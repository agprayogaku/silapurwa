import { KANAL_AKTIF, WA_PAIRING_NUMBER } from '../config/env.js'
import { logger } from '../config/logger.js'
import { mulaiBaileys } from './baileys.js'

export async function inisialisasiSaluran() {
  logger.info({ kanal: KANAL_AKTIF }, 'Menginisialisasi saluran komunikasi...')

  if (KANAL_AKTIF === 'baileys') {
    try {
      await mulaiBaileys(WA_PAIRING_NUMBER ? { pairingNumber: WA_PAIRING_NUMBER } : {})
    } catch (err) {
      // Jangan matikan panel admin hanya karena kanal WhatsApp gagal.
      logger.error({ err: err.message }, 'Kanal WhatsApp gagal dimulai. Panel admin tetap berjalan; ' +
        'buka http://localhost:3000/whatsapp untuk mencoba lagi atau memakai kode pairing.')
    }
  } else if (KANAL_AKTIF === 'simulasi') {
    logger.info('Mode simulasi aktif. Gunakan "npm run simulasi" atau tab Simulator Chat di panel admin.')
  } else {
    logger.warn({ kanal: KANAL_AKTIF }, 'Saluran tidak dikenal, default ke mode simulasi')
  }
}
