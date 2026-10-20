import fs from 'node:fs'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'
import qrcodeTerminal from 'qrcode-terminal'
import QRCode from 'qrcode'
import pino from 'pino'
import { AUTH_DIR } from '../config/env.js'
import { logger } from '../config/logger.js'
import { prosesPesanMasuk } from '../mesin/pipa.js'
import { getPengaturan, catatAudit } from '../db/kueri.js'

// =====================================================================
//  MANAJER KONEKSI WHATSAPP (BAILEYS)
//  Menyimpan status, QR, dan soket secara terpusat agar dapat dipantau
//  dan dikendalikan dari panel admin web maupun konsol.
// =====================================================================

let socket = null
let sedangMenghubungkan = false
let pairingDiminta = false
let dihentikanSengaja = false
const antreanPesan = new Map() // Menjaga urutan respon per pengirim

const keadaan = {
  status: 'terputus', // terputus | menghubungkan | qr | terhubung | keluar | galat
  qr: null,
  qrDataUrl: null,
  pairingCode: null,
  nomor: null,
  namaPerangkat: null,
  sejak: null,
  pesanTerakhir: null,
  percobaan: 0
}

function ubahKeadaan(patch) {
  Object.assign(keadaan, patch)
  keadaan.sejak = new Date().toISOString()
}

export function getStatus() {
  return {
    status: keadaan.status,
    qr: keadaan.qr,
    qrDataUrl: keadaan.qrDataUrl,
    pairingCode: keadaan.pairingCode,
    nomor: keadaan.nomor,
    namaPerangkat: keadaan.namaPerangkat,
    sejak: keadaan.sejak,
    pesanTerakhir: keadaan.pesanTerakhir,
    percobaan: keadaan.percobaan
  }
}

export function getSocket() {
  return socket
}

function hapusSesi() {
  if (fs.existsSync(AUTH_DIR)) {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true })
  }
}

/**
 * Memulai koneksi WhatsApp.
 * @param {object} [opsi]
 * @param {string} [opsi.pairingNumber] Nomor tujuan (format internasional tanpa +),
 *        mis. "628123456789". Bila diisi, akan dibuat kode pairing 8 digit
 *        sebagai alternatif pemindaian QR.
 */
