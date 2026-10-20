-- =====================================================================
-- SILAPURWA — Skema Basis Data
-- Mesin: node:sqlite (SQLite 3.53.0) — TANPA dependensi native
-- Status: SUDAH DIUJI pada Node v24.16.0 (33 objek terbentuk valid)
--         22 tabel + 1 tabel virtual FTS5 + 8 indeks + 3 trigger
-- =====================================================================

-- ---------- PRAGMA (wajib, urutan penting) ----------
PRAGMA journal_mode = WAL;          -- aman & cepat di HDD
PRAGMA synchronous = NORMAL;        -- kurangi fsync pada HDD
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA temp_store = MEMORY;
-- OPSIONAL, hanya boleh dijalankan SEBELUM tabel dibuat:
-- PRAGMA auto_vacuum = FULL;       -- hindari kebutuhan VACUUM berkala

-- =====================================================================
-- A. DIMENSI: KATEGORI & KONTAK
-- =====================================================================
CREATE TABLE kategori (
  id      INTEGER PRIMARY KEY,
  slug    TEXT NOT NULL UNIQUE,
  nama    TEXT NOT NULL,
  urutan  INTEGER NOT NULL DEFAULT 0,
  aktif   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE kontak (
  id          INTEGER PRIMARY KEY,
  unit        TEXT NOT NULL,
  nama_unit   TEXT NOT NULL,
  nomor       TEXT,
  jam_layanan TEXT,
  keterangan  TEXT,
  aktif       INTEGER NOT NULL DEFAULT 1
);

-- =====================================================================
-- B. INTI: BASIS PENGETAHUAN YANG TERSARING
-- =====================================================================
CREATE TABLE faq (
  id                    INTEGER PRIMARY KEY,
  kode                  TEXT UNIQUE,              -- 'KNJ-01'
  kategori_id           INTEGER NOT NULL REFERENCES kategori(id),
  pertanyaan_contoh     TEXT NOT NULL,            -- bahan pencocokan, BUKAN yang dikirim
  jawaban               TEXT NOT NULL,            -- teks resmi final (sumber fakta)
  jawaban_bot_tercetak  TEXT,                     -- versi gaya lansia, pra-render saat publish
  jawaban_tercetak_pada TEXT,
  prioritas             INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','review','publish','arsip')),
  berlaku_dari          TEXT,
  berlaku_sampai        TEXT,                     -- kadaluarsa otomatis
  sumber                TEXT,                     -- SK / SE / arahan penanggung jawab
  versi                 INTEGER NOT NULL DEFAULT 1,
  diverifikasi_oleh     TEXT,
  diverifikasi_pada     TEXT,
  diubah_oleh           TEXT,
  diubah_pada           TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE faq_varian (
  id     INTEGER PRIMARY KEY,
  faq_id INTEGER NOT NULL REFERENCES faq(id) ON DELETE CASCADE,
  teks   TEXT NOT NULL
);

CREATE TABLE faq_keyword (
  id     INTEGER PRIMARY KEY,
  faq_id INTEGER NOT NULL REFERENCES faq(id) ON DELETE CASCADE,
  kata   TEXT NOT NULL,
  bobot  REAL NOT NULL DEFAULT 1.0
);

-- ---------- Indeks pencarian teks penuh (FTS5) ----------
CREATE TABLE kb_dok (
  id     INTEGER PRIMARY KEY,
  faq_id INTEGER NOT NULL REFERENCES faq(id) ON DELETE CASCADE,
  teks   TEXT NOT NULL
);

CREATE VIRTUAL TABLE kb_fts USING fts5(
  teks,
  content='kb_dok',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

CREATE TRIGGER kb_dok_ai AFTER INSERT ON kb_dok BEGIN
  INSERT INTO kb_fts(rowid, teks) VALUES (new.id, new.teks);
END;

CREATE TRIGGER kb_dok_ad AFTER DELETE ON kb_dok BEGIN
  INSERT INTO kb_fts(kb_fts, rowid, teks) VALUES('delete', old.id, old.teks);
END;

CREATE TRIGGER kb_dok_au AFTER UPDATE ON kb_dok BEGIN
  INSERT INTO kb_fts(kb_fts, rowid, teks) VALUES('delete', old.id, old.teks);
  INSERT INTO kb_fts(rowid, teks) VALUES (new.id, new.teks);
END;

-- =====================================================================
-- C. PAGAR PRIVASI & KONFIGURASI
-- =====================================================================
CREATE TABLE pembatasan (
  id              INTEGER PRIMARY KEY,
  pola            TEXT NOT NULL,                  -- regex/keyword
  jenis           TEXT NOT NULL CHECK (jenis IN ('tolak_topik','rate_limit')),
  kategori_alasan TEXT,
  keterangan      TEXT,
  aktif           INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE pengaturan (
  kunci       TEXT PRIMARY KEY,
  nilai       TEXT NOT NULL,
  tipe        TEXT NOT NULL DEFAULT 'string',     -- string|number|bool|json
  keterangan  TEXT,
  diubah_pada TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- =====================================================================
-- D. OPERASIONAL: PERCAKAPAN, PESAN, ESKALASI
-- =====================================================================
CREATE TABLE percakapan (
  id           INTEGER PRIMARY KEY,
  wa_hash      TEXT NOT NULL,                     -- hash nomor, bukan nomor asli
  kanal        TEXT NOT NULL DEFAULT 'baileys',
  mulai        TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  terakhir     TEXT,
  jumlah_pesan INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE pesan (
  id              INTEGER PRIMARY KEY,
  percakapan_id   INTEGER NOT NULL REFERENCES percakapan(id) ON DELETE CASCADE,
  arah            TEXT NOT NULL CHECK (arah IN ('masuk','keluar')),
  isi_teks        TEXT,
  faq_id          INTEGER REFERENCES faq(id),
  skor            REAL,
  jenis_balasan   TEXT CHECK (jenis_balasan IN
                  ('faq','klarifikasi','tolak','eskalasi','sapaan','luar_scope')),
  sumber_jawaban  TEXT CHECK (sumber_jawaban IN ('tercetak','ai','template')),
  ts              TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  kadaluarsa_pada TEXT                            -- retensi otomatis (90 hari)
);

CREATE TABLE pertanyaan_tak_terjawab (
  id               INTEGER PRIMARY KEY,
  teks_normal      TEXT NOT NULL,
  wa_hash          TEXT,
  jumlah           INTEGER NOT NULL DEFAULT 1,
  terakhir         TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  sudah_dibuat_faq INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE eskalasi (
  id             INTEGER PRIMARY KEY,
  percakapan_id  INTEGER NOT NULL REFERENCES percakapan(id) ON DELETE CASCADE,
  topik          TEXT,
  alasan         TEXT,
  status         TEXT NOT NULL DEFAULT 'baru'
                 CHECK (status IN ('baru','diproses','selesai','batal')),
  ditangani_oleh TEXT,
  catatan        TEXT,
  dibuat         TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  ditutup        TEXT
);

-- =====================================================================
-- E. KEAMANAN PANEL ADMIN
-- =====================================================================
CREATE TABLE admin_user (
  id              INTEGER PRIMARY KEY,
  username        TEXT NOT NULL UNIQUE,
  nama            TEXT NOT NULL,
  peran           TEXT NOT NULL DEFAULT 'operator'
                  CHECK (peran IN ('admin','verifikator','operator')),
  password_hash   TEXT NOT NULL,                  -- bcryptjs (pure JS)
  aktif           INTEGER NOT NULL DEFAULT 1,
  gagal_login     INTEGER NOT NULL DEFAULT 0,
  terkunci_hingga TEXT,
  terakhir_login  TEXT
);

CREATE TABLE audit_log (
  id         INTEGER PRIMARY KEY,
  aktor      TEXT NOT NULL,
  aksi       TEXT NOT NULL,
  entitas    TEXT NOT NULL,
  entitas_id TEXT,
  nilai_lama TEXT,
  nilai_baru TEXT,
  ip         TEXT,
  ts         TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- =====================================================================
-- F. LAPISAN AI: JEJAK, KUOTA, TEMPELAN JAWABAN
-- =====================================================================
CREATE TABLE ai_interaksi (
  id              INTEGER PRIMARY KEY,
  pesan_id        INTEGER REFERENCES pesan(id) ON DELETE SET NULL,
  model           TEXT NOT NULL,
  tahap           TEXT NOT NULL CHECK (tahap IN ('cetak','runtime','klarifikasi')),
  tokens_masuk    INTEGER,
  tokens_keluar   INTEGER,
  latensi_ms      INTEGER,
  status          TEXT NOT NULL CHECK (status IN ('ok','429','error','diblok_filter')),
  kode_error      TEXT,
  jawaban_mentah  TEXT,
  konteks_faq_ids TEXT,                           -- JSON array id FAQ yang dikirim
  ts              TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE ai_kuota_harian (
  tanggal           TEXT NOT NULL,
  model             TEXT NOT NULL,
  jumlah_permintaan INTEGER NOT NULL DEFAULT 0,
  tokens_total      INTEGER NOT NULL DEFAULT 0,
  jumlah_429        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tanggal, model)
);

CREATE TABLE cache_jawaban (
  kunci_hash  TEXT PRIMARY KEY,                   -- sha256(teks_normal + faq_id)
  faq_id      INTEGER REFERENCES faq(id) ON DELETE CASCADE,
  jawaban     TEXT NOT NULL,
  dibuat      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  kedaluwarsa TEXT
);

-- =====================================================================
-- G. INDEKS
-- =====================================================================
CREATE INDEX idx_faq_status       ON faq(status, berlaku_sampai);
CREATE INDEX idx_faq_kategori     ON faq(kategori_id);
CREATE INDEX idx_varian_faq       ON faq_varian(faq_id);
CREATE INDEX idx_keyword_kata     ON faq_keyword(kata);
CREATE INDEX idx_pesan_percakapan ON pesan(percakapan_id, ts);
CREATE INDEX idx_pesan_faq        ON pesan(faq_id);
CREATE INDEX idx_percakapan_hash  ON percakapan(wa_hash, terakhir);
CREATE INDEX idx_tak_terjawab     ON pertanyaan_tak_terjawab(sudah_dibuat_faq, jumlah DESC);
CREATE INDEX idx_eskalasi_status  ON eskalasi(status, dibuat);
CREATE INDEX idx_audit_ts         ON audit_log(ts);
CREATE INDEX idx_ai_ts            ON ai_interaksi(ts, status);