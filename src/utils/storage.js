const fs = require('fs');
const path = require('path');

const logsPath = path.join(__dirname, '../../data/logs.json');
const sessionsPath = path.join(__dirname, '../../data/sessions.json');
const archiveDir = path.join(__dirname, '../../data/archive');

// ====================================================================
// INITIAL LOAD
// ====================================================================

const loadInitialData = () => {
  try {
    global.chatLogs = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
  } catch (e) {
    global.chatLogs = [];
  }

  try {
    global.activeSessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
  } catch (e) {
    global.activeSessions = {};
  }
};

// ====================================================================
// ARSIP LOG BULANAN
// ====================================================================

/**
 * Memindahkan log yang sudah ada ke file arsip bulanan
 * sebelum logs.json dikosongkan.
 * Format nama file: logs_YYYY-MM.json
 */
const archiveOldLogs = (logsToArchive) => {
  const now = new Date();
  const label = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const archivePath = path.join(archiveDir, `logs_${label}.json`);

  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(archivePath, 'utf-8'));
  } catch {
    existing = [];
  }

  const merged = existing.concat(logsToArchive);
  fs.writeFileSync(archivePath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`[ ARCHIVE ] ${logsToArchive.length} entri log diarsipkan ke ${path.basename(archivePath)}`);
};

// ====================================================================
// SAVE CHAT LOG
// ====================================================================

const saveChatLog = (logEntry) => {
  global.chatLogs.push(logEntry);

  // Jika melebihi 500 entri, arsipkan 250 entri paling lama lalu buang dari memori
  if (global.chatLogs.length > 500) {
    const logsToArchive = global.chatLogs.splice(0, 250); // ambil 250 terlama dari depan
    archiveOldLogs(logsToArchive);
  }

  // Tulis ke disk secara async agar tidak memblokir event loop
  fs.writeFile(logsPath, JSON.stringify(global.chatLogs, null, 2), 'utf-8', (err) => {
    if (err) console.error('[ STORAGE ] Gagal menyimpan log chat:', err);
  });
};

// ====================================================================
// SAVE ADMIN SESSION
// ====================================================================

const saveAdminSession = (jid, sessionData) => {
  if (sessionData === null) {
    delete global.activeSessions[jid];
  } else {
    global.activeSessions[jid] = sessionData;
  }
  fs.writeFileSync(sessionsPath, JSON.stringify(global.activeSessions, null, 2), 'utf-8');
};

module.exports = { loadInitialData, saveChatLog, saveAdminSession };
