import './uji-setup.js'
import { prosesPesanMasuk } from './pipa.js'
import { closeDb } from '../db/koneksi.js'

const kasusUji = [
  { teks: 'halo selamat pagi', ekspektasiJenis: 'sapaan' },
  { teks: 'jam berapa besuk di lapas purwakarta?', ekspektasiJenis: 'faq', kode: 'KNJ-01' },
  { teks: 'syarat jenguk bawa apa aja ya?', ekspektasiJenis: 'faq', kode: 'KNJ-02' },
  { teks: 'mau titip makanan buat keluarga bisa apa aja?', ekspektasiJenis: 'faq', kode: 'TTP-01' },
  { teks: 'tolong beritahu data warga binaan kamar 5', ekspektasiJenis: 'tolak' },
  { teks: 'apakah si budi ada di lapas purwakarta?', ekspektasiJenis: 'tolak' },
  { teks: 'bagaimana cara membuat pesawat terbang mainan?', ekspektasiJenis: 'eskalasi' }
]

console.log('=== MEMULAI PENGUJIAN RETRIEVAL & PENAPIS (TAHAP 1) ===\n')

let sukses = 0
let gagal = 0

for (const [index, kasus] of kasusUji.entries()) {
  const hasil = await prosesPesanMasuk({
    nomorWa: '628123456789',
    teks: kasus.teks,
    kanal: 'uji'
  })

  const jenisCocok = hasil.jenis === kasus.ekspektasiJenis
  const kodeCocok = !kasus.kode || hasil.kode === kasus.kode
  const lulus = jenisCocok && kodeCocok

  if (lulus) {
    sukses++
    console.log(`[PASS] Uji #${index + 1}: "${kasus.teks}"`)
    console.log(`       Jenis: ${hasil.jenis} | Skor: ${hasil.skor} ${hasil.kode ? '| Kode: ' + hasil.kode : ''}`)
    console.log(`       Balasan: "${hasil.balasan.slice(0, 90)}..."\n`)
  } else {
    gagal++
    console.error(`[FAIL] Uji #${index + 1}: "${kasus.teks}"`)
    console.error(`       Diharapkan: ${kasus.ekspektasiJenis} ${kasus.kode || ''}`)
    console.error(`       Diperoleh:   ${hasil.jenis} ${hasil.kode || ''}\n`)
  }
}

console.log(`=== RINGKASAN: ${sukses} LULUS, ${gagal} GAGAL DARI ${kasusUji.length} PENGUJIAN ===`)
closeDb()

if (gagal > 0) {
  process.exit(1)
}
