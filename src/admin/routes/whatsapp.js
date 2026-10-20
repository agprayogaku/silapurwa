import express from 'express'
import {
  mulaiBaileys,
  mulaiBaileysPairing,
  hentikanBaileys,
  logoutBaileys,
  getStatus,
  adaSesiTersimpan
} from '../../saluran/baileys.js'
import { logger } from '../../config/logger.js'

const router = express.Router()

router.get('/', (req, res) => {
  res.render('whatsapp', {
    status: getStatus(),
    adaSesi: adaSesiTersimpan(),
    pesan: req.query.pesan || null,
    error: req.query.error || null
  })
})

// Endpoint JSON untuk pemantauan status & QR secara langsung (polling)
router.get('/status', (req, res) => {
  res.json({ ...getStatus(), adaSesi: adaSesiTersimpan() })
})

router.post('/hubungkan', async (req, res) => {
  try {
    await mulaiBaileys()
    res.redirect('/whatsapp?pesan=Koneksi+dimulai.+Silakan+pindai+kode+QR+atau+tunggu+kode+muncul.')
  } catch (err) {
    logger.error({ err }, 'Gagal menghubungkan WhatsApp dari panel')
    res.redirect('/whatsapp?error=' + encodeURIComponent('Gagal memulai koneksi: ' + err.message))
  }
})

router.post('/pairing', async (req, res) => {
  const nomor = String(req.body.nomor || '').replace(/[^0-9]/g, '')
  if (nomor.length < 9) {
    return res.redirect('/whatsapp?error=Nomor+WhatsApp+tidak+valid.+Gunakan+format+628xxxxxxxxxx')
  }
  try {
    // Mulai dalam mode kode pairing (menutup soket lama & membersihkan sesi secara internal)
    await mulaiBaileysPairing(nomor)
    res.redirect('/whatsapp?pesan=Kode+pairing+sedang+dibuat.+Periksa+panel+dalam+beberapa+detik.')
  } catch (err) {
    logger.error({ err }, 'Gagal membuat kode pairing')
    res.redirect('/whatsapp?error=' + encodeURIComponent('Gagal membuat kode pairing: ' + err.message))
  }
})

router.post('/putus', (req, res) => {
  hentikanBaileys()
  res.redirect('/whatsapp?pesan=Koneksi+WhatsApp+dihentikan.+Sesi+tersimpan+tetap+aman.')
})

router.post('/logout', async (req, res) => {
  await logoutBaileys()
  res.redirect('/whatsapp?pesan=Sesi+WhatsApp+dihapus.+Silakan+hubungkan+ulang+untuk+membuat+QR+baru.')
})

export default router
