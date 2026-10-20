import { getDb, closeDb } from '../src/db/koneksi.js'

/**
 * Memindai basis data untuk menemukan sisa nilai [VERIFIKASI] yang belum
 * dikonfirmasi ke petugas instansi. Dijalankan sebelum demo/penilaian
 * agar tidak ada data placeholder yang terkirim ke masyarakat.
 *
 * Catatan: sejak seed dinetralkan, basis data baru memang KOSONG (tanpa FAQ).
 * Hasil "BELUM SIAP" pada instalasi bersih adalah kondisi yang diharapkan
 * sampai operator mengisi FAQ lewat panel admin.
 */
function skan() {
  const db = getDb()
  const temuan = []

  // 1. Kolom teks pada tabel kontak & pengaturan
  const tabelKolom = [
    { tabel: 'kontak', kolom: ['nama_unit', 'nomor', 'jam_layanan', 'keterangan'], label: 'n' },
    { tabel: 'pengaturan', kolom: ['nilai'], label: 'kunci' }
  ]

  for (const t of tabelKolom) {
    const baris = db.prepare(`SELECT * FROM ${t.tabel}`).all()
    for (const r of baris) {
      for (const k of t.kolom) {
        const nilai = r[k]
        if (typeof nilai === 'string' && nilai.includes('[VERIFIKASI]')) {
          temuan.push({
            tabel: t.tabel,
            id: r[t.label] || r.id,
            kolom: k,
            nilai: nilai.slice(0, 70)
          })
        }
      }
    }
  }

  // 2. FAQ yang belum di-publish (masih kerangka)
  const faqDraft = db.prepare(`
    SELECT kode, pertanyaan_contoh, jawaban, status
    FROM faq
    WHERE status != 'publish'
    ORDER BY kode ASC
  `).all()

  console.log('================================================================')
  console.log('  AUDIT KESIAPAN DATA SILAPURWA — PRA-DEMO')
  console.log('================================================================\n')

  if (temuan.length === 0) {
    console.log('[OK] Tidak ada sisa nilai [VERIFIKASI] pada kontak & pengaturan.\n')
  } else {
    console.log(`[PERHATIAN] Ditemukan ${temuan.length} nilai [VERIFIKASI] yang belum dikonfirmasi:\n`)
    for (const t of temuan) {
      console.log(`  - ${t.tabel} (${t.id}).${t.kolom} = ${t.nilai}`)
    }
    console.log('')
  }

  const faqSiap = db.prepare("SELECT COUNT(*) n FROM faq WHERE status = 'publish'").get().n
  const faqTotal = db.prepare('SELECT COUNT(*) n FROM faq').get().n

  console.log(`FAQ terbit (publish): ${faqSiap} dari ${faqTotal} total.`)
  console.log(`FAQ belum terbit  : ${faqDraft.length}\n`)

  if (faqTotal === 0) {
    console.log('Catatan: basis data FAQ masih KOSONG (kondisi default/netral).')
    console.log('Tambahkan FAQ melalui panel admin (/faq) lalu ubah status ke Terbit.\n')
  }

  if (faqDraft.length > 0) {
    console.log('Daftar FAQ yang masih DRAFT/REVIEW (belum boleh dijawab bot):')
    for (const f of faqDraft) {
      console.log(`  [${f.status.toUpperCase()}] ${f.kode} — ${f.pertanyaan_contoh}`)
    }
    console.log('')
  }

  // 3. Rekomendasi kesiapan
  const siap = temuan.length === 0 && faqSiap >= 10
  console.log('----------------------------------------------------------------')
  if (siap) {
    console.log('KESIMPULAN: Sistem SIAP untuk demo publik.')
  } else {
    console.log('KESIMPULAN: BELUM SIAP. Lengkapi item di atas sebelum demo.')
    console.log('Gunakan panel admin (/pengaturan dan /faq) atau berkas')
    console.log('docs/lembar-verifikasi-data.md untuk konfirmasi ke petugas.')
  }
  console.log('----------------------------------------------------------------')

  closeDb()
  process.exit(siap ? 0 : 1)
}

skan()
