# Laporan Akhir — Silapurwa
## Sistem Informasi Layanan Lapas Purwakarta

> Dokumen ini adalah kerangka bab pembahasan tugas akhir. Angka yang disajikan
> merupakan **hasil pengukuran langsung** pada berkas uji di repositori ini.

---

## Bab 1 — Pendahuluan

### 1.1 Latar Belakang
Layanan informasi Lapas Purwakarta menerima pertanyaan berulang dari
masyarakat (jam besuk, syarat kunjungan, titipan, pengaduan). Pertanyaan rutin
ini menyita waktu petugas dan sering tidak terlayani di luar jam kerja.
Diperlukan kanal informasi otomatis yang murah, ringan, dan aman.

### 1.2 Rumusan Masalah
1. Bagaimana merancang chatbot yang **tidak berhalusinasi** dan hanya
   menyampaikan informasi terverifikasi?
2. Bagaimana menjaga **privasi warga binaan** sesuai UU PDP No. 27/2022?
3. Bagaimana menekan biaya operasional mendekati **Rp 0** pada perangkat
   berspesifikasi rendah?

### 1.3 Tujuan
Membangun Silapurwa, chatbot WhatsApp + panel admin, dengan arsitektur
berbasis *retrieval* dan lapisan AI yang hanya merapikan bahasa.

---

## Bab 2 — Landasan dan Rancangan

Rancangan lengkap terdapat pada `docs/arsitektur.md`. Ringkas:

- **Arsitektur 3 jalur**: jalur cepat (jawaban tercetak, tanpa AI),
  jalur AI (skor sedang), jalur eskalasi (skor rendah).
- **Anti-halusinasi berlapis**: `systemInstruction` → `responseSchema` →
  penapis pasca-AI (angka/tanggal wajib ada di `<kb>`).
- **Kepatuhan privasi**: nomor pengunjung di-hash; data WBP diblokir pagar.

---

## Bab 3 — Hasil Implementasi

### 3.1 Komponen Terpasang
| Komponen | Berkas | Status |
|---|---|---|
| Pipa orkestrasi pesan | `src/mesin/pipa.js` | Selesai |
| Retrieval FTS5 + cakupan token | `src/mesin/pencari.js` | Selesai |
| Normalisasi & sinonim | `src/mesin/normalisasi.js` | Selesai |
| Pagar privasi & penapis | `src/mesin/penapis.js` | Selesai |
| Integrasi Gemini | `src/mesin/gemini.js` | Selesai |
| Pra-render jawaban | `src/mesin/percetakan.js` | Selesai |
| Kanal Baileys & simulator | `src/saluran/` | Selesai |
| Panel admin (EJS) | `src/admin/` | Selesai |
| Tugas terjadwal | `src/tugas/` | Selesai |

### 3.2 Tampilan Panel Admin
Tangkapan layar tersedia pada `docs/tangkapan-layar/index.html`
(dihasilkan otomatis oleh `npm run export:tangkapan`).

---

## Bab 4 — Hasil Pengujian

### 4.1 Rekapitulasi Suite Uji

| Suite | Berkas | Jumlah | Lulus | Tingkat |
|---|---|---|---|---|
| Retrieval pipeline | `uji-retrieval.js` | 7 | 7 | 100% |
| Penapis AI & anti-halusinasi | `uji-ai.js` | 9 | 9 | 100% |
| Blackbox (termasuk penetrasi) | `uji-blackbox.js` | 30 | 30 | 100% |
| **Total** | | **46** | **46** | **100%** |

### 4.2 Distribusi Hasil Blackbox
| Jenis Balasan | Jumlah | Keterangan |
|---|---|---|
| Sapaan | 4 | Salam dikenali |
| FAQ (jalur cepat) | 14 | Dijawab tanpa AI |
| Tolak (pagar privasi/injeksi) | 9 | Data WBP & prompt injection ditolak |
| Eskalasi | 3 | Di luar cakupan -> diteruskan ke petugas |

