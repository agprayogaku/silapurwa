# Lembar Verifikasi Data — Silapurwa (Lapas Purwakarta)

**Petunjuk:** Berkas ini dicetak dan dibawa saat menemui petugas Lapas
Purwakarta. Isi kolom **Nilai Resmi** bersama petugas, lalu pindahkan ke panel
admin (`/pengaturan`, `/faq`) atau langsung ke `src/db/seed.sql`.
Setelah semua terisi, jalankan `npm run status-data` sampai berstatus **SIAP**.

> Prinsip: *Jangan pernah mengarang jadwal, syarat, atau nomor kontak.*
> Bot hanya boleh mengucapkan apa yang ada di basis data.

---

## A. Kontak dan Jam Layanan

| Kode | Unit | Yang ditanyakan | Nilai Resmi |
|---|---|---|---|
| KON-01 | Layanan Informasi | Nomor WhatsApp/telepon resmi | |
| KON-02 | Layanan Informasi | Jam layanan informasi | |
| KON-03 | Seksi Registrasi/Kunjungan | Nomor telepon | |
| KON-04 | Seksi Pembinaan (Integrasi) | Nomor telepon | |
| KON-05 | Kanal Pengaduan | Nomor pengaduan/WhatsApp | |
| KON-06 | Semua | Apakah nomor boleh dicantumkan ke publik? | Ya / Tidak |

---

## B. FAQ yang Sudah Terbit (mohon validasi ulang faktanya)

| Kode | Topik | Fakta yang harus dikonfirmasi | Benar? |
|---|---|---|---|
| KNJ-01 | Jam besuk | Hari layanan, jam mulai–selesai, zona waktu | |
| KNJ-02 | Syarat besuk | Dokumen wajib, ketentuan keluarga inti | |
| KNJ-03 | Pendaftaran kunjungan | Loket, jam buka pendaftaran, antrean | |
| KNJ-04 | Jumlah pengunjung | Batas orang per WBP | |
| KNJ-05 | Hari libur | Kebijakan tutup, kunjungan khusus hari raya | |
| KNJ-06 | Barang bawaan | Yang boleh/larang, penitipan HP | |
| TTP-01 | Titipan makanan | Jenis, kemasan, porsi | |
| TTP-02 | Barang dilarang | Daftar + dasar aturan | |
| TTP-03 | Jam titipan | Jam per hari kerja | |
| INT-01 | Pembebasan Bersyarat | Definisi & syarat umum | |
| INT-02 | Syarat PB/CB | Dokumen & kelengkapan | |
| PNG-01 | Pengaduan | Cara & kanal | |
| PNG-03 | Bebas biaya | Konfirmasi seluruh layanan gratis (Rp 0) | |

---

## C. FAQ yang Masih DRAFT (perlu jawaban resmi sebelum diaktifkan)

| Kode | Topik | Jawaban resmi (diisi petugas) |
|---|---|---|
| KNJ-… | (Jika ada tambahan) | |
| INT-03 | Apa itu CMB? | |
| INT-04 | Lama proses usulan PB | |
| INT-05 | Cara mengajukan asimilasi | |
| TTP-04 | Prosedur menitipkan barang | |
| DOK-01 | Legalisasi surat | |
| DOK-02 | Izin kunjungan instansi/rombongan | |
| DOK-03 | Izin penelitian/pengambilan data | |
| KES-01 | Layanan kesehatan WBP | |
| KES-02 | Program keterampilan | |
| KES-03 | Program pendidikan | |
| PNG-02 | Kanal pengaduan resmi | |

---

## D. Teks Sistem (perlu persetujuan redaksi)

| Kunci | Isi saat ini | Teks disetujui |
|---|---|---|
| `sapaan_awal` | [VERIFIKASI] | |
| `pesan_fallback` | [VERIFIKASI] | |
| `pesan_tolak_data_wbp` | [VERIFIKASI] | |
| `jam_layanan_petugas` | Senin-Jumat [VERIFIKASI] | |

---

## E. Kepatuhan (centang)

- [ ] Petugas memahami bahwa **percakapan dicatat** untuk peningkatan layanan.
- [ ] Petugas menyetujui **penolakan data warga binaan** via kanal otomatis.
- [ ] Petugas menyetujui gaya bahasa bot ("Bapak/Ibu", maksimal 40 kata).
- [ ] Nomor perdana bot **bukan** nomor pribadi aktif pejabat.
- [ ] Disepakati operator/admin panel yang bertanggung jawab.

---

**Pengesahan**

| Peran | Nama & NIP | Tanda Tangan | Tanggal |
|---|---|---|---|
| Petugas Verifikator | | | |
| Penanggung Jawab Layanan | | | |
| Pengembang (Penulis) | | | |
