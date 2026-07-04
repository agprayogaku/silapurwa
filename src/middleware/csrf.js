const crypto = require('crypto');

// Simpan token CSRF di memori server (cukup untuk single-instance)
let csrfToken = crypto.randomBytes(32).toString('hex');

/**
 * Regenerasi token secara berkala setiap 2 jam
 * agar token tidak berlaku selamanya jika bocor
 */
setInterval(() => {
  csrfToken = crypto.randomBytes(32).toString('hex');
  console.log('[ CSRF ] Token CSRF diperbarui.');
}, 2 * 60 * 60 * 1000); // 2 jam

/**
 * Middleware: Sertakan token CSRF ke setiap response (via res.locals)
 * agar bisa diakses di template EJS sebagai <%= csrfToken %>
 */
const attachCsrfToken = (req, res, next) => {
  res.locals.csrfToken = csrfToken;
  next();
};

/**
 * Middleware: Validasi token CSRF dari setiap request POST
 * Tolak dengan 403 jika token tidak cocok atau tidak ada
 */
const verifyCsrfToken = (req, res, next) => {
  if (req.method !== 'POST') return next(); // hanya periksa POST

  const tokenFromForm = req.body._csrf;

  if (!tokenFromForm || tokenFromForm !== csrfToken) {
    console.warn(`[ CSRF ] Permintaan ditolak — token tidak valid dari ${req.ip}`);
    return res.status(403).send('Permintaan ditolak: token keamanan tidak valid atau kedaluwarsa. Silakan muat ulang halaman dan coba lagi.');
  }

  next();
};

module.exports = { attachCsrfToken, verifyCsrfToken };
