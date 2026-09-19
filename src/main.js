// ─────────────────────────────────────────────────────────────
// main.js — sahne kurulumu + ana döngü
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { initSensors, updateTilt } from './sensors.js';
import { PhysicsWorld } from './physics.js';
import { ParticleSystem } from './particles.js';

// ── Renderer / sahne / kamera ──
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f1a);
scene.fog = new THREE.Fog(0x0b0f1a, 18, 34);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, CONFIG.CAMERA_HEIGHT, 4);
camera.lookAt(0, 0, 0);

// ── Işıklar ──
scene.add(new THREE.AmbientLight(0xffffff, 0.35));

const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(5, 12, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -CONFIG.ARENA_HALF_WIDTH - 2;
sun.shadow.camera.right = CONFIG.ARENA_HALF_WIDTH + 2;
sun.shadow.camera.top = CONFIG.ARENA_HALF_HEIGHT + 2;
sun.shadow.camera.bottom = -CONFIG.ARENA_HALF_HEIGHT - 2;
scene.add(sun);

const rim = new THREE.PointLight(0x3b82f6, 8, 30);
rim.position.set(0, 3, -CONFIG.ARENA_HALF_HEIGHT);
scene.add(rim);

// ── Zemin ──
const groundMesh = new THREE.Mesh(
  new THREE.BoxGeometry(CONFIG.ARENA_HALF_WIDTH * 2, 0.5, CONFIG.ARENA_HALF_HEIGHT * 2),
  new THREE.MeshStandardMaterial({ color: 0x16213e, roughness: 0.85, metalness: 0.1 })
);
groundMesh.position.y = -0.25;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// Zemin ızgara deseni
const grid = new THREE.GridHelper(CONFIG.ARENA_HALF_HEIGHT * 2, 20, 0x2a3a5e, 0x1c2a47);
grid.position.y = 0.01;
scene.add(grid);

// ── Duvarlar (görsel) ──
const wallMat = new THREE.MeshStandardMaterial({
  color: 0x3b82f6, roughness: 0.3, metalness: 0.6,
  transparent: true, opacity: 0.85,
});
const W = CONFIG.ARENA_HALF_WIDTH;
const H = CONFIG.ARENA_HALF_HEIGHT;
const wallDefs = [
  { size: [W * 2 + 1, CONFIG.WALL_HEIGHT, 0.5], pos: [0, CONFIG.WALL_HEIGHT / 2, -H - 0.25] },
  { size: [W * 2 + 1, CONFIG.WALL_HEIGHT, 0.5], pos: [0, CONFIG.WALL_HEIGHT / 2, H + 0.25] },
  { size: [0.5, CONFIG.WALL_HEIGHT, H * 2], pos: [-W - 0.25, CONFIG.WALL_HEIGHT / 2, 0] },
  { size: [0.5, CONFIG.WALL_HEIGHT, H * 2], pos: [W + 0.25, CONFIG.WALL_HEIGHT / 2, 0] },
];
for (const w of wallDefs) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
  mesh.position.set(...w.pos);
  mesh.castShadow = true;
  scene.add(mesh);
}

// ── Partikül sistemi ──
const particles = new ParticleSystem(scene);

// ── Fizik dünyası (çarpışmalarda partikül tetiklenir) ──
const physics = new PhysicsWorld((pos, speed) => particles.emit(pos, speed));

// ── Top görselleri (fizik cisimlerine bağlanır) ──
const ballMeshes = physics.balls.map((body, i) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(CONFIG.BALL_RADIUS, 32, 32),
    new THREE.MeshStandardMaterial({
      color: CONFIG.BALL_COLORS[i % CONFIG.BALL_COLORS.length],
      roughness: 0.25,
      metalness: 0.35,
    })
  );
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
});

// ── Yeniden boyutlandırma ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Ana döngü ──
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1); // sekme önlemi

  // 1) Sensörleri oku (yumuşatılmış)
  const tilt = updateTilt();

  // 2) Yerçekimini eğime göre ayarla, fiziği ilerlet
  physics.setTilt(tilt.x, tilt.z);
  physics.step(dt);

  // 3) Fizik → görsel senkronizasyonu
  for (let i = 0; i < physics.balls.length; i++) {
    ballMeshes[i].position.copy(physics.balls[i].position);
    ballMeshes[i].quaternion.copy(physics.balls[i].quaternion);
  }

  // 4) Partiküller
  particles.update(dt);

  renderer.render(scene, camera);
}

// ── Başlat: önce sensör izni, sonra döngü ──
initSensors().then(animate);
