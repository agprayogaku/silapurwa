-- =====================================================================
-- SILAPURWA — FIXTURE PENGUJIAN (bukan data operasional)
-- ---------------------------------------------------------------------
-- Berkas ini HANYA dipakai oleh npm test (lihat src/mesin/uji-setup.js)
-- dan dijalankan pada basis data sementara terpisah. Tujuannya agar
-- 46 skenario uji tetap deterministik tanpa mengotori basis data
-- operasional yang telah dinetralkan.
-- =====================================================================

DELETE FROM kb_dok;
DELETE FROM faq_varian;
DELETE FROM faq_keyword;
DELETE FROM faq;
DELETE FROM kategori;
DELETE FROM kontak;
DELETE FROM pengaturan;
DELETE FROM pembatasan;

-- ---------------------------------------------------------------
-- KATEGORI
-- ---------------------------------------------------------------
INSERT INTO kategori (id, slug, nama, urutan) VALUES
  (1, 'kunjungan', 'Kunjungan dan Besuk',      1),
  (2, 'integrasi', 'Layanan Integrasi',        2),
  (3, 'titipan',   'Titipan Barang',           3),
  (4, 'dokumen',   'Dokumen dan Permohonan',   4),
  (5, 'kesehatan', 'Kesehatan dan Pembinaan',  5),
  (6, 'pengaduan', 'Pengaduan dan Kanal Resmi',6),
  (7, 'sistem',    'Template Sistem',          9);

-- ---------------------------------------------------------------
-- KONTAK
-- ---------------------------------------------------------------
INSERT INTO kontak (id, unit, nama_unit, nomor, jam_layanan, keterangan) VALUES
  (1, 'umum',      'Layanan Informasi',          '081200000001', 'Senin-Jumat 08.00-15.00', 'Kontak utama bot'),
  (2, 'kunjungan', 'Seksi Registrasi/Kunjungan', '081200000002', 'Jam kunjungan 09.00-12.00','Urusan besuk dan titipan'),
  (3, 'integrasi', 'Seksi Pembinaan',            '081200000003', 'Jam kerja 08.00-15.00',   'PB, CB, CMB, asimilasi'),
  (4, 'pengaduan', 'Kanal Pengaduan',            '081200000004', 'Jam kerja 08.00-15.00',   'Pengaduan dan gratifikasi');

-- ---------------------------------------------------------------
-- PENGATURAN
-- ---------------------------------------------------------------
INSERT INTO pengaturan (kunci, nilai, tipe, keterangan) VALUES
  ('nama_instansi',        'Instansi Uji',                        'string', 'Nama resmi'),
  ('sapaan_awal',          'Selamat datang di layanan informasi kami. Silakan sampaikan pertanyaan Bapak/Ibu.', 'string', 'Pesan pembuka'),
  ('jam_layanan_bot',      '24 jam',                              'string', 'Bot aktif penuh'),
  ('jam_layanan_petugas',  'Senin-Jumat 08.00-15.00',             'string', 'Jam layanan petugas'),
  ('pesan_fallback',       'Mohon maaf Bapak/Ibu, pertanyaan tersebut belum tersedia pada sistem kami. Pertanyaan Anda telah dicatat untuk ditindaklanjuti petugas.', 'string', 'Template eskalasi'),
  ('pesan_tolak_data_wbp', 'Mohon maaf Bapak/Ibu, data pribadi individu bersifat rahasia dan tidak dapat kami berikan.', 'string', 'Template penolakan data'),
  ('delay_min_ms',         '1500',  'number', 'Jeda minimum'),
  ('delay_max_ms',         '4000',  'number', 'Jeda maksimum'),
  ('ambang_jawab',         '0.75',  'number', 'Skor agar langsung dijawab'),
  ('ambang_klarifikasi',   '0.50',  'number', 'Skor untuk tanya konfirmasi'),
  ('kanal_aktif',          'simulasi', 'string', 'baileys | simulasi'),
  ('versi_kb',             '1',     'number', 'Naik tiap KB berubah'),
  ('ai_aktif',             '1',     'bool',   'Saklar darurat lapisan AI'),
  ('ai_model_utama',       'gemini-3.5-flash-lite', 'string', 'Model utama'),
  ('ai_model_cadangan',    'gemini-3.8-flash',      'string', 'Model cadangan'),
  ('ai_suhu',              '0.3',   'number', 'Kreativitas rendah'),
  ('ai_maks_token',        '320',   'number', 'Batas token keluaran'),
  ('ai_kuota_harian_maks', '200',   'number', 'Cap lokal'),
  ('ai_gaya',              'ramah, singkat, jelas, kosakata sederhana untuk lansia', 'string', 'Preferensi gaya'),
  ('ai_kirim_nomor_wa',    '0',     'bool',   'Jangan kirim identitas pengunjung ke AI');

