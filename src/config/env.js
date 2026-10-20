import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT_DIR = path.resolve(__dirname, '../..')
export const DATA_DIR = path.join(ROOT_DIR, 'data')
// DB_PATH dapat diarahkan ke berkas lain via SILAPURWA_DB (dipakai pengujian
// agar tidak mengotori basis data operasional).
export const DB_PATH = process.env.SILAPURWA_DB || path.join(DATA_DIR, 'silapurwa.db')
export const AUTH_DIR = path.join(ROOT_DIR, 'auth_info')
export const REPORT_DIR = path.join(DATA_DIR, 'laporan')

export const PORT = Number.parseInt(process.env.PORT || '3000', 10)
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_silapurwa_fallback'
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
export const KANAL_AKTIF = process.env.KANAL_AKTIF || 'simulasi'
export const WA_PAIRING_NUMBER = (process.env.WA_PAIRING_NUMBER || '').replace(/[^0-9]/g, '')
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
