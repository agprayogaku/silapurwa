import { cekPembatasan, getPengaturan, getKontakUtama } from '../db/kueri.js'

export function filterPesanMasuk(teks) {
  const pelanggaran = cekPembatasan(teks)
  if (!pelanggaran) {
    return { lolos: true }
  }

  const kontak = getKontakUtama()
  const infoKontak = kontak
    ? `\n\nUntuk informasi resmi lebih lanjut, silakan hubungi ${kontak.nama_unit} di nomor ${kontak.nomor} (${kontak.jam_layanan}).`
    : ''

  let balasan = ''
  if (pelanggaran.kategori_alasan === 'privasi_wbp') {
    const kustom = getPengaturan('pesan_tolak_data_wbp', '')
    balasan = (kustom && kustom !== '[VERIFIKASI]')
      ? kustom + infoKontak
      : 'Mohon maaf Bapak/Ibu, data pribadi maupun keberadaan individu bersifat rahasia dan tidak dapat diberikan melalui kanal umum ini.' + infoKontak
  } else if (pelanggaran.kategori_alasan === 'barang_terlarang') {
    balasan = 'Peringatan: Seluruh bentuk penyelundupan barang terlarang (narkoba, senjata, telepon genggam) ke dalam area layanan adalah pelanggaran pidana dan akan diproses hukum.' + infoKontak
  } else if (pelanggaran.kategori_alasan === 'upaya_penetrasi') {
    balasan = 'Mohon maaf Bapak/Ibu, saya hanya dapat membantu pertanyaan seputar layanan informasi kami. Saya tidak dapat mengubah aturan atau memberikan informasi internal sistem.' + infoKontak
  } else {
    balasan = 'Mohon maaf Bapak/Ibu, permintaan tersebut berada di luar wewenang layanan informasi otomatis kami.' + infoKontak
  }

  return {
    lolos: false,
    alasan: pelanggaran.kategori_alasan,
    keterangan: pelanggaran.keterangan,
    balasan
  }
}

// =====================================================================
// PENAPIS PASCA-AI: Verifikasi ketat anti-halusinasi keluaran Gemini
// =====================================================================
const KATA_SPEKULATIF = [
  'sepertinya', 'mungkin', 'saya rasa', 'kira kira', 'kira-kira',
  'kemungkinan', 'asumsi', 'barangkali', 'tampaknya', 'diduga'
]

export function verifikasiJawabanAi(jawaban, konteksKb = '') {
  if (typeof jawaban !== 'string' || !jawaban.trim()) {
    return { lolos: false, alasan: 'jawaban_kosong' }
  }

  const teks = jawaban.trim()

  // 1. Batas panjang (maksimal 400 karakter atau 40 kata)
  if (teks.length > 400) {
    return { lolos: false, alasan: 'terlalu_panjang' }
  }

  const jumlahKata = teks.split(/\s+/).filter(Boolean).length
  if (jumlahKata > 50) { // toleransi hingga 50 kata
    return { lolos: false, alasan: 'kata_melebihi_batas' }
  }

  // 2. Cegah kata-kata spekulatif / ragu-ragu
  const teksKecil = teks.toLowerCase()
  for (const kata of KATA_SPEKULATIF) {
    if (teksKecil.includes(kata)) {
      return { lolos: false, alasan: 'memuat_spekulasi', kata }
    }
  }

  // 3. Deteksi kebocoran data pribadi (PII)
  // NIK 16 digit
  if (/\b\d{16}\b/.test(teks)) {
    return { lolos: false, alasan: 'memuat_nik' }
  }
  // Nomor registrasi tahanan
  if (/\b(no\.\s*reg|nomor\s*register|reg\s*tahanan)\b/i.test(teks)) {
    return { lolos: false, alasan: 'memuat_info_register' }
  }

  // 4. Verifikasi Angka, Jam, & Tanggal (Anti-Halusinasi Terpenting)
  // Setiap token angka di output AI wajib ada di dalam teks konteks KB
  const angkaOutput = teks.match(/\b\d+(?:[.:]\d+)?\b/g) || []
  if (angkaOutput.length > 0) {
    const konteksNormal = konteksKb.toLowerCase()
    for (const angka of angkaOutput) {
      // Abaikan angka urutan list (contoh "1.", "2.", "3.") jika di bawah 5
      if (/^[1-5]$/.test(angka)) continue

      if (!konteksNormal.includes(angka.toLowerCase())) {
        return {
          lolos: false,
          alasan: 'halusinasi_angka',
          angka
        }
      }
    }
  }

  return { lolos: true }
}
