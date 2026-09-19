// ─────────────────────────────────────────────────────────────
// sensors.js — DeviceOrientation (jiroskop/eğim) + masaüstü fallback
// Çıktı: normalize eğim açıları { x, z } (radyan, -π/2 .. π/2)
//   x > 0 → telefon sağa eğik → top sağa gitmeli
//   z > 0 → telefon alt tarafı aşağı eğik → top "aşağı" gitmeli
// ─────────────────────────────────────────────────────────────

import { CONFIG } from './config.js';

const tilt = { x: 0, z: 0 };          // hedef (ham) eğim
const smoothed = { x: 0, z: 0 };      // yumuşatılmış eğim (fizik bunu kullanır)
let source = '—';

const hudX = document.getElementById('tiltX');
const hudZ = document.getElementById('tiltZ');
const hudSrc = document.getElementById('src');

function applyDeadzone(deg) {
  return Math.abs(deg) < CONFIG.TILT_DEADZONE_DEG ? 0 : deg;
}

function onDeviceOrientation(e) {
  if (e.gamma === null || e.beta === null) return;
  // gamma: sol-sağ eğim (-90..90), beta: ön-arka eğim (-180..180)
  tilt.x = (applyDeadzone(e.gamma) * Math.PI) / 180;
  tilt.z = (applyDeadzone(e.beta) * Math.PI) / 180;
  source = 'jiroskop';
}

// ── Masaüstü fallback: fare/dokunma sürükleme ile eğim simülasyonu ──
function enablePointerFallback() {
  let dragging = false;
  const maxDrag = 200; // px — tam eğim için gereken sürükleme

  const start = () => { dragging = true; };
  const end = () => { dragging = false; tilt.x = 0; tilt.z = 0; };
  const move = (e) => {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = (p.clientX - window.innerWidth / 2) / maxDrag;
    const dy = (p.clientY - window.innerHeight / 2) / maxDrag;
    tilt.x = Math.max(-1, Math.min(1, dx)) * (Math.PI / 4);
    tilt.z = Math.max(-1, Math.min(1, dy)) * (Math.PI / 4);
    source = 'sürükleme';
  };

  window.addEventListener('mousedown', start);
  window.addEventListener('mouseup', end);
  window.addEventListener('mousemove', move);
  window.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('touchend', end);
  window.addEventListener('touchmove', move, { passive: true });
}

// ── Kurulum: iOS izni dahil ──
export async function initSensors() {
  const overlay = document.getElementById('overlay');
  const btn = document.getElementById('enableSensors');

  const needsPermission =
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function';

  return new Promise((resolve) => {
    const begin = () => {
      window.addEventListener('deviceorientation', onDeviceOrientation);
      enablePointerFallback();
      overlay.classList.add('hidden');
      resolve();
    };

    btn.addEventListener('click', async () => {
      if (needsPermission) {
        try {
          const state = await DeviceOrientationEvent.requestPermission();
          if (state !== 'granted') {
            btn.textContent = 'İzin reddedildi — sürükleme modu';
          }
        } catch {
          btn.textContent = 'Sensör yok — sürükleme modu';
        }
      }
      begin();
    }, { once: true });

    // Masaüstünde izin gerekmez: buton metnini değiştir
    if (!needsPermission && !('ontouchstart' in window)) {
      btn.textContent = 'Başla (sürükleme modu)';
    }
  });
}

// Her karede çağrılır: yumuşatma + HUD güncelleme
export function updateTilt() {
  const s = CONFIG.TILT_SMOOTHING;
  smoothed.x += (tilt.x - smoothed.x) * s;
  smoothed.z += (tilt.z - smoothed.z) * s;

  hudX.textContent = ((smoothed.x * 180) / Math.PI).toFixed(1);
  hudZ.textContent = ((smoothed.z * 180) / Math.PI).toFixed(1);
  hudSrc.textContent = source;

  return smoothed;
}
