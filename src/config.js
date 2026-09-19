// ─────────────────────────────────────────────────────────────
// ceptop — merkezi ayar dosyası
// Tüm "tweak" edilebilir değerler burada.
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  // Toplar
  BALL_COUNT: 3,            // ← top sayısını buradan artırın
  BALL_RADIUS: 0.35,
  BALL_MASS: 1,
  BALL_RESTITUTION: 0.55,   // sekme katsayısı (0 = hiç, 1 = tam esnek)
  BALL_FRICTION: 0.15,

  // Düzlem / arena (telefon ekranına paralel zemin)
  ARENA_HALF_WIDTH: 4.5,    // X ekseni (telefon genişliği)
  ARENA_HALF_HEIGHT: 8.0,   // Z ekseni (telefon uzunluğu)
  WALL_HEIGHT: 1.5,
  WALL_RESTITUTION: 0.7,

  // Fizik
  GRAVITY_MAX: 18,          // tam eğimde uygulanan maks. yerçekimi (m/s²)
  HOLD_GRAVITY: -4,         // topu zeminde tutan hafif aşağı kuvvet
  FIXED_TIMESTEP: 1 / 60,
  MAX_SUB_STEPS: 4,
  LINEAR_DAMPING: 0.08,     // hava direnci benzeri yavaşlama

  // Sensör
  TILT_SMOOTHING: 0.18,     // 0-1: düşük = daha yumuşak, yüksek = daha tepkili
  TILT_DEADZONE_DEG: 1.2,   // küçük titremeleri yok say

  // Partiküller
  PARTICLES_ENABLED: true,
  PARTICLE_POOL_SIZE: 400,
  PARTICLE_MIN_IMPACT: 2.5, // bu hızın altındaki çarpışmalarda kıvılcım yok

  // Görsel
  CAMERA_HEIGHT: 14,
  BALL_COLORS: [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa78bfa, 0x6bcb77, 0xff9f45],
};
