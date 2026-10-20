import express from 'express'
import { getDb } from '../../db/koneksi.js'
import { getAllFaq, getFaqById, reindexFaq, catatAudit, getKontakUtama } from '../../db/kueri.js'
import { praRenderJawabanTercetak } from '../../mesin/percetakan.js'

const router = express.Router()

router.get('/', (req, res) => {
  const faqs = getAllFaq()
  const db = getDb()
  const kategoriList = db.prepare('SELECT * FROM kategori ORDER BY urutan ASC').all()
  res.render('faq-list', { faqs, kategoriList, pesan: req.query.pesan || null })
})

router.get('/edit/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10)
  const faq = getFaqById(id)
  if (!faq) return res.redirect('/faq')

  const db = getDb()
  const kategoriList = db.prepare('SELECT * FROM kategori ORDER BY urutan ASC').all()
  const varian = db.prepare('SELECT * FROM faq_varian WHERE faq_id = ?').all(id)
  const keyword = db.prepare('SELECT * FROM faq_keyword WHERE faq_id = ?').all(id)

  res.render('faq-edit', {
    faq,
    kategoriList,
    varianText: varian.map(v => v.teks).join('\n'),
    keywordText: keyword.map(k => `${k.kata}, ${k.bobot}`).join('\n'),
    error: null
  })
})

router.post('/edit/:id', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10)
  const db = getDb()
  const faqLama = getFaqById(id)
  if (!faqLama) return res.redirect('/faq')

  const {
    kategori_id,
    pertanyaan_contoh,
    jawaban,
    jawaban_bot_tercetak,
    status,
    sumber,
    berlaku_sampai,
    prioritas,
    varianText,
    keywordText
  } = req.body

  const diubahOleh = req.session?.user?.username || 'admin'

  let jawabanTercetakFinal = (jawaban_bot_tercetak || '').trim() || null
  if (!jawabanTercetakFinal && status === 'publish') {
    const kontak = getKontakUtama()
    const kontakStr = kontak ? `${kontak.nama_unit} (${kontak.nomor})` : ''
    jawabanTercetakFinal = await praRenderJawabanTercetak(pertanyaan_contoh, jawaban, kontakStr)
  }

  db.prepare(`
    UPDATE faq
    SET kategori_id = ?,
        pertanyaan_contoh = ?,
        jawaban = ?,
        jawaban_bot_tercetak = ?,
        status = ?,
        sumber = ?,
        berlaku_sampai = ?,
        prioritas = ?,
        versi = versi + 1,
        diubah_oleh = ?,
        diubah_pada = datetime('now','localtime')
    WHERE id = ?
  `).run(
    Number.parseInt(kategori_id, 10),
    pertanyaan_contoh.trim(),
    jawaban.trim(),
    jawabanTercetakFinal,
    status,
    (sumber || '').trim() || null,
    berlaku_sampai ? berlaku_sampai.trim() : null,
    Number.parseInt(prioritas || '0', 10),
    diubahOleh,
    id
  )

  // Update varian
  db.prepare('DELETE FROM faq_varian WHERE faq_id = ?').run(id)
  if (varianText) {
    const baris = varianText.split('\n').map(b => b.trim()).filter(Boolean)
    const insVarian = db.prepare('INSERT INTO faq_varian (faq_id, teks) VALUES (?, ?)')
    for (const teks of baris) {
      insVarian.run(id, teks)
    }
  }

  // Update keyword
  db.prepare('DELETE FROM faq_keyword WHERE faq_id = ?').run(id)
  if (keywordText) {
    const baris = keywordText.split('\n').map(b => b.trim()).filter(Boolean)
    const insKw = db.prepare('INSERT INTO faq_keyword (faq_id, kata, bobot) VALUES (?, ?, ?)')
    for (const item of baris) {
      const [kata, bobotStr] = item.split(',').map(s => s.trim())
      if (kata) {
        const bobot = Number.parseFloat(bobotStr || '1.0') || 1.0
        insKw.run(id, kata.toLowerCase(), bobot)
      }
    }
  }

  // Bangun ulang indeks pencarian untuk FAQ ini
  reindexFaq(id)

  catatAudit({
    aktor: diubahOleh,
    aksi: 'ubah_faq',
    entitas: 'faq',
    entitasId: String(id),
    nilaiLama: `${faqLama.status} | ${faqLama.pertanyaan_contoh}`,
    nilaiBaru: `${status} | ${pertanyaan_contoh.trim()}`,
    ip: req.ip
  })

  res.redirect('/faq?pesan=FAQ+' + faqLama.kode + '+berhasil+diperbarui')
})

router.post('/reindex-semua', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM kb_dok').run()
  db.prepare(`
    INSERT INTO kb_dok (faq_id, teks)
    SELECT f.id,
           lower(
             f.pertanyaan_contoh || ' ' ||
             coalesce((SELECT group_concat(v.teks, ' ') FROM faq_varian v WHERE v.faq_id = f.id), '') || ' ' ||
             coalesce((SELECT group_concat(k.kata, ' ') FROM faq_keyword k WHERE k.faq_id = f.id), '')
           )
    FROM faq f
    WHERE f.status = 'publish'
  `).run()

  catatAudit({
    aktor: req.session?.user?.username || 'admin',
    aksi: 'reindex_semua',
    entitas: 'kb_dok',
    entitasId: '0',
    ip: req.ip
  })

  res.redirect('/faq?pesan=Seluruh+indeks+pencarian+berhasil+dibangun+ulang')
})

export default router
