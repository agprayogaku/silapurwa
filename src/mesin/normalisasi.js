import crypto from 'node:crypto'

export function hashWaNumber(nomorWa) {
  if (!nomorWa) return 'anon'
  return crypto.createHash('sha256').update(String(nomorWa)).digest('hex').slice(0, 16)
}

const KATA_STOP = new Set([
  'yang', 'untuk', 'pada', 'ke', 'para', 'namun', 'menurut', 'antara', 'dia', 'dua',
  'ia', 'seperti', 'jika', 'sehingga', 'kembali', 'dan', 'ini', 'karena', 'oleh',
  'saat', 'harus', 'saya', 'kami', 'anda', 'kamu', 'apa', 'apakah', 'bagaimana',
  'kapan', 'dimana', 'kenapa', 'mengapa', 'tolong', 'bisa', 'mau', 'dong', 'sih',
  'nih', 'tuh', 'ya', 'halo', 'selamat', 'pagi', 'siang', 'sore', 'malam',
  // Kata basa-basi / tidak informatif agar skor cakupan tidak bias
  'buat', 'aja', 'saja', 'hanya', 'kok', 'deh', 'kah', 'bang', 'pak', 'bu',
  'mas', 'mbak', 'tanya', 'nanya', 'minta', 'info', 'min', 'gan', 'kak',
  'gimana', 'gmn', 'gitu', 'gini', 'sih', 'yaa', 'nya', 'kah', 'pun'
])

const KAMUS_SINONIM = {
  jenguk: 'besuk',
  kunjungi: 'besuk',
  kunjungan: 'besuk',
  nengok: 'besuk',
  persyaratan: 'syarat',
  aturan: 'syarat',
  ketentuan: 'syarat',
  berkas: 'dokumen',
  ktp: 'ktp',
  jadwal: 'jam',
  waktu: 'jam',
  buka: 'jam',
  kirim: 'titip',
  titipan: 'titip',
  menitipkan: 'titip',
  dititipkan: 'titip',
  penitipan: 'titip',
  barangnya: 'barang',
  jumlah: 'orang',
  lamanya: 'lama'
}

export function normalisasiTeks(teks = '') {
  if (typeof teks !== 'string') return ''

  // 1. Lowercase dan bersihkan tanda baca
  let t = teks
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return t
}

export function tokenisasi(teks = '') {
  const t = normalisasiTeks(teks)
  if (!t) return []

  const kataMentah = t.split(' ').filter(Boolean)
  const hasil = []

  for (const kata of kataMentah) {
    if (KATA_STOP.has(kata)) continue

    // Pemetaan sinonim sederhana
    const kanonik = KAMUS_SINONIM[kata] || kata
    hasil.push(kanonik)

    // Lepas akhiran -nya, -an, -kan sederhana jika panjang > 4
    if (kanonik.endsWith('nya') && kanonik.length > 5) {
      hasil.push(kanonik.slice(0, -3))
    }
  }

  return [...new Set(hasil)]
}
