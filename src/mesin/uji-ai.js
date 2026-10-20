import './uji-setup.js'
import { verifikasiJawabanAi } from './penapis.js'
import { mintaJawabanGemini } from './gemini.js'
import { prosesPesanMasuk } from './pipa.js'
import { closeDb, getDb } from '../db/koneksi.js'
import { GEMINI_API_KEY } from '../config/env.js'

console.log('=== MEMULAI PENGUJIAN INTEGRASI AI & PENAPIS PASCA-AI (TAHAP 2) ===\n')

let sukses = 0
let gagal = 0

function assert(kondisi, namaUji, detail = '') {
  if (kondisi) {
    sukses++
    console.log(`[PASS] ${namaUji}`)
  } else {
    gagal++
    console.error(`[FAIL] ${namaUji} ${detail ? '-> ' + detail : ''}`)
  }
}

// -----------------------------------------------------------------
// 1. Pengujian Penapis Pasca-AI (Anti-Halusinasi & PII Guard)
// -----------------------------------------------------------------
const konteksKbContoh = `
<kb>
[KODE: KNJ-01]
Pertanyaan: Jam berapa besuk?
Fakta Resmi: Layanan kunjungan/besuk dibuka pada hari Senin sampai Jumat, pukul 09.00 sampai 12.00 WIB. Pengunjung wajib mendaftar di loket sebelum pukul 11.30 WIB.
Kontak: Seksi Pelayanan di 08123456789.
</kb>
`

// Kasus 1: Jawaban valid, angka dan jam persis ada di KB
const v1 = verifikasiJawabanAi(
  'Baik Bapak/Ibu. Jam besuk dibuka hari Senin sampai Jumat pukul 09.00 sampai 12.00 WIB. Pendaftaran ditutup pukul 11.30 WIB.',
  konteksKbContoh
)
assert(v1.lolos === true, 'Uji 1.1: Jawaban valid dengan angka sesuai KB diterima')

// Kasus 2: Angka/jam halusinasi (pukul 15.00 tidak ada di KB)
const v2 = verifikasiJawabanAi(
  'Baik Bapak/Ibu. Layanan besuk juga buka sore hari pukul 15.00 WIB.',
  konteksKbContoh
)
assert(v2.lolos === false && v2.alasan === 'halusinasi_angka', 'Uji 1.2: Angka/jam halusinasi (15.00) ditolak oleh penapis')

// Kasus 3: Kata spekulatif ("mungkin")
const v3 = verifikasiJawabanAi(
  'Baik Bapak/Ibu, mungkin besok loket kunjungan tetap dibuka.',
  konteksKbContoh
)
assert(v3.lolos === false && v3.alasan === 'memuat_spekulasi', 'Uji 1.3: Kata spekulatif ("mungkin") ditolak')

// Kasus 4: Kebocoran NIK 16 digit
const v4 = verifikasiJawabanAi(
  'Silakan cek NIK Anda 3214011205980001 di loket pendaftaran besuk.',
  konteksKbContoh
)
assert(v4.lolos === false && v4.alasan === 'memuat_nik', 'Uji 1.4: Kebocoran NIK 16 digit dicegah')

// Kasus 5: Kebocoran nomor register tahanan
const v5 = verifikasiJawabanAi(
  'Warga binaan no. reg BI.123/2026 berada di blok hunian A.',
  konteksKbContoh
)
assert(v5.lolos === false && v5.alasan === 'memuat_info_register', 'Uji 1.5: Kebocoran nomor register dicegah')

// -----------------------------------------------------------------
// 2. Pengujian Perilaku Aman Saat Memanggil Gemini
//    - Bila GEMINI_API_KEY kosong: harus terdegradasi anggun (sukses=false)
//    - Bila GEMINI_API_KEY diisi : boleh sukses, tetapi TIDAK boleh melempar
//      eksepsi dan selalu mengembalikan objek dengan status boolean.
// -----------------------------------------------------------------
const resGemini = await mintaJawabanGemini({
  pertanyaan: 'jam besuk hari selasa bisa gak?',
  faqKandidat: [{ kode: 'KNJ-01', id: 1, pertanyaan_contoh: 'Jam besuk', jawaban: 'Senin-Jumat 09.00-12.00' }]
})
assert(typeof resGemini?.sukses === 'boolean', 'Uji 2.1: mintaJawabanGemini mengembalikan status boolean tanpa melempar eksepsi')
if (!GEMINI_API_KEY) {
  assert(resGemini.sukses === false, 'Uji 2.1b: tanpa API key, degradasi anggun (sukses=false)')
} else {
  console.log(`[INFO] Uji 2.1b: GEMINI_API_KEY terisi, respons live sukses=${resGemini.sukses}`)
}

// -----------------------------------------------------------------
// 3. Pengujian Pipa Respon Lengkap dengan Degradasi Aman
// -----------------------------------------------------------------
const resPipa = await prosesPesanMasuk({
  nomorWa: '628111222333',
  teks: 'jam buka besuk lapas',
  kanal: 'uji_tahap2'
})
assert(Boolean(resPipa.balasan), 'Uji 3.1: Pipa pesan menghasilkan respon aman saat AI tidak aktif')
assert(['faq', 'klarifikasi', 'eskalasi'].includes(resPipa.jenis), 'Uji 3.2: Jenis respon valid (' + resPipa.jenis + ')')

// -----------------------------------------------------------------
// 4. Verifikasi Catatan Kuota & AI Interaksi di SQLite
// -----------------------------------------------------------------
const db = getDb()
const totalInteraksi = db.prepare('SELECT COUNT(*) n FROM ai_interaksi').get().n
console.log(`\nInformasi basis data: ${totalInteraksi} catatan log interaksi AI tersimpan.`)
assert(typeof totalInteraksi === 'number', 'Uji 4.1: Tabel ai_interaksi dapat diakses dan konsisten')

console.log(`\n=== RINGKASAN: ${sukses} LULUS, ${gagal} GAGAL ===`)
closeDb()

if (gagal > 0) {
  process.exit(1)
}
