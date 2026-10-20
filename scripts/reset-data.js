import fs from 'node:fs'
import { DB_PATH } from '../src/config/env.js'
import { initDatabase } from '../src/db/init.js'
import { closeDb } from '../src/db/koneksi.js'
import { logger } from '../src/config/logger.js'

/**
 * Mengembalikan basis data ke kondisi DEFAULT/NETRAL:
 * menghapus berkas basis data (beserta WAL/SHM) lalu membangun ulang
 * skema + seed netral (tanpa FAQ, tanpa informasi instansi).
 *
 * Semua data operasional (FAQ, tiket, riwayat percakapan) akan HILANG.
 */
function resetData() {
  console.log('================================================================')
  console.log('  SILAPURWA — RESET DATA KE DEFAULT')
  console.log('================================================================')
  console.log(`  Basis data: ${DB_PATH}`)

  for (const berkas of [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`]) {
    try {
      fs.rmSync(berkas, { force: true })
      if (fs.existsSync(berkas) === false) console.log(`  [dihapus] ${berkas}`)
    } catch (err) {
      logger.warn({ err: err.message, berkas }, 'Gagal menghapus berkas basis data')
    }
  }

  initDatabase()
  closeDb()

  console.log('\n  [SELESAI] Basis data telah direset ke kondisi default/netral.')
  console.log('  Langkah berikutnya: isi FAQ & pengaturan lewat panel admin.')
  console.log('================================================================')
}

resetData()
