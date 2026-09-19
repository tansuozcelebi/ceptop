// ─────────────────────────────────────────────────────────────
// physics.js — cannon-es fizik dünyası
// Zemin telefon ekranına paraleldir; telefon eğimi yerçekimi
// vektörünün X/Z bileşenlerini değiştirir.
// ─────────────────────────────────────────────────────────────

import * as CANNON from 'cannon-es';
import { CONFIG } from './config.js';

export class PhysicsWorld {
  constructor(onImpact) {
    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, CONFIG.HOLD_GRAVITY, 0) });
    this.world.allowSleep = false;
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);

    this.onImpact = onImpact; // (position: Vec3, impactSpeed: number) => void
    this.balls = [];

    this._setupMaterials();
    this._setupGroundAndWalls();
    this._spawnBalls();
  }

  _setupMaterials() {
    this.ballMat = new CANNON.Material('ball');
    this.wallMat = new CANNON.Material('wall');

    this.world.addContactMaterial(new CANNON.ContactMaterial(this.ballMat, this.wallMat, {
      restitution: CONFIG.WALL_RESTITUTION,
      friction: 0.05,
    }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(this.ballMat, this.ballMat, {
      restitution: CONFIG.BALL_RESTITUTION,
      friction: CONFIG.BALL_FRICTION,
    }));
  }

  _setupGroundAndWalls() {
    const W = CONFIG.ARENA_HALF_WIDTH;
    const H = CONFIG.ARENA_HALF_HEIGHT;
    const T = 0.5; // duvar kalınlığı

    // Zemin (statik kutu)
    const ground = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: this.wallMat,
      shape: new CANNON.Box(new CANNON.Vec3(W, T, H)),
      position: new CANNON.Vec3(0, -T, 0),
    });
    this.world.addBody(ground);

    // 4 duvar
    const walls = [
      { size: [W + T, CONFIG.WALL_HEIGHT, T], pos: [0, CONFIG.WALL_HEIGHT / 2, -H - T] }, // üst
      { size: [W + T, CONFIG.WALL_HEIGHT, T], pos: [0, CONFIG.WALL_HEIGHT / 2, H + T] },  // alt
      { size: [T, CONFIG.WALL_HEIGHT, H], pos: [-W - T, CONFIG.WALL_HEIGHT / 2, 0] },     // sol
      { size: [T, CONFIG.WALL_HEIGHT, H], pos: [W + T, CONFIG.WALL_HEIGHT / 2, 0] },      // sağ
    ];
    for (const w of walls) {
      const body = new CANNON.Body({
        type: CANNON.Body.STATIC,
        material: this.wallMat,
        shape: new CANNON.Box(new CANNON.Vec3(...w.size)),
        position: new CANNON.Vec3(...w.pos),
      });
      this.world.addBody(body);
    }
  }

  _spawnBalls() {
    const R = CONFIG.BALL_RADIUS;
    const W = CONFIG.ARENA_HALF_WIDTH - R * 2;
    const H = CONFIG.ARENA_HALF_HEIGHT - R * 2;

    for (let i = 0; i < CONFIG.BALL_COUNT; i++) {
      const body = new CANNON.Body({
        mass: CONFIG.BALL_MASS,
        material: this.ballMat,
        shape: new CANNON.Sphere(R),
        position: new CANNON.Vec3(
          (Math.random() * 2 - 1) * W,
          R + 0.01,
          (Math.random() * 2 - 1) * H
        ),
        linearDamping: CONFIG.LINEAR_DAMPING,
      });

      // Çarpışma olayları → partikül tetikleyici
      body.addEventListener('collide', (e) => {
        const speed = Math.abs(e.contact.getImpactVelocityAlongNormal());
        if (speed >= CONFIG.PARTICLE_MIN_IMPACT && this.onImpact) {
          const p = body.position;
          this.onImpact({ x: p.x, y: p.y, z: p.z }, speed);
        }
      });

      this.world.addBody(body);
      this.balls.push(body);
    }
  }

  // Eğim açılarına göre yerçekimi vektörünü güncelle
  setTilt(tiltX, tiltZ) {
    const g = CONFIG.GRAVITY_MAX;
    this.world.gravity.set(
      Math.sin(tiltX) * g,
      CONFIG.HOLD_GRAVITY,
      Math.sin(tiltZ) * g
    );
  }

  step(dt) {
    this.world.step(CONFIG.FIXED_TIMESTEP, dt, CONFIG.MAX_SUB_STEPS);
  }
}
