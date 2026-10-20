import cron from 'node-cron'
import { cadangkanBasisData } from './cadangan-harian.js'
import { bersihkanLogUsang } from './bersih-log.js'
import { buatLaporanMingguan } from './laporan-mingguan.js'
import { logger } from '../config/logger.js'

export function mulaiPenjadwal() {
  logger.info('Memulai tugas terjadwal (cron)...')

  // 1. Cadangan harian setiap pukul 00:30
  cron.schedule('30 0 * * *', () => {
    try {
      cadangkanBasisData()
    } catch (err) {
      logger.error({ err }, 'Gagal menjalankan cadangan harian')
    }
  })

  // 2. Pembersihan log kadaluarsa setiap pukul 01:00
  cron.schedule('0 1 * * *', () => {
    try {
      bersihkanLogUsang()
    } catch (err) {
      logger.error({ err }, 'Gagal membersihkan log usang')
    }
  })

  // 3. Laporan mingguan setiap Senin pukul 07:00
  cron.schedule('0 7 * * 1', () => {
    try {
      buatLaporanMingguan()
    } catch (err) {
      logger.error({ err }, 'Gagal membuat laporan mingguan')
    }
  })
}
