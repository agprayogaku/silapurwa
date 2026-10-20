import express from 'express'
import { prosesPesanMasuk } from '../../mesin/pipa.js'

const router = express.Router()

router.get('/', (req, res) => {
  res.render('simulator')
})

router.post('/kirim', async (req, res) => {
  const { teks } = req.body
  if (!teks || !teks.trim()) {
    return res.status(400).json({ error: 'Teks tidak boleh kosong' })
  }

  try {
    const hasil = await prosesPesanMasuk({
      nomorWa: '628webtest001',
      teks: teks.trim(),
      kanal: 'web_simulator'
    })

    res.json(hasil)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
