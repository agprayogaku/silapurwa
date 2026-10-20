import { getDb } from '../db/koneksi.js'
import { logger } from '../config/logger.js'

export function bersihkanLogUsang() {
  const db = getDb()
  const resPesan = db.prepare(`
    DELETE FROM pesan
    WHERE kadaluarsa_pada < datetime('now','localtime')
  `).run()

  const resCache = db.prepare(`
    DELETE FROM cache_jawaban
    WHERE kedaluwarsa < datetime('now','localtime')
  `).run()

  logger.info({
    pesanDihapus: resPesan.changes,
    cacheDihapus: resCache.changes
  }, 'Pembersihan log & cache usang selesai')
}
