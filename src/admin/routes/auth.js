import express from 'express'
import bcrypt from 'bcryptjs'
import { getDb } from '../../db/koneksi.js'
import { catatAudit } from '../../db/kueri.js'

const router = express.Router()

router.get('/masuk', (req, res) => {
  if (req.session?.user) {
    return res.redirect('/')
  }
  res.render('masuk', { error: null })
})

router.post('/masuk', (req, res) => {
  const { username, password } = req.body
  const db = getDb()

  const user = db.prepare('SELECT * FROM admin_user WHERE username = ? AND aktif = 1').get(username)

  if (!user) {
    return res.render('masuk', { error: 'Nama pengguna atau kata sandi tidak valid' })
  }

  // Cek penguncian akun
  if (user.terkunci_hingga && new Date(user.terkunci_hingga) > new Date()) {
    return res.render('masuk', { error: 'Akun sedang terkunci sementara karena percobaan gagal berulang kali.' })
  }

  const cocok = bcrypt.compareSync(password || '', user.password_hash)

  if (!cocok) {
    const gagalBaru = user.gagal_login + 1
    let terkunci = null
    if (gagalBaru >= 5) {
      // Kunci selama 15 menit
      terkunci = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }

    db.prepare(`
      UPDATE admin_user
      SET gagal_login = ?, terkunci_hingga = ?
      WHERE id = ?
    `).run(gagalBaru, terkunci, user.id)

    catatAudit({
      aktor: username || 'anon',
      aksi: 'login_gagal',
      entitas: 'admin_user',
      entitasId: String(user.id),
      ip: req.ip
    })

    return res.render('masuk', { error: 'Nama pengguna atau kata sandi tidak valid' })
  }

  // Reset percobaan gagal & catat login sukses
  db.prepare(`
    UPDATE admin_user
    SET gagal_login = 0,
        terkunci_hingga = NULL,
        terakhir_login = datetime('now','localtime')
    WHERE id = ?
  `).run(user.id)

  req.session.user = {
    id: user.id,
    username: user.username,
    nama: user.nama,
    peran: user.peran
  }

  catatAudit({
    aktor: user.username,
    aksi: 'login_sukses',
    entitas: 'admin_user',
    entitasId: String(user.id),
    ip: req.ip
  })

  res.redirect('/')
})

router.get('/keluar', (req, res) => {
  if (req.session?.user) {
    catatAudit({
      aktor: req.session.user.username,
      aksi: 'logout',
      entitas: 'admin_user',
      entitasId: String(req.session.user.id),
      ip: req.ip
    })
  }
  req.session.destroy(() => {
    res.redirect('/auth/masuk')
  })
})

export default router
