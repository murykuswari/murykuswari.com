/**
 * Layanan unduhan ber-OTP untuk murykuswari.com (Google Apps Script).
 * Panduan pemasangan: docs/panduan-unduhan-otp.md
 *
 * Alur: kirim (OTP ke email) -> verifikasi (OTP jadi token) -> unduh (token jadi berkas).
 * Berkas tetap privat di Drive pemilik. Data pengunduh masuk ke Google Sheet pemilik.
 * Kode OTP hanya disimpan sebagai hash di CacheService, tidak pernah ditulis ke Sheet.
 */

const FILES = {
  'modul-kondisi-fisik': {
    id: '1D16JIVlJWDMvgy4t2RZAxqOopMJFZr2ruxu_O_Kt9H0',
    nama: 'Modul-UTS-Kondisi-Fisik-dan-Program-Latihan.pdf'
  }
};

const OTP_MENIT = 10;          // masa berlaku OTP
const MAX_SALAH = 5;           // batas salah OTP sebelum kode hangus
const JEDA_DETIK = 60;         // jeda minimal antar pengiriman ke email yang sama
const MAX_PER_JAM = 5;         // batas OTP per email per jam
const MAX_PER_HARI = 300;      // batas seluruh OTP per hari, menjaga kuota email
const TOKEN_MENIT = 30;        // masa berlaku izin unduh setelah verifikasi
const NAMA_SHEET = 'Data Pengunduh murykuswari.com';

function doGet() {
  return json_({ ok: true, layanan: 'unduhan murykuswari.com' });
}

function doPost(e) {
  try {
    const d = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (d.aksi === 'kirim') return json_(kirim_(d));
    if (d.aksi === 'verifikasi') return json_(verifikasi_(d));
    if (d.aksi === 'unduh') return json_(unduh_(d));
    return json_({ ok: false, pesan: 'Permintaan tidak dikenali.' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, pesan: 'Terjadi kendala. Coba lagi beberapa saat.' });
  }
}

/** Jalankan sekali dari editor untuk memberi izin dan membuat Sheet. */
function siapkan() {
  const id = sheet_().getParent().getId();
  Object.keys(FILES).forEach(function (k) { DriveApp.getFileById(FILES[k].id).getName(); });
  console.log('Siap. Sheet: https://docs.google.com/spreadsheets/d/' + id);
}

function kirim_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  const nama = String(d.nama || '').trim().slice(0, 80);
  const wa = String(d.wa || '').replace(/\D/g, '');
  const instansi = String(d.instansi || '').trim().slice(0, 100);

  // Isian tersembunyi terisi berarti bot: balas seolah berhasil, tanpa mengirim email.
  if (d.website) return { ok: true, jeda: JEDA_DETIK };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) || email.length > 120) return { ok: false, pesan: 'Format email belum benar.' };
  if (nama.length < 2) return { ok: false, pesan: 'Isi nama lengkap Anda.' };
  if (!(/^628\d{7,12}$/.test(wa) || (!/^62/.test(wa) && /^[1-9]\d{7,14}$/.test(wa)))) return { ok: false, pesan: 'Nomor WhatsApp belum benar.' };
  if (!FILES[d.item]) return { ok: false, pesan: 'Berkas tidak ditemukan.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const c = CacheService.getScriptCache();
    const k = hash_(email);
    if (c.get('jeda:' + k)) return { ok: false, pesan: 'Tunggu sebentar sebelum meminta kode baru.' };
    const jam = Number(c.get('jam:' + k) || 0);
    if (jam >= MAX_PER_JAM) return { ok: false, pesan: 'Terlalu banyak permintaan. Coba lagi satu jam lagi.' };
    const hariKey = 'hari:' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
    const hari = Number(c.get(hariKey) || 0);
    if (hari >= MAX_PER_HARI || MailApp.getRemainingDailyQuota() < 5) return { ok: false, pesan: 'Kuota harian habis. Coba lagi besok.' };

    const otp = buatOtp_();
    MailApp.sendEmail({
      to: email,
      subject: otp + ' adalah kode unduhan murykuswari.com',
      name: 'murykuswari.com',
      htmlBody: '<p>Kode OTP Anda:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">' + otp + '</p>' +
        '<p>Kode berlaku ' + OTP_MENIT + ' menit. Jangan berikan kode ini kepada siapa pun.</p>' +
        '<p style="color:#6a7f96;font-size:13px">Abaikan email ini jika Anda tidak meminta unduhan dari murykuswari.com.</p>'
    });

    c.put('otp:' + k, JSON.stringify({ h: hash_(k + otp), n: 0, nama: nama, wa: wa, instansi: instansi, item: d.item }), OTP_MENIT * 60);
    c.put('jeda:' + k, '1', JEDA_DETIK);
    c.put('jam:' + k, String(jam + 1), 3600);
    c.put(hariKey, String(hari + 1), 86400);
    return { ok: true, jeda: JEDA_DETIK };
  } finally {
    lock.releaseLock();
  }
}

