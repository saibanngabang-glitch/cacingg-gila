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

- Lima jenis item (⚡ SPEED, ↪ TURN, ×2, ×5, ×10) dimakan dengan kepala; efek aktif 50 detik (dapat diatur), mengambil lagi mengulang waktunya.
- Gerak: sentuh dan geser jempol (joystick muncul di titik sentuhan); komputer: mouse atau ← → / A D.
- Zoom + dan − selalu tersedia (komputer: roda mouse atau tombol +/−). Zoom hanya mengubah tampilan, bukan hitbox.
- Aturan tabrakan sama untuk pemain dan bot: kepala menabrak badan lain atau dinding = kalah; adu kepala = yang lebih pendek kalah (sama panjang = keduanya kalah). Cacing tidak kebal terhadap apa pun.

## Pembaruan terbaru

- **Gerak normal fleksibel:** putar balik 180° dalam ±0,6 dtk (kecepatan belok 5 rad/dtk, dihaluskan). Item **TURN**: kepala langsung menghadap arah kontrol (hingga 360° seketika, termasuk berbalik); badan tetap mengikuti jejak kepala tanpa teleport.
- **Speed 3 tingkat:** normal · tombol ⚡ saja = **sedang** (×1,5) · item SPEED + tombol = **tinggi** (×2,4). Item SPEED tanpa menahan tombol tidak menambah kecepatan. Tombol dijamin tidak terkunci (lepas di mana pun, sentuhan dibatalkan, atau fokus hilang → mati).
- **Skin menempel di badan:** gambar dipetakan per segmen (u = sepanjang badan, v = melintang), jadi ikut melengkung, berputar, dan membesar; badan selalu solid. Kepala memakai kulit yang sama. Ubin upload 128 px.
- **Multiplier bertumpuk:** ×2, ×5, ×10 aktif bersamaan, masing-masing dengan timer sendiri; mengambil yang baru tidak mereset yang lama. Pengali digabung dengan dikali (mode *Dijumlah* tersedia di konfigurasi). Sejenis menumpuk hingga 3; yang ke-4 memperpanjang yang paling hampir habis.
- **Pertumbuhan berdasar skor:** panjang (maks. 800 ruas), diameter tubuh (maks. radius 32), dan kepala (1,14× radius) naik lewat kurva jenuh yang dapat diatur; ruas ditambah bertahap (maks. 14/dtk) hanya bila jejak kepala cukup, jadi jarak antarruas tetap konsisten. Adu kepala: lebih panjang menang; seri panjang → skor lebih tinggi menang.
- Fitur sebelumnya tetap: item dengan timer despawn, headshot, arena & pandangan 50×, render berdasarkan jarak, peta mini.
- Semua angka (kurva pertumbuhan, kecepatan, durasi, tumpukan) ada di daftar `SC` dan tabel `ITEMS` di awal `src/main.js`.

## Cara menguji kemampuan

Admin Panel sudah dihapus. Untuk uji cepat, ubah angka di daftar `SC` / tabel `ITEMS` di awal `src/main.js` (mis. `ttl` item atau durasi efek), lalu jalankan ulang.

## Status pengujian (jujur)

Sudah diuji: pemeriksaan sintaks `src/main.js` dan simulasi 20.000 frame di Node dengan DOM tiruan (8 game berturut-turut: cacing bergerak, makan, tumbuh, kalah, game over dan main lagi; bot berjalan; ketiga efek aktif dan hitung mundur dimulai dari 50 detik).

**Belum diuji:** `npm install` dan `npm run build` (lingkungan pembuatan tidak punya akses internet), deploy Vercel, sentuhan dan joystick di iPhone/Android sungguhan, upload skin lewat galeri, ekspor/impor konfigurasi, suara, dan kenyamanan layout HP. Jalankan `npm run build` dan coba di HP sebelum mengandalkan hasilnya.

## Keterbatasan

- Belum ada: fitur otomatisasi (auto-play/auto-farming/PANIC STOP), crop manual (gambar skin dipotong persegi dari tengah), IndexedDB (skin gambar disimpan di localStorage dalam ukuran 64×64), PIN admin (siapa pun yang membuka game bisa membuka Admin Panel; ia hanya mengubah konfigurasi lokal), dan file kode terpisah per modul (semua di `src/main.js`).
- Radius putaran ditentukan oleh kecepatan belok (radius ≈ kecepatan ÷ kecepatan belok), diatur lewat *Kecepatan belok normal/TAJAM*.
- Laju frame dibatasi agar tabrakan akurat: di perangkat yang sangat lambat game berjalan lebih lambat, bukan melompat.