-- ---------------------------------------------------------------
-- PAGAR PRIVASI
-- ---------------------------------------------------------------
INSERT INTO pembatasan (pola, jenis, kategori_alasan, keterangan) VALUES
  ('data warga binaan|nama narapidana|nama wbp|nomor register|no reg',
     'tolak_topik', 'privasi_wbp', 'Data pribadi WBP dilarang diberikan'),
  ('apakah .* ada di lapas|isi sel|kamar .* nomor|foto .* wbp|foto narapidana',
     'tolak_topik', 'privasi_wbp', 'Keberadaan/kondisi pribadi WBP'),
  ('kondisi .*narapidana|kondisi .*warga binaan|kondisi .*wbp|foto .*warga binaan|foto .*tahanan|foto .*narapidana|isi blok|blok hunian',
     'tolak_topik', 'privasi_wbp', 'Kondisi fisik, foto, dan penghunian WBP bersifat rahasia'),
  ('nik|nomor ktp|no hp saya|cv saya|kartu keluarga',
     'tolak_topik', 'data_pribadi_pengunjung', 'Jangan minta/kirim data pribadi'),
  ('surat keputusan|sk pembebasan|berkas perkara|putusan pengadilan',
     'tolak_topik', 'dokumen_terbatas', 'Dokumen internal'),
  ('cara memasukkan narkoba|cara menyelundupkan|titip hp|sabu|ganja|senjata',
     'tolak_topik', 'barang_terlarang', 'Permintaan cara melanggar aturan'),
  ('abaikan (instruksi|aturan|perintah)|system prompt|api key|developer mode|lupakan aturan|berperan sebagai|bocorkan',
     'tolak_topik', 'upaya_penetrasi', 'Upaya mengubah aturan/instruksi sistem'),
  ('__rate_limit__',
     'rate_limit', 'batas_kecepatan', 'Maks 20 pesan / 5 menit / nomor');

