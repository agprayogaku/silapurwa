import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buatAplikasiAdmin } from '../src/admin/server.js'
import { getDb, closeDb } from '../src/db/koneksi.js'
import { logger } from '../src/config/logger.js'

/**
 * Menjalankan panel admin secara luring pada port acak, login sebagai admin,
 * lalu menyimpan setiap halaman sebagai berkas HTML mandiri ke
 * docs/tangkapan-layar/. Berkas ini dapat dibuka di peramban dan diambil
 * tangkapan layarnya untuk lampiran laporan tugas akhir.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const keluar = path.join(root, 'docs', 'tangkapan-layar')

const KREDENSIAL = { username: 'admin', password: 'AdminLapas2026!' }

/**
 * Menyusun daftar halaman yang akan diekspor. Halaman "Kelola FAQ" hanya
 * disertakan bila ada minimal satu FAQ (basis data netral tidak memilikinya).
 */
function daftarHalaman(db) {
  const faqPertama = db.prepare('SELECT id FROM faq ORDER BY id ASC LIMIT 1').get()
  const halaman = [
    { nama: '01-dashboard', url: '/' },
    { nama: '02-daftar-faq', url: '/faq' }
  ]
  if (faqPertama) {
    halaman.push({ nama: '03-kelola-faq', url: `/faq/edit/${faqPertama.id}` })
  }
  halaman.push(
    { nama: '04-eskalasi', url: '/eskalasi' },
    { nama: '05-simulator', url: '/simulator' },
    { nama: '06-pengaturan', url: '/pengaturan' },
    { nama: '07-whatsapp', url: '/whatsapp' },
    { nama: '08-halaman-masuk', url: '/auth/masuk' }
  )
  return halaman
}

async function utama() {
  const db = getDb()
  const HALAMAN = daftarHalaman(db)
  // Bersihkan berkas lama agar lampiran tidak memuat halaman usang
  fs.rmSync(keluar, { recursive: true, force: true })
  fs.mkdirSync(keluar, { recursive: true })

  const app = buatAplikasiAdmin()
  const server = app.listen(0)
  await new Promise(r => server.once('listening', r))
  const port = server.address().port
  const base = `http://127.0.0.1:${port}`
  logger.info({ base }, 'Server sementara untuk ekspor tangkapan layar aktif')

  // Login untuk memperoleh cookie sesi
  const login = await fetch(`${base}/auth/masuk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(KREDENSIAL.username)}&password=${encodeURIComponent(KREDENSIAL.password)}`,
    redirect: 'manual'
  })
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0]

  let jumlah = 0
  for (const h of HALAMAN) {
    const publik = h.url === '/auth/masuk'
    const res = await fetch(`${base}${h.url}`, {
      headers: publik ? {} : { Cookie: cookie },
      redirect: 'follow'
    })
    let html = await res.text()

    // Sisipkan spanduk keterangan untuk lampiran
    const spanduk = `<!-- Tangkapan layar Silapurwa: ${h.url} (${new Date().toISOString()}) -->`
    html = html.replace('<!DOCTYPE html>', `<!DOCTYPE html>\n${spanduk}`)

    const tujuan = path.join(keluar, `${h.nama}.html`)
    fs.writeFileSync(tujuan, html, 'utf8')
    jumlah++
    logger.info({ tujuan, status: res.status }, 'Halaman diekspor')
  }

  // Indeks halaman
  const indeks = `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><title>Lampiran Tangkapan Layar Silapurwa</title>
<style>body{font-family:Segoe UI,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem}
h1{color:#1e3a8a}li{margin:.4rem 0}a{color:#0284c7;text-decoration:none}a:hover{text-decoration:underline}
small{color:#64748b}</style></head><body>
<h1>Lampiran Tangkapan Layar — Panel Admin Silapurwa</h1>
<p><small>Dibuat ${new Date().toLocaleString('id-ID')}. Buka tiap berkas lalu ambil tangkapan layar (Win+Shift+S) untuk lampiran laporan.</small></p>
<ol>
${HALAMAN.map(h => `<li><a href="${h.nama}.html">${h.nama.replace(/^\d+-/, '').replace(/-/g, ' ')}</a> <small>(${h.url})</small></li>`).join('\n')}
</ol>
</body></html>`
  fs.writeFileSync(path.join(keluar, 'index.html'), indeks, 'utf8')

  console.log(`\n[OK] ${jumlah} halaman diekspor ke ${keluar}`)
  console.log('Buka docs/tangkapan-layar/index.html untuk melihat daftarnya.')

  server.close()
  closeDb()
  process.exit(0)
}

utama().catch(err => {
  logger.error({ err }, 'Gagal mengekspor tangkapan layar')
  process.exit(1)
})