export async function mulaiBaileys(opsi = {}) {
  if (sedangMenghubungkan) {
    logger.info('Koneksi WhatsApp sedang dalam proses menyambung, permintaan diabaikan.')
    return socket
  }
  if (socket && ['qr', 'terhubung', 'menghubungkan'].includes(keadaan.status)) {
    logger.info({ status: keadaan.status }, 'Koneksi WhatsApp sudah aktif.')
    return socket
  }

  sedangMenghubungkan = true
  dihentikanSengaja = false
  ubahKeadaan({ status: 'menghubungkan', pesanTerakhir: 'Menyiapkan koneksi...' })
  pairingDiminta = false

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true })
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)

    let version
    try {
      const v = await fetchLatestBaileysVersion()
      version = v.version
      logger.info({ version: v.version, isLatest: v.isLatest }, 'Versi WhatsApp Web terdeteksi')
    } catch (err) {
      logger.warn({ err: err.message }, 'Gagal mengambil versi terbaru, memakai versi bawaan Baileys')
    }

    socket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Silapurwa Lapas Purwakarta', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: false
    })

    socket.ev.on('creds.update', saveCreds)

    // Kode pairing (opsional) sebagai alternatif QR
    if (opsi.pairingNumber && !state.creds.registered) {
      const nomorBersih = String(opsi.pairingNumber).replace(/[^0-9]/g, '')
      const mintaKode = async (percobaanKe = 1) => {
        if (pairingDiminta) return
        try {
          const kode = await socket.requestPairingCode(nomorBersih)
          pairingDiminta = true
          ubahKeadaan({
            pairingCode: kode,
            pesanTerakhir: `Kode pairing dibuat untuk ${nomorBersih}. Masukkan di WhatsApp > Perangkat Tertaut > Tautkan dengan nomor telepon.`
          })
          console.log(`\n>> KODE PAIRING WhatsApp: ${kode}`)
          console.log('   Buka WhatsApp > Perangkat Tertaut > Tautkan dengan nomor telepon.\n')
          logger.info({ nomor: nomorBersih, kode }, 'KODE PAIRING WHATSAPP dibuat')
        } catch (err) {
          logger.warn({ err: err.message, percobaanKe }, 'Percobaan membuat kode pairing gagal')
          if (percobaanKe < 4 && !pairingDiminta) {
            setTimeout(() => mintaKode(percobaanKe + 1), 3000)
          } else {
            ubahKeadaan({ pesanTerakhir: 'Gagal membuat kode pairing: ' + err.message })
            logger.error({ err: err.message }, 'Gagal membuat kode pairing setelah beberapa percobaan')
          }
        }
      }
      // Beri jeda singkat agar soket siap, lalu minta kode (dengan percobaan ulang)
      setTimeout(() => mintaKode(1), 2000)
    }

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        ubahKeadaan({
          status: 'qr',
          qr,
          pesanTerakhir: 'Menunggu pemindaian kode QR...'
        })
        try {
          keadaan.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 })
        } catch (err) {
          logger.warn({ err: err.message }, 'Gagal membuat gambar QR untuk web')
        }

        console.log('\n=============================================================')
        console.log('  PINDAI KODE QR BERIKUT DENGAN WHATSAPP PADA PERANGKAT ANDA ')
        console.log('  (WhatsApp > Perangkat Tertaut > Tautkan Perangkat)         ')
        console.log('=============================================================\n')
        qrcodeTerminal.generate(qr, { small: true })
        console.log('\nAtau buka panel admin: http://localhost:3000/whatsapp\n')
      }

      if (connection === 'open') {
        ubahKeadaan({
          status: 'terhubung',
          qr: null,
          qrDataUrl: null,
          pairingCode: null,
          percobaan: 0,
          nomor: socket.user?.id?.split(':')[0] || socket.user?.id || null,
          namaPerangkat: socket.user?.name || null,
          pesanTerakhir: 'WhatsApp berhasil terhubung.'
        })
        logger.info({ nomor: keadaan.nomor }, 'Koneksi WhatsApp Silapurwa BERHASIL TERHUBUNG!')
        catatAudit({
          aktor: 'sistem', aksi: 'wa_terhubung', entitas: 'koneksi',
          entitasId: '1', nilaiBaru: 'terhubung'
        })
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const alasan = lastDisconnect?.error?.message || 'tidak diketahui'
        const loggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401

        logger.warn({ statusCode, alasan, loggedOut }, 'Koneksi WhatsApp terputus')

        catatAudit({
          aktor: 'sistem', aksi: 'wa_terputus', entitas: 'koneksi',
          entitasId: String(statusCode || 0), nilaiLama: 'terhubung',
          nilaiBaru: `terputus (${statusCode})`
        })

        socket = null
        sedangMenghubungkan = false

        if (dihentikanSengaja) {
          dihentikanSengaja = false
          logger.info('Koneksi ditutup atas permintaan operator; sambung ulang otomatis dilewati.')
          return
        }

        if (loggedOut) {
          ubahKeadaan({
            status: 'keluar', qr: null, qrDataUrl: null, pairingCode: null,
            pesanTerakhir: 'Sesi dikeluarkan dari perangkat. Silakan hubungkan ulang.'
          })
          hapusSesi()
          logger.error('Sesi dikeluarkan (loggedOut/401). Sesi lama dibersihkan, QR baru akan dibuat saat menghubungkan ulang.')
        } else {
          const jeda = Math.min(5000 * (keadaan.percobaan + 1), 60000)
          keadaan.percobaan += 1
          ubahKeadaan({
            status: 'terputus',
            pesanTerakhir: `Terputus (${statusCode || '-'}). Menyambung ulang dalam ${Math.round(jeda / 1000)} detik...`
          })
          logger.info({ jeda, percobaan: keadaan.percobaan }, 'Menjadwalkan sambung ulang otomatis...')
          setTimeout(() => { mulaiBaileys(opsi) }, jeda)
        }
      }
    })

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return

      for (const msg of messages) {
        if (msg.key.fromMe) continue
        const from = msg.key.remoteJid
        if (!from || from === 'status@broadcast') continue
        if (from.endsWith('@g.us')) continue

        const teks =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          ''
        if (!teks || !teks.trim()) continue

        const nomorPengirim = from.replace(/@.+/, '')

        const antreanSebelumnya = antreanPesan.get(from) || Promise.resolve()
        const antreanSekarang = antreanSebelumnya.then(async () => {
          try {
            const delayMin = Number.parseInt(getPengaturan('delay_min_ms', '1500'), 10)
            const delayMax = Number.parseInt(getPengaturan('delay_max_ms', '4000'), 10)
            const jeda = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin

            await socket.sendPresenceUpdate('composing', from).catch(() => {})
            await new Promise(r => setTimeout(r, jeda))

            const hasil = await prosesPesanMasuk({
              nomorWa: nomorPengirim,
              teks,
              kanal: 'baileys'
            })

            await socket.sendPresenceUpdate('paused', from).catch(() => {})
            await socket.sendMessage(from, { text: hasil.balasan })

            logger.info({
              pengirim: nomorPengirim, jenis: hasil.jenis, skor: hasil.skor
            }, 'Respon berhasil dikirim via WhatsApp')
          } catch (err) {
            logger.error({ err: err.message, from }, 'Gagal memproses/mengirim pesan WhatsApp')
          }
        })

        antreanPesan.set(from, antreanSekarang.finally(() => {
          if (antreanPesan.get(from) === antreanSekarang) antreanPesan.delete(from)
        }))
      }
    })

    return socket
  } catch (err) {
    sedangMenghubungkan = false
    ubahKeadaan({ status: 'galat', pesanTerakhir: 'Gagal memulai koneksi: ' + err.message })
    logger.error({ err }, 'Gagal memulai Baileys')
    throw err
  } finally {
    sedangMenghubungkan = false
  }
}