-- ---------------------------------------------------------------
-- FAQ (kerangka)
-- ---------------------------------------------------------------
INSERT INTO faq (id, kode, kategori_id, pertanyaan_contoh, jawaban, status, sumber) VALUES
  (1,  'KNJ-01', 1, 'Jam berapa besuk di Lapas Purwakarta?',             '[VERIFIKASI]', 'draft', NULL),
  (2,  'KNJ-02', 1, 'Apa saja syarat untuk besuk?',                      '[VERIFIKASI]', 'draft', NULL),
  (3,  'KNJ-03', 1, 'Bagaimana cara mendaftar kunjungan?',               '[VERIFIKASI]', 'draft', NULL),
  (4,  'KNJ-04', 1, 'Berapa orang yang boleh ikut besuk?',               '[VERIFIKASI]', 'draft', NULL),
  (5,  'KNJ-05', 1, 'Apakah besuk buka pada hari libur nasional?',       '[VERIFIKASI]', 'draft', NULL),
  (6,  'KNJ-06', 1, 'Barang apa yang boleh dibawa pengunjung?',          '[VERIFIKASI]', 'draft', NULL),
  (7,  'INT-01', 2, 'Apa itu Pembebasan Bersyarat (PB)?',                '[VERIFIKASI]', 'draft', NULL),
  (8,  'INT-02', 2, 'Apa syarat mengajukan PB atau CB?',                 '[VERIFIKASI]', 'draft', NULL),
  (9,  'INT-03', 2, 'Apa itu Cuti Menjelang Bebas (CMB)?',               '[VERIFIKASI]', 'draft', NULL),
  (10, 'INT-04', 2, 'Berapa lama proses usulan pembebasan bersyarat?',   '[VERIFIKASI]', 'draft', NULL),
  (11, 'INT-05', 2, 'Bagaimana cara mengajukan asimilasi?',              '[VERIFIKASI]', 'draft', NULL),
  (12, 'TTP-01', 3, 'Makanan dan minuman apa yang boleh dititipkan?',    '[VERIFIKASI]', 'draft', NULL),
  (13, 'TTP-02', 3, 'Apa saja barang yang dilarang dititipkan?',         '[VERIFIKASI]', 'draft', NULL),
  (14, 'TTP-03', 3, 'Kapan jam penerimaan titipan?',                     '[VERIFIKASI]', 'draft', NULL),
  (15, 'TTP-04', 3, 'Bagaimana prosedur menitipkan barang?',             '[VERIFIKASI]', 'draft', NULL),
  (16, 'DOK-01', 4, 'Bagaimana cara meminta legalisasi surat?',          '[VERIFIKASI]', 'draft', NULL),
  (17, 'DOK-02', 4, 'Bagaimana izin kunjungan untuk instansi atau rombongan?', '[VERIFIKASI]', 'draft', NULL),
  (18, 'DOK-03', 4, 'Bagaimana cara mengajukan izin penelitian atau pengambilan data?', '[VERIFIKASI]', 'draft', NULL),
  (19, 'KES-01', 5, 'Bagaimana layanan kesehatan untuk warga binaan?',   '[VERIFIKASI]', 'draft', NULL),
  (20, 'KES-02', 5, 'Program keterampilan apa saja yang tersedia?',      '[VERIFIKASI]', 'draft', NULL),
  (21, 'KES-03', 5, 'Apakah ada program pendidikan di dalam lapas?',     '[VERIFIKASI]', 'draft', NULL),
  (22, 'PNG-01', 6, 'Bagaimana cara menyampaikan pengaduan?',            '[VERIFIKASI]', 'draft', NULL),
  (23, 'PNG-02', 6, 'Apa saja kanal pengaduan resmi yang tersedia?',     '[VERIFIKASI]', 'draft', NULL),
  (24, 'PNG-03', 6, 'Bagaimana melaporkan dugaan gratifikasi?',          '[VERIFIKASI]', 'draft', NULL),
  (25, 'OPS-01', 7, 'Pertanyaan di luar cakupan layanan bot',            '[VERIFIKASI]', 'draft', NULL),
  (26, 'OPS-02', 7, 'Permintaan data warga binaan',                      '[VERIFIKASI]', 'draft', NULL);

-- ---------------------------------------------------------------
-- VARIAN & KEYWORD
-- ---------------------------------------------------------------
INSERT INTO faq_varian (faq_id, teks) VALUES
  (1, 'jam besuk'), (1, 'jadwal kunjungan'), (1, 'besuk buka jam berapa'),
  (1, 'kapan bisa menjenguk'), (1, 'jam layanan kunjungan'),
  (2, 'syarat jenguk'), (2, 'persyaratan besuk'), (2, 'dokumen apa yang dibawa'),
  (2, 'apa saja yang harus dibawa saat besuk'),
  (3, 'cara daftar besuk'), (3, 'pendaftaran kunjungan'), (3, 'antrean kunjungan'),
  (6, 'barang bawaan saat besuk'),
  (12, 'titip makanan'), (12, 'boleh titip makanan apa'),
  (13, 'barang yang tidak boleh dititipkan'), (14, 'jam titip barang'),
  (7, 'pb itu apa'), (8, 'syarat pembebasan bersyarat'), (10, 'lamanya proses asimilasi'),
  (22, 'cara mengadu'), (22, 'mau lapor'), (23, 'nomor pengaduan');

