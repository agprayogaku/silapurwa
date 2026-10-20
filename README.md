# SILAPURWA — Sistem Informasi Layanan Lapas Purwakarta

Chatbot layanan publik berbasis WhatsApp + panel admin web untuk
Lapas Kelas IIB Purwakarta. Dibangun ringan (tanpa dependensi native) agar
berjalan pada perangkat Windows spesifikasi rendah, dengan biaya operasional
mendekati **Rp 0**.

> Proyek ini merupakan bagian dari tugas akhir seleksi CPNS Kemenkumham.

---

## Fitur Utama

- **Jawaban otomatis** pertanyaan rutin (jam besuk, syarat kunjungan, titipan,
  layanan integrasi, pengaduan) dari basis FAQ terverifikasi (FTS5).
- **Lapisan AI Gemini** yang hanya merapikan bahasa, bukan sumber fakta
  (anti-halusinasi berlapis).
- **Pagar privasi** menolak permintaan data warga binaan (WBP) dan upaya
  menjebol aturan (prompt injection).
- **Panel admin** untuk kelola FAQ, tiket eskalasi, pengaturan, dan simulator
  percakapan.
- **Kanal Baileys** (WhatsApp) + **simulator** lokal konsol/web untuk demo.
- **Tugas terjadwal**: cadangan harian, pembersihan log 90 hari, laporan
  mingguan.

---

## Prasyarat

- Windows 10/11 dengan **Node.js 24 LTS**.
- Akun Google AI Studio (opsional, untuk lapisan AI) — punya free tier.

## Pemasangan Cepat

```powershell
# 1. Pasang dependensi
npm install

# 2. Siapkan konfigurasi
Copy-Item .env.example .env   # lalu isi GEMINI_API_KEY bila punya

# 3. Inisialisasi basis data + akun admin
npm run init-db

# 4. Jalankan aplikasi
npm start
```

Panel admin: <http://localhost:3000>
Akun awal: `admin` / `AdminLapas2026!` **(ganti segera)**

> **Catatan seed netral:** `npm run init-db` menghasilkan basis data **kosong
> dan netral** — tidak ada FAQ maupun data instansi (kontak/pengaturan bernilai
> default). Tambahkan FAQ melalui panel admin (`/faq`), lengkapi `/pengaturan`,
> lalu ubah status FAQ menjadi **Terbit** agar bot dapat menjawab. Untuk
> mengembalikan basis data ke kondisi default kapan saja: `npm run reset-data`.
>
> **Data layanan terverifikasi:** `npm run data:lapas` memuat 26 FAQ resmi
> (jadwal kunjungan, penitipan uang, penitipan barang, tata tertib) beserta
> kontak dan pengaturan dari `src/db/data-lapas.sql`. Sumber: *Catatan
> Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas
> Kelas IIB Purwakarta*. Perintah ini aman dijalankan berulang.

## Mode Operasi

- **Simulasi (bawaan)**: `KANAL_AKTIF=simulasi` di `.env`. Uji di konsol:
  `npm run simulasi`, atau lewat tab *Simulator Chat* di panel admin.
- **WhatsApp (Baileys)**: ada dua cara menautkan perangkat.
  1. **Lewat panel admin (dianjurkan)** — buka tab **WhatsApp**
     (<http://localhost:3000/whatsapp>) lalu klik **Hubungkan WhatsApp**.
     Kode QR akan tampil sebagai gambar dan diperbarui otomatis; pindai dengan
     WhatsApp → *Perangkat Tertaut* → *Tautkan Perangkat*. Panel juga
     menampilkan status koneksi, tombol **Putuskan** (pertahankan sesi) dan
     **Hapus Sesi** (logout), serta opsi **Kode Pairing** 8 digit bila kamera
     tidak tersedia.
  2. **Lewat terminal** — `npm run wa:login` untuk menampilkan QR di konsol,
     atau `npm run wa:login 628xxxxxxxxxx` untuk membuat kode pairing.

  Untuk menjalankan kanal WhatsApp otomatis saat aplikasi mulai, set
  `KANAL_AKTIF=baileys` di `.env`. Bila dibiarkan `simulasi`, tombol di panel
  **WhatsApp** tetap dapat mengaktifkan kanal tanpa mengubah `.env`.

## Pengujian

```powershell
npm test                # retrieval + AI + blackbox (46 skenario)
npm run test:retrieval  # 7 uji pipeline retrieval
npm run test:ai         # 9 uji penapis anti-halusinasi & AI
npm run test:blackbox   # 30 skenario blackbox (termasuk prompt injection)
```

## Utilitas Pelaporan

```powershell
npm run status-data       # audit kesiapan data (sisa [VERIFIKASI])
npm run reset-data        # kembalikan basis data ke kondisi default/netral
npm run data:lapas        # muat data layanan terverifikasi (src/db/data-lapas.sql)
npm run export:tangkapan  # ekspor halaman panel -> docs/tangkapan-layar/
npm run doc:blackbox      # bangun docs/pengujian-blackbox.md dari hasil uji
npm run wa:login          # tampilkan QR WhatsApp di terminal (penautan perangkat)
npm run wa:login -- 628xxxxxxxxxx   # buat kode pairing 8 digit
```

> Pengujian (`npm test`) berjalan pada **basis data sementara terpisah**
> (`src/db/seed-uji.sql`) sehingga tidak mengubah data operasional Anda.

## Pemasangan sebagai Layanan Windows

1. Jalankan `scripts\power-plan.ps1` (Administrator) untuk mencegah sleep.
2. Unduh `nssm.exe`, lalu ikuti `scripts\pasang-service.bat`.

## Dokumentasi

- `docs/arsitektur.md` — rancangan teknis lengkap.
- `docs/laporan-akhir.md` — kerangka bab laporan tugas akhir + KPI.
- `docs/pengujian-blackbox.md` — tabel hasil 30 skenario uji.
- `docs/analisis-risiko-baileys.md` — analisis risiko kanal WhatsApp.
- `docs/lembar-verifikasi-data.md` — lembar konfirmasi ke petugas Lapas.
- `docs/perbaikan-integrasi-whatsapp.md` — catatan perbaikan kanal WhatsApp (QR/pairing).
- `docs/tangkapan-layar/index.html` — lampiran tangkapan layar panel admin.

---

## Struktur

```
src/
  index.js        bootstrap + health check
  config/         env, logger
  saluran/        baileys, simulasi, pemilih kanal
  mesin/          pipa, normalisasi, pencari, penapis, gemini, percetakan
  db/             koneksi, schema.sql, seed.sql, kueri, init
  admin/          server web, routes, middleware, views (EJS)
  tugas/          cadangan, bersih-log, laporan-mingguan, penjadwal
data/             basis data, backups, laporan (tidak di-commit)
docs/             lampiran tugas akhir
scripts/          bantuan pemasangan & utilitas
```
