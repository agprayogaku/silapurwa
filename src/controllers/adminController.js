const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto'); // built-in Node.js, tidak perlu install
const { invalidateCache } = require('../utils/templates');
const { sanitizeInput } = require('../utils/sanitizer');

const faqPath = path.join(__dirname, '../../data/faq.json');
const layananPath = path.join(__dirname, '../../data/layanan.json');
const jadwalPath = path.join(__dirname, '../../data/jadwal.json');
const auditLogPath = path.join(__dirname, '../../data/audit_log.json');

// ====================================================================
// HELPERS
// ====================================================================

const readFaqData = () => JSON.parse(fs.readFileSync(faqPath, 'utf-8'));
const writeFaqData = (data) => fs.writeFileSync(faqPath, JSON.stringify(data, null, 2), 'utf-8');

const writeAuditLog = (aksi, detail) => {
  let logs = [];
  try { logs = JSON.parse(fs.readFileSync(auditLogPath, 'utf-8')); } catch { logs = []; }

  logs.push({
    waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    aksi,
    detail
  });

  if (logs.length > 1000) logs.shift();
  fs.writeFileSync(auditLogPath, JSON.stringify(logs, null, 2), 'utf-8');
};

// ====================================================================
// DASHBOARD
// ====================================================================

const getDashboard = (req, res) => {
  try {
    const faq = readFaqData();
    const layanan = JSON.parse(fs.readFileSync(layananPath, 'utf-8'));
    const logs = global.chatLogs || [];
    const sessions = global.activeSessions || {};
    const totalSesiAdmin = Object.keys(sessions).filter(key => sessions[key].isReporting).length;

    // Baca 10 entri audit log terbaru untuk ditampilkan di dashboard
    let auditLogs = [];
    try {
      const semua = JSON.parse(fs.readFileSync(auditLogPath, 'utf-8'));
      auditLogs = semua.slice(-10).reverse(); // 10 terbaru, urutan terbaru di atas
    } catch { auditLogs = []; }

    res.render('dashboard', {
      title: 'Dashboard SILAPURWA',
      totalFaq: faq.length,
      totalLarangan: layanan.penitipan_barang.larangan.length,
      logs,
      totalSesiAdmin,
      auditLogs  // ← tambahan
    });
  } catch (error) {
    res.status(500).send("Error memuat halaman dashboard.");
  }
};

// ====================================================================
// FAQ CRUD
// ====================================================================

const getFaqPage = (req, res) => {
  try {
    const faq = readFaqData();
    res.render('manage-faq', { title: 'Kelola FAQ', faq });
  } catch (error) {
    res.status(500).send("Error memuat data FAQ.");
  }
};

const createFaq = (req, res) => {
  try {
    const { pertanyaan, jawaban } = req.body;
    if (!pertanyaan || !jawaban) return res.status(400).send("Pertanyaan dan jawaban wajib diisi.");

    const faq = readFaqData();
    const entryBaru = { id: randomUUID(), pertanyaan: sanitizeInput(pertanyaan), jawaban: sanitizeInput(jawaban, 1000) };
    faq.push(entryBaru);
    writeFaqData(faq);

    writeAuditLog('TAMBAH_FAQ', { pertanyaan: entryBaru.pertanyaan });
    invalidateCache();
    res.redirect('/admin-panel/faq');
  } catch (error) {
    res.status(500).send("Gagal menambahkan FAQ.");
  }
};

const updateFaq = (req, res) => {
  try {
    const { id } = req.params;
    const { pertanyaan, jawaban } = req.body;
    if (!pertanyaan || !jawaban) return res.status(400).send("Pertanyaan dan jawaban wajib diisi.");

    const faq = readFaqData();
    const index = faq.findIndex(item => item.id === id); // cari berdasarkan id, bukan index array
    if (index === -1) return res.status(404).send("Data FAQ tidak ditemukan.");

    faq[index].pertanyaan = sanitizeInput(pertanyaan);
    faq[index].jawaban = sanitizeInput(jawaban, 1000);
    writeFaqData(faq);

    writeAuditLog('UBAH_FAQ', { id, pertanyaan: pertanyaan.trim() });
    invalidateCache();
    res.redirect('/admin-panel/faq');
  } catch (error) {
    res.status(500).send("Gagal memperbarui FAQ.");
  }
};

const deleteFaq = (req, res) => {
  try {
    const { id } = req.params;
    const faq = readFaqData();
    const itemDihapus = faq.find(item => item.id === id);
    if (!itemDihapus) return res.status(404).send("Data FAQ tidak ditemukan.");

    const filtered = faq.filter(item => item.id !== id);
    writeFaqData(filtered);

    writeAuditLog('HAPUS_FAQ', { id, pertanyaan: itemDihapus.pertanyaan });
    invalidateCache();
    res.redirect('/admin-panel/faq');
  } catch (error) {
    res.status(500).send("Gagal menghapus FAQ.");
  }
};

// ====================================================================
// LAYANAN & JADWAL
// ====================================================================

const getLayananPage = (req, res) => {
  try {
    const jadwal = JSON.parse(fs.readFileSync(jadwalPath, 'utf-8'));
    const layanan = JSON.parse(fs.readFileSync(layananPath, 'utf-8'));
    res.render('manage-layanan', { title: 'Kelola Layanan', jadwal, layanan });
  } catch (error) {
    res.status(500).send("Error memuat data layanan.");
  }
};

const updateJadwal = (req, res) => {
  try {
    const {
      tahanan_sesi_1, tahanan_sesi_2,
      narapidana_sesi_1, narapidana_sesi_2,
      sabtu_tahanan, sabtu_napi,
      titipan_non_makanan, titipan_uang
    } = req.body;

    const dataJadwal = {
      jadwal_kunjungan: {
        tahanan: { sesi_1: tahanan_sesi_1.trim(), sesi_2: tahanan_sesi_2.trim() },
        narapidana: { sesi_1: narapidana_sesi_1.trim(), sesi_2: narapidana_sesi_2.trim() },
        khusus_sabtu: { tahanan: sabtu_tahanan.trim(), narapidana: sabtu_napi.trim() }
      },
      titipan_non_makanan: titipan_non_makanan.trim(),
      titipan_uang: titipan_uang.trim()
    };

    fs.writeFileSync(jadwalPath, JSON.stringify(dataJadwal, null, 2), 'utf-8');
    writeAuditLog('UBAH_JADWAL', { oleh: 'Admin Panel' });
    invalidateCache();
    res.redirect('/admin-panel/layanan');
  } catch (error) {
    res.status(500).send("Gagal memperbarui data jadwal.");
  }
};

// Halaman Audit Log
const getAuditLogPage = (req, res) => {
  try {
    let auditLogs = [];
    try {
      auditLogs = JSON.parse(fs.readFileSync(auditLogPath, 'utf-8'));
      auditLogs = auditLogs.reverse(); // terbaru di atas
    } catch { auditLogs = []; }

    res.render('audit-log', { title: 'Riwayat Aktivitas Admin', auditLogs });
  } catch (error) {
    res.status(500).send("Error memuat halaman audit log.");
  }
};

module.exports = {
  getDashboard,
  getFaqPage,
  createFaq,
  updateFaq,
  deleteFaq,
  getLayananPage,
  updateJadwal,
  getAuditLogPage
};
