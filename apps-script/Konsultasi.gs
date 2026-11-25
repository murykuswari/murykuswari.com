/**
 * Layanan Program Gizi Personal (program.html) untuk murykuswari.com.
 * Berkas ini satu proyek dengan Kode.gs: memakai hash_, buatOtp_, aman_, json_ dari sana.
 * Panduan pemasangan: docs/panduan-program-gizi.md
 *
 * Alur: kons-kirim (OTP ke email) -> kons-masuk (OTP jadi sesi + riwayat)
 *       -> kons-profil (simpan profil) -> kons-simpan (simpan asesmen + laporan).
 *
 * Penyimpanan (Drive pemilik, folder "Claude 2026"):
 *   Konsultasi Gizi Olahraga – murykuswari.com/
 *     Database Konsultasi Gizi Olahraga   (Sheet: Klien, Konsultasi)
 *     Klien/<Nama> – <email>/              (satu Google Doc laporan per konsultasi)
 */

const KONS = {
  FOLDER_ID: '1NUQ1tXIEDL2dp88tGNTggseucZZPkZ-N',   // Claude 2026 / Konsultasi Gizi Olahraga – murykuswari.com
  SHEET_ID: '19XM6Gwdka7yYLBXsicHootqRMoQqj707Ti6hapAAanA', // Database Konsultasi Gizi Olahraga
  EMAIL_PEMILIK: 'mury@esaunggul.ac.id',
  ADMIN: ['mury@esaunggul.ac.id', 'murykuswari@gmail.com'], // email yang boleh membuka dashboard.html
  SESI_JAM: 6,              // masa berlaku sesi masuk (maksimal 6 jam, batas CacheService)
  INGAT_HARI: 30,           // "Ingat perangkat ini": tidak perlu kode OTP selama sekian hari
  KIRIM_SALINAN_KLIEN: true, // kirim ringkasan hasil ke email klien setelah disimpan
  KABARI_PEMILIK: true,      // kirim pemberitahuan ke pemilik untuk setiap konsultasi baru
  MAX_SIMPAN_HARI: 10,      // batas simpan per klien per hari
  // Halaman pemesanan jadwal (mis. Google Calendar "Appointment schedule"). Kosong = klien dihubungi lewat email/WA.
  JADWAL_URL: '',
  SITUS: 'https://murykuswari.com/konsultasi/'
};

/**
 * Paket konsultasi lanjutan berbayar. Harga dalam rupiah (bilangan bulat).
 * CONTOH — ubah nama, harga, dan deskripsi sesuai keputusan pemilik sebelum pembayaran diaktifkan.
 * Pembayaran aktif setelah Script Property MIDTRANS_SERVER_KEY diisi (lihat docs/skema-pembayaran.md).
 */
const PAKET = [
  { id: 'sesi-1', nama: 'Konsultasi lanjutan 1 sesi', harga: 250000, deskripsi: 'Video call 45 menit, telaah program dan hasil asesmen, rekomendasi tertulis.' },
  { id: 'paket-4', nama: 'Pendampingan 4 minggu', harga: 750000, deskripsi: '2 sesi video call, evaluasi mingguan via WhatsApp, penyesuaian program tiap 2 minggu.' },
  { id: 'paket-12', nama: 'Pendampingan 12 minggu', harga: 1800000, deskripsi: '6 sesi video call, evaluasi mingguan, periodisasi gizi sampai kompetisi.' }
];
const KOLOM_BAYAR = ['Order ID', 'Dibuat', 'Email', 'Nama', 'Paket', 'Jumlah (Rp)', 'Status', 'Metode', 'Dibayar', 'ID klien praktisi', 'Catatan', 'Status Midtrans', 'Diperbarui', 'ID permintaan', 'Bukti', 'Catatan verifikasi', 'Diverifikasi oleh'];
// Pembayaran langsung ke e-wallet pemilik (GoPay/DANA/LinkAja). Nomor dompet diatur di config.js (SITE.dompet).
// Status: menunggu -> dicek (klien mengunggah bukti) -> lunas (admin konfirmasi) | gagal (admin tolak bukti).
const DOMPET_SAH = ['GoPay', 'DANA', 'LinkAja', 'OVO', 'ShopeePay', 'QRIS', 'Transfer bank'];

/**
 * Tujuan pembayaran yang dicantumkan di email instruksi pembayaran (dikirim saat admin memilih "berbayar").
 * Samakan dengan SITE.dompet / SITE.rekening / SITE.qris di config.js. Baris dengan nomor kosong tidak ditampilkan.
 */
const PEMBAYARAN = {
  dompet: [
    { nama: 'GoPay', nomor: '0811-8432-050', atasNama: '' },
    { nama: 'DANA', nomor: '0811-8432-050', atasNama: '' },
    { nama: 'OVO', nomor: '0811-8432-050', atasNama: '' },
    { nama: 'LinkAja', nomor: '0811-8432-050', atasNama: '' }
  ],
  // Transfer bank, mis. { bank: 'BCA', nomor: '1234567890', atasNama: 'Mury Kuswari' }
  rekening: [
    { bank: '', nomor: '', atasNama: '' }
  ],
  qris: '',           // URL gambar QRIS, mis. 'https://murykuswari.com/assets/img/qris.jpg'
  batasJam: 72,       // batas waktu pembayaran yang dicantumkan di email
  whatsapp: '6282245039450'
};
// Permintaan konsultasi lanjutan: admin memutuskan gratis / berbayar / ditolak sebelum menjawab.
const KOLOM_TANYA = ['ID', 'Dibuat', 'Email', 'Nama', 'ID klien praktisi', 'Topik', 'Pertanyaan', 'Status', 'Jenis', 'Paket', 'Harga (Rp)', 'Catatan admin', 'Order ID', 'Jawaban', 'Dijawab', 'Diperbarui'];
const TOPIK = ['Performa & persiapan kompetisi', 'Komposisi tubuh (turun lemak / naik otot)', 'Membuat berat badan kelas tanding', 'Menu & pola makan harian', 'Suplemen', 'Cedera, pemulihan, atau keluhan kesehatan', 'Program untuk tim / klien', 'Lainnya'];

const KOLOM_KLIEN = ['Email', 'Nama lengkap', 'Jenis kelamin', 'Tanggal lahir', 'Asal', 'WhatsApp', 'Cabang olahraga', 'Level', 'Terdaftar', 'Terakhir masuk', 'Jumlah konsultasi', 'Folder klien', 'Peran', 'Profesi & lisensi', 'Foto'];
const KOLOM_KONS = ['ID', 'Waktu', 'Email', 'Nama', 'Cabang olahraga', 'Tujuan', 'Fase', 'BB (kg)', 'TB (cm)', '% lemak', 'FFM (kg)', 'Energi rata-rata (kkal)', 'KH rata-rata (g)', 'Protein (g)', 'Lemak (g)', 'EA (kkal/kg FFM)', 'Laju keringat (L/jam)', 'Tujuan konsultasi', 'Laporan', 'Data (JSON)', 'ID klien praktisi', 'Nama klien praktisi'];
const KOLOM_KP = ['ID klien', 'Email praktisi', 'Nama klien', 'Jenis kelamin', 'Tanggal lahir', 'Cabang olahraga', 'Nomor/kelas/posisi', 'Level', 'Email klien', 'WhatsApp klien', 'Catatan', 'Dibuat', 'Diperbarui', 'Jumlah konsultasi', 'Folder', 'Foto'];

function konsultasi_(d) {
  switch (d.aksi) {
    case 'kons-kirim': return konsKirim_(d);
    case 'kons-masuk': return konsMasuk_(d);
    case 'kons-lanjut': return konsLanjut_(d);
    case 'kons-keluar': return konsKeluar_(d);
    case 'kons-profil': return konsProfil_(d);
    case 'kons-simpan': return konsSimpan_(d);
    case 'kons-riwayat': return konsRiwayat_(d);
    case 'kons-klien': return konsKlien_(d);
    case 'kons-foto': return konsFoto_(d);
    case 'kons-foto-ambil': return konsFotoAmbil_(d);
    case 'kons-admin': return konsAdmin_(d);
    case 'kons-paket': return { ok: true, aktif: !!kunciMidtrans_(), dompet: true, paket: PAKET, topik: TOPIK, jadwal: KONS.JADWAL_URL };
    case 'kons-tanya': return konsTanya_(d);
    case 'kons-putus': return konsPutus_(d);
    case 'kons-jawab': return konsJawab_(d);
    case 'kons-bayar': return konsBayar_(d);
    case 'kons-status': return konsStatus_(d);
    case 'kons-bayar-dompet': return konsBayarDompet_(d);
    case 'kons-konfirmasi': return konsKonfirmasi_(d);
    case 'kons-verifikasi': return konsVerifikasi_(d);
    case 'kons-daftar': return konsDaftar_(d);           // Pendaftaran.gs
    case 'kons-daftar-admin': return konsDaftarAdmin_(d); // Pendaftaran.gs
    default: return { ok: false, pesan: 'Permintaan tidak dikenali.' };
  }
}

/** Jalankan sekali dari editor: memberi izin Drive/Sheets/Docs/Gmail dan menyiapkan tab Sheet. */
function siapkanKonsultasi() {
  tab_('Klien', KOLOM_KLIEN);
  tab_('Konsultasi', KOLOM_KONS);
  tab_('Klien Praktisi', KOLOM_KP);
  tab_('Pembayaran', KOLOM_BAYAR);
  tab_('Permintaan', KOLOM_TANYA);
  folderKlienInduk_();
  UrlFetchApp.fetch('https://api.midtrans.com', { muteHttpExceptions: true }); // meminta izin akses jaringan untuk Midtrans
  const uji = DocumentApp.create('uji-izin-program-gizi');
  DriveApp.getFileById(uji.getId()).setTrashed(true);
  console.log('Siap. Folder: https://drive.google.com/drive/folders/' + KONS.FOLDER_ID);
}

/* ---------- OTP & sesi ---------- */

