import { ikon } from '../util/ikon.js'

/**
 * Menyediakan data umum untuk seluruh view: pengguna yang sedang masuk,
 * jalur aktif (untuk menandai menu), dan helper ikon SVG.
 */
export function wajibMasuk(req, res, next) {
  if (req.session && req.session.user) {
    return next()
  }
  return res.redirect('/auth/masuk')
}

export function teruskanUserKeView(req, res, next) {
  res.locals.user = req.session ? req.session.user : null
  res.locals.path = req.path
  res.locals.ikon = ikon
  next()
}
