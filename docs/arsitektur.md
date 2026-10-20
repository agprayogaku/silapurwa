# Arsitektur Silapurwa — Sistem Informasi Layanan Lapas Purwakarta

Dokumen ini menjelaskan rancangan teknis chatbot layanan publik **Silapurwa**
(Sistem Informasi Layanan Lapas Purwakarta) sebagai lampiran tugas akhir CPNS.

---

## 1. Tujuan dan Ruang Lingkup

Silapurwa adalah asisten layanan informasi berbasis WhatsApp untuk menjawab
pertanyaan rutin masyarakat (jam besuk, syarat kunjungan, titipan, layanan
integrasi, pengaduan) secara otomatis, 24 jam, tanpa biaya operasional dan
tanpa menambah beban petugas.

Prinsip utama: **retrieval sebagai satu-satunya sumber fakta.** Seluruh kalimat
bot dapat dilacak ke satu baris `faq` atau `kontak` di basis data.

---

## 2. Diagram Alur Pesan

```
WhatsApp (masyarakat)
        |
        v
  [Baileys adapter]  --- jeda manusiawi 1,5-4 dtk + indikator "mengetik"
        |
        v
  [penapis.js - pagar pembatasan]
  cek: data WBP / PII / barang terlarang / prompt injection
        | ditolak -> balasan template + kontak  (AI tidak dipanggil)
        v lolos
  [normalisasi.js] lower-case, buang stopword, sinonim (jenguk->besuk)
        |
        v
  [pencari.js - FTS5 + bobot keyword + faktor cakupan token]
        |
        +-- skor >= 0,75  -> JALUR CEPAT: jawaban_bot_tercetak  (TANPA AI)
        |
        +-- 0,50-0,75     -> JALUR AI: 1-3 FAQ sbg konteks -> Gemini
        |                        -> penapis pasca-AI (anti-halusinasi)
        |                        -> gagal? fallback jawaban tercetak/klarifikasi
        |
        +-- < 0,50        -> JALUR ESKALASI: template + kontak petugas
        |
        v
  catat: pesan, ai_interaksi, ai_kuota_harian
```

---

## 3. Tumpukan Teknologi

| Lapisan | Teknologi | Alasan |
|---|---|---|
| Runtime | Node.js 24 LTS (ESM) | Tersedia, ringan, dukungan `node:sqlite` native |
| Basis data | `node:sqlite` (SQLite + FTS5 + JSON1) | Tanpa dependensi native/C++ di Windows |
| Kanal WA | `@whiskeysockets/baileys@6.7.24` | Ringan (tanpa Chromium), versi stabil `legacy` |
| Web admin | Express 5 + EJS | Sederhana, tanpa build step |
| AI (bahasa) | `@google/genai` + `gemini-3.5-flash-lite` | Merapikan bahasa, bukan sumber fakta |
| Autentikasi | `express-session` + `bcryptjs` | Hash murni JS, tanpa `node-gyp` |
| Penjadwal | `node-cron` | Cadangan, pembersihan log, laporan mingguan |

**Tanpa dependensi native apa pun** — penting agar terpasang pada host Windows
spesifikasi rendah (Intel i3-8100, 8 GB RAM, HDD).

---

## 4. Skema Data (ringkas)

- `faq` + `faq_varian` + `faq_keyword` -> basis pengetahuan.
- `kb_dok` + `kb_fts` (FTS5) -> indeks pencarian (isi: pertanyaan contoh +
  varian + keyword, digabung).
- `pesan`, `percakapan`, `eskalasi`, `pertanyaan_tak_terjawab` -> operasional.
- `ai_interaksi`, `ai_kuota_harian`, `cache_jawaban` -> lapisan AI.
- `admin_user`, `audit_log` -> keamanan dan tata kelola.
- `pembatasan` -> pola pagar privasi dan topik terlarang.

Detail penuh: `src/db/schema.sql`.

---

## 5. Kontrol Anti-Halusinasi

1. `systemInstruction` mengikat: sumber hanya blok `<kb>`.
2. `responseSchema` JSON terstruktur (`terjawab`, `jawaban`, `faq_dipakai`).
3. Suhu rendah (0,1) untuk kepatuhan fakta.
4. `penapis.js` memverifikasi setiap angka/jam/tanggal keluaran AI agar ada di
   dalam konteks `<kb>`; jika tidak -> tolak dan pakai jawaban tercetak.
5. Deteksi kata spekulatif dan pola PII.
6. Cap kuota lokal; gagal/kehabisan kuota -> degradasi ke jawaban tercetak.

KPI: **0 kejadian** jawaban memuat angka/tanggal di luar basis pengetahuan.

---

## 6. Kepatuhan Privasi (UU PDP No. 27/2022)

- Nomor WhatsApp pengunjung di-hash SHA-256; tidak pernah dikirim ke Gemini.
- Hanya teks pertanyaan + FAQ publik yang dikirim ke API.
- Data warga binaan (nama, register, kondisi, foto) diblokir di pagar pembatasan.
- Pada tier gratis, Google menyatakan data dipakai untuk meningkatkan produk;
  hal ini dinyatakan terbuka di laporan, dan opsi tier berbayar (< Rp 5.000/bulan)
  disiapkan untuk produksi.

---

## 7. Tugas Terjadwal

| Tugas | Jadwal | Fungsi |
|---|---|---|
| Cadangan harian | 00:30 tiap hari | Salin basis data, retensi 14 hari |
| Pembersihan log | 01:00 tiap hari | Hapus pesan/cache > 90 hari |
| Laporan mingguan | Senin 07:00 | Rekap pertanyaan tak terjawab |

---

## 8. Struktur Folder

```
silapurwa/
|- src/
|  |- index.js              # bootstrap + health check
|  |- config/               # env, logger
|  |- saluran/              # baileys, simulasi, indeks (pemilih kanal)
|  |- mesin/                # pipa, normalisasi, pencari, penapis, gemini, percetakan
|  |- db/                   # koneksi, schema.sql, seed.sql, kueri, init
|  |- admin/                # server, routes, middleware, views (EJS)
|  \- tugas/                # cadangan, bersih-log, laporan-mingguan, penjadwal
|- data/                    # silapurwa.db, backups, laporan (tidak di-commit)
|- scripts/                 # pasang-service, jalankan-debug, cadangan, power-plan
\- docs/                    # lampiran tugas akhir
```
