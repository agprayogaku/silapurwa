import crypto from 'node:crypto'
import { hashWaNumber, normalisasiTeks } from './normalisasi.js'
import { filterPesanMasuk, verifikasiJawabanAi } from './penapis.js'
import { cariJawabanTerbaik } from './pencari.js'
import { mintaJawabanGemini } from './gemini.js'
import {
  upsertPercakapan,
  insertPesan,
  catatTakTerjawab,
  buatEskalasi,
  getPengaturan,
  getKontakUtama,
  getCacheJawaban,
  setCacheJawaban
} from '../db/kueri.js'
import { logger } from '../config/logger.js'

export async function prosesPesanMasuk({ nomorWa, teks, kanal = 'baileys' }) {
  const waHash = hashWaNumber(nomorWa)
  const percakapan = upsertPercakapan(waHash, kanal)

  // 1. Catat pesan masuk
  insertPesan({
    percakapanId: percakapan.id,
    arah: 'masuk',
    isiTeks: teks,
    jenisBalasan: null
  })

  // 2. Filter pagar pembatasan (topik terlarang / privasi)
  const hasilFilter = filterPesanMasuk(teks)
  if (!hasilFilter.lolos) {
    logger.warn({ waHash, alasan: hasilFilter.alasan }, 'Pesan ditolak oleh filter pagar pembatasan')

    insertPesan({
      percakapanId: percakapan.id,
      arah: 'keluar',
      isiTeks: hasilFilter.balasan,
      jenisBalasan: 'tolak',
      sumberJawaban: 'template'
    })

    return {
      balasan: hasilFilter.balasan,
      jenis: 'tolak',
      skor: 0,
      faqId: null
    }
  }

  // Sapaan dasar (1-4 kata yang memuat kata sapaan umum)
  const teksNormal = normalisasiTeks(teks)
  const kataSapaan = ['halo', 'hai', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'ping', 'p', 'permisi', 'kumaha']
  const kataTokens = teksNormal.split(' ').filter(Boolean)
  const isSapaan = kataTokens.length <= 4 && kataTokens.some(k => kataSapaan.includes(k))

  if (isSapaan) {
    let sapaan = getPengaturan('sapaan_awal', '')
    if (!sapaan || sapaan === '[VERIFIKASI]') {
      sapaan = 'Selamat datang di layanan informasi kami. Silakan sampaikan pertanyaan Bapak/Ibu.'
    }

    insertPesan({
      percakapanId: percakapan.id,
      arah: 'keluar',
      isiTeks: sapaan,
      jenisBalasan: 'sapaan',
      sumberJawaban: 'template'
    })

    return {
      balasan: sapaan,
      jenis: 'sapaan',
      skor: 1.0,
      faqId: null
    }
  }

  // 3. Pencarian FAQ (Retrieval)
  const ambangJawab = Number.parseFloat(getPengaturan('ambang_jawab', '0.75'))
  const ambangKlarifikasi = Number.parseFloat(getPengaturan('ambang_klarifikasi', '0.45'))

  const hasilCari = cariJawabanTerbaik(teks)
  const { terbaik, skor, calon } = hasilCari

  // JALUR 1: Lolos Ambang Tinggi -> Jawab Langsung (Tercetak / Jawaban Resmi)
  if (terbaik && skor >= ambangJawab) {
    const isiBalasan = terbaik.jawaban_bot_tercetak || terbaik.jawaban

    insertPesan({
      percakapanId: percakapan.id,
      arah: 'keluar',
      isiTeks: isiBalasan,
      faqId: terbaik.id,
      skor,
      jenisBalasan: 'faq',
      sumberJawaban: 'tercetak'
    })

    logger.info({ kode: terbaik.kode, skor, waHash }, 'Pertanyaan terjawab melalui Jalur Cepat (Tercetak)')
    return {
      balasan: isiBalasan,
      jenis: 'faq',
      skor,
      faqId: terbaik.id,
      kode: terbaik.kode
    }
  }

  // JALUR 2: Ambang Sedang (0.45 - 0.75) -> Coba AI Gemini dengan Konteks FAQ
  if (terbaik && skor >= ambangKlarifikasi) {
    const kontak = getKontakUtama()
    const infoKontak = kontak ? `${kontak.nama_unit} (${kontak.nomor}, ${kontak.jam_layanan})` : ''

    // Cek cache jawaban terlebih dahulu
    const kunciCache = crypto.createHash('sha256').update(`${teksNormal}:${terbaik.id}`).digest('hex').slice(0, 32)
    const adaCache = getCacheJawaban(kunciCache)
    if (adaCache) {
      insertPesan({
        percakapanId: percakapan.id,
        arah: 'keluar',
        isiTeks: adaCache.jawaban,
        faqId: terbaik.id,
        skor,
        jenisBalasan: 'faq',
        sumberJawaban: 'cache'
      })
      logger.info({ waHash, kode: terbaik.kode }, 'Pertanyaan terjawab melalui Cache AI')
      return {
        balasan: adaCache.jawaban,
        jenis: 'faq',
        skor,
        faqId: terbaik.id,
        kode: terbaik.kode,
        sumber: 'cache'
      }
    }

    // Panggil Gemini jika AI aktif
    const kandidatFaq = calon.slice(0, 3).map(c => c.faq)
    const hasilGemini = await mintaJawabanGemini({
      pertanyaan: teks,
      faqKandidat: kandidatFaq,
      kontakInfo: infoKontak,
      tahap: 'klarifikasi'
    })

    if (hasilGemini.sukses && hasilGemini.data?.terjawab && hasilGemini.data?.jawaban) {
      const jawabanAi = hasilGemini.data.jawaban.trim()

      // Penapis pasca-AI: verifikasi kepatuhan fakta & anti-halusinasi
      const cekPasca = verifikasiJawabanAi(jawabanAi, hasilGemini.teksKonteks)
      if (cekPasca.lolos) {
        // Simpan ke cache selama 24 jam
        setCacheJawaban(kunciCache, terbaik.id, jawabanAi, 24)

        insertPesan({
          percakapanId: percakapan.id,
          arah: 'keluar',
          isiTeks: jawabanAi,
          faqId: terbaik.id,
          skor,
          jenisBalasan: 'faq',
          sumberJawaban: 'ai'
        })

        logger.info({ kode: terbaik.kode, model: hasilGemini.model }, 'Pertanyaan berhasil dijawab via AI (Lolos Penapis)')
        return {
          balasan: jawabanAi,
          jenis: 'faq',
          skor,
          faqId: terbaik.id,
          kode: terbaik.kode,
          sumber: 'ai'
        }
      } else {
        logger.warn({ alasan: cekPasca.alasan, detail: cekPasca }, 'Jawaban Gemini ditolak oleh penapis pasca-AI')
      }
    }

    // Degradasi Aman: Jika AI mati, gagal kuota, atau ditolak penapis -> Fallback ke klarifikasi/tercetak
    const saran = calon.slice(0, 2).map((c, i) => `${i + 1}. ${c.faq.pertanyaan_contoh}`).join('\n')
    const kontakFallback = kontak ? `\n\nAtau hubungi petugas kami: ${kontak.nomor}` : ''

    const teksKlarifikasi = `Mohon maaf Bapak/Ibu, apakah yang dimaksud adalah salah satu dari topik berikut:\n\n${saran}\n\nSilakan ketik ulang pertanyaan secara lebih spesifik ya.${kontakFallback}`

    insertPesan({
      percakapanId: percakapan.id,
      arah: 'keluar',
      isiTeks: teksKlarifikasi,
      faqId: terbaik.id,
      skor,
      jenisBalasan: 'klarifikasi',
      sumberJawaban: 'template'
    })

    return {
      balasan: teksKlarifikasi,
      jenis: 'klarifikasi',
      skor,
      faqId: terbaik.id
    }
  }

  // JALUR 3: Di Bawah Ambang -> Eskalasi & Catat
  catatTakTerjawab(teksNormal, waHash)
  buatEskalasi({
    percakapanId: percakapan.id,
    topik: teks.slice(0, 80),
    alasan: 'Skor di bawah ambang batas (' + skor + ')'
  })

  const kontak = getKontakUtama()
  const nomorKontak = kontak ? kontak.nomor : '[nomor petugas]'
  const jamLayanan = kontak ? kontak.jam_layanan : 'jam kerja'

  let fallback = getPengaturan('pesan_fallback', '')
  if (!fallback || fallback === '[VERIFIKASI]') {
    fallback = `Mohon maaf Bapak/Ibu, informasi tersebut belum tersedia di sistem otomatis kami. Pertanyaan Anda sudah kami teruskan ke petugas. Untuk layanan segera, silakan hubungi Seksi Informasi di nomor ${nomorKontak} pada ${jamLayanan}. Terima kasih.`
  }

  insertPesan({
    percakapanId: percakapan.id,
    arah: 'keluar',
    isiTeks: fallback,
    faqId: null,
    skor,
    jenisBalasan: 'eskalasi',
    sumberJawaban: 'template'
  })

  logger.info({ waHash, skor }, 'Pertanyaan tidak cocok -> dieskalasi ke petugas')
  return {
    balasan: fallback,
    jenis: 'eskalasi',
    skor,
    faqId: null
  }
}
