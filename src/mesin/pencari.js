import { cariFts, cariKeyword } from '../db/kueri.js'
import { tokenisasi } from './normalisasi.js'
import { logger } from '../config/logger.js'

/**
 * Menghitung proporsi token pertanyaan yang benar-benar muncul di dalam
 * dokumen FAQ. Ini adalah sinyal ABSOLUT (bukan relatif seperti normalisasi
 * BM25), sehingga pertanyaan di luar cakupan tidak dapat memperoleh skor tinggi
 * hanya karena kebetulan menjadi kandidat teratas.
 */
function hitungCakupan(tokens, docTeks) {
  if (!tokens || tokens.length === 0) return 0
  if (!docTeks) return 0

  const doc = docTeks.toLowerCase()
  let cocok = 0
  for (const t of tokens) {
    if (doc.includes(t)) cocok++
  }
  return cocok / tokens.length
}

export function cariJawabanTerbaik(teksPengunjung) {
  const tokens = tokenisasi(teksPengunjung)

  if (tokens.length === 0) {
    return { terbaik: null, skor: 0, calon: [] }
  }

  // 1. Ambil kandidat via FTS5 (gabungan kata dengan operator OR)
  const ftsQuery = tokens.join(' OR ')
  let hasilFts = []
  try {
    hasilFts = cariFts(ftsQuery, 5)
  } catch (err) {
    logger.warn({ err: err.message, ftsQuery }, 'FTS5 query gagal, fallback ke keyword murni')
  }

  // 2. Ambil kandidat via tabel faq_keyword
  const hasilKeyword = cariKeyword(tokens, 5)

  // 3. Normalisasi & gabungkan skor
  const skorPeta = new Map()

  if (hasilFts.length > 0) {
    const nilaiAbsolut = hasilFts.map(r => Math.abs(r.skor_raw))
    const maksAbs = Math.max(...nilaiAbsolut, 0.0001)

    for (const item of hasilFts) {
      const ftsNorm = Math.min(Math.abs(item.skor_raw) / maksAbs, 1.0)
      skorPeta.set(item.faq_id, {
        item,
        ftsNorm,
        kwNorm: 0,
        prioritas: item.prioritas || 0,
        docTeks: item.doc_teks || ''
      })
    }
  }

  if (hasilKeyword.length > 0) {
    const maksBobot = Math.max(...hasilKeyword.map(r => r.total_bobot), 1.0)

    for (const item of hasilKeyword) {
      const kwNorm = Math.min(item.total_bobot / maksBobot, 1.0)
      if (skorPeta.has(item.faq_id)) {
        const entry = skorPeta.get(item.faq_id)
        entry.kwNorm = kwNorm
        if (!entry.docTeks) entry.docTeks = item.doc_teks || ''
      } else {
        skorPeta.set(item.faq_id, {
          item,
          ftsNorm: 0,
          kwNorm,
          prioritas: item.prioritas || 0,
          docTeks: item.doc_teks || ''
        })
      }
    }
  }

  if (skorPeta.size === 0) {
    return { terbaik: null, skor: 0, calon: [] }
  }

  // 4. Hitung skor gabungan dengan FAKTOR CAKUPAN (anti-relevansi palsu)
  const daftarCalon = []
  for (const [, entry] of skorPeta.entries()) {
    const { item, ftsNorm, kwNorm, prioritas, docTeks } = entry
    const prioNorm = Math.min(prioritas / 10, 1.0)

    // Cakupan penuh tercapai bila >= 60% token pertanyaan ada di dokumen FAQ
    const cakupan = hitungCakupan(tokens, docTeks)
    const faktorCakupan = Math.min(cakupan / 0.6, 1.0)

    const skorDasar =
      0.55 * ftsNorm +
      0.35 * kwNorm +
      0.10 * prioNorm

    const skorAkhir = Number((skorDasar * faktorCakupan).toFixed(3))

    daftarCalon.push({
      faq: item,
      skor: skorAkhir,
      ftsNorm,
      kwNorm,
      cakupan: Number(cakupan.toFixed(2))
    })
  }

  daftarCalon.sort((a, b) => b.skor - a.skor)
  const terbaik = daftarCalon[0]

  return {
    terbaik: terbaik ? terbaik.faq : null,
    skor: terbaik ? terbaik.skor : 0,
    calon: daftarCalon
  }
}
