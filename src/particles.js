// ─────────────────────────────────────────────────────────────
// particles.js — havuz tabanlı kıvılcım partikül sistemi
// Nesne oluşturma (GC baskısı) yok; sabit boyutlu buffer'lar
// yeniden kullanılır. Mobil GPU dostu THREE.Points tabanlı.
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three';
import { CONFIG } from './config.js';

export class ParticleSystem {
  constructor(scene) {
    this.size = CONFIG.PARTICLE_POOL_SIZE;
    this.positions = new Float32Array(this.size * 3);
    this.velocities = new Float32Array(this.size * 3);
    this.lifetimes = new Float32Array(this.size); // 0 = ölü
    this.cursor = 0;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffd166,
      size: 0.12,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  // Çarpışma noktasında kıvılcım patlaması
  emit(pos, impactSpeed) {
    if (!CONFIG.PARTICLES_ENABLED) return;
    const count = Math.min(4 + Math.floor(impactSpeed * 1.5), 20);

    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.size;

      const i3 = i * 3;
      this.positions[i3] = pos.x;
      this.positions[i3 + 1] = pos.y;
      this.positions[i3 + 2] = pos.z;

      // Rastgele yönde patlama (yukarı ağırlıklı)
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * impactSpeed * 0.4;
      this.velocities[i3] = Math.cos(angle) * speed;
      this.velocities[i3 + 1] = 1.5 + Math.random() * 2.5;
      this.velocities[i3 + 2] = Math.sin(angle) * speed;

      this.lifetimes[i] = 0.5 + Math.random() * 0.4; // saniye
    }
  }

  update(dt) {
    const drag = 1 - Math.min(dt * 3, 1);

    for (let i = 0; i < this.size; i++) {
      if (this.lifetimes[i] <= 0) continue;

      this.lifetimes[i] -= dt;
      const i3 = i * 3;

      if (this.lifetimes[i] <= 0) {
        this.positions[i3 + 1] = -100; // görünmez yap
        continue;
      }

      this.velocities[i3 + 1] -= 9.8 * dt; // yerçekimi
      this.velocities[i3] *= drag;
      this.velocities[i3 + 2] *= drag;

      this.positions[i3] += this.velocities[i3] * dt;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * dt;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * dt;
    }

    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
