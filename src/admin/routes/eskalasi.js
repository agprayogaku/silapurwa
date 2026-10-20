import express from 'express'
import { getDb } from '../../db/koneksi.js'
import { catatAudit } from '../../db/kueri.js'

const router = express.Router()

router.get('/', (req, res) => {
  const db = getDb()
  const daftar = db.prepare(`
    SELECT e.*, p.wa_hash, p.kanal
    FROM eskalasi e
    JOIN percakapan p ON p.id = e.percakapan_id
    ORDER BY e.status = 'baru' DESC, e.id DESC
  `).all()

  res.render('eskalasi', { daftar, pesan: req.query.pesan || null })
})

router.post('/update/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10)
  const { status, catatan } = req.body
  const username = req.session?.user?.username || 'admin'
  const db = getDb()

  db.prepare(`
    UPDATE eskalasi
    SET status = ?,
        ditangani_oleh = ?,
        catatan = ?,
        ditutup = CASE WHEN ? = 'selesai' THEN datetime('now','localtime') ELSE ditutup END
    WHERE id = ?
  `).run(status, username, catatan, status, id)

  catatAudit({
    aktor: username,
    aksi: 'update_eskalasi',
    entitas: 'eskalasi',
    entitasId: String(id),
    nilaiBaru: status,
    ip: req.ip
  })

  res.redirect('/eskalasi?pesan=Status+tiket+berhasil+diperbarui')
})

export default router
