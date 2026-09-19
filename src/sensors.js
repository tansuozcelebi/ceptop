// ─────────────────────────────────────────────────────────────
// sensors.js — DeviceOrientation (açılar) + DeviceMotion (ivme)
// + masaüstü fallback (ok tuşları ile eğim simülasyonu)
//
// Çıktılar:
//   updateTilt() → yumuşatılmış eğim { x, z } (radyan)
//   HUD'a canlı açı (alpha/beta/gamma) ve ivme (X/Y/Z) yazar
// ─────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';

const tilt = { x: 0, z: 0 };          // hedef (ham) eğim
const smoothed = { x: 0, z: 0 };      // yumuşatılmış eğim (fizik bunu kullanır)
let source = '—';

// Ham sensör verileri (HUD için)
const raw = { alpha: 0, beta: 0, gamma: 0, accX: 0, accY: 0, accZ: 0 };

// HUD elemanları
const el = {
  angA: document.getElementById('angA'),
  angB: document.getElementById('angB'),
  angG: document.getElementById('angG'),
  accX: document.getElementById('accX'),
  accY: document.getElementById('accY'),
  accZ: document.getElementById('accZ'),
  tiltX: document.getElementById('tiltX'),
  tiltZ: document.getElementById('tiltZ'),
  src: document.getElementById('src'),
};

function applyDeadzone(deg) {
  return Math.abs(deg) < CONFIG.TILT_DEADZONE_DEG ? 0 : deg;
}

// ── Jiroskop / yön sensörü ──
function onDeviceOrientation(e) {
  if (e.gamma === null || e.beta === null) return;
  // alpha: pusula yönü (0..360), beta: ön-arka (-180..180), gamma: sol-sağ (-90..90)
  raw.alpha = e.alpha ?? 0;
  raw.beta = e.beta ?? 0;
  raw.gamma = e.gamma ?? 0;

  tilt.x = (applyDeadzone(raw.gamma) * Math.PI) / 180;
  tilt.z = (applyDeadzone(raw.beta) * Math.PI) / 180;
  source = 'jiroskop';
}

// ── İvmeölçer ──
function onDeviceMotion(e) {
  // Yerçekimi dahil ivme (her cihazda mevcut olan budur)
  const a = e.accelerationIncludingGravity || e.acceleration;
  if (!a) return;
  raw.accX = a.x ?? 0;
  raw.accY = a.y ?? 0;
  raw.accZ = a.z ?? 0;
}

// ── Masaüstü fallback: ok tuşları / WASD ile eğim simülasyonu ──
// (Kamera artık OrbitControls ile fareye bağlı, sürükleme çakışmasın diye kaldırıldı)
function enableKeyboardFallback() {
  const MAX = Math.PI / 4; // 45°
  const pressed = new Set();

  const update = () => {
    const l = pressed.has('ArrowLeft') || pressed.has('a');
    const r = pressed.has('ArrowRight') || pressed.has('d');
    const u = pressed.has('ArrowUp') || pressed.has('w');
    const d = pressed.has('ArrowDown') || pressed.has('s');
    tilt.x = (r ? MAX : 0) - (l ? MAX : 0);
    tilt.z = (d ? MAX : 0) - (u ? MAX : 0);
    if (l || r || u || d) source = 'klavye';
  };

  window.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pressed.add(k);
    update();
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pressed.delete(k);
    update();
  });
}

// ── Kurulum: iOS izni (orientation + motion birlikte) ──
export async function initSensors() {
  const overlay = document.getElementById('overlay');
  const btn = document.getElementById('enableSensors');

  const needsOrientationPermission =
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function';
  const needsMotionPermission =
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function';
  const needsPermission = needsOrientationPermission || needsMotionPermission;

  return new Promise((resolve) => {
    const begin = () => {
      window.addEventListener('deviceorientation', onDeviceOrientation);
      window.addEventListener('devicemotion', onDeviceMotion);
      enableKeyboardFallback();
      overlay.classList.add('hidden');
      resolve();
    };

    btn.addEventListener('click', async () => {
      if (needsPermission) {
        try {
          if (needsOrientationPermission) {
            const s1 = await DeviceOrientationEvent.requestPermission();
            if (s1 !== 'granted') btn.textContent = 'Yön izni reddedildi';
          }
          if (needsMotionPermission) {
            const s2 = await DeviceMotionEvent.requestPermission();
            if (s2 !== 'granted') btn.textContent = 'Hareket izni reddedildi';
          }
        } catch {
          btn.textContent = 'Sensör yok — klavye modu';
        }
      }
      begin();
    }, { once: true });

    // Masaüstünde izin gerekmez: buton metnini değiştir
    if (!needsPermission && !('ontouchstart' in window)) {
      btn.textContent = 'Başla (ok tuşları ile eğim)';
    }
  });
}

// Her karede çağrılır: yumuşatma + HUD güncelleme
export function updateTilt() {
  const s = CONFIG.TILT_SMOOTHING;
  smoothed.x += (tilt.x - smoothed.x) * s;
  smoothed.z += (tilt.z - smoothed.z) * s;

  // HUD: açılar
  el.angA.textContent = raw.alpha.toFixed(1);
  el.angB.textContent = raw.beta.toFixed(1);
  el.angG.textContent = raw.gamma.toFixed(1);

  // HUD: ivme
  el.accX.textContent = raw.accX.toFixed(2);
  el.accY.textContent = raw.accY.toFixed(2);
  el.accZ.textContent = raw.accZ.toFixed(2);

  // HUD: uygulanan eğim
  el.tiltX.textContent = ((smoothed.x * 180) / Math.PI).toFixed(1);
  el.tiltZ.textContent = ((smoothed.z * 180) / Math.PI).toFixed(1);
  el.src.textContent = source;

  return smoothed;
}
