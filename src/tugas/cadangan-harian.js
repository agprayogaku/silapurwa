import fs from 'node:fs'
import path from 'node:path'
import { DB_PATH, DATA_DIR } from '../config/env.js'
import { logger } from '../config/logger.js'

export function cadangkanBasisData() {
  const folderBackup = path.join(DATA_DIR, 'backups')
  if (!fs.existsSync(folderBackup)) {
    fs.mkdirSync(folderBackup, { recursive: true })
  }

  const sekarang = new Date()
  const stamp = sekarang.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const tujuan = path.join(folderBackup, `silapurwa-${stamp}.db`)

  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, tujuan)
    logger.info({ tujuan }, 'Cadangan harian basis data berhasil dibuat')

    // Bersihkan cadangan yang lebih tua dari 14 hari
    const batasHapus = Date.now() - 14 * 24 * 60 * 60 * 1000
    const berkasDaftar = fs.readdirSync(folderBackup)

    for (const b of berkasDaftar) {
      if (!b.endsWith('.db')) continue
      const berkasPath = path.join(folderBackup, b)
      const stat = fs.statSync(berkasPath)
      if (stat.mtimeMs < batasHapus) {
        fs.unlinkSync(berkasPath)
        logger.info({ dihapus: b }, 'Cadangan usang (>14 hari) dihapus')
      }
    }
  }
}
