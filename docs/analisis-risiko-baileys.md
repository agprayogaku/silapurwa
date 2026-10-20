# Analisis Risiko Kanal WhatsApp (Baileys) — Silapurwa

Bab ini membahas risiko utama penggunaan pustaka tidak resmi **Baileys** untuk
menghubungkan Silapurwa dengan WhatsApp, beserta mitigasi yang diterapkan.

---

## 1. Latar Belakang Pemilihan Baileys

WhatsApp tidak menyediakan API resmi gratis untuk instansi. Tiga opsi ditimbang:

| Opsi | Biaya | Beban Host | Risiko Blokir | Kesimpulan |
|---|---|---|---|---|
| Meta WhatsApp Cloud API | Berbayar per percakapan | Ringan | Rendah (resmi) | Butuh biaya & verifikasi bisnis -> tidak untuk demo |
| `whatsapp-web.js` | Gratis | Berat (Chromium) | Sedang | Membutuhkan Chromium; tidak layak di HDD/RAM 8 GB |
| **Baileys** | **Gratis** | **Ringan (WebSocket)** | **Sedang–Tinggi** | **Dipilih untuk demo** |

Baileys dipilih karena **tanpa Chromium** sehingga cocok dengan host
spesifikasi rendah dan target biaya Rp 0.

---

## 2. Risiko Utama dan Mitigasi

| # | Risiko | Dampak | Probabilitas | Mitigasi yang Diterapkan |
|---|---|---|---|---|
| 1 | Nomor diblokir/ban | Layanan mati, demo gagal | Sedang | Nomor perdana sekali pakai + nomor cadangan; bot tidak pernah memulai percakapan; jeda acak 1,5-4 dtk + indikator mengetik; adapter siap ditukar ke Cloud API |
| 2 | Sesi terputus (401/loggedOut) | Bot diam | Sedang | Reconnect otomatis + catat ke `audit_log`; peringatan eksplisit bila 401 |
| 3 | Versi RC tidak stabil | Error saat demo | Rendah | Pin eksak `6.7.24` (`legacy`) + `package-lock.json` di-commit |
| 4 | Pelanggaran ToS WhatsApp | Sanksi akun | Sedang | Penggunaan wajar, hanya membalas (tidak menyebar), dinyatakan terbuka di laporan |
| 5 | Kuota Gemini habis (429) | Bot tidak bisa merapikan bahasa | Sedang | Cap lokal `ai_kuota_harian_maks`; turun otomatis ke jawaban tercetak; model cadangan; saklar `ai_aktif=0` |
| 6 | AI berhalusinasi | Informasi salah | Sedang | Retrieval sumber tunggal; `responseSchema`; penapis angka/tanggal; jawaban tercetak sbg jaring pengaman |
| 7 | Data pengunjung ke free tier Google | Isu UU PDP | Tinggi bila diabaikan | Hash nomor WA; hanya FAQ publik + teks pertanyaan; opsi tier berbayar |
| 8 | Mesin sleep/mati | Bot tidak responsif | Sedang | NSSM auto-restart; `power-plan.ps1` anti-sleep; endpoint `/health` |

---

## 3. Karakteristik Risiko Pustaka Tidak Resmi

Baileys berkomunikasi dengan server WhatsApp melalui protokol multi-perangkat
(Multi-Device) yang direverse-engineer. Konsekuensinya:

1. **Tidak ada jaminan dukungan.** Perubahan protokol WhatsApp dapat memecah
   pustaka sewaktu-waktu.
2. **Deteksi otomatis.** WhatsApp dapat mendeteksi pola non-manusia (balas
   terlalu cepat, volume tinggi, pesan keluar tanpa dipicu).
3. **Isolasi kanal.** Karena itu, seluruh logika bisnis (retrieval, penapis,
   AI) dipisahkan dari kanal melalui folder `src/saluran/`. Bila Baileys tidak
   lagi layak, adaptor Cloud API dapat dipasang tanpa mengubah `src/mesin/`.

---

## 4. Rancangan Peralihan ke Kanal Resmi

Abstraksi `src/saluran/indeks.js` memilih kanal berdasarkan variabel `KANAL_AKTIF`:
`baileys` | `simulasi` (dan disiapkan `cloudapi`). Fungsi `prosesPesanMasuk()`
bersifat kanal-agnostik: menerima `{ nomorWa, teks, kanal }` dan mengembalikan
`{ balasan, jenis, skor, ... }`. Dengan demikian, peralihan ke Cloud API hanya
mengganti lapisan saluran, bukan mesin.

---

## 5. Kesimpulan

Baileys memberikan solusi **nol biaya** yang layak untuk tahap demonstrasi dan
penelitian. Risiko blokir dimitigasi melalui perilaku manusiawi, nomor sekali
pakai, dan desain saluran yang dapat ditukar. Untuk operasional produksi
berkelanjutan di instansi, disarankan bermigrasi ke **WhatsApp Cloud API** resmi
yang memenuhi kepatuhan platform dan privasi sepenuhnya.
