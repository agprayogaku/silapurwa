import fs from 'node:fs'
import path from 'node:path'
import { getDb } from '../db/koneksi.js'
import { REPORT_DIR } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Menyusun laporan mingguan pertanyaan tak terjawab (bahan perbaikan basis FAQ)
 * ke berkas Markdown di folder data/laporan.
 */
export function buatLaporanMingguan() {
  const db = getDb()
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true })
  }

  const takTerjawab = db.prepare(`
    SELECT teks_normal, jumlah, terakhir
    FROM pertanyaan_tak_terjawab
    WHERE sudah_dibuat_faq = 0
    ORDER BY jumlah DESC, terakhir DESC
    LIMIT 20
  `).all()

  const statJenis = db.prepare(`
    SELECT jenis_balasan, COUNT(*) n
    FROM pesan
    WHERE arah = 'keluar' AND jenis_balasan IS NOT NULL
    GROUP BY jenis_balasan
  `).all()

  const totalMasuk = db.prepare("SELECT COUNT(*) n FROM pesan WHERE arah = 'masuk'").get().n

  const sekarang = new Date()
  const stamp = sekarang.toISOString().slice(0, 10)
  const berkas = path.join(REPORT_DIR, `laporan-mingguan-${stamp}.md`)

  const barisStat = statJenis.map(s => `| ${s.jenis_balasan} | ${s.n} |`).join('\n')
  const barisTak = takTerjawab.length
    ? takTerjawab.map((t, i) => `${i + 1}. **${t.teks_normal}** — diajukan ${t.jumlah}x (terakhir: ${t.terakhir})`).join('\n')
    : '_Tidak ada pertanyaan tak terjawab pada periode ini._'

  const isi = `# Laporan Mingguan Silapurwa — ${stamp}

Dibuat otomatis oleh tugas terjadwal Silapurwa (Lapas Purwakarta).

## 1. Ringkasan Aktivitas
- Total pesan masuk: **${totalMasuk}**

| Jenis Balasan | Jumlah |
|---|---|
${barisStat || '| - | 0 |'}

## 2. Pertanyaan Tak Terjawab Teratas (Bahan Perbaikan FAQ)
${barisTak}

## 3. Tindak Lanjut yang Disarankan
1. Periksa daftar di atas, tambahkan FAQ baru pada panel admin bila topik berulang.
2. Perbarui ` + '`jawaban`' + ` dan ` + '`jawaban_bot_tercetak`' + ` lalu set status menjadi **publish**.
3. Klik **Perbarui Indeks Pencarian** di halaman Basis FAQ setelah perubahan.
`

  fs.writeFileSync(berkas, isi, 'utf8')
  logger.info({ berkas, jumlahTakTerjawab: takTerjawab.length }, 'Laporan mingguan berhasil dibuat')
  return berkas
}
