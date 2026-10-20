// =====================================================================
//  Pengelompokan pengaturan panel admin.
//
//  Tujuan: menyajikan ~24 kunci pengaturan mentah menjadi blok-blok
//  logis dengan label ramah pengguna, tanpa mengubah struktur basis data
//  atau nama kunci yang dipakai kode program.
// =====================================================================

const GRUP = [
  {
    id: 'identitas',
    judul: 'Identitas & Sapaan',
    ikon: 'perisai',
    deskripsi: 'Nama instansi, jam layanan, dan pesan pembuka yang diterima pengunjung.'
  },
  {
    id: 'pesan',
    judul: 'Pesan Otomatis',
    ikon: 'simulator',
    deskripsi: 'Teks yang dikirim saat pertanyaan belum terjawab atau menyangkut data pribadi.'
  },
  {
    id: 'penitipan',
    judul: 'Informasi Penitipan',
    ikon: 'dokumen',
    deskripsi: 'Rekening resmi, nomor konfirmasi, dan batas penitipan uang.'
  },
  {
    id: 'pencocokan',
    judul: 'Pencocokan FAQ & Ambang Batas',
    ikon: 'cari',
    deskripsi: 'Batas skor penentu jawaban langsung, klarifikasi, atau eskalasi ke petugas.'
  },
  {
    id: 'ai',
    judul: 'Mesin AI (Gemini)',
    ikon: 'robot',
    deskripsi: 'Model, kreativitas, kuota, dan perlindungan privasi pada lapisan AI.'
  },
  {
    id: 'kanal',
    judul: 'Kanal & Kecepatan Balasan',
    ikon: 'aktivitas',
    deskripsi: 'Kanal aktif serta jeda balasan agar percakapan terasa manusiawi.'
  }
]

// Urutan kunci di sini juga menentukan urutan tampil di setiap blok.
const META = {
  nama_instansi: {
    grup: 'identitas',
    label: 'Nama Instansi',
    lebar: 'wide',
    petunjuk: 'Nama resmi instansi yang tampil pada pesan dan laporan.'
  },
  sapaan_awal: {
    grup: 'identitas',
    label: 'Pesan Sapaan Awal',
    lebar: 'wide',
    kontrol: 'textarea',
    petunjuk: 'Dikirim saat pengunjung menyapa bot. Gunakan bahasa ramah dan singkat.'
  },
  jam_layanan_bot: {
    grup: 'identitas',
    label: 'Jam Layanan Bot',
    petunjuk: 'Contoh: 24 jam.'
  },
  jam_layanan_petugas: {
    grup: 'identitas',
    label: 'Jam Layanan Petugas',
    petunjuk: 'Jam petugas manusia melayani tindak lanjut.'
  },

  pesan_fallback: {
    grup: 'pesan',
    label: 'Pesan Bila Belum Terjawab',
    lebar: 'wide',
    kontrol: 'textarea',
    petunjuk: 'Dikirim saat pertanyaan tidak cocok dengan FAQ dan dieskalasi ke petugas.'
  },
  pesan_tolak_data_wbp: {
    grup: 'pesan',
    label: 'Pesan Penolakan Data Pribadi',
    lebar: 'wide',
    kontrol: 'textarea',
    petunjuk: 'Dikirim saat pengunjung meminta data pribadi atau keberadaan WBP.'
  },

  bank_penitipan_nama: {
    grup: 'penitipan',
    label: 'Nama Bank Penitipan',
    petunjuk: 'Nama bank resmi untuk penitipan uang.'
  },
  bank_penitipan_rekening: {
    grup: 'penitipan',
    label: 'Nomor Rekening Penitipan',
    petunjuk: 'Nomor rekening resmi yang boleh digunakan masyarakat.'
  },
  konfirmasi_penitipan_nomor: {
    grup: 'penitipan',
    label: 'Nomor Konfirmasi Transfer',
    petunjuk: 'Nomor yang menghubungi pengunjung untuk konfirmasi transfer.'
  },
  batas_penitipan_uang: {
    grup: 'penitipan',
    label: 'Batas Maksimal Penitipan Uang',
    tipe: 'number',
    langkah: '1000',
    min: '0',
    petunjuk: 'Dalam Rupiah. Contoh: 500000 untuk Rp500.000.'
  },

  ambang_jawab: {
    grup: 'pencocokan',
    label: 'Ambang Jawab Langsung',
    tipe: 'number',
    langkah: '0.01',
    min: '0',
    max: '1',
    petunjuk: 'Skor minimum agar FAQ dijawab langsung (disarankan 0,75).'
  },
  ambang_klarifikasi: {
    grup: 'pencocokan',
    label: 'Ambang Klarifikasi',
    tipe: 'number',
    langkah: '0.01',
    min: '0',
    max: '1',
    petunjuk: 'Skor minimum untuk meminta klarifikasi atau memanggil AI (disarankan 0,50).'
  },
  versi_kb: {
    grup: 'pencocokan',
    label: 'Versi Basis Pengetahuan',
    tipe: 'number',
    langkah: '1',
    min: '1',
    petunjuk: 'Naikkan setiap kali isi FAQ berubah.'
  },

  ai_aktif: {
    grup: 'ai',
    label: 'Aktifkan Lapisan AI',
    tipe: 'bool',
    petunjuk: 'Jika nonaktif, sistem hanya memakai jawaban tercetak dan eskalasi.'
  },
  ai_model_utama: {
    grup: 'ai',
    label: 'Model AI Utama',
    petunjuk: 'Model Gemini utama untuk jawaban bergaya manusiawi.'
  },
  ai_model_cadangan: {
    grup: 'ai',
    label: 'Model AI Cadangan',
    petunjuk: 'Dipakai otomatis bila model utama terkena batas kuota (429).'
  },
  ai_suhu: {
    grup: 'ai',
    label: 'Suhu (Kreativitas) AI',
    tipe: 'number',
    langkah: '0.1',
    min: '0',
    max: '2',
    petunjuk: 'Nilai rendah (0,3) membuat jawaban lebih patuh pada fakta.'
  },
  ai_maks_token: {
    grup: 'ai',
    label: 'Maksimum Token Jawaban',
    tipe: 'number',
    langkah: '10',
    min: '50',
    petunjuk: 'Batas panjang keluaran AI.'
  },
  ai_kuota_harian_maks: {
    grup: 'ai',
    label: 'Kuota Harian AI',
    tipe: 'number',
    langkah: '10',
    min: '0',
    petunjuk: 'Jumlah maksimum panggilan AI per hari.'
  },
  ai_gaya: {
    grup: 'ai',
    label: 'Gaya Bahasa AI',
    lebar: 'wide',
    kontrol: 'textarea',
    petunjuk: 'Preferensi gaya jawaban, misalnya ramah dan sederhana untuk lansia.'
  },
  ai_kirim_nomor_wa: {
    grup: 'ai',
    label: 'Kirim Nomor WhatsApp ke AI',
    tipe: 'bool',
    opsi: [
      { nilai: '0', label: 'Jangan kirim (disarankan)' },
      { nilai: '1', label: 'Kirim' }
    ],
    petunjuk: 'Biarkan "Jangan kirim" agar identitas pengunjung tidak pernah dikirim ke penyedia AI.'
  },

  kanal_aktif: {
    grup: 'kanal',
    label: 'Kanal Aktif',
    opsi: [
      { nilai: 'simulasi', label: 'Simulasi (tanpa WhatsApp)' },
      { nilai: 'baileys', label: 'WhatsApp (Baileys)' }
    ],
    petunjuk: 'Kanal yang dipakai saat aplikasi dijalankan.'
  },
  delay_min_ms: {
    grup: 'kanal',
    label: 'Jeda Minimum Balasan',
    tipe: 'number',
    langkah: '100',
    min: '0',
    petunjuk: 'Dalam milidetik. Contoh: 1500 = 1,5 detik.'
  },
  delay_max_ms: {
    grup: 'kanal',
    label: 'Jeda Maksimum Balasan',
    tipe: 'number',
    langkah: '100',
    min: '0',
    petunjuk: 'Dalam milidetik. Contoh: 4000 = 4 detik.'
  }
}

