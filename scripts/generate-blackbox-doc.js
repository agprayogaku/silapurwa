import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Menghasilkan docs/pengujian-blackbox.md dari hasil uji
 * docs/hasil-blackbox.json (dibuat oleh src/mesin/uji-blackbox.js).
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const berkasJson = path.join(root, 'docs', 'hasil-blackbox.json')
const berkasMd = path.join(root, 'docs', 'pengujian-blackbox.md')

if (!fs.existsSync(berkasJson)) {
  console.error('Berkas hasil-blackbox.json tidak ditemukan. Jalankan: npm run test:blackbox')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(berkasJson, 'utf8'))
const total = data.length
const lulus = data.filter(d => d.status === 'LULUS').length
const persen = ((lulus / total) * 100).toFixed(1)

const kelompok = [...new Set(data.map(d => d.bag))]
const barisKelompok = kelompok.map(b => {
  const subset = data.filter(d => d.bag === b)
  const ok = subset.filter(d => d.status === 'LULUS').length
  return `| ${b} | ${subset.length} | ${ok} | ${((ok / subset.length) * 100).toFixed(0)}% |`
}).join('\n')

const barisTabel = data.map(d =>
  `| ${d.id} | ${d.bag} | ${d.teks.replace(/\|/g, '\\|')} | ${d.jenis} | ${d.kode} | ${d.skor} | ${d.status} |`
).join('\n')

const isi = `# Pengujian Blackbox Silapurwa

Dokumen ini dihasilkan otomatis dari \`src/mesin/uji-blackbox.js\` (berkas mentah:
\`docs/hasil-blackbox.json\`). Metode: **blackbox** — menguji masukan pengguna
terhadap keluaran bot tanpa melihat struktur internal.

## 1. Ringkasan Hasil

- Total skenario: **${total}**
- Lulus: **${lulus}**
- Gagal: **${total - lulus}**
- Tingkat keberhasilan: **${persen}%**

| Kelompok Uji | Jumlah | Lulus | Persentase |
|---|---|---|---|
${barisKelompok}

## 2. Tabel Hasil per Skenario

| ID | Kelompok | Masukan | Jenis Balasan | Kode FAQ | Skor | Status |
|---|---|---|---|---|---|---|
${barisTabel}

## 3. Catatan Metodologi

- Kelompok **Sapaan**: menguji pengenalan salam dan basa-basi.
- Kelompok **FAQ**: menguji jalur cepat (jawaban tercetak, tanpa AI).
- Kelompok **Sinonim**: menguji normalisasi kata (jenguk->besuk, dll.).
- Kelompok **Privasi**: menguji pagar pembatasan data warga binaan (UU PDP).
- Kelompok **Injection**: menguji ketahanan terhadap upaya menjebol aturan
  (prompt injection) — bot harus menolak atau mengeskalasi.
- Kelompok **Di luar cakupan**: memastikan bot tidak mengarang jawaban.
- Kelompok **Mutu**: memastikan gaya bahasa ramah ("Bapak/Ibu") dan tidak
  memuat kata spekulatif.

Pengujian ini dijalankan tanpa API key Gemini aktif, sehingga sekaligus
membuktikan **degradasi aman** (layanan tetap berjalan tanpa AI).

> Perintah: \`npm run test:blackbox\`
`

fs.writeFileSync(berkasMd, isi, 'utf8')
console.log(`Dokumentasi pengujian dibuat: ${berkasMd}`)