function konsKirim_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  if (d.website) return { ok: true, jeda: JEDA_DETIK };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) || email.length > 120) return { ok: false, pesan: 'Format email belum benar.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const c = CacheService.getScriptCache();
    const k = hash_('kons:' + email);
    if (c.get('kjeda:' + k)) return { ok: false, pesan: 'Tunggu sebentar sebelum meminta kode baru.' };
    const jam = Number(c.get('kjam:' + k) || 0);
    if (jam >= MAX_PER_JAM) return { ok: false, pesan: 'Terlalu banyak permintaan. Coba lagi satu jam lagi.' };
    const hariKey = 'hari:' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
    const hari = Number(c.get(hariKey) || 0);
    if (hari >= MAX_PER_HARI || MailApp.getRemainingDailyQuota() < 5) return { ok: false, pesan: 'Kuota harian habis. Coba lagi besok.' };
    const otp = buatOtp_();
    MailApp.sendEmail({
      to: email,
      subject: otp + ' adalah kode masuk Program Gizi murykuswari.com',
      name: 'Program Gizi murykuswari.com',
      htmlBody: '<p>Kode masuk Program Gizi Olahraga Anda:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">' + otp + '</p>' +
        '<p>Kode berlaku ' + OTP_MENIT + ' menit. Jangan berikan kode ini kepada siapa pun.</p>' +
        '<p style="color:#6a7f96;font-size:13px">Abaikan email ini jika Anda tidak sedang masuk ke murykuswari.com.</p>'
    });
    c.put('kotp:' + k, JSON.stringify({ h: hash_(k + otp), n: 0 }), OTP_MENIT * 60);
    c.put('kjeda:' + k, '1', JEDA_DETIK);
    c.put('kjam:' + k, String(jam + 1), 3600);
    c.put(hariKey, String(hari + 1), 86400);
    return { ok: true, jeda: JEDA_DETIK };
  } finally {
    lock.releaseLock();
  }
}

function konsMasuk_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  const otp = String(d.otp || '').trim();
  if (!/^\d{6}$/.test(otp)) return { ok: false, pesan: 'Masukkan 6 digit kode.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let token;
  try {
    const c = CacheService.getScriptCache();
    const k = hash_('kons:' + email);
    const raw = c.get('kotp:' + k);
    if (!raw) return { ok: false, pesan: 'Kode sudah tidak berlaku. Minta kode baru.' };
    const s = JSON.parse(raw);
    if (hash_(k + otp) !== s.h) {
      s.n += 1;
      if (s.n >= MAX_SALAH) { c.remove('kotp:' + k); return { ok: false, pesan: 'Terlalu banyak percobaan. Minta kode baru.' }; }
      c.put('kotp:' + k, JSON.stringify(s), OTP_MENIT * 60);
      return { ok: false, pesan: 'Kode salah. Sisa percobaan: ' + (MAX_SALAH - s.n) + '.' };
    }
    c.remove('kotp:' + k);
    token = Utilities.getUuid() + Utilities.getUuid();
    c.put('ksesi:' + hash_(token), JSON.stringify({ email: email }), KONS.SESI_JAM * 3600);
  } finally {
    lock.releaseLock();
  }
  const hasil = paketMasuk_(email, token);
  if (d.ingat) hasil.ingat = buatIngat_(email);
  return hasil;
}

function paketMasuk_(email, token) {
  const profil = cariKlien_(email);
  if (profil) setSel_('Klien', profil.baris, 'Terakhir masuk', waktu_());
  return { ok: true, token: token, jam: KONS.SESI_JAM, email: email, admin: isAdmin_(email), profil: profil ? profil.data : null, foto: profil ? fotoBase64_(profil.data.foto) : '', riwayat: riwayat_(email), klienPraktisi: daftarKP_(email), pembayaran: daftarBayar_(email), permintaan: daftarTanya_(email) };
}

/* ---------- Ingat perangkat (tanpa OTP selama INGAT_HARI) ---------- */

function buatIngat_(email) {
  const t = Utilities.getUuid() + Utilities.getUuid();
  const sampai = Date.now() + KONS.INGAT_HARI * 864e5;
  PropertiesService.getScriptProperties().setProperty('kingat:' + hash_(t), JSON.stringify({ email: email, sampai: sampai }));
  return { token: t, sampai: sampai };
}

function konsLanjut_(d) {
  const props = PropertiesService.getScriptProperties();
  const key = 'kingat:' + hash_(String(d.ingat || ''));
  const raw = props.getProperty(key);
  if (!raw) return { ok: false, ulang: true, pesan: 'Silakan masuk dengan kode email.' };
  const s = JSON.parse(raw);
  if (s.sampai < Date.now()) { props.deleteProperty(key); return { ok: false, ulang: true, pesan: 'Masa ingat perangkat habis. Silakan masuk lagi.' }; }
  if (Math.random() < 0.05) bersihkanIngat_();
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('ksesi:' + hash_(token), JSON.stringify({ email: s.email }), KONS.SESI_JAM * 3600);
  return paketMasuk_(s.email, token);
}

function konsKeluar_(d) {
  if (d.ingat) PropertiesService.getScriptProperties().deleteProperty('kingat:' + hash_(String(d.ingat)));
  if (d.token) CacheService.getScriptCache().remove('ksesi:' + hash_(String(d.token)));
  return { ok: true };
}

function bersihkanIngat_() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('kingat:') !== 0) return;
    try { if (JSON.parse(all[k]).sampai < Date.now()) props.deleteProperty(k); } catch (e) { props.deleteProperty(k); }
  });
}

function sesi_(d) {
  const raw = CacheService.getScriptCache().get('ksesi:' + hash_(String(d.token || '')));
  return raw ? JSON.parse(raw).email : null;
}

function konsRiwayat_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const p = cariKlien_(email);
  return { ok: true, email: email, admin: isAdmin_(email), profil: p ? p.data : null, foto: p ? fotoBase64_(p.data.foto) : '', riwayat: riwayat_(email), klienPraktisi: daftarKP_(email), pembayaran: daftarBayar_(email), permintaan: daftarTanya_(email) };
}

/* ---------- Profil ---------- */

function bersih_(v, n) { return String(v == null ? '' : v).trim().slice(0, n || 120); }

function konsProfil_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const p = d.profil || {};
  const data = {
    nama: bersih_(p.nama, 80), jk: p.jk === 'P' ? 'P' : 'L', tglLahir: bersih_(p.tglLahir, 10), asal: bersih_(p.asal, 120),
    wa: String(p.wa || '').replace(/\D/g, '').slice(0, 16), cabor: bersih_(p.cabor, 40), caborLain: bersih_(p.caborLain, 60), level: bersih_(p.level, 40),
    peran: ['atlet', 'pelatih', 'ahligizi'].indexOf(p.peran) >= 0 ? p.peran : 'atlet', profesi: bersih_(p.profesi, 120)
  };
  if (data.nama.length < 3) return { ok: false, pesan: 'Isi nama lengkap.' };
  if (data.peran === 'atlet' && !/^\d{4}-\d{2}-\d{2}$/.test(data.tglLahir)) return { ok: false, pesan: 'Isi tanggal lahir.' };
  if (data.peran !== 'atlet' && data.profesi.length < 3) return { ok: false, pesan: 'Isi profesi dan lisensi/instansi.' };
  if (data.asal.length < 3) return { ok: false, pesan: 'Isi asal (kota dan instansi/klub).' };
  if (!/^\d{9,16}$/.test(data.wa)) return { ok: false, pesan: 'Nomor WhatsApp belum benar.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ada = cariKlien_(email);
    const folder = ada && ada.data.folder ? ada.data.folder : folderKlien_(email, data.nama).getUrl();
    const baris = [aman_(email), aman_(data.nama), data.jk, data.tglLahir, aman_(data.asal), "'" + data.wa, aman_(data.cabor + (data.caborLain ? ' – ' + data.caborLain : '')), aman_(data.level),
      ada ? ada.data.terdaftar : waktu_(), waktu_(), ada ? ada.data.jumlah : 0, folder, data.peran, aman_(data.profesi), ada ? ada.data.foto : ''];
    const sh = tab_('Klien', KOLOM_KLIEN);
    if (ada) sh.getRange(ada.baris, 1, 1, baris.length).setValues([baris]);
    else sh.appendRow(baris);
    data.email = email; data.folder = folder;
    return { ok: true, profil: data };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Simpan konsultasi ---------- */

function konsSimpan_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi. Data Anda masih ada di formulir.' };
  const klien = cariKlien_(email);
  if (!klien) return { ok: false, pesan: 'Lengkapi profil terlebih dahulu.' };
  const c = CacheService.getScriptCache();
  const kk = 'ksimpan:' + hash_(email) + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
  const n = Number(c.get(kk) || 0);
  if (n >= KONS.MAX_SIMPAN_HARI) return { ok: false, pesan: 'Batas penyimpanan hari ini tercapai.' };

  const input = d.input || {};
  const r = d.ringkas || {};
  const laporan = Array.isArray(d.laporan) ? d.laporan.slice(0, 40) : [];
  const json = JSON.stringify({ input: input, ringkas: r });
  if (json.length > 45000) return { ok: false, pesan: 'Data terlalu besar.' };

  const id = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 4);
  const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
  const klienId = bersih_(d.klienId, 40);
  let kp = null;
  if (klienId) {
    kp = cariKP_(email, klienId);
    if (!kp) return { ok: false, pesan: 'Klien tidak ditemukan.' };
  }
  const nama = kp ? kp.data.nama : klien.data.nama;
  const oleh = kp ? klien.data.nama + (klien.data.profesi ? ' (' + klien.data.profesi + ')' : '') : '';

  // Laporan Google Doc di folder klien (praktisi: subfolder klien di dalam folder praktisi).
  const folder = kp ? folderKP_(email, klien.data.nama, klienId, nama) : folderKlien_(email, nama);
  const doc = DocumentApp.create('Program Gizi – ' + nama + ' – ' + tanggal);
  const body = doc.getBody();
  body.appendParagraph('Program Gizi Olahraga Personal').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(nama + ' · ' + tanggal + ' · ID ' + id + (oleh ? ' · disusun oleh ' + oleh + ' (' + email + ')' : ' · ' + email));
  if (input.tujuanKonsultasi) {
    body.appendParagraph('Tujuan konsultasi').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(bersih_(input.tujuanKonsultasi, 1500));
  }
  laporan.forEach(function (s) {
    body.appendParagraph(bersih_(s.judul, 120)).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    (Array.isArray(s.baris) ? s.baris.slice(0, 60) : []).forEach(function (b) { body.appendParagraph(bersih_(b, 2000)); });
  });
  body.appendParagraph('Hasil ini adalah estimasi berbasis rumus dan literatur, bukan diagnosis. Ditinjau oleh Assoc. Prof. Dr. Mury Kuswari.').setItalic(true);
  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    tab_('Konsultasi', KOLOM_KONS).appendRow([
      id, waktu_(), aman_(email), aman_(nama), aman_(r.cabor), aman_(r.tujuan), aman_(r.fase), num_(input.bb), num_(input.tb), num_(r.pct), num_(r.ffm),
      num_(r.energi), num_(r.kh), num_(r.protein), num_(r.lemak), num_(r.ea), num_(r.sr), aman_(bersih_(input.tujuanKonsultasi, 1000)), file.getUrl(), aman_(json), klienId, kp ? aman_(nama) : ''
    ]);
    const k2 = cariKlien_(email);
    setSel_('Klien', k2.baris, 'Jumlah konsultasi', Number(k2.data.jumlah || 0) + 1);
    if (kp) {
      const sh = ss_().getSheetByName('Klien Praktisi');
      sh.getRange(kp.baris, KOLOM_KP.indexOf('Jumlah konsultasi') + 1).setValue(Number(kp.data.jumlah || 0) + 1);
      sh.getRange(kp.baris, KOLOM_KP.indexOf('Diperbarui') + 1).setValue(waktu_());
    }
    c.put(kk, String(n + 1), 86400);
  } finally {
    lock.releaseLock();
  }

  const html = laporanHtml_(nama + (oleh ? ' · disusun oleh ' + oleh : ''), tanggal, input.tujuanKonsultasi, laporan);
  try {
    if (KONS.KIRIM_SALINAN_KLIEN && MailApp.getRemainingDailyQuota() > 5) {
      MailApp.sendEmail({ to: email, subject: (kp ? 'Program Gizi untuk ' + nama + ' – ' : 'Program Gizi Olahraga Anda – ') + tanggal, name: 'Program Gizi murykuswari.com', htmlBody: html, replyTo: KONS.EMAIL_PEMILIK });
    }
    if (KONS.KABARI_PEMILIK && MailApp.getRemainingDailyQuota() > 5) {
      MailApp.sendEmail({ to: KONS.EMAIL_PEMILIK, subject: 'Konsultasi baru: ' + nama + (kp ? ' oleh ' + klien.data.nama : '') + ' (' + (r.cabor || '-') + ')', name: 'Program Gizi murykuswari.com', replyTo: email,
        htmlBody: '<p><b>' + esc_(nama) + '</b> (' + esc_(email) + ', WA ' + esc_(klien.data.wa) + ', ' + esc_(klien.data.asal) + ')</p><p>Laporan: <a href="' + file.getUrl() + '">' + esc_(doc.getName()) + '</a></p>' + html });
    }
  } catch (err) { console.error(err); }

  return { ok: true, id: id, tanggal: tanggal, riwayat: riwayat_(email, klienId), klienPraktisi: kp ? daftarKP_(email) : undefined };
}

