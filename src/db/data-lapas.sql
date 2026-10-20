-- =====================================================================
-- SILAPURWA — DATA LAYANAN TERVERIFIKASI
-- Sumber tunggal:
--   "Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan
--    Barang Lapas Kelas IIB Purwakarta"
-- Semua fakta di bawah diambil langsung dari dokumen tersebut. Tidak ada
-- jadwal, nomor, atau ketentuan yang dikarang.
-- Muat dengan: npm run data:lapas
-- =====================================================================

-- Lepas FK sementara agar pemuatan ulang tidak terhalang riwayat pesan.
PRAGMA foreign_keys = OFF;

DELETE FROM kb_dok;
DELETE FROM faq_varian;
DELETE FROM faq_keyword;
DELETE FROM faq;
DELETE FROM kategori;
DELETE FROM kontak;

-- ---------------------------------------------------------------
-- 1. KATEGORI
-- ---------------------------------------------------------------
INSERT INTO kategori (id, slug, nama, urutan, aktif) VALUES
  (1, 'kunjungan',        'Jadwal dan Kunjungan',     1, 1),
  (2, 'penitipan-uang',   'Penitipan Uang',           2, 1),
  (3, 'penitipan-barang', 'Penitipan Barang',         3, 1),
  (4, 'tata-tertib',      'Tata Tertib Kunjungan',    4, 1),
  (5, 'informasi',        'Informasi Umum',           5, 1);

-- ---------------------------------------------------------------
-- 2. KONTAK RESMI (hanya yang tercantum pada dokumen)
-- ---------------------------------------------------------------
INSERT INTO kontak (id, unit, nama_unit, nomor, jam_layanan, keterangan, aktif) VALUES
  (1, 'umum',      'Layanan Kunjungan dan Penitipan', '0852-8442-4304',
      'Sesuai jadwal kunjungan',
      'Konfirmasi transfer penitipan uang; tidak melalui grup', 1),
  (2, 'penitipan', 'Konfirmasi Transfer Penitipan Uang', '0852-8442-4304',
      'Sesuai jadwal kunjungan',
      'Rekening resmi BRI 37340100033564', 1),
  (3, 'layanan',   'Petugas Layanan Kunjungan', NULL,
      'Sesuai jadwal kunjungan', NULL, 1);

-- ---------------------------------------------------------------
-- 3. PENGATURAN (upsert; perilaku sistem tidak diubah)
-- ---------------------------------------------------------------
INSERT INTO pengaturan (kunci, nilai, tipe, keterangan) VALUES
  ('nama_instansi',              'Lapas Kelas IIB Purwakarta', 'string', 'Nama resmi instansi'),
  ('sapaan_awal',                'Selamat datang di layanan informasi Lapas Kelas IIB Purwakarta. Silakan tanyakan jadwal kunjungan, penitipan uang, penitipan barang, atau tata tertib kunjungan.', 'string', 'Pesan pembuka bot'),
  ('jam_layanan_petugas',        'Sesuai jadwal kunjungan', 'string', 'Jam layanan petugas'),
  ('bank_penitipan_nama',        'BRI', 'string', 'Bank resmi penitipan uang'),
  ('bank_penitipan_rekening',    '37340100033564', 'string', 'Nomor rekening resmi penitipan uang'),
  ('konfirmasi_penitipan_nomor', '0852-8442-4304', 'string', 'Nomor konfirmasi transfer (bukan grup)'),
  ('batas_penitipan_uang',       '500000', 'number', 'Maksimal penitipan uang per WBP (Rupiah)')
ON CONFLICT(kunci) DO UPDATE SET
  nilai = excluded.nilai,
  tipe = excluded.tipe,
  keterangan = excluded.keterangan,
  diubah_pada = datetime('now','localtime');

-- ---------------------------------------------------------------
-- 4. FAQ TERBIT (26 butir)
-- ---------------------------------------------------------------
INSERT INTO faq
  (id, kode, kategori_id, pertanyaan_contoh, jawaban, jawaban_bot_tercetak,
   prioritas, status, sumber)
