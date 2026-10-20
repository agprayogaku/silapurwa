import { getDb } from './koneksi.js'

export function getPengaturan(kunci, nilaiBawaan = '') {
  const db = getDb()
  const row = db.prepare('SELECT nilai FROM pengaturan WHERE kunci = ?').get(kunci)
  return row ? row.nilai : nilaiBawaan
}

export function getAllPengaturan() {
  const db = getDb()
  return db.prepare('SELECT kunci, nilai, tipe, keterangan FROM pengaturan').all()
}

export function updatePengaturan(kunci, nilai) {
  const db = getDb()
  return db.prepare(`
    UPDATE pengaturan
    SET nilai = ?, diubah_pada = datetime('now','localtime')
    WHERE kunci = ?
  `).run(String(nilai), kunci)
}

export function getKontakUtama() {
  const db = getDb()
  return db.prepare('SELECT nama_unit, nomor, jam_layanan FROM kontak WHERE unit = ? AND aktif = 1').get('umum')
}

export function getAllKontak() {
  const db = getDb()
  return db.prepare('SELECT * FROM kontak ORDER BY id ASC').all()
}

export function cekPembatasan(teks) {
  const db = getDb()
  const daftar = db.prepare(`
    SELECT pola, jenis, kategori_alasan, keterangan
    FROM pembatasan
    WHERE aktif = 1 AND jenis = 'tolak_topik'
  `).all()

  for (const item of daftar) {
    try {
      const reg = new RegExp(item.pola, 'i')
      if (reg.test(teks)) {
        return item
      }
    } catch {
      // Abaikan pola regex yang tidak valid
    }
  }
  return null
}

export function cariFts(kataTeks, limit = 5) {
  const db = getDb()
  // FTS5 MATCH format: gabungkan kata dengan OR agar tidak kaku
  return db.prepare(`
    SELECT d.faq_id,
           f.kode,
           f.pertanyaan_contoh,
           f.jawaban,
           f.jawaban_bot_tercetak,
           f.prioritas,
           d.teks AS doc_teks,
           bm25(kb_fts) AS skor_raw
    FROM kb_fts
    JOIN kb_dok d ON d.id = kb_fts.rowid
    JOIN faq    f ON f.id = d.faq_id
    WHERE kb_fts MATCH ?
      AND f.status = 'publish'
      AND (f.berlaku_sampai IS NULL OR f.berlaku_sampai >= date('now'))
    ORDER BY skor_raw ASC
    LIMIT ?
  `).all(kataTeks, limit)
}

export function cariKeyword(tokens, limit = 5) {
  if (!tokens || tokens.length === 0) return []
  const db = getDb()
  const placeholders = tokens.map(() => '?').join(',')

  return db.prepare(`
    SELECT k.faq_id,
           f.kode,
           f.pertanyaan_contoh,
           f.jawaban,
           f.jawaban_bot_tercetak,
           f.prioritas,
           (SELECT teks FROM kb_dok WHERE faq_id = k.faq_id LIMIT 1) AS doc_teks,
           SUM(k.bobot) AS total_bobot
    FROM faq_keyword k
    JOIN faq f ON f.id = k.faq_id
    WHERE k.kata IN (${placeholders})
      AND f.status = 'publish'
      AND (f.berlaku_sampai IS NULL OR f.berlaku_sampai >= date('now'))
    GROUP BY k.faq_id
    ORDER BY total_bobot DESC
    LIMIT ?
  `).all(...tokens, limit)
}

export function getFaqById(id) {
  const db = getDb()
  return db.prepare('SELECT * FROM faq WHERE id = ?').get(id)
}

export function getAllFaq() {
  const db = getDb()
  return db.prepare(`
    SELECT f.*, k.nama AS nama_kategori
    FROM faq f
    JOIN kategori k ON k.id = f.kategori_id
    ORDER BY f.kategori_id ASC, f.id ASC
  `).all()
}

export function reindexFaq(faqId) {
  const db = getDb()
  const faq = db.prepare('SELECT * FROM faq WHERE id = ?').get(faqId)
  if (!faq) return

  // Hapus indeks lama
  db.prepare('DELETE FROM kb_dok WHERE faq_id = ?').run(faqId)

  // Hanya indeks jika status publish
  if (faq.status === 'publish') {
    const varian = db.prepare('SELECT teks FROM faq_varian WHERE faq_id = ?').all(faqId).map(v => v.teks).join(' ')
    const keyword = db.prepare('SELECT kata FROM faq_keyword WHERE faq_id = ?').all(faqId).map(k => k.kata).join(' ')
    const teksGabung = `${faq.pertanyaan_contoh} ${varian} ${keyword}`.toLowerCase()

    db.prepare('INSERT INTO kb_dok (faq_id, teks) VALUES (?, ?)').run(faqId, teksGabung)
  }
}

export function upsertPercakapan(waHash, kanal = 'baileys') {
  const db = getDb()
  let row = db.prepare('SELECT * FROM percakapan WHERE wa_hash = ?').get(waHash)
  if (!row) {
    db.prepare(`
      INSERT INTO percakapan (wa_hash, kanal, mulai, terakhir, jumlah_pesan)
      VALUES (?, ?, datetime('now','localtime'), datetime('now','localtime'), 1)
    `).run(waHash, kanal)
    row = db.prepare('SELECT * FROM percakapan WHERE wa_hash = ?').get(waHash)
  } else {
    db.prepare(`
      UPDATE percakapan
      SET terakhir = datetime('now','localtime'),
          jumlah_pesan = jumlah_pesan + 1
      WHERE id = ?
    `).run(row.id)
  }
  return row
}

