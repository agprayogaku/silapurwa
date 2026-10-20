import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'node:url'
import { getDb, closeDb } from './koneksi.js'
import { logger } from '../config/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(__dirname, 'schema.sql')
const seedPath = path.join(__dirname, 'seed.sql')

export function initDatabase() {
  const db = getDb()

  logger.info('Menjalankan schema.sql...')
  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  db.exec(schemaSql)

  logger.info('Menjalankan seed.sql...')
  let seedSql = fs.readFileSync(seedPath, 'utf8')

  // Hash kata sandi awal default: AdminLapas2026!
  const defaultPass = 'AdminLapas2026!'
  const hash = bcrypt.hashSync(defaultPass, 12)
  seedSql = seedSql.replace('[GANTI_HASH_BCRYPT]', hash)

  db.exec(seedSql)

  // Bangun indeks pencarian FTS untuk seluruh FAQ berstatus publish.
  // (Seed netral tidak memuat FAQ; indeks akan terisi saat FAQ ditambahkan
  //  dan diterbitkan melalui panel admin.)
  db.exec(`
    DELETE FROM kb_dok;
    INSERT INTO kb_dok (faq_id, teks)
    SELECT f.id,
           lower(
             f.pertanyaan_contoh || ' ' ||
             coalesce((SELECT group_concat(v.teks, ' ') FROM faq_varian v WHERE v.faq_id = f.id), '') || ' ' ||
             coalesce((SELECT group_concat(k.kata, ' ') FROM faq_keyword k WHERE k.faq_id = f.id), '')
           )
    FROM faq f
    WHERE f.status = 'publish';
  `)

  logger.info({
    username: 'admin',
    passwordDefault: defaultPass
  }, 'Inisialisasi basis data SELESAI (data NETRAL / kosong). Akun admin dibuat — GANTI SANDI SEGERA dan isi FAQ lewat panel admin.')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    initDatabase()
    closeDb()
    process.exit(0)
  } catch (err) {
    logger.error({ err }, 'Gagal inisialisasi basis data')
    process.exit(1)
  }
}
