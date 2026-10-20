// =====================================================================
//  BOOTSTRAP PENGUJIAN
//  Wajib diimpor PALING AWAL pada setiap skrip uji.
//
//  Tujuan: mengarahkan basis data ke berkas sementara yang terpisah,
//  lalu mengisinya dengan fixture (src/db/seed-uji.sql) agar 46 skenario
//  uji tetap deterministik TANPA mengubah basis data operasional yang
//  telah dinetralkan.
// =====================================================================
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbUji = path.join(os.tmpdir(), `silapurwa-uji-${process.pid}-${Date.now()}.db`)

// Harus di-set SEBELUM modul config/env.js dievaluasi.
process.env.SILAPURWA_DB = dbUji

for (const sisa of [dbUji, `${dbUji}-wal`, `${dbUji}-shm`]) {
  try { fs.rmSync(sisa, { force: true }) } catch { /* abaikan */ }
}

// Impor dinamis agar env.js membaca SILAPURWA_DB di atas.
const { initDatabase } = await import('../db/init.js')
const { getDb, closeDb } = await import('../db/koneksi.js')

// 1. Skema + seed netral
initDatabase()

// 2. Terapkan fixture data uji
const fixtureSql = fs.readFileSync(path.join(__dirname, '../db/seed-uji.sql'), 'utf8')
getDb().exec(fixtureSql)

closeDb()

process.on('exit', () => {
  for (const sisa of [dbUji, `${dbUji}-wal`, `${dbUji}-shm`]) {
    try { fs.rmSync(sisa, { force: true }) } catch { /* abaikan */ }
  }
})

export const DB_UJI = dbUji