export function insertPesan({ percakapanId, arah, isiTeks, faqId = null, skor = null, jenisBalasan, sumberJawaban = 'tercetak' }) {
  const db = getDb()
  return db.prepare(`
    INSERT INTO pesan (
      percakapan_id, arah, isi_teks, faq_id, skor, jenis_balasan,
      sumber_jawaban, ts, kadaluarsa_pada
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'), datetime('now','localtime','+90 days'))
  `).run(percakapanId, arah, isiTeks, faqId, skor, jenisBalasan, sumberJawaban)
}

export function catatTakTerjawab(teksNormal, waHash) {
  const db = getDb()
  const ada = db.prepare('SELECT id, jumlah FROM pertanyaan_tak_terjawab WHERE teks_normal = ?').get(teksNormal)
  if (ada) {
    db.prepare(`
      UPDATE pertanyaan_tak_terjawab
      SET jumlah = jumlah + 1, terakhir = datetime('now','localtime')
      WHERE id = ?
    `).run(ada.id)
  } else {
    db.prepare(`
      INSERT INTO pertanyaan_tak_terjawab (teks_normal, wa_hash, jumlah, terakhir)
      VALUES (?, ?, 1, datetime('now','localtime'))
    `).run(teksNormal, waHash)
  }
}

export function buatEskalasi({ percakapanId, topik, alasan }) {
  const db = getDb()
  return db.prepare(`
    INSERT INTO eskalasi (percakapan_id, topik, alasan, status, dibuat)
    VALUES (?, ?, ?, 'baru', datetime('now','localtime'))
  `).run(percakapanId, topik, alasan)
}

export function catatAudit({ aktor, aksi, entitas, entitasId, nilaiLama = null, nilaiBaru = null, ip = null }) {
  const db = getDb()
  return db.prepare(`
    INSERT INTO audit_log (aktor, aksi, entitas, entitas_id, nilai_lama, nilai_baru, ip, ts)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
  `).run(aktor, aksi, entitas, String(entitasId), nilaiLama, nilaiBaru, ip)
}

export function cekDanTambahKuotaHarian(model, maksHarian = 500) {
  const db = getDb()
  const tgl = new Date().toISOString().slice(0, 10)

  let row = db.prepare('SELECT * FROM ai_kuota_harian WHERE tanggal = ? AND model = ?').get(tgl, model)
  if (!row) {
    db.prepare(`
      INSERT INTO ai_kuota_harian (tanggal, model, jumlah_permintaan, tokens_total, jumlah_429)
      VALUES (?, ?, 0, 0, 0)
    `).run(tgl, model)
    row = { tanggal: tgl, model, jumlah_permintaan: 0, tokens_total: 0, jumlah_429: 0 }
  }

  if (row.jumlah_permintaan >= maksHarian) {
    return { boleh: false, sisa: 0, terpakai: row.jumlah_permintaan }
  }

  return { boleh: true, sisa: maksHarian - row.jumlah_permintaan, terpakai: row.jumlah_permintaan }
}

export function tambahPenggunaanKuota(model, tokensMasuk = 0, tokensKeluar = 0) {
  const db = getDb()
  const tgl = new Date().toISOString().slice(0, 10)
  const totalTokens = (tokensMasuk || 0) + (tokensKeluar || 0)

  db.prepare(`
    INSERT INTO ai_kuota_harian (tanggal, model, jumlah_permintaan, tokens_total, jumlah_429)
    VALUES (?, ?, 1, ?, 0)
    ON CONFLICT(tanggal, model) DO UPDATE SET
      jumlah_permintaan = jumlah_permintaan + 1,
      tokens_total = tokens_total + excluded.tokens_total
  `).run(tgl, model, totalTokens)
}

export function tambahHitungan429(model) {
  const db = getDb()
  const tgl = new Date().toISOString().slice(0, 10)

  db.prepare(`
    INSERT INTO ai_kuota_harian (tanggal, model, jumlah_permintaan, tokens_total, jumlah_429)
    VALUES (?, ?, 0, 0, 1)
    ON CONFLICT(tanggal, model) DO UPDATE SET
      jumlah_429 = jumlah_429 + 1
  `).run(tgl, model)
}

export function catatAiInteraksi({
  pesanId = null,
  model,
  tahap,
  tokensMasuk = 0,
  tokensKeluar = 0,
  latensiMs = 0,
  status,
  kodeError = null,
  jawabanMentah = null,
  konteksFaqIds = '[]'
}) {
  const db = getDb()
  return db.prepare(`
    INSERT INTO ai_interaksi (
      pesan_id, model, tahap, tokens_masuk, tokens_keluar,
      latensi_ms, status, kode_error, jawaban_mentah, konteks_faq_ids, ts
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
  `).run(
    pesanId,
    model,
    tahap,
    tokensMasuk,
    tokensKeluar,
    latensiMs,
    status,
    kodeError,
    jawabanMentah,
    typeof konteksFaqIds === 'string' ? konteksFaqIds : JSON.stringify(konteksFaqIds)
  )
}

export function getCacheJawaban(kunciHash) {
  const db = getDb()
  return db.prepare(`
    SELECT * FROM cache_jawaban
    WHERE kunci_hash = ? AND (kedaluwarsa IS NULL OR kedaluwarsa > datetime('now','localtime'))
  `).get(kunciHash)
}

export function setCacheJawaban(kunciHash, faqId, jawaban, jamKedaluwarsa = 24) {
  const db = getDb()
  return db.prepare(`
    INSERT OR REPLACE INTO cache_jawaban (kunci_hash, faq_id, jawaban, dibuat, kedaluwarsa)
    VALUES (?, ?, ?, datetime('now','localtime'), datetime('now','localtime', '+' || ? || ' hours'))
  `).run(kunciHash, faqId, jawaban, jamKedaluwarsa)
}

