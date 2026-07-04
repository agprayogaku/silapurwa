const fs = require('fs');
const path = require('path');

// Cache data JSON di memori agar tidak baca disk setiap pesan masuk
let cachedData = null;

const getJsonData = () => {
  if (cachedData) return cachedData; // gunakan cache jika sudah ada

  cachedData = {
    faq: JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/faq.json'), 'utf-8')),
    layanan: JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/layanan.json'), 'utf-8')),
    jadwal: JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/jadwal.json'), 'utf-8')),
  };

  return cachedData;
};

// Dipanggil oleh adminController setiap kali ada perubahan data via panel
const invalidateCache = () => {
  cachedData = null;
  console.log('[ CACHE ] Cache data JSON telah direset.');
};

const mainMenuText = `*🤖 MENU UTAMA SILAPURWA*\n(Sistem Layanan Informasi Publik Lapas Purwakarta)\n\nHalo! Selamat datang di layanan informasi otomatis Lapas Kelas IIB Purwakarta. Silakan kirimkan perintah menggunakan format garis miring *(/)* di bawah ini:\n\n📌 */jadwal* : Informasi hari & sesi kunjungan\n📋 */syarat* : Syarat berkunjung & dokumen wajib\n📦 */titipan* : Ketentuan titip barang & makanan\n❌ */larangan* : Daftar benda dilarang masuk\n💰 */uang* : Prosedur penitipan uang\nℹ️ */integrasi* : Informasi layanan PB, CB, CMB\n📞 */admin* : Hubungi petugas piket layanan\n\n💡 _Ketik perintah tepat seperti format di atas untuk bantuan otomatis._`;

const groupMenuText = `*🚨 LAYANAN INFORMASI LAPAS PURWAKARTA (SILAPURWA)*\nHalo bapak/ibu anggota grup. Untuk menggunakan layanan informasi otomatis di dalam grup ini, silakan gunakan perintah berikut:\n\n📌 */jadwal* - Cek jadwal kunjungan\n📋 */syarat* - Syarat kunjungan\n❌ */larangan* - Daftar barang dilarang\n📞 */admin* - Minta bantuan petugas langsung\n\n⚠️ _Mohon gunakan perintah dengan bijak agar tidak mengganggu kenyamanan grup._`;

const getReply = (userInput, textMessage) => {
  const { faq, layanan, jadwal } = getJsonData();

  if (userInput === '/jadwal') {
    const j = jadwal.jadwal_kunjungan;
    return `*📌 JADWAL KUNJUNGAN LAPAS PURWAKARTA*\n\n*🔒 Tahanan (Senin & Rabu):*\n• Sesi I : ${j.tahanan.sesi_1}\n• Sesi II : ${j.tahanan.sesi_2}\n\n*🔓 Narapidana (Selasa & Kamis):*\n• Sesi I : ${j.narapidana.sesi_1}\n• Sesi II : ${j.narapidana.sesi_2}\n\n*🗓️ Khusus Hari Sabtu:*\n• Tahanan: ${j.khusus_sabtu.tahanan}\n• Narapidana: ${j.khusus_sabtu.narapidana}\n\n👉 _Ketik */menu* untuk kembali._`;
  }
  if (userInput === '/uang') {
    return `*💰 KETENTUAN PENITIPAN UANG*\n\n${jadwal.titipan_uang}\n\n👉 _Ketik */menu* untuk kembali._`;
  }
  if (userInput === '/syarat') {
    return `*📋 SYARAT & KETENTUAN KUNJUNGAN*\n\n` + layanan.syarat_kunjungan.umum.map((item, i) => `${i + 1}. ${item}`).join('\n') + `\n\n*⚠️ KHUSUS TAHANAN:*\n${layanan.syarat_kunjungan.catatan_tahanan}\n\n👉 _Ketik */menu* untuk kembali._`;
  }
  if (userInput === '/larangan') {
    return `*❌ DAFTAR BARANG YANG DILARANG MASUK*\n\n` + layanan.penitipan_barang.larangan.map((item, i) => `${i + 1}. ${item}`).join('\n') + `\n\n👉 _Ketik */menu* untuk kembali._`;
  }
  if (userInput === '/titipan') {
    return `*📦 KETENTUAN LAYANAN PENITIPAN BARANG & MAKANAN*\n\n• Waktu layanan: ${jadwal.titipan_non_makanan}\n\n*Aturan Kemasan & Jumlah:*\n` + layanan.penitipan_barang.ketentuan_lain.map(item => `• ${item}`).join('\n') + `\n\n👉 _Ketik */menu* untuk kembali._`;
  }
  if (userInput === '/integrasi' || userInput === '/pb' || userInput === '/cb' || userInput === '/cmb') {
    return `*ℹ️ LAYANAN INTEGRASI (PB, CB, CMB, ASIMILASI)*\n\n${layanan.layanan_integrasi.status}\n\n👉 _Ketik */menu* untuk kembali._`;
  }

  const matchedFaq = faq.find(item => userInput.includes(item.pertanyaan.toLowerCase()));
  if (matchedFaq) return matchedFaq.jawaban + `\n\n👉 _Ketik */menu* untuk menu utama._`;

  return null;
};

module.exports = { mainMenuText, groupMenuText, getReply, invalidateCache };