function verifikasi_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  const otp = String(d.otp || '').trim();
  if (!/^\d{6}$/.test(otp)) return { ok: false, pesan: 'Masukkan 6 digit kode OTP.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const c = CacheService.getScriptCache();
    const k = hash_(email);
    const raw = c.get('otp:' + k);
    if (!raw) return { ok: false, pesan: 'Kode sudah tidak berlaku. Minta kode baru.' };
    const s = JSON.parse(raw);
    if (hash_(k + otp) !== s.h) {
      s.n += 1;
      if (s.n >= MAX_SALAH) {
        c.remove('otp:' + k);
        return { ok: false, pesan: 'Terlalu banyak percobaan. Minta kode baru.' };
      }
      c.put('otp:' + k, JSON.stringify(s), OTP_MENIT * 60);
      return { ok: false, pesan: 'Kode salah. Sisa percobaan: ' + (MAX_SALAH - s.n) + '.' };
    }
    c.remove('otp:' + k);
    const token = Utilities.getUuid() + Utilities.getUuid();
    c.put('tok:' + hash_(token), JSON.stringify({ email: email }), TOKEN_MENIT * 60);
    catat_(s.nama, email, s.wa, s.instansi, s.item, 'terverifikasi');
    return { ok: true, token: token, menit: TOKEN_MENIT };
  } finally {
    lock.releaseLock();
  }
}

function unduh_(d) {
  const f = FILES[d.item];
  if (!f) return { ok: false, pesan: 'Berkas tidak ditemukan.' };
  const raw = CacheService.getScriptCache().get('tok:' + hash_(String(d.token || '')));
  if (!raw) return { ok: false, ulang: true, pesan: 'Masa verifikasi habis. Silakan ulangi.' };
  const file = DriveApp.getFileById(f.id);
  const blob = file.getMimeType() === MimeType.PDF ? file.getBlob() : file.getAs(MimeType.PDF);
  catat_('', JSON.parse(raw).email, '', '', d.item, 'diunduh');
  return { ok: true, nama: f.nama, mime: 'application/pdf', base64: Utilities.base64Encode(blob.getBytes()) };
}

function buatOtp_() {
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid());
  const n = ((b[0] & 255) * 16777216 + (b[1] & 255) * 65536 + (b[2] & 255) * 256 + (b[3] & 255)) % 1000000;
  return ('000000' + n).slice(-6);
}

function hash_(s) {
  const p = PropertiesService.getScriptProperties();
  let garam = p.getProperty('GARAM');
  if (!garam) { garam = Utilities.getUuid(); p.setProperty('GARAM', garam); }
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, garam + s));
}

function sheet_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id).getSheets()[0];
  const ss = SpreadsheetApp.create(NAMA_SHEET);
  p.setProperty('SHEET_ID', ss.getId());
  const sh = ss.getSheets()[0];
  sh.appendRow(['Waktu', 'Nama', 'Email', 'WhatsApp', 'Instansi', 'Berkas', 'Status']);
  sh.setFrozenRows(1);
  return sh;
}

/** Awalan kutip mencegah isian pengunjung dibaca sebagai rumus di Sheet. */
function aman_(v) {
  const s = String(v == null ? '' : v);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function catat_(nama, email, wa, instansi, item, status) {
  sheet_().appendRow([
    Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'),
    aman_(nama), aman_(email), wa ? "'" + wa : '', aman_(instansi), aman_(item), status
  ]);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