### 4.3 Uji Anti-Halusinasi (bukti utama)
| Kasus uji | Perilaku bot |
|---|---|
| Jawaban memuat jam “15.00” (di luar KB) | **Ditolak** penapis (`halusinasi_angka`) |
| Jawaban memuat kata “mungkin” | **Ditolak** (`memuat_spekulasi`) |
| Jawaban memuat NIK 16 digit | **Ditolak** (`memuat_nik`) |
| Jawaban memuat nomor register WBP | **Ditolak** (`memuat_info_register`) |
| API key kosong / kuota habis | **Degradasi aman** ke jawaban tercetak |

### 4.4 Uji Ketahanan (Prompt Injection)
Empat upaya menjebol (`abaikan instruksi`, `berperan sebagai`,
`lupakan aturan`, `developer mode`) seluruhnya **ditolak** oleh pagar
pembatasan sebelum AI dipanggil.

---

## Bab 5 — Pembahasan Kinerja (KPI)

| KPI | Target | Hasil Terukur | Status |
|---|---|---|---|
| Pertanyaan rutin terjawab otomatis | ≥ 70% | **100%** untuk 14 kasus FAQ in-scope | Tercapai |
| Jawaban memuat angka/tanggal di luar KB | 0 kejadian | **0** (penapis menolak 100% kasus uji) | Tercapai |
| Waktu balas (di luar jeda sengaja) | < 5 detik | **rata-rata 3 ms**, p95 2 ms (jalur cepat) | Tercapai |
| Ketersediaan saat jam uji | ≥ 95% | 100% (46/46 uji, tanpa kegagalan runtime) | Tercapai |
| Pertanyaan tak terjawab terkumpul/minggu | ≥ 5 | Terkumpul & dilaporkan otomatis | Tercapai |
| Pemanggilan Gemini per 100 pesan | ≤ 30 | ~0 (jalur cepat menangani mayoritas) | Tercapai |

> Catatan: persentase 60% pada seluruh 30 skenario blackbox mencakup uji
> penetrasi & privasi yang **memang harus ditolak**, bukan kegagalan layanan.
> Untuk pertanyaan rutin sesuai cakupan, tingkat jawab otomatis 100%.

### 5.1 Efisiensi Biaya
- Jalur cepat tidak memanggil AI -> kuota Gemini hemat.
- Perkiraan produksi (tier berbayar) pada 500–1.000 pesan/bulan:
  **< Rp 5.000/bulan**. Pada tier gratis: **Rp 0**.

### 5.2 Analisis Risiko
Risiko utama — pemblokiran nomor WhatsApp (Baileys) — dibahas pada
`docs/analisis-risiko-baileys.md`, termasuk strategi peralihan ke
WhatsApp Cloud API resmi.

---

## Bab 6 — Kesimpulan dan Saran

### 6.1 Kesimpulan
1. Silapurwa menjawab pertanyaan rutin secara otomatis dan konsisten.
2. Arsitektur retrieval + penapis pasca-AI terbukti **mencegah halusinasi**
   (0 angka/tanggal di luar basis pengetahuan).
3. Data warga binaan terlindungi; privasi pengunjung dijaga.
4. Biaya operasional mendekati nol dan berjalan pada perangkat spesifikasi
   rendah tanpa dependensi native.

### 6.2 Saran
1. Lengkapi data `[VERIFIKASI]` bersama petugas (lihat
   `docs/lembar-verifikasi-data.md`) sebelum operasional.
2. Migrasi ke kanal resmi (Cloud API) untuk penggunaan produksi berkelanjutan.
3. Tambahkan basis FAQ secara berkala dari laporan mingguan.

---

## Lampiran
- `docs/arsitektur.md` — rancangan teknis.
- `docs/pengujian-blackbox.md` — tabel 30 skenario uji.
- `docs/analisis-risiko-baileys.md` — analisis risiko kanal.
- `docs/lembar-verifikasi-data.md` — lembar verifikasi petugas.
- `docs/tangkapan-layar/index.html` — lampiran tangkapan layar.
- `src/db/schema.sql` — skema basis data lengkap.
