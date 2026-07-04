const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getFaqPage,
  createFaq,
  updateFaq,
  deleteFaq,
  getLayananPage,
  updateJadwal,
  getAuditLogPage
} = require('../controllers/adminController');

// Rute Tampilan Manajemen Layanan
router.get('/layanan', getLayananPage);

// Rute Aksi Pembaruan Data
router.post('/layanan/update-jadwal', updateJadwal);

// Jalur Navigasi Tampilan
router.get('/', getDashboard);
router.get('/faq', getFaqPage);

// Jalur Operasi Aksi CRUD Data
router.post('/faq/create', createFaq);
router.post('/faq/update/:id', updateFaq);
router.post('/faq/delete/:id', deleteFaq);

// Jalur Log Audit
router.get('/audit-log', getAuditLogPage);

module.exports = router;
