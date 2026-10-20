# Laporan Perbaikan — Integrasi Sesi WhatsApp (Baileys) via Kode QR

**Tanggal:** 18 Oktober 2026
**Lingkup:** Kanal WhatsApp (`src/saluran/baileys.js`) dan panel admin.
**Ringkasan:** Kanal WhatsApp sebelumnya tidak dapat ditautkan karena tidak ada
antarmuka konfigurasi QR dan terdapat kesalahan pemanggilan pustaka Baileys.
Keduanya telah diperbaiki; penautan kini dapat dilakukan dari panel admin web
(QR bergambar) maupun dari terminal, dengan opsi kode pairing 8 digit.

---

## 1. Gejala yang Dilaporkan

> "Proyek sudah berjalan di localhost tanpa kendala. Namun, saya masih belum
> bisa memakainya karena tidak ada opsi atau konfigurasi untuk mengintegrasikan
> sesi WhatsApp Baileys menggunakan kode QR."

Aplikasi memang hidup di `http://localhost:3000`, tetapi tidak ada tempat untuk
menautkan perangkat WhatsApp: tidak ada halaman QR dan kanal WhatsApp tidak
pernah benar-benar tersambung.

## 2. Akar Masalah

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | `makeWASocket.default(...)` pada `src/saluran/baileys.js` | Pustaka Baileys diimpor sebagai *default export* yang sudah berupa fungsi. Mengakses `.default` menghasilkan `undefined`, sehingga pemanggilan melempar `TypeError: makeWASocket.default is not a function` dan soket tidak pernah dibuat. |
| 2 | Tidak ada antarmuka QR di panel admin | Operator tidak punya cara memicu dan memindai QR; satu-satunya cara adalah mengubah `.env` dan membaca QR di konsol. |
| 3 | Reconnect otomatis tidak dapat dikendalikan | Menekan "putus" tetap memicu sambung ulang otomatis. |
| 4 | `fetchLatestBaileysVersion()` tanpa penanganan galat | Bila offline/diblokir, seluruh proses gagal. |
| 5 | Kegagalan kanal WA mematikan panel admin | `inisialisasiSaluran()` melempar galat sampai proses utama keluar. |

## 3. Perbaikan yang Dilakukan

### 3.1 `src/saluran/baileys.js` — dirombak menjadi manajer koneksi
- **Perbaikan bug kritis:** `makeWASocket.default(...)` → `makeWASocket(...)`.
- Status koneksi terpusat: `terputus | menghubungkan | qr | terhubung | keluar | galat`,
  lengkap dengan nomor bot, nama perangkat, waktu pembaruan, dan pesan terakhir.
- QR dihasilkan ganda: **teks di terminal** (`qrcode-terminal`) dan **gambar PNG
  data-URL** (`qrcode`) untuk ditampilkan di panel web.
- Kode pairing 8 digit (`requestPairingCode`) dengan **3 percobaan ulang** bila
  gagal, sebagai alternatif saat kamera tidak tersedia.
