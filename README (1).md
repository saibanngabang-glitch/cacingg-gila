# Cacingg Gila

Game arena cacing 2D untuk browser (Vite + Canvas 2D). Tanpa backend dan tanpa API key; semua data disimpan lokal di browser.

## Jalankan di komputer

```
npm install
npm run dev       # buka alamat yang tampil (mis. http://localhost:5173)
npm run build     # hasil produksi ada di folder dist
npm run preview
```

## Upload ke GitHub dari HP

1. Buka github.com → **New repository** → beri nama → **Create repository**.
2. **Add file → Upload files**, pilih `package.json`, `index.html`, `vercel.json`, `README.md` (`.gitignore` boleh dilewati) → **Commit changes**.
3. Folder `src`: **Add file → Create new file**, ketik nama `src/main.js` (tanda `/` otomatis membuat folder), tempel isi file, **Commit**. Ulangi untuk `src/style.css`.

## Deploy ke Vercel

1. Buka vercel.com → masuk dengan GitHub → **Add New → Project** → pilih repository.
2. Framework Preset **Vite**, Build Command `npm run build`, Output Directory `dist` (sudah diatur di `vercel.json`) → **Deploy**.
3. Buka URL `https://…vercel.app` di HP.

## Item dan kontrol

- Tiga item acak muncul di arena dan dimakan dengan kepala: ⚡ SPEED (×1,6), 🍏 PENGGANDA (×2/×5/×10), ↪ BELOK TAJAM. Masing-masing aktif 50 detik; mengambil lagi mengulang ke 50 detik. Tidak ada cooldown. Waktu hanya berjalan saat game tidak di-pause.
- Gerak: sentuh dan geser jempol (joystick muncul di titik sentuhan); komputer: mouse atau ← → / A D.
- Zoom + dan − selalu tersedia (komputer: roda mouse atau tombol +/−). Zoom hanya mengubah tampilan, bukan hitbox.
- Aturan tabrakan sama untuk pemain dan bot: kepala menabrak badan lain atau dinding = kalah; adu kepala = yang lebih pendek kalah (sama panjang = keduanya kalah). Cacing tidak kebal terhadap apa pun.

## Cara menguji kemampuan

Buka **Admin Panel** (dari menu atau dari layar pause): naikkan *Jumlah tiap jenis item*, perpendek durasi (mis. 10 detik), atau ubah pengali, lalu MAIN. Panah berwarna di tepi layar menunjuk item terdekat.

## Status pengujian (jujur)

Sudah diuji: pemeriksaan sintaks `src/main.js` dan simulasi 20.000 frame di Node dengan DOM tiruan (8 game berturut-turut: cacing bergerak, makan, tumbuh, kalah, game over dan main lagi; bot berjalan; ketiga efek aktif dan hitung mundur dimulai dari 50 detik).

**Belum diuji:** `npm install` dan `npm run build` (lingkungan pembuatan tidak punya akses internet), deploy Vercel, sentuhan dan joystick di iPhone/Android sungguhan, upload skin lewat galeri, ekspor/impor konfigurasi, suara, dan kenyamanan layout HP. Jalankan `npm run build` dan coba di HP sebelum mengandalkan hasilnya.

## Keterbatasan

- Belum ada: fitur otomatisasi (auto-play/auto-farming/PANIC STOP), crop manual (gambar skin dipotong persegi dari tengah), IndexedDB (skin gambar disimpan di localStorage dalam ukuran 64×64), PIN admin (siapa pun yang membuka game bisa membuka Admin Panel; ia hanya mengubah konfigurasi lokal), dan file kode terpisah per modul (semua di `src/main.js`).
- Radius putaran ditentukan oleh kecepatan belok (radius ≈ kecepatan ÷ kecepatan belok), diatur lewat *Kecepatan belok normal/TAJAM*.
- Laju frame dibatasi agar tabrakan akurat: di perangkat yang sangat lambat game berjalan lebih lambat, bukan melompat.
