import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb, closeDb } from '../src/db/koneksi.js'
import { logger } from '../src/config/logger.js'

/**
 * Memuat data layanan terverifikasi (jadwal kunjungan, penitipan uang,
 * penitipan barang, tata tertib) dari src/db/data-lapas.sql.
 *
 * Aman dijalankan berulang: seluruh data FAQ/kategori/kontak lama diganti,
 * sedangkan pengaturan perilaku sistem di-upsert (tidak dihapus).
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '..', 'src', 'db', 'data-lapas.sql')

function muat() {
  console.log('================================================================')
  console.log('  SILAPURWA — MUAT DATA LAYANAN TERVERIFIKASI')
  console.log('================================================================')

  const db = getDb()
  const sql = fs.readFileSync(sqlPath, 'utf8')
  db.exec(sql)

  const stat = {
    faq: db.prepare("SELECT COUNT(*) AS n FROM faq WHERE status = 'publish'").get().n,
    kategori: db.prepare('SELECT COUNT(*) AS n FROM kategori').get().n,
    kontak: db.prepare('SELECT COUNT(*) AS n FROM kontak').get().n,
    indeks: db.prepare('SELECT COUNT(*) AS n FROM kb_dok').get().n
  }

  console.log(`  FAQ terbit : ${stat.faq}`)
  console.log(`  Kategori   : ${stat.kategori}`)
  console.log(`  Kontak     : ${stat.kontak}`)
  console.log(`  Indeks FTS : ${stat.indeks}`)
  console.log('\n  [SELESAI] Data layanan berhasil dimuat.')
  console.log('================================================================')

  logger.info(stat, 'Data layanan terverifikasi dimuat')
  closeDb()
}

muat()
