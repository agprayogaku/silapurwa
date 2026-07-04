/**
 * SILAPURWA — Input Sanitizer
 * Membersihkan input dari pengguna sebelum diproses ke log atau tampilan web.
 */

/**
 * Menghapus karakter kontrol tersembunyi (null byte, karakter non-printable)
 * dan memotong panjang string agar tidak membebani log.
 *
 * @param {string} input - Teks mentah dari pesan WhatsApp pengguna
 * @param {number} maxLength - Panjang maksimal karakter (default: 500)
 * @returns {string} Teks yang sudah dibersihkan
 */
const sanitizeInput = (input, maxLength = 500) => {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // hapus karakter kontrol
    .replace(/</g, '&lt;')   // cegah HTML injection di tampilan EJS
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, maxLength);    // batasi panjang maksimal
};

/**
 * Membersihkan input khusus untuk disimpan ke file JSON log.
 * Tidak mengubah < dan > karena tidak ditampilkan di HTML,
 * tetapi tetap menghapus karakter kontrol dan membatasi panjang.
 *
 * @param {string} input - Teks mentah
 * @param {number} maxLength - Panjang maksimal karakter (default: 500)
 * @returns {string} Teks yang aman untuk disimpan ke JSON
 */
const sanitizeForLog = (input, maxLength = 500) => {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // hapus karakter kontrol
    .trim()
    .slice(0, maxLength);
};

module.exports = { sanitizeInput, sanitizeForLog };
