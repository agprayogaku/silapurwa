import express from 'express'
import { getDb } from '../../db/koneksi.js'

const router = express.Router()

router.get('/', (req, res) => {
  const db = getDb()

  const stats = {
    totalPercakapan: db.prepare('SELECT COUNT(*) n FROM percakapan').get().n,
    totalPesanMasuk: db.prepare("SELECT COUNT(*) n FROM pesan WHERE arah = 'masuk'").get().n,
    terjawabFaq: db.prepare("SELECT COUNT(*) n FROM pesan WHERE jenis_balasan = 'faq'").get().n,
    ditolak: db.prepare("SELECT COUNT(*) n FROM pesan WHERE jenis_balasan = 'tolak'").get().n,
    dieskalasi: db.prepare("SELECT COUNT(*) n FROM pesan WHERE jenis_balasan = 'eskalasi'").get().n,
    takTerjawab: db.prepare("SELECT COUNT(*) n FROM pertanyaan_tak_terjawab WHERE sudah_dibuat_faq = 0").get().n,
    totalFaqPublish: db.prepare("SELECT COUNT(*) n FROM faq WHERE status = 'publish'").get().n,
    totalFaqDraft: db.prepare("SELECT COUNT(*) n FROM faq WHERE status = 'draft'").get().n
  }

  const pesanTerbaru = db.prepare(`
    SELECT p.id, p.arah, p.isi_teks, p.jenis_balasan, p.sumber_jawaban, p.skor, p.ts, f.kode AS kode_faq
    FROM pesan p
    LEFT JOIN faq f ON f.id = p.faq_id
    ORDER BY p.id DESC
    LIMIT 10
  `).all()

  const takTerjawabTop = db.prepare(`
    SELECT id, teks_normal, jumlah, terakhir
    FROM pertanyaan_tak_terjawab
    WHERE sudah_dibuat_faq = 0
    ORDER BY jumlah DESC, terakhir DESC
    LIMIT 5
  `).all()

  const tglHariIni = new Date().toISOString().slice(0, 10)
  const kuotaHariIni = db.prepare('SELECT SUM(jumlah_permintaan) jml, SUM(tokens_total) tok, SUM(jumlah_429) e429 FROM ai_kuota_harian WHERE tanggal = ?').get(tglHariIni) || {}
  const totalInteraksiAi = db.prepare('SELECT COUNT(*) n FROM ai_interaksi').get().n
  const totalAiOk = db.prepare("SELECT COUNT(*) n FROM ai_interaksi WHERE status = 'ok'").get().n

  const aiStats = {
    panggilanHariIni: kuotaHariIni.jml || 0,
    tokenHariIni: kuotaHariIni.tok || 0,
    rateLimit429: kuotaHariIni.e429 || 0,
    totalPanggilan: totalInteraksiAi,
    totalSukses: totalAiOk
  }

  res.render('dashboard', { stats, aiStats, pesanTerbaru, takTerjawabTop })
})

export default router