INSERT INTO faq_keyword (faq_id, kata, bobot) VALUES
  (1, 'besuk', 1.5), (1, 'kunjungan', 1.5), (1, 'jam', 1.0), (1, 'jadwal', 1.2),
  (2, 'syarat', 1.5), (2, 'persyaratan', 1.5), (2, 'ktp', 1.2), (2, 'dokumen', 1.2), (2, 'besuk', 1.5), (2, 'jenguk', 1.5),
  (3, 'daftar', 1.4), (3, 'pendaftaran', 1.4), (3, 'antre', 1.2),
  (4, 'orang', 1.4), (4, 'jumlah', 1.5),
  (5, 'libur', 1.5), (5, 'minggu', 1.4), (5, 'tanggal', 1.0),
  (6, 'bawaan', 1.3), (6, 'barang', 1.2),
  (12, 'titip', 1.5), (12, 'makanan', 1.3), (12, 'minuman', 1.2),
  (13, 'dilarang', 1.5), (13, 'terlarang', 1.5), (13, 'barang', 1.3), (13, 'titip', 1.2),
  (14, 'titipan', 1.5), (14, 'penerimaan', 1.2),
  (7, 'pb', 1.5), (7, 'pembebasan', 1.5), (7, 'bersyarat', 1.3),
  (8, 'syarat', 1.4), (9, 'cmb', 1.5), (9, 'cuti', 1.4),
  (11, 'asimilasi', 1.5), (16, 'legalisasi', 1.5), (16, 'surat', 1.2),
  (17, 'instansi', 1.3), (17, 'rombongan', 1.3),
  (18, 'penelitian', 1.5), (18, 'data', 1.1),
  (19, 'kesehatan', 1.4), (20, 'keterampilan', 1.4), (21, 'pendidikan', 1.4),
  (22, 'pengaduan', 1.5), (22, 'mengadu', 1.5), (24, 'gratifikasi', 1.5),
  (25, 'lain', 0.5), (26, 'data', 1.0), (26, 'warga', 1.0);

-- ---------------------------------------------------------------
-- TERBITKAN 13 FAQ (jawaban terverifikasi untuk pengujian)
-- ---------------------------------------------------------------
UPDATE faq SET status='publish',
  jawaban = 'Layanan kunjungan/besuk dibuka pada hari Senin sampai Jumat, pukul 09.00 sampai 12.00 WIB. Pengunjung wajib mendaftar di loket sebelum pukul 11.30 WIB.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Layanan besuk dibuka hari Senin sampai Jumat, pukul 09.00 sampai 12.00 WIB. Pendaftaran ditutup pukul 11.30 WIB ya. Jangan lupa bawa KTP asli.'
  WHERE kode = 'KNJ-01';
UPDATE faq SET status='publish',
  jawaban = 'Syarat besuk: 1) KTP/SIM/Paspor asli pengunjung, 2) Tercatat sebagai keluarga inti atau memiliki surat izin pihak penahan, 3) Berpakaian sopan dan rapi.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Syarat besuk cukup bawa KTP asli, berpakaian rapi dan sopan, serta merupakan keluarga inti warga binaan. Silakan datang langsung ke loket kunjungan.'
  WHERE kode = 'KNJ-02';
UPDATE faq SET status='publish',
  jawaban = 'Pendaftaran kunjungan dilakukan langsung di Loket Pendaftaran Kunjungan dengan mengambil nomor antrean dan menunjukkan KTP asli mulai pukul 08.30 WIB.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Pendaftaran kunjungan dilakukan langsung di loket dengan mengambil nomor antrean dan membawa KTP asli mulai pukul 08.30 WIB.'
  WHERE kode = 'KNJ-03';
UPDATE faq SET status='publish',
  jawaban = 'Kunjungan keluarga dibatasi maksimal 3 (tiga) orang dewasa per warga binaan dalam satu sesi besuk, untuk menjaga ketertiban ruang kunjungan.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Jumlah pengunjung dibatasi maksimal 3 orang dewasa per warga binaan untuk kenyamanan dan ketertiban bersama.'
  WHERE kode = 'KNJ-04';
UPDATE faq SET status='publish',
  jawaban = 'Layanan kunjungan/besuk tutup pada hari Sabtu, Minggu, dan hari libur nasional. Kunjungan khusus hari libur hanya dibuka pada Hari Raya Idul Fitri dan Hari Raya Natal.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Layanan besuk tutup pada hari Minggu dan hari libur nasional ya. Layanan khusus libur hanya dibuka saat Hari Raya besar keagamaan.'
  WHERE kode = 'KNJ-05';
