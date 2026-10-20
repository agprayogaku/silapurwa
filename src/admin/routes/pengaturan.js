import express from 'express'
import { getAllPengaturan, updatePengaturan, catatAudit } from '../../db/kueri.js'
import { kelompokkanPengaturan } from '../util/pengaturan-grup.js'

const router = express.Router()

router.get('/', (req, res) => {
  const daftar = getAllPengaturan()
  res.render('pengaturan', {
    daftar,
    grupPengaturan: kelompokkanPengaturan(daftar),
    pesan: req.query.pesan || null
  })
})

router.post('/', (req, res) => {
  const username = req.session?.user?.username || 'admin'
  const keys = Object.keys(req.body)

  for (const k of keys) {
    if (k.startsWith('cfg_')) {
      const kunciAsli = k.replace(/^cfg_/, '')
      const nilai = req.body[k]
      updatePengaturan(kunciAsli, nilai)
    }
  }

  catatAudit({
    aktor: username,
    aksi: 'ubah_pengaturan',
    entitas: 'pengaturan',
    entitasId: 'multi',
    ip: req.ip
  })

  res.redirect('/pengaturan?pesan=Pengaturan+berhasil+disimpan')
})

export default router