/**
 * Memulai koneksi dalam mode kode pairing. Menutup soket lama dan
 * membersihkan sesi agar kode pairing dapat dibuat dengan andal.
 * @param {string} nomor Nomor WhatsApp bot (format 628xxxxxxxxxx).
 */
export async function mulaiBaileysPairing(nomor) {
  const nomorBersih = String(nomor).replace(/[^0-9]/g, '')

  // Tutup soket lama tanpa proses logout (yang dapat menggantung pada sesi belum tertaut)
  dihentikanSengaja = true
  try {
    if (socket) {
      socket.end(undefined)
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Gagal menutup soket lama untuk mode pairing')
  }
  socket = null
  sedangMenghubungkan = false

  // Bersihkan sesi lama agar Baileys membuat kredensial baru
  hapusSesi()
  await new Promise(r => setTimeout(r, 500))

  return mulaiBaileys({ pairingNumber: nomorBersih })
}

/** Menutup soket tanpa menghapus sesi tersimpan. */
export function hentikanBaileys() {
  dihentikanSengaja = true
  try {
    if (socket) {
      socket.end(undefined)
      socket = null
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Gagal menutup soket secara rapi')
  }
  ubahKeadaan({ status: 'terputus', qr: null, qrDataUrl: null, pairingCode: null, pesanTerakhir: 'Koneksi dihentikan oleh operator.' })
  logger.info('Koneksi WhatsApp dihentikan oleh operator')
}

/** Logout penuh: memutuskan tautan dan menghapus berkas sesi. */
export async function logoutBaileys() {
  dihentikanSengaja = true
  try {
    if (socket) {
      await socket.logout().catch(() => {})
      socket = null
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'Logout Baileys bermasalah, tetap membersihkan sesi')
  }
  hapusSesi()
  ubahKeadaan({
    status: 'keluar', qr: null, qrDataUrl: null, pairingCode: null,
    nomor: null, namaPerangkat: null, percobaan: 0,
    pesanTerakhir: 'Sesi WhatsApp telah dihapus. Hubungkan ulang untuk membuat QR baru.'
  })
  catatAudit({
    aktor: 'operator', aksi: 'wa_logout', entitas: 'koneksi',
    entitasId: '1', nilaiBaru: 'logout'
  })
  logger.info('Sesi WhatsApp dihapus (logout)')
}

export function adaSesiTersimpan() {
  try {
    return fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0
  } catch {
    return false
  }
}