- **Sambung ulang otomatis** dengan jeda bertingkat (5→60 detik) hanya untuk
  pemutusan tak terduga. Penanda `dihentikanSengaja` mencegah sambung ulang saat
  operator menekan **Putuskan**/**Hapus Sesi** atau memakai mode pairing.
- `fetchLatestBaileysVersion()` dibungkus `try/catch` (memakai versi bawaan bila
  gagal), sehingga tidak lagi mematikan kanal saat jaringan bermasalah.
- Fungsi baru: `getStatus()`, `hentikanBaileys()`, `logoutBaileys()`,
  `mulaiBaileysPairing(nomor)`, `adaSesiTersimpan()`.
- Penanganan `loggedOut` (kode 401) membersihkan sesi lama agar QR baru dapat dibuat.

### 3.2 Panel admin — halaman baru "WhatsApp"
- `src/admin/routes/whatsapp.js`:
  - `GET /whatsapp` — halaman status + QR.
  - `GET /whatsapp/status` — JSON untuk pembaruan langsung (polling 2 detik).
  - `POST /whatsapp/hubungkan` — mulai sesi (munculkan QR).
  - `POST /whatsapp/pairing` — buat kode pairing dari nomor bot.
  - `POST /whatsapp/putus` — hentikan soket, sesi tetap tersimpan.
  - `POST /whatsapp/logout` — hapus sesi (logout).
- `src/admin/views/whatsapp.ejs` — kartu QR bergambar yang menyegar sendiri,
  panel informasi koneksi, formulir kode pairing, dan peringatan keamanan.
- Tautan **WhatsApp** ditambahkan ke navigasi (`src/admin/views/header.ejs`),
  dan router dipasang di `src/admin/server.js` (di belakang login).

### 3.3 Ketahanan & kegunaan lain
- `src/saluran/indeks.js` — kegagalan kanal WhatsApp tidak lagi menghentikan
  panel admin; hanya dicatat dan panel tetap berjalan.
- `src/config/env.js` — variabel baru `WA_PAIRING_NUMBER`.
- `scripts/wa-login.js` + `npm run wa:login` — penautan mandiri via terminal
  (argumen nomor → mode kode pairing).
- `.env.example` dan `README.md` diperbarui dengan langkah penautan.
- `src/mesin/uji-ai.js` — Uji 2.1 disesuaikan agar menguji **perilaku aman**
  baik saat kunci API kosong maupun terisi (tidak lagi mengasumsikan kunci kosong).

## 4. Cara Menggunakan

### Opsi A — Lewat panel admin (dianjurkan)
1. `npm start` (kanal boleh tetap `simulasi`).
2. Buka <http://localhost:3000> lalu login (`admin` / `AdminLapas2026!`).
3. Masuk tab **WhatsApp** → klik **Hubungkan WhatsApp**.
4. Pindai QR di layar: WhatsApp → **Perangkat Tertaut** → **Tautkan Perangkat**.
5. Setelah tertaut, status berubah menjadi **Terhubung** dan bot siap menerima pesan.

Tombol **Putuskan** menghentikan koneksi dengan tetap menyimpan sesi;
**Hapus Sesi** melakukan logout penuh sehingga perlu pemindaian ulang.

### Opsi B — Kode pairing (tanpa kamera)
Pada tab **WhatsApp**, isi nomor bot (format `628xxxxxxxxxx`) lalu klik
**Buat Kode Pairing**, dan masukkan 8 digit kode di
WhatsApp → **Perangkat Tertaut** → **Tautkan dengan nomor telepon**.

### Opsi C — Terminal
```powershell
npm run wa:login                 # tampilkan QR di konsol
npm run wa:login -- 628xxxxxxxxxx  # buat kode pairing
```

### Menjalankan WhatsApp otomatis saat aplikasi mulai
Set `KANAL_AKTIF=baileys` (dan opsional `WA_PAIRING_NUMBER=628xxxxxxxxxx`) di `.env`.

## 5. Hasil Pengujian

Diuji pada server lokal dengan `KANAL_AKTIF=baileys` (Node.js v24, Windows 11):

| Skenario | Hasil |
|----------|-------|
| Server mulai & QR terbentuk | ✅ status `qr`, gambar QR data-URL ±6,8 KB, QR teks tampil di konsol |
| Halaman `GET /whatsapp` | ✅ HTTP 200, memuat elemen `qr-image`, form pairing, tombol hubungkan |
| `GET /whatsapp/status` | ✅ JSON status + QR + `adaSesi` |
| **Hubungkan** | ✅ status → `qr`, QR siap pindai |
| **Putuskan** | ✅ status tetap `terputus` (tidak ada sambung ulang otomatis) |
| **Kode pairing** | ✅ kode 8 digit terbit (contoh `842QK6EE`), tersimpan di status |
| Nomor pairing tidak valid | ✅ ditolak dengan pesan jelas, tidak crash |
| Live Gemini (kunci terisi) | ✅ `sukses=true`, jawaban *grounded*, angka sesuai basis FAQ |
| `npm test` | ✅ **46/46 lulus** (retrieval 7, AI 9, blackbox 30) |

Diverifikasi juga bahwa AI tidak mengarang angka: keluaran hanya memakai jam
`09.00–12.00` yang ada di konteks `<kb>`.

## 6. Berkas yang Diubah / Ditambah

**Diubah**
- `src/saluran/baileys.js` (perombakan manajer koneksi)
- `src/saluran/indeks.js`
- `src/admin/server.js`
- `src/admin/views/header.ejs`
- `src/config/env.js`
- `src/index.js`
- `src/mesin/uji-ai.js`
- `package.json`, `.env.example`, `README.md`

**Ditambah**
- `src/admin/routes/whatsapp.js`
- `src/admin/views/whatsapp.ejs`
- `scripts/wa-login.js`
- dependensi `qrcode@1.5.4` (murni JavaScript, tanpa kompilasi native)

## 7. Catatan

- Sesuaikan `.env`: `KANAL_AKTIF=baileys` bila ingin kanal WA aktif sejak awal.
- Gunakan **nomor perdana khusus bot**, bukan nomor pribadi.
- Baileys adalah pustaka tidak resmi; lihat `docs/analisis-risiko-baileys.md`.
- Pada lingkungan ini `git` tidak tersedia dan salinan proyek tidak memiliki
  folder `.git`, sehingga perubahan belum di-commit.
