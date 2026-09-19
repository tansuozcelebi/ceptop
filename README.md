# ceptop

Cep telefonunda çalışan, **Three.js** + **cannon-es** fizik motoru kullanan, jiroskop (DeviceOrientation) sensörleriyle kontrol edilen top simülasyonu.

Telefonu eğdiğinizde, ekrana paralel düzlem üzerindeki top(lar) gerçek fizik kurallarıyla (yerçekimi, sürtünme, çarpışma, sekme) hareket eder.

## Özellikler

- 🎮 **Jiroskop kontrolü** — telefon eğimi yerçekimi vektörüne dönüşür
- ⚽ **Tam fizik motoru** — cannon-es ile gerçekçi çarpışma, sekme ve sürtünme
- 🔢 **Çoklu top desteği** — `src/config.js` içindeki `BALL_COUNT` ile top sayısını değiştirin
- ✨ **Partikül efektleri** — sert çarpışmalarda kıvılcım partikülleri (havuza dayalı, performans dostu)
- 🖱️ **Masaüstü fallback** — sensörü olmayan cihazlarda fare/touch sürükleme ile eğim simülasyonu

## Çalıştırma

Statik bir site olduğu için herhangi bir HTTP sunucusu yeterli:

```bash
# Python
python -m http.server 8000

# veya Node
npx serve .
```

Ardından telefondan `http://<bilgisayar-ip>:8000` adresine gidin.

> ⚠️ **HTTPS notu:** iOS 13+ ve modern Android tarayıcıları sensör verisine yalnızca **güvenli bağlamda** (HTTPS veya localhost) izin verir. Telefonda test için [ngrok](https://ngrok.com), GitHub Pages veya benzeri HTTPS'li bir yayın önerilir.
>
> 📱 **iOS notu:** Sayfa açıldığında çıkan "Sensörleri Etkinleştir" butonuna basın — iOS `DeviceOrientationEvent.requestPermission()` gerektirir.

## Proje Yapısı

```
ceptop/
├── index.html        # Giriş noktası, import map, UI katmanı
├── src/
│   ├── config.js     # Tüm ayarlar (top sayısı, fizik sabitleri, partikül)
│   ├── main.js       # Uygulama döngüsü, sahne kurulumu
│   ├── sensors.js    # DeviceOrientation + masaüstü fallback
│   ├── physics.js    # cannon-es dünyası, toplar, duvarlar, çarpışma olayları
│   └── particles.js  # Partikül havuzu (kıvılcım efektleri)
└── README.md
```

## Yol Haritası

- [x] Tek/çoklu top + jiroskop kontrolü
- [x] Temel partikül efektleri
- [ ] Seviye/labirent sistemi
- [ ] Ses efektleri (çarpışma şiddetine göre)
- [ ] Skor ve hedef delikler
- [ ] Dokunsal geri bildirim (Vibration API)

## Teknolojiler

- [Three.js](https://threejs.org/) `0.160.0`
- [cannon-es](https://github.com/pmndrs/cannon-es) `0.20.0`
- Build aracı yok — saf ES Modules + CDN import map