UPDATE faq SET status='publish',
  jawaban = 'Pengunjung dilarang membawa telepon genggam, senjata tajam, uang tunai, dan obat-obatan terlarang ke ruang kunjungan. Seluruh barang berharga wajib dititipkan di loker penitipan loket.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Seluruh HP, tas, dan barang berharga wajib disimpan di loker loket pendaftaran sebelum memasuki ruang kunjungan.'
  WHERE kode = 'KNJ-06';
UPDATE faq SET status='publish',
  jawaban = 'Pembebasan Bersyarat (PB) adalah proses pembinaan narapidana di luar Lapas setelah menjalani sekurang-kurangnya 2/3 masa pidana dengan ketentuan minimal 9 bulan dan berkelakuan baik.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Pembebasan Bersyarat (PB) diberikan kepada warga binaan yang sudah menjalani 2/3 masa hukuman dan berkelakuan baik selama pembinaan.'
  WHERE kode = 'INT-01';
UPDATE faq SET status='publish',
  jawaban = 'Syarat pengusulan PB/CB meliputi: salinan putusan hakim, surat jaminan keluarga bermaterai, laporan Litmas Bapas, dan catatan berkelakuan baik (bebas Register F).',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Syarat integrasi (PB/CB) antara lain surat jaminan keluarga bermaterai, laporan penelitian Bapas, dan catatan berkelakuan baik.'
  WHERE kode = 'INT-02';
UPDATE faq SET status='publish',
  jawaban = 'Titipan makanan diperbolehkan untuk makanan matang yang tidak berkuah santan kental, dalam wadah transparan, dan tidak basi. Dilarang membawa makanan dalam kaleng.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Titipan makanan boleh berupa makanan matang kering dalam wadah bening/transparan ya. Mohon tidak menggunakan wadah kaleng atau kaca.'
  WHERE kode = 'TTP-01';
UPDATE faq SET status='publish',
  jawaban = 'Barang yang dilarang dititipkan: 1) Handphone/alat komunikasi dan charger, 2) Sajam dan senjata api, 3) Narkoba/obat keras tanpa resep, 4) Minuman keras, 5) Kemasan kaleng atau kaca.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Dilarang menitipkan HP, senjata tajam, obat keras tanpa resep, serta kemasan kaca atau kaleng.'
  WHERE kode = 'TTP-02';
UPDATE faq SET status='publish',
  jawaban = 'Layanan penerimaan titipan makanan dan barang dibuka setiap hari kerja Senin sampai Jumat, pukul 08.30 sampai 11.30 WIB di loket pemeriksaan pintu utama.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Jam penerimaan titipan dibuka Senin sampai Jumat, pukul 08.30 sampai 11.30 WIB di loket pintu utama.'
  WHERE kode = 'TTP-03';
UPDATE faq SET status='publish',
  jawaban = 'Pengaduan masyarakat dapat disampaikan melalui kotak pengaduan di loket pelayanan informasi atau kanal WhatsApp resmi pengaduan.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Pengaduan dapat disampaikan langsung di kotak pengaduan loket pelayanan atau melalui nomor pengaduan resmi kami.'
  WHERE kode = 'PNG-01';
UPDATE faq SET status='publish',
  jawaban = 'Seluruh layanan (kunjungan, titipan makanan, pengurusan pembebasan bersyarat) adalah GRATIS (Rp 0). Dilarang memberikan imbalan atau uang kepada petugas.',
  jawaban_bot_tercetak = 'Baik Bapak/Ibu. Seluruh layanan sama sekali TIDAK DIPUNGUT BIAYA (Rp 0 / Bebas Pungli). Laporkan bila ada petugas meminta biaya.'
  WHERE kode = 'PNG-03';

-- ---------------------------------------------------------------
-- INDEKS PENCARIAN FTS
-- ---------------------------------------------------------------
DELETE FROM kb_dok;
INSERT INTO kb_dok (faq_id, teks)
SELECT f.id,
       lower(
         f.pertanyaan_contoh || ' ' ||
         coalesce((SELECT group_concat(v.teks, ' ') FROM faq_varian v WHERE v.faq_id = f.id), '') || ' ' ||
         coalesce((SELECT group_concat(k.kata, ' ') FROM faq_keyword k WHERE k.faq_id = f.id), '')
       )
FROM faq f
WHERE f.status = 'publish';
