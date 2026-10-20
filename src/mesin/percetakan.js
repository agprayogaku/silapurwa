import { mintaJawabanGemini } from './gemini.js'
import { verifikasiJawabanAi } from './penapis.js'
import { logger } from '../config/logger.js'

export async function praRenderJawabanTercetak(pertanyaan, jawabanResmi, kontak = '') {
  if (!jawabanResmi || !jawabanResmi.trim()) return ''

  // Coba minta Gemini menulis versi ramah lansia
  const hasilAi = await mintaJawabanGemini({
    pertanyaan: `Tolong ringkas dan susunkan jawaban resmi berikut menjadi jawaban chatbot WhatsApp yang sangat ramah lansia, sopan, singkat (maksimal 35 kata), dan langsung to the point. Pertanyaan acuan: "${pertanyaan}"`,
    faqKandidat: [{
      kode: 'DRAFT',
      id: 0,
      pertanyaan_contoh: pertanyaan,
      jawaban: jawabanResmi
    }],
    kontakInfo: kontak,
    tahap: 'cetak'
  })

  if (hasilAi.sukses && hasilAi.data?.terjawab && hasilAi.data?.jawaban) {
    const teks = hasilAi.data.jawaban.trim()
    const verifikasi = verifikasiJawabanAi(teks, jawabanResmi + ' ' + kontak)
    if (verifikasi.lolos) {
      logger.info('Jawaban tercetak berhasil dipra-render via Gemini')
      return teks
    }
  }

  // Fallback deterministik tanpa AI
  let bersih = jawabanResmi.replace(/\s+/g, ' ').trim()
  if (bersih.length > 200) {
    bersih = bersih.slice(0, 190) + '...'
  }
  return `Baik Bapak/Ibu. ${bersih}`
}
