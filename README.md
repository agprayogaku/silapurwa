# SILAPURWA (Sistem Layanan Informasi Publik Lapas Purwakarta)

SILAPURWA adalah inovasi pelayanan publik berbasis WhatsApp Chatbot yang dikembangkan sebagai bagian dari Aktualisasi Nilai-Nilai Dasar PNS (Pelatihan Dasar CPNS). Sistem ini dirancang untuk mengoptimalisasi layanan informasi publik di Lapas Kelas IIB Purwakarta, khususnya bagi keluarga warga binaan, agar dapat mengakses informasi secara cepat, transparan, dan akurat selama 24 jam.

## 🎯 Target Proyek
1. Chatbot WhatsApp aktif dan berjalan.
2. Sistem auto-reply FAQ berjalan.
3. Menu layanan informasi tersedia.
4. Admin panel sederhana tersedia.
5. SOP penggunaan tersedia.

## 🚀 Fitur Utama (Alur Chatbot)
1. **Jadwal Kunjungan** - Informasi waktu dan sesi kunjungan warga binaan.
2. **Penitipan Barang** - Alur, syarat, dan ketentuan penitipan barang/makanan.
3. **Layanan Integrasi** - Informasi syarat PB, CB, CMB, dan Asimilasi.
4. **Kontak Petugas** - Akses komunikasi langsung ke pengaduan/layanan terkait.
5. **Bicara dengan Admin** - Pengalihan otomatis ke petugas piket (manual reply).

## 🛠️ Teknologi & Library
- **Runtime Environment:** Node.js LTS
- **Framework Web:** Express.js
- **WhatsApp Library:** @whiskeysockets/baileys
- **Database/Penyimpanan Data:** JSON File-Based Database

## 📁 Struktur Proyek
```text
/silapurwa
 ├── /src
 │    ├── /bot          # Logika dan penanganan pesan WhatsApp
 │    ├── /routes       # Routing untuk web admin panel
 │    ├── /controllers  # Logika bisnis admin panel
 │    ├── /services     # Layanan integrasi data
 │    ├── /utils        # Helper fungsi utilitas
 ├── /data              # Penyimpanan data informasi (JSON)
 ├── /public            # Aset statis web admin (CSS, JS, Gambar)
 ├── /views             # Template tampilan admin panel
 ├── /session           # Penyimpanan sesi login WhatsApp (autentikasi QR)
 ├── app.js             # Entry point utama aplikasi
 └── .env               # Konfigurasi environment sistem
