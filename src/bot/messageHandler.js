const { mainMenuText, groupMenuText, getReply } = require('../utils/templates');
const { saveChatLog, saveAdminSession } = require('../utils/storage');
const { sanitizeInput, sanitizeForLog } = require('../utils/sanitizer');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Konfigurasi Variabel Global untuk Sinkronisasi ke Dashboard Web Express
global.chatLogs = global.chatLogs || [];
global.activeSessions = global.activeSessions || {};

// Konfigurasi Environment Kamtib (Sesuaikan nomor WhatsApp Anda tanpa @s.whatsapp.net)
// Membaca Nilai Secara Dinamis dari Berkas .env
const ADMIN_OFFICER_JID = process.env.ADMIN_OFFICER_JID;
// Memisahkan ID grup dengan koma jika suatu saat ada lebih dari 1 grup terdaftar
const WHITELISTED_GROUPS = process.env.WHITELISTED_GROUPS ? process.env.WHITELISTED_GROUPS.split(',') : [];

/**
 * Fungsi Helper untuk Mencatat Log Chat Terakhir ke Memori Global
 */
function addLog(phoneNumber, pushName, message, responseType) {
  global.chatLogs.unshift({
    timestamp: new Date(),
    phoneNumber,
    pushName: pushName || 'Keluarga WBP',
    message,
    responseType
  });

  // Batasi memori hanya menyimpan 50 aktivitas chat terakhir agar menghemat RAM
  if (global.chatLogs.length > 50) {
    global.chatLogs.pop();
  }
}

/**
 * Handler Utama Pesan WhatsApp Masuk
 */