const URUTAN = new Map(Object.keys(META).map((kunci, i) => [kunci, i]))

/**
 * Mengubah daftar pengaturan mentah menjadi blok-blok siap tampil.
 * Kunci yang belum dikenal tetap ditampilkan pada blok "Lainnya" agar
 * tidak ada pengaturan yang hilang dari panel.
 *
 * @param {Array<{kunci:string,nilai:string,tipe:string,keterangan?:string}>} daftar
 * @returns {Array<{id:string,judul:string,ikon:string,deskripsi:string,items:Array}>}
 */
export function kelompokkanPengaturan(daftar = []) {
  const wadah = new Map(GRUP.map(g => [g.id, { ...g, items: [] }]))
  const lainnya = {
    id: 'lainnya',
    judul: 'Pengaturan Lainnya',
    ikon: 'pengaturan',
    deskripsi: 'Parameter tambahan yang belum masuk kelompok khusus.',
    items: []
  }

  for (const item of daftar) {
    const meta = META[item.kunci] || {}
    const tujuan = wadah.get(meta.grup) || lainnya

    const tipeTampil = meta.tipe || item.tipe || 'string'
    const opsi = meta.opsi || (tipeTampil === 'bool'
      ? [
          { nilai: '1', label: 'Aktif' },
          { nilai: '0', label: 'Nonaktif' }
        ]
      : null)

    tujuan.items.push({
      ...item,
      label: meta.label || item.kunci,
      petunjuk: meta.petunjuk || item.keterangan || '',
      lebar: meta.lebar || '',
      kontrol: meta.kontrol || '',
      opsi,
      tipeTampil,
      langkah: meta.langkah || '',
      min: meta.min,
      max: meta.max
    })
  }

  for (const grup of wadah.values()) {
    grup.items.sort((a, b) => {
      const ia = URUTAN.has(a.kunci) ? URUTAN.get(a.kunci) : 9999
      const ib = URUTAN.has(b.kunci) ? URUTAN.get(b.kunci) : 9999
      return ia - ib
    })
  }

  const hasil = GRUP.map(g => wadah.get(g.id)).filter(g => g.items.length > 0)
  if (lainnya.items.length > 0) hasil.push(lainnya)
  return hasil
}

export default kelompokkanPengaturan
