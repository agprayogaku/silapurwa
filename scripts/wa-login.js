import readline from 'node:readline'
import { mulaiBaileys, getStatus, adaSesiTersimpan } from '../src/saluran/baileys.js'
import { getDb, closeDb } from '../src/db/koneksi.js'
import { logger } from '../src/config/logger.js'

/**
 * Skrip pairing WhatsApp mandiri (tanpa panel web).
 * Menampilkan kode QR di terminal, atau membuat kode pairing bila diberi nomor.
 *
 * Contoh:
 *   node scripts/wa-login.js              -> tampilkan QR di terminal
 *   node scripts/wa-login.js 628123456789 -> buat kode pairing 8 digit
 */

const nomorPairing = process.argv[2] ? String(process.argv[2]).replace(/[^0-9]/g, '') : null

async function utama() {
  getDb()

  console.log('================================================================')
  console.log('  SILAPURWA — PENAUTAN PERANGKAT WHATSAPP')
  console.log('================================================================')

  if (adaSesiTersimpan()) {
    console.log('  Sesi tersimpan ditemukan. Bot akan mencoba memakai sesi tersebut.')
    console.log('  Bila ingin menautkan perangkat baru, hapus folder auth_info lebih dahulu.')
  } else {
    console.log('  Belum ada sesi. Siapkan WhatsApp di ponsel untuk menautkan perangkat.')
  }

  if (nomorPairing) {
    console.log(`  Mode kode pairing untuk nomor: ${nomorPairing}`)
  } else {
    console.log('  Mode QR: pindai kode pada layar ini.')
  }
  console.log('================================================================\n')

  await mulaiBaileys(nomorPairing ? { pairingNumber: nomorPairing } : {})

  // Pantau status sampai terhubung atau pengguna keluar
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const pantau = setInterval(() => {
    const s = getStatus()
    if (s.pairingCode) {
      console.log(`\n  >> KODE PAIRING: ${s.pairingCode}`)
      console.log('     Masukkan di WhatsApp > Perangkat Tertaut > Tautkan dengan nomor telepon.\n')
    }
  }, 3000)

  const tanya = () => {
    rl.question('Tekan [Enter] untuk menutup skrip ini (koneksi tetap berjalan bila aplikasi utama aktif). ', () => {
      clearInterval(pantau)
      rl.close()
      const s = getStatus()
      console.log(`\nStatus terakhir: ${s.status}${s.nomor ? ' | nomor: ' + s.nomor : ''}`)
      closeDb()
      process.exit(0)
    })
  }
  tanya()
}

utama().catch(err => {
  logger.error({ err }, 'Skrip penautan WhatsApp gagal')
  process.exit(1)
})