/* ---------- Sheet & Drive ---------- */

function ss_() { return SpreadsheetApp.openById(KONS.SHEET_ID); }

function tab_(nama, kolom) {
  const ss = ss_();
  let sh = ss.getSheetByName(nama);
  if (!sh) {
    // Tab pertama bawaan (hasil impor CSV) dipakai sebagai "Klien".
    const first = ss.getSheets()[0];
    if (nama === 'Klien' && first.getName() !== 'Konsultasi' && !ss.getSheetByName('Klien')) { first.setName('Klien'); sh = first; }
    else sh = ss.insertSheet(nama);
  }
  if (sh.getLastRow() === 0 || sh.getRange(1, 1).getValue() !== kolom[0] || sh.getRange(1, kolom.length).getValue() !== kolom[kolom.length - 1]) {
    if (sh.getLastRow() === 0) sh.appendRow(kolom); else sh.getRange(1, 1, 1, kolom.length).setValues([kolom]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, kolom.length).setFontWeight('bold').setBackground('#e1eff9');
  }
  return sh;
}

function cariKlien_(email) {
  const sh = tab_('Klien', KOLOM_KLIEN);
  const n = sh.getLastRow();
  if (n < 2) return null;
  const v = sh.getRange(2, 1, n - 1, KOLOM_KLIEN.length).getValues();
  for (let i = 0; i < v.length; i++) {
    if (String(v[i][0]).replace(/^'/, '').toLowerCase() === email) {
      const r = v[i];
      const tgl = r[3] instanceof Date ? Utilities.formatDate(r[3], 'Asia/Jakarta', 'yyyy-MM-dd') : String(r[3]);
      const cab = String(r[6]).replace(/^'/, '').split(' – ');
      return { baris: i + 2, data: { email: email, nama: String(r[1]).replace(/^'/, ''), jk: r[2], tglLahir: tgl, asal: String(r[4]).replace(/^'/, ''), wa: String(r[5]).replace(/\D/g, ''), cabor: cab[0], caborLain: cab[1] || '', level: String(r[7]).replace(/^'/, ''), terdaftar: r[8], jumlah: r[10], folder: r[11], peran: String(r[12] || 'atlet'), profesi: String(r[13] || '').replace(/^'/, ''), foto: String(r[14] || '') } };
    }
  }
  return null;
}

function setSel_(tab, baris, kolomNama, nilai) {
  const kol = (tab === 'Klien' ? KOLOM_KLIEN : KOLOM_KONS).indexOf(kolomNama) + 1;
  ss_().getSheetByName(tab).getRange(baris, kol).setValue(nilai);
}

function riwayat_(email, klienId) {
  return riwayatPer_(email)[klienId || ''] || [];
}

/** Baca tab Konsultasi sekali, kelompokkan per klien praktisi ('' = akun sendiri). */
function riwayatPer_(email) {
  const sh = tab_('Konsultasi', KOLOM_KONS);
  const n = sh.getLastRow();
  const out = {};
  if (n < 2) return out;
  const v = sh.getRange(2, 1, n - 1, KOLOM_KONS.length).getValues();
  v.forEach(function (r) {
    if (String(r[2]).replace(/^'/, '').toLowerCase() !== email) return;
    const kid = String(r[20] || '');
    let data = {};
    try { data = JSON.parse(String(r[19]).replace(/^'/, '')); } catch (e) { /* abaikan baris rusak */ }
    (out[kid] = out[kid] || []).push({ id: r[0], waktu: String(r[1]), input: data.input || {}, ringkas: data.ringkas || {}, laporan: String(r[18] || '') });
  });
  Object.keys(out).forEach(function (k) { out[k] = out[k].slice(-30); });
  return out;
}

function folderKlienInduk_() {
  const induk = DriveApp.getFolderById(KONS.FOLDER_ID);
  const it = induk.getFoldersByName('Klien');
  return it.hasNext() ? it.next() : induk.createFolder('Klien');
}

function folderKlien_(email, nama) {
  const induk = folderKlienInduk_();
  const props = PropertiesService.getScriptProperties();
  const key = 'kfolder:' + hash_(email);
  const id = props.getProperty(key);
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* folder dihapus, buat ulang */ } }
  const f = induk.createFolder(String(nama).slice(0, 60) + ' – ' + email);
  props.setProperty(key, f.getId());
  return f;
}

function waktu_() { return Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'); }
function num_(v) { const x = Number(v); return isFinite(x) && v !== '' && v != null ? Math.round(x * 100) / 100 : ''; }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

function laporanHtml_(nama, tanggal, tujuan, laporan) {
  let h = '<div style="font-family:Arial,sans-serif;max-width:680px;color:#0b1e33"><h2 style="color:#003a63">Program Gizi Olahraga Personal</h2><p>' + esc_(nama) + ' · ' + esc_(tanggal) + '</p>';
  if (tujuan) h += '<h3>Tujuan konsultasi</h3><p>' + esc_(bersih_(tujuan, 1500)) + '</p>';
  laporan.forEach(function (s) {
    h += '<h3 style="color:#0070b8;margin-bottom:4px">' + esc_(bersih_(s.judul, 120)) + '</h3>';
    (Array.isArray(s.baris) ? s.baris.slice(0, 60) : []).forEach(function (b) { h += '<p style="margin:4px 0">' + esc_(bersih_(b, 2000)) + '</p>'; });
  });
  h += '<p style="color:#6a7f96;font-size:13px">Hasil ini adalah estimasi berbasis rumus dan literatur, bukan diagnosis. Balas email ini untuk berdiskusi dengan Assoc. Prof. Dr. Mury Kuswari. Masuk lagi di murykuswari.com/konsultasi untuk melanjutkan program.</p></div>';
  return h;
}

/* ---------- Klien milik pelatih / ahli gizi ---------- */

function konsKlien_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const praktisi = cariKlien_(email);
  if (!praktisi || praktisi.data.peran === 'atlet') return { ok: false, pesan: 'Fitur ini untuk akun pelatih atau ahli gizi.' };
  const k = d.klien || {};
  const data = {
    nama: bersih_(k.nama, 80), jk: k.jk === 'P' ? 'P' : 'L', tglLahir: bersih_(k.tglLahir, 10), cabor: bersih_(k.cabor, 40), caborLain: bersih_(k.caborLain, 60),
    level: bersih_(k.level, 40), email: bersih_(k.email, 120).toLowerCase(), wa: String(k.wa || '').replace(/\D/g, '').slice(0, 16), catatan: bersih_(k.catatan, 500)
  };
  if (data.nama.length < 2) return { ok: false, pesan: 'Isi nama klien.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tglLahir)) return { ok: false, pesan: 'Isi tanggal lahir klien.' };
  if (data.email && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(data.email)) return { ok: false, pesan: 'Email klien belum benar.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = tab_('Klien Praktisi', KOLOM_KP);
    const ada = k.id ? cariKP_(email, bersih_(k.id, 40)) : null;
    if (!ada && daftarKP_(email).length >= 200) return { ok: false, pesan: 'Batas 200 klien per akun tercapai.' };
    const id = ada ? ada.data.id : 'K' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMddHHmmss') + Utilities.getUuid().slice(0, 3);
    const baris = [id, aman_(email), aman_(data.nama), data.jk, data.tglLahir, aman_(data.cabor), aman_(data.caborLain), aman_(data.level), aman_(data.email), data.wa ? "'" + data.wa : '', aman_(data.catatan),
      ada ? ada.data.dibuat : waktu_(), waktu_(), ada ? ada.data.jumlah : 0, ada ? ada.data.folder : '', ada ? ada.data.foto : ''];
    if (ada) sh.getRange(ada.baris, 1, 1, baris.length).setValues([baris]); else sh.appendRow(baris);
    return { ok: true, id: id, klienPraktisi: daftarKP_(email) };
  } finally {
    lock.releaseLock();
  }
}

function barisKP_(r) {
  const tgl = r[4] instanceof Date ? Utilities.formatDate(r[4], 'Asia/Jakarta', 'yyyy-MM-dd') : String(r[4]);
  const t = function (v) { return String(v == null ? '' : v).replace(/^'/, ''); };
  return { id: t(r[0]), nama: t(r[2]), jk: t(r[3]) === 'P' ? 'P' : 'L', tglLahir: tgl, cabor: t(r[5]), caborLain: t(r[6]), level: t(r[7]), email: t(r[8]), wa: t(r[9]).replace(/\D/g, ''), catatan: t(r[10]), dibuat: r[11], diperbarui: String(r[12]), jumlah: r[13], folder: t(r[14]), foto: t(r[15]) };
}

function cariKP_(email, id) {
  const sh = tab_('Klien Praktisi', KOLOM_KP);
  const n = sh.getLastRow();
  if (n < 2) return null;
  const v = sh.getRange(2, 1, n - 1, KOLOM_KP.length).getValues();
  for (let i = 0; i < v.length; i++) {
    if (String(v[i][0]) === id && String(v[i][1]).replace(/^'/, '').toLowerCase() === email) return { baris: i + 2, data: barisKP_(v[i]) };
  }
  return null;
}

function daftarKP_(email) {
  const sh = tab_('Klien Praktisi', KOLOM_KP);
  const n = sh.getLastRow();
  if (n < 2) return [];
  const v = sh.getRange(2, 1, n - 1, KOLOM_KP.length).getValues();
  const out = [];
  let per = null;
  v.forEach(function (r) {
    if (String(r[1]).replace(/^'/, '').toLowerCase() !== email) return;
    if (!per) per = riwayatPer_(email);
    const k = barisKP_(r);
    k.riwayat = per[k.id] || [];
    out.push(k);
  });
  return out;
}

function folderKP_(email, namaPraktisi, id, namaKlien) {
  const induk = folderKlien_(email, namaPraktisi);
  const props = PropertiesService.getScriptProperties();
  const key = 'kpfolder:' + id;
  const fid = props.getProperty(key);
  if (fid) { try { return DriveApp.getFolderById(fid); } catch (e) { /* dibuat ulang */ } }
  const f = induk.createFolder('Klien – ' + String(namaKlien).slice(0, 60) + ' (' + id + ')');
  props.setProperty(key, f.getId());
  const kp = cariKP_(email, id);
  if (kp) ss_().getSheetByName('Klien Praktisi').getRange(kp.baris, KOLOM_KP.indexOf('Folder') + 1).setValue(f.getUrl());
  return f;
}

/* ---------- Foto profil ---------- */

function isAdmin_(email) { return KONS.ADMIN.map(function (e) { return e.toLowerCase(); }).indexOf(email) >= 0; }

function fotoBase64_(id) {
  if (!id) return '';
  try { return 'data:image/jpeg;base64,' + Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes()); } catch (e) { return ''; }
}

/** Simpan foto (JPEG persegi, sudah diperkecil di browser) ke folder klien; ganti foto lama. */
function konsFoto_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(d.foto || ''));
  if (!m) return { ok: false, pesan: 'Format foto tidak dikenali.' };
  if (m[1].length > 400000) return { ok: false, pesan: 'Foto terlalu besar.' };
  const akun = cariKlien_(email);
  if (!akun) return { ok: false, pesan: 'Lengkapi profil terlebih dahulu.' };
  const klienId = bersih_(d.klienId, 40);
  let kp = null, folder;
  if (klienId) {
    kp = cariKP_(email, klienId);
    if (!kp) return { ok: false, pesan: 'Klien tidak ditemukan.' };
    folder = folderKP_(email, akun.data.nama, klienId, kp.data.nama);
  } else {
    folder = folderKlien_(email, akun.data.nama);
  }
  const blob = Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/jpeg', 'foto-profil.jpg');
  const lama = kp ? kp.data.foto : akun.data.foto;
  if (lama) { try { DriveApp.getFileById(lama).setTrashed(true); } catch (e) { /* sudah tidak ada */ } }
  const file = folder.createFile(blob);
  if (kp) ss_().getSheetByName('Klien Praktisi').getRange(kp.baris, KOLOM_KP.indexOf('Foto') + 1).setValue(file.getId());
  else setSel_('Klien', akun.baris, 'Foto', file.getId());
  return { ok: true };
}

/** Ambil foto: milik sendiri, klien praktisi milik sendiri, atau (admin) foto siapa pun. */
function konsFotoAmbil_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const klienId = bersih_(d.klienId, 40);
  const target = bersih_(d.email, 120).toLowerCase();
  if (klienId) {
    const pemilik = isAdmin_(email) && target ? target : email;
    const kp = cariKP_(pemilik, klienId);
    return { ok: true, foto: kp ? fotoBase64_(kp.data.foto) : '' };
  }
  if (target && target !== email && !isAdmin_(email)) return { ok: false, pesan: 'Tidak diizinkan.' };
  const k = cariKlien_(target || email);
  return { ok: true, foto: k ? fotoBase64_(k.data.foto) : '' };
}

/* ---------- Dashboard pengelola ---------- */

function konsAdmin_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  if (!isAdmin_(email)) return { ok: false, pesan: 'Dashboard hanya untuk pengelola.' };
  const ringkasR = function (list) {
    return list.map(function (r) {
      const i = r.input || {};
      return { id: r.id, tanggal: i.tanggal || String(r.waktu).slice(0, 10), bb: i.bb, tb: i.tb, tujuan: i.tujuan, fase: i.fase, tujuanKonsultasi: String(i.tujuanKonsultasi || '').slice(0, 600), catatanPraktisi: String(i.catatanPraktisi || '').slice(0, 600), reds: i.reds || [], ringkas: r.ringkas || {}, laporan: r.laporan };
    });
  };
  // Klien (akun sendiri).
  const out = [];
  const shK = tab_('Klien', KOLOM_KLIEN);
  const nK = shK.getLastRow();
  const vK = nK > 1 ? shK.getRange(2, 1, nK - 1, KOLOM_KLIEN.length).getValues() : [];
  const semua = semuaRiwayat_();
  vK.forEach(function (r) {
    const em = String(r[0]).replace(/^'/, '').toLowerCase();
    if (!em) return;
    const k = cariKlienDariBaris_(em, r);
    out.push({ jenis: 'akun', email: em, nama: k.nama, jk: k.jk, tglLahir: k.tglLahir, asal: k.asal, wa: k.wa, cabor: k.cabor, caborLain: k.caborLain, level: k.level, peran: k.peran, profesi: k.profesi, terdaftar: String(r[8]), terakhir: String(r[9]), adaFoto: !!k.foto, folder: k.folder,
      riwayat: ringkasR((semua[em] || {})[''] || []) });
  });
  // Klien milik praktisi.
  const shP = tab_('Klien Praktisi', KOLOM_KP);
  const nP = shP.getLastRow();
  const vP = nP > 1 ? shP.getRange(2, 1, nP - 1, KOLOM_KP.length).getValues() : [];
  vP.forEach(function (r) {
    const k = barisKP_(r);
    const pem = String(r[1]).replace(/^'/, '').toLowerCase();
    const prak = out.filter(function (x) { return x.email === pem; })[0];
    out.push({ jenis: 'klien-praktisi', id: k.id, praktisiEmail: pem, praktisiNama: prak ? prak.nama : pem, email: k.email, nama: k.nama, jk: k.jk, tglLahir: k.tglLahir, wa: k.wa, cabor: k.cabor, caborLain: k.caborLain, level: k.level, catatan: k.catatan, terdaftar: String(k.dibuat), adaFoto: !!k.foto, folder: k.folder,
      riwayat: ringkasR((semua[pem] || {})[k.id] || []) });
  });
  return { ok: true, peserta: out, pembayaran: semuaBayar_(), permintaan: semuaTanya_(), paket: PAKET, bayarAktif: !!kunciMidtrans_(), dibuat: waktu_() };
}

function cariKlienDariBaris_(email, r) {
  const tgl = r[3] instanceof Date ? Utilities.formatDate(r[3], 'Asia/Jakarta', 'yyyy-MM-dd') : String(r[3]);
  const cab = String(r[6]).replace(/^'/, '').split(' – ');
  return { nama: String(r[1]).replace(/^'/, ''), jk: r[2], tglLahir: tgl, asal: String(r[4]).replace(/^'/, ''), wa: String(r[5]).replace(/\D/g, ''), cabor: cab[0], caborLain: cab[1] || '', level: String(r[7]).replace(/^'/, ''), folder: r[11], peran: String(r[12] || 'atlet'), profesi: String(r[13] || '').replace(/^'/, ''), foto: String(r[14] || '') };
}

/** Semua konsultasi, dikelompokkan email → klienId → daftar (sekali baca). */
function semuaRiwayat_() {
  const sh = tab_('Konsultasi', KOLOM_KONS);
  const n = sh.getLastRow();
  const out = {};
  if (n < 2) return out;
  sh.getRange(2, 1, n - 1, KOLOM_KONS.length).getValues().forEach(function (r) {
    const em = String(r[2]).replace(/^'/, '').toLowerCase();
    const kid = String(r[20] || '');
    let data = {};
    try { data = JSON.parse(String(r[19]).replace(/^'/, '')); } catch (e) { /* abaikan */ }
    out[em] = out[em] || {};
    (out[em][kid] = out[em][kid] || []).push({ id: r[0], waktu: String(r[1]), input: data.input || {}, ringkas: data.ringkas || {}, laporan: String(r[18] || '') });
  });
  return out;
}

/* ---------- Pembayaran konsultasi lanjutan (Midtrans Snap) ---------- */
// Alur: kons-bayar membuat tagihan Snap -> klien membayar di halaman Midtrans -> Midtrans mengirim
// notifikasi ke URL web app ini (doPost di Kode.gs meneruskan ke midtransNotif_) -> tanda tangan SHA-512
// diverifikasi dan status dicek ulang ke API Midtrans -> baris Pembayaran ditandai "lunas" -> email ke klien & pemilik.
// kons-status mengecek ulang ke API bila notifikasi terlambat, sehingga validasi tetap otomatis.

function kunciMidtrans_() { return PropertiesService.getScriptProperties().getProperty('MIDTRANS_SERVER_KEY') || ''; }
function produksiMidtrans_() { return PropertiesService.getScriptProperties().getProperty('MIDTRANS_PRODUKSI') === 'true'; }
function urlMidtrans_(jenis) {
  const prod = produksiMidtrans_();
  if (jenis === 'snap') return prod ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
  return prod ? 'https://api.midtrans.com/v2/' : 'https://api.sandbox.midtrans.com/v2/';
}
function authMidtrans_() { return 'Basic ' + Utilities.base64Encode(kunciMidtrans_() + ':'); }

function konsBayar_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  if (!kunciMidtrans_()) return { ok: false, pesan: 'Pembayaran online belum diaktifkan. Silakan hubungi ' + KONS.EMAIL_PEMILIK + '.' };
  const akun = cariKlien_(email);
  if (!akun) return { ok: false, pesan: 'Lengkapi profil terlebih dahulu.' };
  // Harga hanya dari keputusan admin pada permintaan, bukan dari pilihan klien.
  const t = cariTanya_(bersih_(d.permintaanId, 40));
  if (!t || t.data.email !== email) return { ok: false, pesan: 'Permintaan tidak ditemukan.' };
  if (t.data.status !== 'menunggu-bayar' || !(t.data.harga > 0)) return { ok: false, pesan: 'Permintaan ini tidak memerlukan pembayaran saat ini.' };
  const orderId = 'MK-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMddHHmmss') + '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
  const namaPaket = (t.data.paket || 'Konsultasi lanjutan').slice(0, 50);
  const body = {
    transaction_details: { order_id: orderId, gross_amount: t.data.harga },
    item_details: [{ id: t.data.id, price: t.data.harga, quantity: 1, name: namaPaket }],
    customer_details: { first_name: akun.data.nama.slice(0, 50), email: email, phone: akun.data.wa ? '+' + akun.data.wa : '' },
    callbacks: { finish: KONS.SITUS + '?bayar=' + encodeURIComponent(orderId) },
    expiry: { unit: 'hours', duration: 24 }
  };
  const res = UrlFetchApp.fetch(urlMidtrans_('snap'), { method: 'post', contentType: 'application/json', headers: { Authorization: authMidtrans_(), Accept: 'application/json' }, payload: JSON.stringify(body), muteHttpExceptions: true });
  let j = {};
  try { j = JSON.parse(res.getContentText()); } catch (e) { /* respons tidak valid */ }
  if (res.getResponseCode() >= 300 || !j.redirect_url) { console.error(res.getContentText()); return { ok: false, pesan: 'Gagal membuat tagihan. Coba lagi beberapa saat.' }; }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    tab_('Pembayaran', KOLOM_BAYAR).appendRow([orderId, waktu_(), aman_(email), aman_(t.data.nama), aman_(namaPaket), t.data.harga, 'menunggu', '', '', t.data.klienId, aman_(t.data.topik), '', waktu_(), t.data.id]);
    setTanya_(t.baris, { 'Order ID': orderId });
  } finally { lock.releaseLock(); }
  return { ok: true, orderId: orderId, redirect: j.redirect_url };
}

/** Dipanggil dari doPost (Kode.gs) untuk notifikasi HTTP Midtrans. */
function midtransNotif_(d) {
  const kunci = kunciMidtrans_();
  if (!kunci) return { ok: false };
  const sig = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_512, String(d.order_id) + String(d.status_code) + String(d.gross_amount) + kunci)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
  if (sig !== String(d.signature_key)) { console.warn('Tanda tangan Midtrans tidak cocok: ' + d.order_id); return { ok: false }; }
  // Validasi ganda: ambil status resmi langsung dari API Midtrans.
  const resmi = statusMidtrans_(String(d.order_id)) || d;
  terapkanStatus_(String(d.order_id), resmi);
  return { ok: true };
}

function statusMidtrans_(orderId) {
  const res = UrlFetchApp.fetch(urlMidtrans_('api') + encodeURIComponent(orderId) + '/status', { headers: { Authorization: authMidtrans_(), Accept: 'application/json' }, muteHttpExceptions: true });
  try { const j = JSON.parse(res.getContentText()); return j && j.transaction_status ? j : null; } catch (e) { return null; }
}

function petaStatus_(m) {
  const t = String(m.transaction_status || '');
  if (t === 'settlement' || (t === 'capture' && String(m.fraud_status || 'accept') === 'accept')) return 'lunas';
  if (t === 'pending' || t === 'authorize' || (t === 'capture' && m.fraud_status === 'challenge')) return 'menunggu';
  if (t === 'expire') return 'kedaluwarsa';
  if (t === 'refund' || t === 'partial_refund') return 'dikembalikan';
  if (t === 'deny' || t === 'cancel' || t === 'failure') return 'gagal';
  return 'menunggu';
}

function cariBayar_(orderId) {
  const sh = tab_('Pembayaran', KOLOM_BAYAR);
  const n = sh.getLastRow();
  if (n < 2) return null;
  const v = sh.getRange(2, 1, n - 1, KOLOM_BAYAR.length).getValues();
  for (let i = 0; i < v.length; i++) if (String(v[i][0]) === orderId) return { baris: i + 2, r: v[i] };
  return null;
}

function terapkanStatus_(orderId, m) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let baru = false, row;
  try {
    row = cariBayar_(orderId);
    if (!row) return null;
    // Nilai yang dibayar harus sama dengan tagihan.
    if (m.gross_amount && Math.round(Number(m.gross_amount)) !== Math.round(Number(row.r[5]))) { console.warn('Nominal tidak cocok: ' + orderId); return row; }
    const st = petaStatus_(m);
    const lama = String(row.r[6]);
    const sh = ss_().getSheetByName('Pembayaran');
    sh.getRange(row.baris, 7, 1, 7).setValues([[st, String(m.payment_type || row.r[7] || ''), st === 'lunas' ? (row.r[8] || waktu_()) : row.r[8], row.r[9], row.r[10], m.manual ? row.r[11] : String(m.transaction_status || ''), waktu_()]]); // kolom 14 (ID permintaan) tidak diubah
    baru = st === 'lunas' && lama !== 'lunas';
    row = cariBayar_(orderId);
  } finally { lock.releaseLock(); }
  if (baru) {
    kabariLunas_(row.r);
    const tid = String(row.r[13] || '');
    const t = tid ? cariTanya_(tid) : null;
    if (t && t.data.status === 'menunggu-bayar') {
      setTanya_(t.baris, { 'Status': 'lunas' });
      try { MailApp.sendEmail({ to: KONS.EMAIL_PEMILIK, name: 'Konsultasi Gizi murykuswari.com', subject: 'Siap dijawab (lunas): ' + t.data.topik + ' – ' + t.data.nama, htmlBody: '<p>Permintaan dari <b>' + esc_(t.data.nama) + '</b> sudah dibayar dan siap Anda jawab di dashboard.</p><p><i>' + esc_(t.data.pertanyaan) + '</i></p><p>https://murykuswari.com/dashboard.html</p>' }); } catch (e) { console.error(e); }
    }
  }
  return row;
}

function kabariLunas_(r) {
  const email = String(r[2]).replace(/^'/, ''), nama = String(r[3]).replace(/^'/, ''), paket = String(r[4]).replace(/^'/, '');
  const rp = 'Rp' + Number(r[5]).toLocaleString('id-ID');
  const jadwal = KONS.JADWAL_URL ? '<p>Pilih jadwal sesi Anda di sini: <a href="' + KONS.JADWAL_URL + '">' + KONS.JADWAL_URL + '</a></p>' : '<p>Tim Dr. Mury akan menghubungi Anda melalui email atau WhatsApp dalam 1×24 jam untuk menjadwalkan sesi.</p>';
  try {
    MailApp.sendEmail({ to: email, replyTo: KONS.EMAIL_PEMILIK, name: 'Konsultasi Gizi murykuswari.com', subject: 'Pembayaran diterima – ' + paket,
      htmlBody: '<p>Halo ' + esc_(nama) + ',</p><p>Pembayaran <b>' + esc_(paket) + '</b> sebesar <b>' + rp + '</b> (order ' + esc_(r[0]) + ') sudah kami terima dan terverifikasi.</p>' + jadwal + '<p>Sambil menunggu, perbarui data asesmen Anda di <a href="' + KONS.SITUS + '">' + KONS.SITUS + '</a> agar sesi lebih efektif.</p><p>Salam,<br>Assoc. Prof. Dr. Mury Kuswari</p>' });
    MailApp.sendEmail({ to: KONS.EMAIL_PEMILIK, replyTo: email, name: 'Konsultasi Gizi murykuswari.com', subject: 'LUNAS: ' + paket + ' – ' + nama,
      htmlBody: '<p><b>' + esc_(nama) + '</b> (' + esc_(email) + ') membayar <b>' + esc_(paket) + '</b> ' + rp + '. Order ' + esc_(r[0]) + ', metode ' + esc_(r[7]) + '.</p><p>Catatan klien: ' + esc_(r[10]) + '</p><p>Lihat profil dan riwayatnya di dashboard: https://murykuswari.com/dashboard.html</p>' });
  } catch (e) { console.error(e); }
}

function konsStatus_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const orderId = bersih_(d.orderId, 40);
  let row = cariBayar_(orderId);
  if (!row || String(row.r[2]).replace(/^'/, '').toLowerCase() !== email) return { ok: false, pesan: 'Pesanan tidak ditemukan.' };
  if (String(row.r[6]) === 'menunggu' && kunciMidtrans_() && String(row.r[7]).indexOf('dompet') !== 0) {
    const m = statusMidtrans_(orderId);
    if (m) row = terapkanStatus_(orderId, m) || row;
  }
  return { ok: true, status: String(row.r[6]), jadwal: KONS.JADWAL_URL, pembayaran: daftarBayar_(email), permintaan: daftarTanya_(email) };
}

function barisBayar_(r) {
  return { orderId: String(r[0]), dibuat: String(r[1]), email: String(r[2]).replace(/^'/, ''), nama: String(r[3]).replace(/^'/, ''), paket: String(r[4]).replace(/^'/, ''), jumlah: Number(r[5]), status: String(r[6]), metode: String(r[7]), dibayar: String(r[8]), klienId: String(r[9]), permintaanId: String(r[13] || ''), bukti: String(r[14] || ''), info: String(r[11] || '').replace(/^'/, ''), catatanVerifikasi: String(r[15] || '').replace(/^'/, '') };
}
function daftarBayar_(email) {
  const sh = tab_('Pembayaran', KOLOM_BAYAR);
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, KOLOM_BAYAR.length).getValues().filter(function (r) { return String(r[2]).replace(/^'/, '').toLowerCase() === email; }).map(barisBayar_).slice(-20);
}
function semuaBayar_() {
  const sh = tab_('Pembayaran', KOLOM_BAYAR);
  const n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, KOLOM_BAYAR.length).getValues().map(barisBayar_);
}


/* ---------- Pembayaran langsung ke e-wallet pemilik (verifikasi oleh admin) ---------- */

/** Buat (atau pakai ulang) tagihan transfer dengan kode unik 3 digit untuk satu permintaan berbayar. */
function buatTagihanDompet_(t) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const semua = semuaBayar_();
    // Tagihan transfer yang masih terbuka untuk permintaan ini dipakai ulang bila harga belum berubah.
    const ada = semua.filter(function (b) { return b.permintaanId === t.data.id && b.metode.indexOf('dompet') === 0 && (b.status === 'menunggu' || b.status === 'dicek'); })[0];
    if (ada && ada.jumlah - t.data.harga >= 101 && ada.jumlah - t.data.harga <= 999) return { orderId: ada.orderId, jumlah: ada.jumlah };
    if (ada) setBayar_(ada.orderId, { 'Status': 'gagal', 'Catatan verifikasi': 'Diganti tagihan baru (harga berubah).' });
    const dipakai = {};
    semua.forEach(function (b) { if (b.status === 'menunggu' || b.status === 'dicek') dipakai[b.jumlah] = 1; });
    let jumlah = 0;
    for (let i = 0; i < 50 && !jumlah; i++) { const c = t.data.harga + 101 + Math.floor(Math.random() * 899); if (!dipakai[c]) jumlah = c; }
    if (!jumlah) jumlah = t.data.harga + 101 + Math.floor(Math.random() * 899);
    const orderId = 'MK-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMddHHmmss') + '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
    tab_('Pembayaran', KOLOM_BAYAR).appendRow([orderId, waktu_(), aman_(t.data.email), aman_(t.data.nama), aman_((t.data.paket || 'Konsultasi lanjutan').slice(0, 80)), jumlah, 'menunggu', 'dompet', '', t.data.klienId, aman_(t.data.topik), '', waktu_(), t.data.id, '', '', '']);
    setTanya_(t.baris, { 'Order ID': orderId });
    return { orderId: orderId, jumlah: jumlah };
  } finally { lock.releaseLock(); }
}

/** Batalkan tagihan transfer yang masih terbuka bila keputusan diubah menjadi gratis atau tolak. */
function batalkanTagihanTerbuka_(t, alasan) {
  semuaBayar_().forEach(function (b) {
    if (b.permintaanId === t.data.id && b.metode.indexOf('dompet') === 0 && b.status === 'menunggu') setBayar_(b.orderId, { 'Status': 'gagal', 'Catatan verifikasi': alasan });
  });
}

/** Klien memilih bayar via e-wallet/transfer: buat tagihan dengan kode unik 3 digit agar mudah dicocokkan. */
function konsBayarDompet_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const t = cariTanya_(bersih_(d.permintaanId, 40));
  if (!t || t.data.email !== email) return { ok: false, pesan: 'Permintaan tidak ditemukan.' };
  if (t.data.status !== 'menunggu-bayar' || !(t.data.harga > 0)) return { ok: false, pesan: 'Permintaan ini tidak memerlukan pembayaran saat ini.' };
  const tg = buatTagihanDompet_(t);
  return { ok: true, orderId: tg.orderId, jumlah: tg.jumlah, pembayaran: daftarBayar_(email), permintaan: daftarTanya_(email) };
}

/** Email instruksi pembayaran lengkap: rincian tagihan, tujuan pembayaran, langkah konfirmasi. */
function htmlInstruksiBayar_(t, paket, harga, tg, catatan) {
  const rp = function (n) { return 'Rp' + Number(n).toLocaleString('id-ID'); };
  const kode = tg.jumlah - harga;
  const batas = Utilities.formatDate(new Date(Date.now() + PEMBAYARAN.batasJam * 3600 * 1000), 'Asia/Jakarta', "d MMMM yyyy, HH:mm 'WIB'");
  const td = 'padding:10px 14px;border-bottom:1px solid #e3e7ec;font-size:14px;';
  const baris = function (a, b, tebal) { return '<tr><td style="' + td + 'color:#55657a;">' + a + '</td><td style="' + td + 'text-align:right;' + (tebal ? 'font-weight:800;color:#003a63;font-size:18px;' : 'color:#1f2a37;') + '">' + b + '</td></tr>'; };
  const tujuan = [];
  PEMBAYARAN.dompet.filter(function (w) { return String(w.nomor || '').trim(); }).forEach(function (w) {
    tujuan.push('<tr><td style="' + td + '"><b>' + esc_(w.nama) + '</b></td><td style="' + td + 'font-family:monospace;font-size:15px;">' + esc_(w.nomor) + '</td><td style="' + td + 'color:#55657a;">' + (w.atasNama ? 'a.n. ' + esc_(w.atasNama) : '') + '</td></tr>');
  });
  PEMBAYARAN.rekening.filter(function (b) { return String(b.nomor || '').trim(); }).forEach(function (b) {
    tujuan.push('<tr><td style="' + td + '"><b>Transfer ' + esc_(b.bank) + '</b></td><td style="' + td + 'font-family:monospace;font-size:15px;">' + esc_(b.nomor) + '</td><td style="' + td + 'color:#55657a;">' + (b.atasNama ? 'a.n. ' + esc_(b.atasNama) : '') + '</td></tr>');
  });
  const wa = PEMBAYARAN.whatsapp ? 'https://wa.me/' + PEMBAYARAN.whatsapp + '?text=' + encodeURIComponent('Halo Dr. Mury, saya sudah membayar konsultasi lanjutan ' + paket + ' sebesar ' + rp(tg.jumlah) + ' (order ' + tg.orderId + '). Bukti transfer saya lampirkan.') : '';
  const tombol = function (href, label, warna) { return '<a href="' + href + '" style="display:inline-block;background:' + warna + ';color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;margin:4px 6px 4px 0;font-size:14px;">' + label + '</a>'; };
  return '<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2a37;max-width:620px;line-height:1.55;">' +
    '<p>Halo ' + esc_(t.data.nama) + ',</p>' +
    '<p>Terima kasih atas permintaan konsultasi Anda tentang <b>' + esc_(t.data.topik) + '</b>. Setelah saya telaah bersama profil dan riwayat program Anda, permintaan ini saya tangani melalui <b>' + esc_(paket) + '</b>.</p>' +
    (catatan ? '<p style="background:#f4f8fc;border-left:4px solid #0070b8;padding:10px 14px;margin:14px 0;"><b>Catatan Dr. Mury:</b> ' + esc_(catatan) + '</p>' : '') +
    '<h3 style="color:#003a63;margin:22px 0 8px;font-size:16px;">1. Rincian tagihan</h3>' +
    '<table style="border-collapse:collapse;width:100%;border:1px solid #e3e7ec;border-radius:10px;">' +
      baris('Layanan', esc_(paket)) + baris('Biaya konsultasi', rp(harga)) + baris('Kode unik verifikasi', '+' + rp(kode)) + baris('Total yang ditransfer', rp(tg.jumlah), true) +
      baris('Nomor order', esc_(tg.orderId)) + baris('Bayar sebelum', batas) +
    '</table>' +
    '<p style="font-size:13px;color:#55657a;margin:8px 0 0;">Mohon transfer <b>tepat ' + rp(tg.jumlah) + '</b>. Tiga digit terakhir adalah kode unik agar pembayaran Anda langsung dikenali.</p>' +
    '<h3 style="color:#003a63;margin:22px 0 8px;font-size:16px;">2. Tujuan pembayaran</h3>' +
    (tujuan.length ? '<table style="border-collapse:collapse;width:100%;border:1px solid #e3e7ec;">' + tujuan.join('') + '</table>' : '<p>Nomor tujuan pembayaran akan dikirim terpisah oleh Dr. Mury.</p>') +
    (PEMBAYARAN.qris ? '<p style="margin:12px 0 0;">Atau pindai QRIS berikut dengan aplikasi e-wallet/m-banking apa pun, lalu masukkan nominal ' + rp(tg.jumlah) + ':<br><img src="' + PEMBAYARAN.qris + '" alt="QRIS" width="220" style="margin-top:8px;border:1px solid #e3e7ec;border-radius:8px;"></p>' : '') +
    (kunciMidtrans_() ? '<p style="margin:12px 0 0;">Tersedia juga pembayaran online (QRIS, virtual account, e-wallet) yang diverifikasi otomatis dari halaman konsultasi.</p>' : '') +
    '<h3 style="color:#003a63;margin:22px 0 8px;font-size:16px;">3. Konfirmasi pembayaran</h3>' +
    '<ol style="padding-left:20px;margin:0;">' +
      '<li>Simpan tangkapan layar bukti transfer.</li>' +
      '<li>Buka <a href="' + KONS.SITUS + '">' + KONS.SITUS + '</a>, masuk dengan email ini, lalu klik <b>Saya sudah bayar</b> pada permintaan Anda dan unggah bukti. Anda juga boleh <b>membalas email ini</b> dengan melampirkan bukti transfer' + (wa ? ' atau mengirimkannya lewat WhatsApp' : '') + '.</li>' +
      '<li>Saya akan mencocokkan pembayaran (biasanya kurang dari 1×24 jam) dan mengirim email <b>Pembayaran diterima</b>, lalu konsultasi lanjutan Anda segera saya kerjakan.</li>' +
    '</ol>' +
    '<p style="margin:18px 0 6px;">' + tombol(KONS.SITUS, 'Konfirmasi & unggah bukti', '#f05828') + (wa ? tombol(wa, 'Kirim bukti via WhatsApp', '#25a244') : '') + '</p>' +
    '<p style="font-size:13px;color:#55657a;">Bila tagihan melewati batas waktu, cukup balas email ini dan saya buatkan tagihan baru. Pembayaran hanya ke nomor di atas; saya tidak pernah meminta transfer ke nomor lain.</p>' +
    '<p>Salam sehat dan bugar,<br><b>Assoc. Prof. Dr. Mury Kuswari, S.Pd., M.Si</b><br>Dosen Peneliti Gizi Olahraga &amp; Kebugaran · Universitas Esa Unggul<br><a href="https://murykuswari.com">murykuswari.com</a></p>' +
  '</div>';
}

/** Klien menyatakan sudah membayar: pilih dompet tujuan dan (sebaiknya) unggah bukti. Admin lalu mengonfirmasi. */
function konsKonfirmasi_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const orderId = bersih_(d.orderId, 40);
  const row = cariBayar_(orderId);
  if (!row || String(row.r[2]).replace(/^'/, '').toLowerCase() !== email) return { ok: false, pesan: 'Tagihan tidak ditemukan.' };
  if (String(row.r[7]).indexOf('dompet') !== 0) return { ok: false, pesan: 'Tagihan ini dibayar lewat pembayaran online.' };
  if (['menunggu', 'dicek'].indexOf(String(row.r[6])) < 0) return { ok: false, pesan: 'Tagihan ini sudah ' + row.r[6] + '.' };
  const dompet = DOMPET_SAH.indexOf(d.dompet) >= 0 ? d.dompet : '';
  if (!dompet) return { ok: false, pesan: 'Pilih dompet tujuan pembayaran.' };
  const pengirim = bersih_(d.pengirim, 80);
  let bukti = String(row.r[14] || '');
  if (d.bukti) {
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(d.bukti));
    if (!m) return { ok: false, pesan: 'Format bukti tidak dikenali.' };
    if (m[1].length > 1500000) return { ok: false, pesan: 'Gambar bukti terlalu besar.' };
    const akun = cariKlien_(email);
    const folder = folderKlien_(email, akun ? akun.data.nama : email);
    const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[1]), 'image/jpeg', 'bukti-bayar-' + orderId + '.jpg'));
    bukti = file.getUrl();
  }
  if (!bukti && !pengirim) return { ok: false, pesan: 'Unggah bukti pembayaran atau tulis nama/nomor akun pengirim.' };
  setBayar_(orderId, { 'Status': 'dicek', 'Metode': 'dompet:' + dompet, 'Bukti': bukti, 'Status Midtrans': pengirim ? 'pengirim: ' + aman_(pengirim) : '' });
  const r = cariBayar_(orderId).r;
  const rp = 'Rp' + Number(r[5]).toLocaleString('id-ID');
  try {
    MailApp.sendEmail({ to: KONS.EMAIL_PEMILIK, replyTo: email, name: 'Konsultasi Gizi murykuswari.com', subject: 'Cek pembayaran ' + dompet + ' ' + rp + ' – ' + String(r[3]).replace(/^'/, ''),
      htmlBody: '<p><b>' + esc_(String(r[3]).replace(/^'/, '')) + '</b> (' + esc_(email) + ') menyatakan sudah membayar <b>' + rp + '</b> ke <b>' + esc_(dompet) + '</b> untuk ' + esc_(String(r[4]).replace(/^'/, '')) + '.</p>' +
        (pengirim ? '<p>Akun pengirim: ' + esc_(pengirim) + '</p>' : '') + (bukti ? '<p>Bukti: <a href="' + bukti + '">' + bukti + '</a></p>' : '') +
        '<p>Cocokkan nominal <b>' + rp + '</b> (3 digit terakhir = kode unik) di riwayat ' + esc_(dompet) + ' Anda, lalu klik <b>Konfirmasi lunas</b> di dashboard: https://murykuswari.com/dashboard.html</p>' });
  } catch (e) { console.error(e); }
  return { ok: true, status: 'dicek', pembayaran: daftarBayar_(email), permintaan: daftarTanya_(email) };
}

/** Admin mengonfirmasi (lunas) atau menolak bukti pembayaran e-wallet. */
function konsVerifikasi_(d) {
  const admin = sesi_(d);
  if (!admin) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  if (!isAdmin_(admin)) return { ok: false, pesan: 'Hanya pengelola.' };
  const orderId = bersih_(d.orderId, 40);
  const row = cariBayar_(orderId);
  if (!row) return { ok: false, pesan: 'Tagihan tidak ditemukan.' };
  if (String(row.r[7]).indexOf('dompet') !== 0) return { ok: false, pesan: 'Pembayaran online diverifikasi otomatis.' };
  if (['menunggu', 'dicek'].indexOf(String(row.r[6])) < 0) return { ok: false, pesan: 'Tagihan ini sudah ' + row.r[6] + '.' };
  const catatan = bersih_(d.catatan, 500);
  if (d.terima === true) {
    setBayar_(orderId, { 'Catatan verifikasi': aman_(catatan), 'Diverifikasi oleh': admin });
    terapkanStatus_(orderId, { transaction_status: 'settlement', payment_type: String(row.r[7]), gross_amount: row.r[5], manual: true });
  } else {
    if (!catatan) return { ok: false, pesan: 'Tulis alasan penolakan untuk klien.' };
    setBayar_(orderId, { 'Status': 'gagal', 'Catatan verifikasi': aman_(catatan), 'Diverifikasi oleh': admin });
    const tid = String(row.r[13] || '');
    const t = tid ? cariTanya_(tid) : null;
    if (t && t.data.orderId === orderId) setTanya_(t.baris, { 'Order ID': '' });
    const email = String(row.r[2]).replace(/^'/, '');
    try {
      MailApp.sendEmail({ to: email, replyTo: KONS.EMAIL_PEMILIK, name: 'Konsultasi Gizi murykuswari.com', subject: 'Pembayaran belum dapat dikonfirmasi',
        htmlBody: '<p>Halo ' + esc_(String(row.r[3]).replace(/^'/, '')) + ',</p><p>Pembayaran Rp' + Number(row.r[5]).toLocaleString('id-ID') + ' (order ' + esc_(orderId) + ') belum dapat kami konfirmasi.</p><p><b>Alasan:</b> ' + esc_(catatan) + '</p><p>Silakan buka <a href="' + KONS.SITUS + '">' + KONS.SITUS + '</a> untuk membayar ulang atau membalas email ini bila Anda yakin sudah membayar.</p><p>Salam,<br>Assoc. Prof. Dr. Mury Kuswari</p>' });
    } catch (e) { console.error(e); }
  }
  return { ok: true, pembayaran: semuaBayar_(), permintaan: semuaTanya_() };
}

function setBayar_(orderId, nilai) {
  const row = cariBayar_(orderId);
  if (!row) return;
  const sh = ss_().getSheetByName('Pembayaran');
  Object.keys(nilai).forEach(function (k) { sh.getRange(row.baris, KOLOM_BAYAR.indexOf(k) + 1).setValue(nilai[k]); });
  sh.getRange(row.baris, KOLOM_BAYAR.indexOf('Diperbarui') + 1).setValue(waktu_());
}

/* ---------- Permintaan konsultasi lanjutan (keputusan admin) ---------- */

function barisTanya_(r) {
  const t = function (v) { return String(v == null ? '' : v).replace(/^'/, ''); };
  return { id: t(r[0]), dibuat: t(r[1]), email: t(r[2]).toLowerCase(), nama: t(r[3]), klienId: t(r[4]), topik: t(r[5]), pertanyaan: t(r[6]), status: t(r[7]), jenis: t(r[8]), paket: t(r[9]), harga: Number(r[10]) || 0, catatan: t(r[11]), orderId: t(r[12]), jawaban: t(r[13]), dijawab: t(r[14]), diperbarui: t(r[15]) };
}
function semuaTanya_() {
  const sh = tab_('Permintaan', KOLOM_TANYA);
  const n = sh.getLastRow();
  return n < 2 ? [] : sh.getRange(2, 1, n - 1, KOLOM_TANYA.length).getValues().map(barisTanya_);
}
function daftarTanya_(email) { return semuaTanya_().filter(function (t) { return t.email === email; }).slice(-30); }
function cariTanya_(id) {
  if (!id) return null;
  const sh = tab_('Permintaan', KOLOM_TANYA);
  const n = sh.getLastRow();
  if (n < 2) return null;
  const v = sh.getRange(2, 1, n - 1, KOLOM_TANYA.length).getValues();
  for (let i = 0; i < v.length; i++) if (String(v[i][0]) === id) return { baris: i + 2, data: barisTanya_(v[i]) };
  return null;
}
function setTanya_(baris, nilai) {
  const sh = ss_().getSheetByName('Permintaan');
  Object.keys(nilai).forEach(function (k) { sh.getRange(baris, KOLOM_TANYA.indexOf(k) + 1).setValue(nilai[k]); });
  sh.getRange(baris, KOLOM_TANYA.indexOf('Diperbarui') + 1).setValue(waktu_());
}

/** Klien mengajukan pertanyaan/masalah. Belum ada pembayaran; admin memutuskan dulu. */
function konsTanya_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const akun = cariKlien_(email);
  if (!akun) return { ok: false, pesan: 'Lengkapi profil terlebih dahulu.' };
  const topik = TOPIK.indexOf(d.topik) >= 0 ? d.topik : 'Lainnya';
  const tanya = bersih_(d.pertanyaan, 3000);
  if (tanya.length < 30) return { ok: false, pesan: 'Jelaskan masalah Anda minimal 30 karakter.' };
  const terbuka = daftarTanya_(email).filter(function (t) { return t.status === 'menunggu-keputusan'; }).length;
  if (terbuka >= 3) return { ok: false, pesan: 'Masih ada 3 permintaan yang menunggu ditinjau. Mohon tunggu jawabannya.' };
  const klienId = bersih_(d.klienId, 40);
  let nama = akun.data.nama;
  if (klienId) { const kp = cariKP_(email, klienId); if (!kp) return { ok: false, pesan: 'Klien tidak ditemukan.' }; nama = kp.data.nama + ' (via ' + akun.data.nama + ')'; }
  const id = 'Q' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMddHHmmss') + Utilities.getUuid().slice(0, 3).toUpperCase();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    tab_('Permintaan', KOLOM_TANYA).appendRow([id, waktu_(), aman_(email), aman_(nama), klienId, aman_(topik), aman_(tanya), 'menunggu-keputusan', '', '', '', '', '', '', '', waktu_()]);
  } finally { lock.releaseLock(); }
  try {
    MailApp.sendEmail({ to: KONS.EMAIL_PEMILIK, replyTo: email, name: 'Konsultasi Gizi murykuswari.com', subject: 'Permintaan konsultasi baru: ' + topik + ' – ' + nama,
      htmlBody: '<p><b>' + esc_(nama) + '</b> (' + esc_(email) + ', WA ' + esc_(akun.data.wa) + ')</p><p><b>' + esc_(topik) + '</b></p><p>' + esc_(tanya) + '</p><p>Tentukan gratis atau berbayar di dashboard: https://murykuswari.com/dashboard.html</p>' });
  } catch (e) { console.error(e); }
  return { ok: true, id: id, permintaan: daftarTanya_(email) };
}

/** Admin memutuskan: gratis, berbayar (paket atau harga sendiri), atau tolak. */
function konsPutus_(d) {
  const admin = sesi_(d);
  if (!admin) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  if (!isAdmin_(admin)) return { ok: false, pesan: 'Hanya pengelola.' };
  const t = cariTanya_(bersih_(d.id, 40));
  if (!t) return { ok: false, pesan: 'Permintaan tidak ditemukan.' };
  if (['menunggu-keputusan', 'menunggu-bayar'].indexOf(t.data.status) < 0) return { ok: false, pesan: 'Permintaan ini sudah diproses (' + t.data.status + ').' };
  const catatan = bersih_(d.catatan, 1500);
  let nilai, subjek, isi, berbayar = null;
  if (d.jenis === 'gratis') {
    nilai = { 'Status': 'gratis', 'Jenis': 'gratis', 'Paket': '', 'Harga (Rp)': 0, 'Catatan admin': catatan };
    subjek = 'Konsultasi Anda diterima (gratis)';
    isi = '<p>Permintaan konsultasi Anda tentang <b>' + esc_(t.data.topik) + '</b> diterima tanpa biaya. Jawaban akan dikirim melalui email dan dapat dilihat di ' + KONS.SITUS + '.</p>';
  } else if (d.jenis === 'berbayar') {
    const pk = PAKET.filter(function (p) { return p.id === d.paket; })[0];
    const harga = Math.round(Number(d.harga || (pk && pk.harga) || 0));
    if (!(harga >= 10000 && harga <= 100000000)) return { ok: false, pesan: 'Isi harga yang valid (minimal Rp10.000).' };
    const namaPaket = bersih_(d.namaPaket || (pk && pk.nama) || 'Konsultasi lanjutan', 80);
    nilai = { 'Status': 'menunggu-bayar', 'Jenis': 'berbayar', 'Paket': namaPaket, 'Harga (Rp)': harga, 'Catatan admin': catatan };
    subjek = 'Konfirmasi konsultasi lanjutan & instruksi pembayaran: ' + namaPaket;
    berbayar = { paket: namaPaket, harga: harga };
  } else if (d.jenis === 'tolak') {
    nilai = { 'Status': 'ditolak', 'Jenis': 'ditolak', 'Catatan admin': catatan };
    subjek = 'Tentang permintaan konsultasi Anda';
    isi = '<p>Terima kasih atas permintaan konsultasi tentang <b>' + esc_(t.data.topik) + '</b>. Saat ini permintaan tersebut belum dapat kami layani.</p>';
  } else return { ok: false, pesan: 'Pilih gratis, berbayar, atau tolak.' };
  setTanya_(t.baris, nilai);
  let htmlBody;
  if (berbayar) {
    const t2 = cariTanya_(t.data.id);
    const tg = buatTagihanDompet_(t2);
    htmlBody = htmlInstruksiBayar_(t2, berbayar.paket, berbayar.harga, tg, catatan);
  } else {
    batalkanTagihanTerbuka_(t, 'Keputusan diubah menjadi ' + d.jenis + '.');
    htmlBody = '<p>Halo ' + esc_(t.data.nama) + ',</p>' + isi + (catatan ? '<p><b>Catatan Dr. Mury:</b> ' + esc_(catatan) + '</p>' : '') + '<p>Salam,<br>Assoc. Prof. Dr. Mury Kuswari</p>';
  }
  try {
    MailApp.sendEmail({ to: t.data.email, replyTo: KONS.EMAIL_PEMILIK, name: 'Konsultasi Gizi murykuswari.com', subject: subjek, htmlBody: htmlBody });
  } catch (e) { console.error(e); }
  return { ok: true, permintaan: semuaTanya_(), pembayaran: semuaBayar_() };
}

/** Admin menjawab permintaan yang gratis atau sudah lunas. */
function konsJawab_(d) {
  const admin = sesi_(d);
  if (!admin) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  if (!isAdmin_(admin)) return { ok: false, pesan: 'Hanya pengelola.' };
  const t = cariTanya_(bersih_(d.id, 40));
  if (!t) return { ok: false, pesan: 'Permintaan tidak ditemukan.' };
  if (['gratis', 'lunas', 'dijawab'].indexOf(t.data.status) < 0) return { ok: false, pesan: t.data.status === 'menunggu-bayar' ? 'Menunggu pembayaran klien.' : 'Tentukan gratis atau berbayar terlebih dahulu.' };
  const jawaban = bersih_(d.jawaban, 10000);
  if (jawaban.length < 10) return { ok: false, pesan: 'Tulis jawaban.' };
  setTanya_(t.baris, { 'Status': 'dijawab', 'Jawaban': aman_(jawaban), 'Dijawab': waktu_() });
  try {
    MailApp.sendEmail({ to: t.data.email, replyTo: KONS.EMAIL_PEMILIK, name: 'Konsultasi Gizi murykuswari.com', subject: 'Jawaban konsultasi: ' + t.data.topik,
      htmlBody: '<p>Halo ' + esc_(t.data.nama) + ',</p><p><b>Pertanyaan Anda:</b><br>' + esc_(t.data.pertanyaan) + '</p><p><b>Jawaban Dr. Mury:</b><br>' + esc_(jawaban).replace(/\n/g, '<br>') + '</p><p>Jawaban ini juga tersimpan di ' + KONS.SITUS + '.</p><p>Salam,<br>Assoc. Prof. Dr. Mury Kuswari</p>' });
  } catch (e) { console.error(e); }
  return { ok: true, permintaan: semuaTanya_() };
}


/** Jalankan dari editor untuk melihat contoh email instruksi pembayaran di inbox pemilik (tanpa membuat tagihan). */
function ujiEmailInstruksiBayar() {
  const t = { data: { id: 'UJI', nama: 'Klien Contoh', email: KONS.EMAIL_PEMILIK, topik: 'Komposisi tubuh (turun lemak / naik otot)' } };
  const html = htmlInstruksiBayar_(t, 'Konsultasi lanjutan 1 sesi', 250000, { orderId: 'MK-UJI-0001', jumlah: 250437 }, 'Kita bahas pola makan saat shift malam dan target lemak 12 minggu.');
  MailApp.sendEmail({ to: KONS.EMAIL_PEMILIK, name: 'Konsultasi Gizi murykuswari.com', subject: '[UJI] Konfirmasi konsultasi lanjutan & instruksi pembayaran', htmlBody: html });
}