async function handleIncomingMessage(sock, m) {
  const msg = m.messages[0];
  if (!msg.message || msg.key.fromMe) return;

  // 1. FITUR ANTI-SPAM PESAN LAMA (Abaikan jika usia pesan > 5 menit / 300 detik)
  const messageTimestamp = msg.messageTimestamp;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (currentTimestamp - messageTimestamp > 300) {
    console.log(`[ ANTI-SPAM ] Mengabaikan pesan lama dari ${msg.key.remoteJid}`);
    return;
  }

  const from = msg.key.remoteJidAlt || msg.key.remoteJid || '';
  if (!from) return; // Jika tidak ada identitas pengirim, langsung hentikan proses
  const isGroup = from.endsWith('@g.us');
  const pushName = sanitizeInput(msg.pushName || '', 100); // nama dibatasi 100 karakter

  const rawText = msg.message.conversation || msg.message.extendedTextMessage?.text;
  if (!rawText) return;
  const textMessage = sanitizeInput(rawText);  // ← sanitasi sebelum diproses lebih lanjut
  const userInput = textMessage.toLowerCase().trim();

  let replyText = '';
  let logType = ''; // Menentukan tipe log untuk dashboard web

  // Inisialisasi sesi user jika belum ada di variabel global
  if (!global.activeSessions[from]) {
    global.activeSessions[from] = { isReporting: false, lastActive: Date.now() };
  }

  // ====================================================================
  // A. LOGIKA KHUSUS JIKA PENGIRIM ADALAH PETUGAS ADMIN PRIBADI
  // ====================================================================
  if (from === ADMIN_OFFICER_JID) {
    // Petugas memilih user berdasarkan antrean
    if (userInput.startsWith('/pilih ')) {
      const targetIndex = parseInt(userInput.split(' ')[1]) - 1;
      const activeUsers = Object.keys(global.activeSessions).filter(jid => global.activeSessions[jid].isReporting === true);

      if (activeUsers[targetIndex]) {
        global.adminSelectedUser = activeUsers[targetIndex];
        // KODE BARU (Lebih Aman):
        const targetUserText = global.adminSelectedUser ? global.adminSelectedUser.split('@')[0] : 'User';
        await sock.sendMessage(from, { text: `✅ *Berhasil terhubung.* Anda sekarang berbicara dengan *${targetUserText}*. Semua pesan yang Anda ketik akan diteruskan ke user tersebut. Ketik */selesai* untuk menyudahi.` });
        addLog(from, 'Petugas Kamtib', textMessage, 'Admin Menghubungkan Sesi');
      } else {
        await sock.sendMessage(from, { text: `❌ Pilihan nomor antrean tidak valid.` });
      }
      return;
    }

    if (userInput === '/selesai') {
      if (global.adminSelectedUser) {
        const targetUser = global.adminSelectedUser;
        global.activeSessions[targetUser].isReporting = false;
        delete global.activeSessions[targetUser];
        global.adminSelectedUser = null;

        await sock.sendMessage(targetUser, { text: `🔄 _Sesi konsultasi manual telah diakhiri oleh petugas. Bot otomatis SILAPURWA kembali aktif._` });
        await sock.sendMessage(from, { text: `✅ Sesi berhasil ditutup. Ketik */list* untuk melihat antrean user lain.` });
        addLog(from, 'Petugas Kamtib', textMessage, 'Admin Mengakhiri Sesi');
      } else {
        await sock.sendMessage(from, { text: `⚠️ Anda tidak sedang dalam sesi percakapan dengan user manapun.` });
      }
      return;
    }

    if (userInput === '/list') {
      const activeUsers = Object.keys(global.activeSessions).filter(jid => global.activeSessions[jid].isReporting === true);
      if (activeUsers.length === 0) {
        await sock.sendMessage(from, { text: `📭 Tidak ada antrean keluarga WBP saat ini.` });
        return;
      }
      let listText = `📋 *ANTREAN KONSULTASI KELUARGA WBP*:\n\n`;
      activeUsers.forEach((jid, index) => {
        listText += `${index + 1}. No: ${jid.split('@')[0]}\n`;
      });
      listText += `\n💡 Ketik */pilih [nomor]* untuk menjawab. Contoh: */pilih 1*`;
      await sock.sendMessage(from, { text: listText });
      return;
    }

    // Relai jawaban dari Admin ke User yang dituju
    if (global.adminSelectedUser) {
      await sock.sendMessage(global.adminSelectedUser, { text: `*💬 Balasan Petugas Kamtib:* ${textMessage}` });
      addLog(global.adminSelectedUser, 'Petugas Kamtib', textMessage, 'Relai Jawaban Admin');
      console.log(`[ RELAI ADMIN -> USER ] Meneruskan pesan ke ${global.adminSelectedUser}`);
      return;
    }
  }

  // ====================================================================
  // B. LOGIKA UNTUK USER / KELUARGA WBP
  // ====================================================================

  // 2. FITUR VALIDASI SESI TIMEOUT (10 MENIT PASIF DI MODE ADMIN)
  if (global.activeSessions[from].isReporting === true) {
    const minutesPassed = (Date.now() - global.activeSessions[from].lastActive) / 60000;
    if (minutesPassed > 10) {
      global.activeSessions[from].isReporting = false;
      delete global.activeSessions[from];
      await sock.sendMessage(from, { text: `⚠️ _Sesi manual terputus otomatis karena Anda tidak mengirim pesan selama 10 menit._\n\n` + mainMenuText });
      addLog(from, pushName, textMessage, 'Sesi Timeout (10 Menit)');
      return;
    }
  }

  // Perbarui waktu aktivitas terakhir user
  global.activeSessions[from].lastActive = Date.now();

  // Jika user dalam mode menunggu respon admin, relai pesan ke HP petugas pribadi
  if (global.activeSessions[from].isReporting === true) {
    await sock.sendMessage(ADMIN_OFFICER_JID, {
      text: `⚠️ *PESAN MASUK DARI USER* (${from.split('@')[0]}):\n\n"${textMessage}"\n\n💡 _Ketik */list* untuk melihat daftar antrean percakapan._`
    });
    addLog(from, pushName, textMessage, 'Diteruskan ke Petugas');
    console.log(`[ RELAI USER -> ADMIN ] Meneruskan pesan dari ${from} ke petugas.`);
    return;
  }

  // FILTER PENGGUNAAN DI GRUP ATAU PERSONAL
  if (isGroup) {
    if (!WHITELISTED_GROUPS.includes(from)) return;

    if (userInput === '/menu' || userInput === '/help') {
      replyText = groupMenuText;
      logType = 'Menu Grup';
    } else if (userInput === '/admin') {
      replyText = `🚨 *Permintaan Bantuan Petugas*:\nHalo, bapak/ibu petugas piket Kamtib. Terdapat anggota grup (${pushName || from.split('@')[0]}) yang membutuhkan bantuan langsung di dalam grup keluarga WBP ini. Mohon responnya.`;
      logType = 'Panggilan Admin Grup';
    } else {
      replyText = getReply(userInput, textMessage);
      logType = replyText ? 'Auto-Response FAQ (Grup)' : '';
    }
  } else {
    // PENANGANAN CHAT PERSONAL (PRIVATE CHAT)
    if (userInput === '/menu' || userInput === '/help' || userInput === 'menu' || userInput === 'halo') {
      replyText = mainMenuText;
      logType = 'Fallback Menu Utama';
    } else if (userInput === '/admin') {
      global.activeSessions[from].isReporting = true;
      saveAdminSession(from, { isReporting: true, timestamp: Date.now() })

      // Mengirimkan notifikasi instan ke HP pribadi petugas
      const activeUsers = Object.keys(global.activeSessions).filter(jid => global.activeSessions[jid].isReporting === true);
      await sock.sendMessage(ADMIN_OFFICER_JID, { text: `🔔 *NOTIFIKASI BARU:* User ${from.split('@')[0]} meminta berbicara dengan admin. Total dalam antrean: ${activeUsers.length}. Ketik */list* untuk merespon.` });

      replyText = `*📞 MODE MANUAL PETUGAS AKTIF*\n\nSistem otomatis *SILAPURWA* telah dinonaktifkan sementara untuk nomor Anda.\n\n⚠️ *PENTING:* Silakan sebutkan *NAMA ANDA* dan *NAMA WARGA BINAAN* yang ingin Anda tanyakan terlebih dahulu sebagai proses verifikasi awal, lalu sampaikan pertanyaan Anda.\n\n👉 _Ketik */menu* untuk membatalkan dan mengaktifkan kembali bot._`;
      logType = 'Masuk Antrean Admin';
    } else {
      replyText = getReply(userInput, textMessage);
      if (replyText) {
        logType = 'Auto-Response FAQ';
      } else {
        replyText = `⚠️ _Maaf, perintah *"${textMessage}"* tidak dikenali._\n\n` + mainMenuText;
        logType = 'Perintah Tidak Dikenali';
      }
    }
  }

  // EKSEKUSI PENGIRIMAN PESAN BALASAN DENGAN TYPING DELAY & PENCATATAN LOG
  if (replyText) {
    await sock.sendPresenceUpdate('composing', from);
    const randomDelay = Math.floor(Math.random() * 2000) + 1500;
    await delay(randomDelay);
    await sock.sendPresenceUpdate('paused', from);

    await sock.sendMessage(from, { text: replyText });

    // Simpan aktivitas ke riwayat log web
    addLog(from, pushName, textMessage, logType);
  }

  // ====================================================================
  // PENCATATAN LOG AKTIVITAS (CHAT LOGS PERSISTENCE)
  // ====================================================================
  const whatsappNumber = (from && typeof from === 'string') ? from.split('@')[0] : 'Sistem/Grup';

  const logEntry = {
    waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    whatsapp: whatsappNumber,
    pesan: sanitizeForLog(textMessage),    // ← sanitasi untuk JSON
    respons: sanitizeForLog(replyText),    // ← sanitasi untuk JSON
    tipe: logType
  };

  // Panggil fungsi helper untuk menulis log secara instan ke data/logs.json
  saveChatLog(logEntry);
}

module.exports = { handleIncomingMessage };
