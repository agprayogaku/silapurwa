import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import session from 'express-session'
import { SESSION_SECRET } from '../config/env.js'
import { wajibMasuk, teruskanUserKeView } from './middleware/auth.js'

import authRouter from './routes/auth.js'
import dashboardRouter from './routes/dashboard.js'
import faqRouter from './routes/faq.js'
import pengaturanRouter from './routes/pengaturan.js'
import eskalasiRouter from './routes/eskalasi.js'
import simulatorRouter from './routes/simulator.js'
import whatsappRouter from './routes/whatsapp.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function buatAplikasiAdmin() {
  const app = express()

  // Pengaturan View Engine EJS
  app.set('view engine', 'ejs')
  app.set('views', path.join(__dirname, 'views'))

  // Middleware Parser
  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())

  // Middleware Sesi
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000 // 8 jam
    }
  }))

  app.use(teruskanUserKeView)

  // Health check endpoint (publik)
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'silapurwa',
      waktu: new Date().toISOString()
    })
  })

  // Rute Autentikasi
  app.use('/auth', authRouter)

  // Rute Terlindungi
  app.use('/', wajibMasuk, dashboardRouter)
  app.use('/faq', wajibMasuk, faqRouter)
  app.use('/pengaturan', wajibMasuk, pengaturanRouter)
  app.use('/eskalasi', wajibMasuk, eskalasiRouter)
  app.use('/simulator', wajibMasuk, simulatorRouter)
  app.use('/whatsapp', wajibMasuk, whatsappRouter)

  return app
}