VALUES
-- ===== A. JADWAL & KUNJUNGAN =====
(1, 'KNJ-01', 1,
 'Bagaimana jadwal kunjungan tahanan dan narapidana?',
 'Jadwal kunjungan dibedakan menurut kategori WBP. Tahanan: Senin dan Rabu pukul 08.30-11.30 WIB serta 13.00-14.30 WIB, dan Sabtu pukul 08.30-11.30 WIB. Narapidana: Senin, Selasa, dan Kamis pukul 08.30-11.30 WIB serta 13.00-14.30 WIB, dan Sabtu pukul 08.30-11.30 WIB. Jadwal Sabtu dilakukan secara bergantian sesuai pekan.',
 'Baik Bapak/Ibu. Tahanan: Senin dan Rabu pukul 08.30-11.30 serta 13.00-14.30 WIB. Narapidana: Senin, Selasa, dan Kamis pada jam yang sama. Sabtu pukul 08.30-11.30 WIB, bergantian sesuai pekan.',
 9, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(2, 'KNJ-02', 1,
 'Kapan jadwal kunjungan untuk tahanan?',
 'Jadwal kunjungan Tahanan: Senin pukul 08.30-11.30 WIB dan 13.00-14.30 WIB; Rabu pukul 08.30-11.30 WIB dan 13.00-14.30 WIB; serta Sabtu pukul 08.30-11.30 WIB. Kunjungan Sabtu dilakukan secara bergantian sesuai pekan.',
 'Baik Bapak/Ibu. Kunjungan tahanan dibuka Senin dan Rabu pukul 08.30-11.30 serta 13.00-14.30 WIB, dan Sabtu pukul 08.30-11.30 WIB secara bergantian.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(3, 'KNJ-03', 1,
 'Kapan jadwal kunjungan untuk narapidana?',
 'Jadwal kunjungan Narapidana: Senin, Selasa, dan Kamis pukul 08.30-11.30 WIB dan 13.00-14.30 WIB; serta Sabtu pukul 08.30-11.30 WIB. Kunjungan Sabtu dilakukan secara bergantian sesuai pekan.',
 'Baik Bapak/Ibu. Kunjungan narapidana dibuka Senin, Selasa, dan Kamis pukul 08.30-11.30 serta 13.00-14.30 WIB, dan Sabtu pukul 08.30-11.30 WIB secara bergantian.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(4, 'KNJ-04', 1,
 'Bagaimana jadwal kunjungan hari Sabtu?',
 'Kunjungan hari Sabtu dilakukan secara bergantian: pekan ke-1, ke-3, dan ke-5 untuk Tahanan; pekan ke-2 dan ke-4 untuk Narapidana. Waktu kunjungan pukul 08.30-11.30 WIB.',
 'Baik Bapak/Ibu. Sabtu bergantian: pekan 1, 3, dan 5 untuk tahanan; pekan 2 dan 4 untuk narapidana, pukul 08.30-11.30 WIB.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(5, 'KNJ-05', 1,
 'Identitas apa yang wajib dibawa saat berkunjung?',
 'Pengunjung wajib membawa dan menunjukkan identitas diri berupa E-KTP, SIM, atau paspor.',
 'Baik Bapak/Ibu. Mohon bawa dan tunjukkan identitas asli berupa E-KTP, SIM, atau paspor.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(6, 'KNJ-06', 1,
 'Apa syarat surat izin besuk untuk pengunjung tahanan?',
 'Pengunjung tahanan wajib membawa surat izin besuk dari instansi yang melakukan penahanan, yaitu Kepolisian, Kejaksaan, Pengadilan, Polisi Militer, Bea Cukai, atau Imigrasi. Surat izin disesuaikan dengan instansi yang menahan.',
 'Baik Bapak/Ibu. Pengunjung tahanan wajib membawa surat izin besuk dari instansi yang menahan: Kepolisian, Kejaksaan, Pengadilan, Polisi Militer, Bea Cukai, atau Imigrasi.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(7, 'KNJ-07', 1,
 'Bagaimana aturan pakaian saat berkunjung?',
 'Pengunjung wajib berpakaian sopan dan tertutup. Laki-laki mengenakan pakaian sopan dan celana panjang. Perempuan berpakaian sopan dan dilarang menggunakan rok.',
 'Baik Bapak/Ibu. Berpakaianlah sopan dan tertutup: Bapak memakai celana panjang, Ibu tidak menggunakan rok.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(8, 'KNJ-08', 1,
 'Barang elektronik apa yang wajib dititipkan saat kunjungan?',
 'Pengunjung wajib menitipkan barang elektronik, seperti handphone, charger, headset, power bank, dan barang elektronik lainnya.',
 'Baik Bapak/Ibu. HP, charger, headset, power bank, dan barang elektronik lain wajib dititipkan sebelum masuk ruang kunjungan.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(9, 'KNJ-09', 1,
 'Apakah pengunjung dan barang bawaan akan diperiksa?',
 'Ya. Pengunjung dan barang bawaan akan digeledah serta diperiksa oleh petugas Lapas Kelas IIB Purwakarta.',
 'Baik Bapak/Ibu. Pengunjung dan barang bawaan akan digeledah serta diperiksa oleh petugas.',
 4, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(10, 'KNJ-10', 1,
 'Apakah boleh membawa barang pecah belah atau mudah terbakar?',
 'Pengunjung dilarang membawa barang pecah belah atau barang yang mudah terbakar.',
 'Mohon maaf Bapak/Ibu. Barang pecah belah dan barang mudah terbakar dilarang dibawa.',
 4, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(11, 'KNJ-11', 1,
 'Apa saja barang terlarang yang tidak boleh dibawa saat kunjungan?',
 'Pengunjung dilarang keras membawa senjata api, senjata tajam, narkoba, minuman beralkohol, dan barang terlarang lainnya. Apabila ditemukan narkoba, pengunjung akan diproses sesuai hukum yang berlaku.',
 'Mohon maaf Bapak/Ibu. Senjata api, senjata tajam, narkoba, dan minuman beralkohol dilarang keras. Temuan narkoba akan diproses sesuai hukum.',
 4, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(12, 'KNJ-12', 1,
 'Apa kewajiban pengunjung selama berada di ruang kunjungan?',
 'Pengunjung wajib mematuhi batas waktu kunjungan, menjaga keamanan dan ketertiban, serta bersikap sopan selama berada di ruang kunjungan.',
 'Baik Bapak/Ibu. Mohon patuhi batas waktu, jaga keamanan dan ketertiban, serta bersikap sopan selama di ruang kunjungan.',
 3, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

-- ===== B. PENITIPAN UANG =====
(13, 'UANG-01', 2,
 'Bagaimana cara menitipkan uang untuk WBP?',
 'Penitipan uang hanya dapat dilakukan melalui rekening resmi Bank BRI nomor 37340100033564. Konfirmasi transfer dilakukan melalui nomor 0852-8442-4304, bukan melalui grup. Uang diserahkan kepada petugas layanan kunjungan dan penitipan.',
 'Baik Bapak/Ibu. Titipkan uang hanya melalui rekening BRI 37340100033564, lalu konfirmasi ke 0852-8442-4304 (bukan via grup).',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(14, 'UANG-02', 2,
 'Berapa maksimal penitipan uang?',
 'Maksimal penitipan uang bagi Warga Binaan Pemasyarakatan (WBP) adalah Rp500.000.',
 'Baik Bapak/Ibu. Maksimal penitipan uang adalah Rp500.000.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(15, 'UANG-03', 2,
 'Apa nomor rekening resmi untuk penitipan uang?',
 'Nomor rekening resmi penitipan uang adalah Bank BRI dengan nomor rekening 37340100033564.',
 'Baik Bapak/Ibu. Rekening resmi penitipan uang adalah BRI 37340100033564.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(16, 'UANG-04', 2,
 'Ke nomor mana konfirmasi transfer penitipan uang?',
 'Konfirmasi transfer dilakukan melalui nomor 0852-8442-4304. Konfirmasi tidak dilakukan melalui grup.',
 'Baik Bapak/Ibu. Konfirmasi transfer ke nomor 0852-8442-4304, bukan melalui grup.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

-- ===== C. PENITIPAN BARANG: DAFTAR LARANGAN =====
(17, 'BRG-01', 3,
 'Barang apa saja yang dilarang masuk atau dititipkan ke dalam lapas?',
 'Barang yang dilarang masuk: alat elektronik seperti handphone, laptop, charger, kartu SIM, dan kamera; senjata api dan senjata tajam; narkotika dan obat-obatan terlarang; serta minuman keras dan minuman beralkohol.',
 'Mohon maaf Bapak/Ibu. Alat elektronik, senjata api/tajam, narkotika, serta minuman keras dan beralkohol dilarang masuk.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(18, 'BRG-02', 3,
 'Minuman dan makanan apa yang dilarang dititipkan?',
 'Minuman dan makanan yang dilarang: minuman kemasan, serbuk minuman, minuman sachet, minuman beku, minuman berperasa, air mineral botol, mi instan, makanan berbau menyengat seperti jengkol dan petai, kopi, gula pasir, garam, serta kacang-kacangan, pilus, dan sukro.',
 'Mohon maaf Bapak/Ibu. Minuman kemasan/sachet, air botol, mi instan, makanan berbau menyengat, kopi, gula, garam, dan kacang-kacangan dilarang.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(19, 'BRG-03', 3,
 'Apakah buah utuh, rokok, ikat pinggang, topi, dan kain boleh dititipkan?',
 'Buah-buahan utuh dilarang, kecuali yang telah dipotong menjadi ukuran kecil. Rokok, ikat pinggang, topi, pembalut, sarung, seprai, tambang, tali, dan kain panjang sejenisnya juga dilarang dititipkan.',
 'Mohon maaf Bapak/Ibu. Buah utuh (kecuali dipotong kecil), rokok, ikat pinggang, topi, pembalut, sarung, seprai, tambang, tali, dan kain panjang dilarang.',
 4, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(20, 'BRG-04', 3,
 'Apakah pasta gigi, sikat gigi keras, sedotan, aluminium foil, dan barang kaca boleh masuk?',
 'Pasta gigi dan sikat gigi berbahan keras dilarang. Sedotan, barang yang mengandung aluminium foil, serta barang berbahan gelas atau kaca juga dilarang masuk.',
 'Mohon maaf Bapak/Ibu. Pasta gigi, sikat gigi keras, sedotan, aluminium foil, serta barang berbahan gelas atau kaca dilarang.',
 4, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

-- ===== C. PENITIPAN BARANG: YANG DIPERBOLEHKAN =====
(21, 'BRG-05', 3,
 'Apakah boleh menitipkan nasi dan lauk pauk?',
 'Nasi dan lauk pauk ukuran sedang diperbolehkan, dengan jumlah maksimal 2 (dua) buah.',
 'Baik Bapak/Ibu. Nasi dan lauk pauk ukuran sedang diperbolehkan, maksimal 2 buah.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(22, 'BRG-06', 3,
 'Bagaimana ketentuan menitipkan makanan ringan?',
 'Makanan ringan wajib dikemas ulang menggunakan plastik transparan.',
 'Baik Bapak/Ibu. Makanan ringan wajib dikemas ulang menggunakan plastik transparan.',
 4, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(23, 'BRG-07', 3,
 'Berapa pakaian yang boleh dititipkan dan bagaimana ketentuannya?',
 'Pakaian yang dititipkan maksimal 2 (dua) pasang dan harus ditukar dengan pakaian yang telah digunakan WBP atau menggunakan sistem tukar ganti.',
 'Baik Bapak/Ibu. Pakaian maksimal 2 pasang dan harus ditukar dengan pakaian yang telah digunakan WBP (sistem tukar ganti).',
 4, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

(24, 'BRG-08', 3,
 'Bagaimana aturan menitipkan sabun dan sampo?',
 'Sabun dan sampo hanya diperbolehkan dalam bentuk sachet, atau dipindahkan ke dalam plastik transparan.',
 'Baik Bapak/Ibu. Sabun dan sampo hanya boleh dalam bentuk sachet atau dipindahkan ke plastik transparan.',
 4, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

-- ===== D. TATA TERTIB =====
(25, 'TERTIB-01', 4,
 'Apa saja tata tertib kunjungan?',
 'Tata tertib kunjungan: membawa identitas E-KTP, SIM, atau paspor; berpakaian sopan dan tertutup; mematuhi batas waktu kunjungan; menitipkan barang elektronik; dilarang membawa barang terlarang, pecah belah, atau mudah terbakar; bersedia digeledah; serta menjaga keamanan, ketertiban, dan kesopanan.',
 'Baik Bapak/Ibu. Bawa identitas, berpakaian sopan, patuhi batas waktu, titipkan barang elektronik, jangan bawa barang terlarang, bersedia digeledah, dan jaga ketertiban.',
 5, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta'),

-- ===== E. INFORMASI UMUM =====
(26, 'INFO-01', 5,
 'Lapas mana yang menyediakan layanan informasi ini?',
 'Layanan informasi ini disediakan oleh Lapas Kelas IIB Purwakarta.',
 'Baik Bapak/Ibu. Ini layanan informasi Lapas Kelas IIB Purwakarta.',
 2, 'publish',
 'Catatan Informasi Layanan Kunjungan, Penitipan Uang, dan Penitipan Barang Lapas Kelas IIB Purwakarta');

-- ---------------------------------------------------------------
-- 5. VARIAN PERTANYAAN (frasa yang sering diketik masyarakat)
-- ---------------------------------------------------------------
INSERT INTO faq_varian (faq_id, teks) VALUES
  (1, 'jadwal kunjungan'), (1, 'jam besuk'), (1, 'jam kunjungan'),
  (1, 'jadwal besuk'), (1, 'kapan bisa besuk'), (1, 'jadwal besuk tahanan dan narapidana'),
  (1, 'kunjungan hari senin'), (1, 'kunjungan hari selasa'), (1, 'kunjungan hari rabu'),
  (1, 'kunjungan hari kamis'),
  (2, 'jam besuk tahanan'), (2, 'jadwal kunjungan tahanan'), (2, 'tahanan besuk hari apa'),
  (2, 'kapan tahanan bisa besuk'), (2, 'jam kunjungan tahanan'),
  (3, 'jam besuk narapidana'), (3, 'jadwal kunjungan narapidana'), (3, 'narapidana besuk hari apa'),
  (3, 'kapan narapidana bisa besuk'), (3, 'jam kunjungan narapidana'),
  (4, 'jadwal sabtu'), (4, 'besuk hari sabtu'), (4, 'sabtu minggu ke berapa'),
  (4, 'giliran sabtu'), (4, 'sabtu tahanan atau narapidana'),
  (5, 'syarat identitas'), (5, 'harus bawa ktp'), (5, 'identitas pengunjung'),
  (5, 'bawa sim paspor'), (5, 'dokumen identitas'),
  (6, 'surat izin besuk'), (6, 'surat izin tahanan'), (6, 'syarat besuk tahanan'),
  (6, 'izin penahanan'), (6, 'surat izin dari kepolisian'),
  (7, 'aturan pakaian'), (7, 'boleh pakai rok'), (7, 'pakaian sopan'),
  (7, 'cara berpakaian besuk'), (7, 'perempuan tidak boleh rok'),
  (8, 'barang elektronik'), (8, 'hp dititipkan'), (8, 'boleh bawa hp'),
  (8, 'charger headset power bank'), (8, 'barang yang dititipkan'),
  (9, 'apakah diperiksa'), (9, 'digeledah'), (9, 'diperiksa petugas'),
  (9, 'pemeriksaan barang bawaan'), (9, 'penggeledahan'),
  (10, 'barang pecah belah'), (10, 'barang mudah terbakar'), (10, 'boleh bawa kaca'),
  (10, 'boleh bawa barang pecah belah'), (10, 'tidak boleh bawa kaca'),
  (11, 'barang terlarang'), (11, 'senjata api'), (11, 'narkoba'),
  (11, 'minuman beralkohol'), (11, 'tidak boleh dibawa'),
  (12, 'batas waktu kunjungan'), (12, 'harus sopan'), (12, 'jaga ketertiban'),
  (12, 'kewajiban pengunjung'), (12, 'aturan di ruang kunjungan'),
  (12, 'berapa lama kunjungan'),
  (13, 'cara titip uang'), (13, 'menitipkan uang'), (13, 'transfer uang'),
  (13, 'setor uang wbp'), (13, 'penitipan uang'),
  (14, 'maksimal titip uang'), (14, 'batas penitipan uang'),
  (14, 'berapa maksimal titip uang'), (14, 'limit uang'),
  (15, 'nomor rekening'), (15, 'rekening bri'), (15, 'no rekening'),
  (15, 'rekening penitipan uang'), (15, 'nomor rekening penitipan'),
  (16, 'konfirmasi transfer'), (16, 'nomor konfirmasi'), (16, 'bukti transfer'),
  (16, 'nomor konfirmasi transfer'), (16, 'konfirmasi tidak lewat grup'),
  (17, 'barang dilarang'), (17, 'alat elektronik dilarang'), (17, 'senjata narkoba miras'),
  (17, 'barang yang tidak boleh masuk'), (17, 'barang apa yang dilarang'),
  (17, 'penitipan barang'), (17, 'barang titipan'), (17, 'barang bawaan'),
  (18, 'makanan dilarang'), (18, 'minuman dilarang'), (18, 'mi instan'),
  (18, 'air mineral botol'), (18, 'jengkol petai'), (18, 'kopi gula garam'),
  (18, 'boleh bawa mi instan'), (18, 'boleh bawa air mineral'), (18, 'air mineral boleh'),
  (19, 'buah utuh'), (19, 'rokok'), (19, 'ikat pinggang'), (19, 'topi'),
  (19, 'sarung seprai tali'), (19, 'boleh bawa buah'), (19, 'boleh bawa rokok'),
  (20, 'pasta gigi'), (20, 'sikat gigi'), (20, 'sedotan'), (20, 'aluminium foil'),
  (20, 'gelas kaca'), (20, 'boleh bawa pasta gigi'), (20, 'boleh bawa sedotan'),
  (21, 'titip nasi'), (21, 'nasi lauk'), (21, 'boleh bawa nasi'),
  (21, 'lauk pauk'), (21, 'boleh titip nasi'),
  (22, 'makanan ringan'), (22, 'kemasan plastik transparan'), (22, 'snack'),
  (23, 'titip pakaian'), (23, 'berapa pasang pakaian'), (23, 'tukar ganti pakaian'),
  (23, 'boleh titip pakaian'),
  (24, 'sabun sampo'), (24, 'sabun sachet'), (24, 'sampo sachet'),
  (24, 'boleh bawa sabun'),
  (25, 'tata tertib'), (25, 'peraturan kunjungan'), (25, 'aturan besuk'),
  (25, 'ketentuan kunjungan'), (25, 'tata tertib kunjungan'),
  (26, 'lapas mana'), (26, 'nama lapas'), (26, 'lapas kelas iiib purwakarta'),
  (26, 'instansi apa');

-- ---------------------------------------------------------------
-- 6. KATA KUNCI & BOBOT (bentuk kanonik sesuai normalisasi sistem)
-- ---------------------------------------------------------------
INSERT INTO faq_keyword (faq_id, kata, bobot) VALUES
  (1, 'jam', 1.3), (1, 'besuk', 1.5), (1, 'tahanan', 1.2), (1, 'narapidana', 1.2),
  (2, 'tahanan', 1.7), (2, 'besuk', 1.3), (2, 'jam', 1.2),
  (3, 'narapidana', 1.7), (3, 'besuk', 1.3), (3, 'jam', 1.2),
  (4, 'sabtu', 1.7), (4, 'bergantian', 1.5), (4, 'pekan', 1.4),
  (5, 'identitas', 1.7), (5, 'ktp', 1.6), (5, 'sim', 1.4), (5, 'paspor', 1.4),
  (6, 'surat', 1.5), (6, 'izin', 1.6), (6, 'tahanan', 1.4), (6, 'penahanan', 1.4),
  (6, 'kepolisian', 1.2), (6, 'kejaksaan', 1.2),
  (7, 'pakaian', 1.7), (7, 'sopan', 1.5), (7, 'rok', 1.5), (7, 'celana', 1.4),
  (8, 'elektronik', 1.6), (8, 'handphone', 1.6), (8, 'hp', 1.5), (8, 'charger', 1.4),
  (8, 'power', 1.3), (8, 'headset', 1.3),
  (9, 'diperiksa', 1.6), (9, 'digeledah', 1.7), (9, 'petugas', 1.2),
  (10, 'pecah', 1.6), (10, 'belah', 1.5), (10, 'terbakar', 1.6), (10, 'kaca', 1.3),
  (11, 'terlarang', 1.6), (11, 'senjata', 1.6), (11, 'narkoba', 1.6),
  (11, 'alkohol', 1.5), (11, 'miras', 1.4),
  (12, 'sopan', 1.5), (12, 'tertib', 1.5), (12, 'batas', 1.3), (12, 'jam', 1.2),
  (12, 'lama', 1.3),
  (13, 'titip', 1.6), (13, 'uang', 1.7), (13, 'transfer', 1.6), (13, 'rekening', 1.5),
  (14, 'maksimal', 1.7), (14, 'uang', 1.5), (14, 'titip', 1.4), (14, 'batas', 1.3),
  (15, 'rekening', 1.8), (15, 'bri', 1.7), (15, 'nomor', 1.2),
  (16, 'konfirmasi', 1.8), (16, 'transfer', 1.6), (16, 'nomor', 1.3),
  (17, 'dilarang', 1.5), (17, 'elektronik', 1.4), (17, 'senjata', 1.4),
  (17, 'narkotika', 1.5), (17, 'alkohol', 1.4), (17, 'barang', 1.4),
  (17, 'titip', 1.4), (17, 'bawaan', 1.3),
  (18, 'minuman', 1.5), (18, 'makanan', 1.4), (18, 'instan', 1.6), (18, 'botol', 1.5),
  (18, 'jengkol', 1.5), (18, 'petai', 1.4), (18, 'kopi', 1.4), (18, 'gula', 1.3),
  (18, 'garam', 1.3), (18, 'kacang', 1.3), (18, 'air', 1.5), (18, 'mineral', 1.5),
  (19, 'buah', 1.6), (19, 'rokok', 1.7), (19, 'pinggang', 1.4), (19, 'topi', 1.5),
  (19, 'sarung', 1.5), (19, 'seprai', 1.4), (19, 'tali', 1.3),
  (20, 'pasta', 1.6), (20, 'sikat', 1.5), (20, 'sedotan', 1.6), (20, 'aluminium', 1.5),
  (20, 'foil', 1.3), (20, 'gelas', 1.4), (20, 'kaca', 1.3),
  (21, 'nasi', 1.7), (21, 'lauk', 1.7), (21, 'pauk', 1.5), (21, 'makanan', 1.1),
  (22, 'ringan', 1.5), (22, 'snack', 1.5), (22, 'plastik', 1.5), (22, 'transparan', 1.5),
  (23, 'pakaian', 1.7), (23, 'pasang', 1.5), (23, 'tukar', 1.5), (23, 'ganti', 1.4),
  (24, 'sabun', 1.7), (24, 'sampo', 1.7), (24, 'sachet', 1.6),
  (25, 'tertib', 1.7), (25, 'peraturan', 1.6), (25, 'besuk', 1.3), (25, 'syarat', 1.3),
  (26, 'lapas', 1.7), (26, 'purwakarta', 1.6), (26, 'kelas', 1.4);

-- ---------------------------------------------------------------
-- 7. BANGUN INDEKS PENCARIAN FTS
-- ---------------------------------------------------------------
INSERT INTO kb_dok (faq_id, teks)
SELECT f.id,
       lower(
         f.pertanyaan_contoh || ' ' ||
         coalesce((SELECT group_concat(v.teks, ' ') FROM faq_varian v WHERE v.faq_id = f.id), '') || ' ' ||
         coalesce((SELECT group_concat(k.kata, ' ') FROM faq_keyword k WHERE k.faq_id = f.id), '')
       )
FROM faq f
WHERE f.status = 'publish';

-- ---------------------------------------------------------------
-- 8. PAGAR PRIVASI & KEAMANAN
--    a) Perluas pola perlindungan data WBP (mis. "data warga binaan kamar 5").
--    b) Perhalus pola penyelundupan agar pertanyaan sah tentang barang
--       terlarang (mis. "apakah boleh bawa senjata tajam?") tidak ikut
--       tertolak. Yang diblokir hanya niat menyelundupkan.
-- ---------------------------------------------------------------
UPDATE pembatasan
SET pola = 'data (pribadi|warga binaan|wbp|narapidana|tahanan)|nama (lengkap|warga binaan|wbp|narapidana|tahanan)|nomor (identitas|registrasi|register)|no reg'
WHERE pola LIKE 'data pribadi|nama lengkap%';

UPDATE pembatasan
SET pola = '(isi|nomor) sel|kamar .*(wbp|tahanan|narapidana|warga|blok|[0-9])|blok hunian|foto .*(warga binaan|wbp|narapidana|tahanan|individu)|kondisi .*pribadi'
WHERE pola LIKE 'isi sel|kamar%';

UPDATE pembatasan
SET pola = 'cara memasukkan (barang|narkoba|hp|handphone|sabu|senjata)|cara menyelundupkan|menyelundupkan',
    keterangan = 'Permintaan cara melanggar aturan / menyelundupkan barang'
WHERE kategori_alasan = 'barang_terlarang';

PRAGMA foreign_keys = ON;
