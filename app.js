require('dotenv').config(); // 1. MEMUAT KONFIGURASI .ENV DI BARIS PERTAMA
const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');
const express = require('express');
const adminRoutes = require('./src/routes/adminRoutes');
const adminAuth = require('./src/middleware/auth');
const { handleIncomingMessage } = require('./src/bot/messageHandler');
const { loadInitialData } = require('./src/utils/storage');
const { attachCsrfToken, verifyCsrfToken } = require('./src/middleware/csrf');

const app = express();
const PORT = process.env.PORT || 3000; // 2. MENGGUNAKAN VARIABEL PORT DARI .ENV

// ====================================================================
// CONFIGURATION EXPRESS WEB SERVER
// ====================================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(attachCsrfToken);
app.use(verifyCsrfToken);

app.use('/admin-panel', adminAuth, adminRoutes);
app.get('/', (req, res) => res.redirect('/admin-panel'));

// ====================================================================
// CONFIGURATION WHATSAPP BOT (BAILEYS) WITH ROBUST RECONNECT
// ====================================================================
const MAX_RECONNECT = 10;
let reconnectAttempts = 0;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'session'));

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: undefined,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n[ SILAPURWA ] Silakan scan QR Code di bawah ini dengan WhatsApp Layanan:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[ SILAPURWA ] Koneksi terputus (Status Code: ${statusCode}). Menghubungkan kembali: ${shouldReconnect}`);

      if (shouldReconnect) {
        if (reconnectAttempts >= MAX_RECONNECT) {
          // Batas tercapai — hentikan reconnect dan minta intervensi manual
          console.error(`\n[ CRITICAL ] Gagal terhubung setelah ${MAX_RECONNECT} percobaan.`);
          console.error('[ CRITICAL ] Sistem membutuhkan intervensi manual. Silakan periksa koneksi internet dan jalankan ulang dengan: pm2 restart silapurwa\n');
          return; // hentikan rekursi
        }

        reconnectAttempts++;
        console.log(`[ SILAPURWA ] Percobaan reconnect ke-${reconnectAttempts} dari ${MAX_RECONNECT}...`);

        setTimeout(() => {
          connectToWhatsApp();
        }, 5000);

      }
    } else if (connection === 'open') {
      // Reset counter setiap kali koneksi berhasil
      reconnectAttempts = 0;
      console.log('\n=============================================');
      console.log('[ SILAPURWA ] Chatbot BERHASIL terhubung ke WhatsApp!');
      console.log(`[ SILAPURWA ] Web Admin berjalan di: http://localhost:${PORT}`);
      console.log('=============================================\n');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    try {
      await handleIncomingMessage(sock, m);
    } catch (error) {
      console.error("[ ERROR HANDLER ] Gagal memproses pesan masuk:", error);
    }
  });
}

// ====================================================================
// GLOBAL ERROR HANDLING (Mencegah Server Crash Akibat Gangguan Eksternal)
// ====================================================================
process.on('uncaughtException', (err) => {
  console.error('\n[ CRITICAL CRASH PREVENTED ] Menangkap uncaughtException:');
  console.error(err.stack || err);
  console.log('Sistem tetap berjalan aman...\n');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n[ CRITICAL CRASH PREVENTED ] Menangkap unhandledRejection pada promise:', promise);
  console.error('Alasan:', reason);
  console.log('Sistem tetap berjalan aman...\n');
});

// Muat data Chat Log dan Sesi dari penyimpanan JSON lokal
loadInitialData();

// Jalankan Server Web Express & WhatsApp Bot
app.listen(PORT, () => {
  console.log(`[ SERVER ] Web Admin siap di port ${PORT}`);
  connectToWhatsApp().catch(err => console.error("[ ERROR ] Gagal menjalankan bot:", err));
});
