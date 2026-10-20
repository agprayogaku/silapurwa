-- =====================================================================
-- SILAPURWA — Data Awal (seed) — VERSI NETRAL
-- ---------------------------------------------------------------------
-- Seed ini SENGAJA dinetralkan: TIDAK memuat informasi instansi apa pun,
-- tidak ada FAQ, dan tidak ada nomor kontak. Semua nilai di bawah adalah
-- DEFAULT generik yang WAJIB diisi operator melalui panel admin
-- (/faq, /pengaturan) sebelum sistem dipakai melayani masyarakat.
-- Jangan pernah mengarang jadwal, syarat, atau nomor kontak.
-- =====================================================================

-- ---------------------------------------------------------------
-- 1. KATEGORI (kerangka umum, dapat ditambah/diubah dari panel admin)
-- ---------------------------------------------------------------
INSERT INTO kategori (slug, nama, urutan) VALUES
  ('umum',      'Informasi Umum',     1),
  ('layanan',   'Prosedur Layanan',   2),
  ('dokumen',   'Dokumen dan Syarat', 3),
  ('jadwal',    'Jadwal dan Waktu',   4),
  ('pengaduan', 'Pengaduan',          5),
  ('sistem',    'Template Sistem',    9);

-- ---------------------------------------------------------------
-- 2. KONTAK (kosong / netral — isi dari panel admin)
-- ---------------------------------------------------------------
INSERT INTO kontak (id, unit, nama_unit, nomor, jam_layanan, keterangan) VALUES
  (1, 'umum',      'Layanan Informasi',         '', '', 'Kontak utama bot'),
  (2, 'layanan',   'Petugas Layanan',           '', '', 'Tindak lanjut tiket'),
  (3, 'pengaduan', 'Kanal Pengaduan',           '', '', 'Pengaduan masyarakat');

-- ---------------------------------------------------------------
-- 3. PENGATURAN (nilai default generik)
-- ---------------------------------------------------------------
INSERT INTO pengaturan (kunci, nilai, tipe, keterangan) VALUES
  ('nama_instansi',        'Nama Instansi Belum Diatur', 'string', 'Nama resmi instansi (isi dari panel)'),
  ('sapaan_awal',          'Selamat datang di layanan informasi kami. Silakan sampaikan pertanyaan Bapak/Ibu.', 'string', 'Pesan pembuka bot'),
  ('jam_layanan_bot',      '24 jam',       'string', 'Bot aktif penuh'),
  ('jam_layanan_petugas',  'Belum diatur', 'string', 'Jam layanan petugas manusia'),
  ('pesan_fallback',       'Mohon maaf Bapak/Ibu, pertanyaan tersebut belum tersedia pada sistem kami. Pertanyaan Anda telah dicatat untuk ditindaklanjuti petugas.', 'string', 'Template eskalasi ke petugas'),
  ('pesan_tolak_data_wbp', 'Mohon maaf Bapak/Ibu, data pribadi individu bersifat rahasia dan tidak dapat kami berikan.', 'string', 'Template penolakan data pribadi'),
  ('delay_min_ms',         '1500',  'number', 'Jeda minimum (simulasi manusia)'),
  ('delay_max_ms',         '4000',  'number', 'Jeda maksimum'),
  ('ambang_jawab',         '0.75',  'number', 'Skor agar langsung dijawab'),
  ('ambang_klarifikasi',   '0.50',  'number', 'Skor untuk tanya konfirmasi'),
  ('kanal_aktif',          'simulasi', 'string', 'baileys | simulasi'),
  ('versi_kb',             '1',     'number', 'Naik tiap KB berubah'),
  ('ai_aktif',             '1',     'bool',   'Saklar darurat lapisan AI'),
  ('ai_model_utama',       'gemini-3.5-flash-lite', 'string', 'Hemat, tersedia di free tier'),
  ('ai_model_cadangan',    'gemini-3.8-flash',      'string', 'Dipakai bila model utama kena 429'),
  ('ai_suhu',              '0.3',   'number', 'Kreativitas rendah agar tidak mengarang'),
  ('ai_maks_token',        '320',   'number', 'Batas token keluaran'),
  ('ai_kuota_harian_maks', '200',   'number', 'Cap lokal, di bawah RPD Google'),
  ('ai_gaya',              'ramah, singkat, jelas, kosakata sederhana untuk lansia', 'string', 'Preferensi gaya'),
  ('ai_kirim_nomor_wa',    '0',     'bool',   'JANGAN kirim identitas pengunjung ke AI');

-- ---------------------------------------------------------------
-- 4. PAGAR PRIVASI (pembatasan) — perlindungan generik
-- ---------------------------------------------------------------
INSERT INTO pembatasan (pola, jenis, kategori_alasan, keterangan) VALUES
  ('data pribadi|nama lengkap|nomor identitas|nomor registrasi|no reg',
     'tolak_topik', 'privasi_pribadi', 'Data pribadi individu dilarang diberikan'),
  ('isi sel|kamar .* nomor|foto .* individu|kondisi .* pribadi',
     'tolak_topik', 'privasi_pribadi', 'Keberadaan/kondisi pribadi bersifat rahasia'),
  ('nik|nomor ktp|no hp saya|cv saya|kartu keluarga',
     'tolak_topik', 'data_pribadi_pengunjung', 'Jangan minta/kirim data pribadi'),
  ('surat keputusan|sk pembebasan|berkas perkara|putusan pengadilan',
     'tolak_topik', 'dokumen_terbatas', 'Dokumen internal'),
  ('cara memasukkan narkoba|cara menyelundupkan|sabu|ganja|senjata',
     'tolak_topik', 'barang_terlarang', 'Permintaan cara melanggar aturan'),
  ('abaikan (instruksi|aturan|perintah)|system prompt|api key|developer mode|lupakan aturan|berperan sebagai|bocorkan',
     'tolak_topik', 'upaya_penetrasi', 'Upaya mengubah aturan/instruksi sistem'),
  ('__rate_limit__',
     'rate_limit', 'batas_kecepatan', 'Maks 20 pesan / 5 menit / nomor');

-- ---------------------------------------------------------------
-- 5. BASIS FAQ — SENGAJA KOSONG
--    Tambahkan FAQ melalui panel admin (/faq) setelah diverifikasi.
-- ---------------------------------------------------------------

-- ---------------------------------------------------------------
-- 6. AKUN ADMIN AWAL
--    Buat hash bcryptjs lebih dulu, contoh:
--    npx --yes bcryptjs-cli hash "KataSandiAnda" 12
--    atau: node -e "console.log(require('bcryptjs').hashSync('KataSandiAnda',12))"
-- ---------------------------------------------------------------
INSERT INTO admin_user (username, nama, peran, password_hash) VALUES
  ('admin', 'Administrator', 'admin', '[GANTI_HASH_BCRYPT]');
