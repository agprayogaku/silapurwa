import { PORT, KANAL_AKTIF } from './config/env.js'
import { logger } from './config/logger.js'
import { getDb, closeDb } from './db/koneksi.js'
import { buatAplikasiAdmin } from './admin/server.js'
import { inisialisasiSaluran } from './saluran/indeks.js'
import { mulaiPenjadwal } from './tugas/penjadwal.js'

async function utama() {
  logger.info('========================================================')
  logger.info('  SILAPURWA — Sistem Informasi Layanan Lapas Purwakarta')
  logger.info('========================================================')

  // 1. Pastikan koneksi basis data aktif
  getDb()

  // 2. Jalankan tugas terjadwal
  mulaiPenjadwal()

  // 3. Jalankan server web panel admin
  const app = buatAplikasiAdmin()
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT, url: `http://localhost:${PORT}` }, 'Panel Admin Silapurwa AKTIF')
  })

  // 4. Inisialisasi saluran WhatsApp / Simulasi
  await inisialisasiSaluran()

  if (KANAL_AKTIF === 'baileys') {
    logger.info('Kanal WhatsApp aktif. Buka http://localhost:%d/whatsapp untuk memantau QR / koneksi.', PORT)
  }

  // Penanganan keluar bersih
  const tanganiKeluar = (sinyal) => {
    logger.info({ sinyal }, 'Menerima sinyal keluar. Menutup layanan...')
    server.close(() => {
      closeDb()
      logger.info('Aplikasi Silapurwa berhenti dengan aman.')
      process.exit(0)
    })
  }

  process.on('SIGINT', () => tanganiKeluar('SIGINT'))
  process.on('SIGTERM', () => tanganiKeluar('SIGTERM'))
}

utama().catch((err) => {
  logger.fatal({ err }, 'Kesalahan fatal pada bootstrap aplikasi')
  process.exit(1)
})
