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
  SESI_JAM: 6,              // masa berlaku sesi masuk (maksimal 6 jam, batas CacheService)
  KIRIM_SALINAN_KLIEN: true, // kirim ringkasan hasil ke email klien setelah disimpan
  KABARI_PEMILIK: true,      // kirim pemberitahuan ke pemilik untuk setiap konsultasi baru
  MAX_SIMPAN_HARI: 10       // batas simpan per klien per hari
};

const KOLOM_KLIEN = ['Email', 'Nama lengkap', 'Jenis kelamin', 'Tanggal lahir', 'Asal', 'WhatsApp', 'Cabang olahraga', 'Level', 'Terdaftar', 'Terakhir masuk', 'Jumlah konsultasi', 'Folder klien'];
const KOLOM_KONS = ['ID', 'Waktu', 'Email', 'Nama', 'Cabang olahraga', 'Tujuan', 'Fase', 'BB (kg)', 'TB (cm)', '% lemak', 'FFM (kg)', 'Energi rata-rata (kkal)', 'KH rata-rata (g)', 'Protein (g)', 'Lemak (g)', 'EA (kkal/kg FFM)', 'Laju keringat (L/jam)', 'Tujuan konsultasi', 'Laporan', 'Data (JSON)'];

function konsultasi_(d) {
  switch (d.aksi) {
    case 'kons-kirim': return konsKirim_(d);
    case 'kons-masuk': return konsMasuk_(d);
    case 'kons-profil': return konsProfil_(d);
    case 'kons-simpan': return konsSimpan_(d);
    case 'kons-riwayat': return konsRiwayat_(d);
    default: return { ok: false, pesan: 'Permintaan tidak dikenali.' };
  }
}

/** Jalankan sekali dari editor: memberi izin Drive/Sheets/Docs/Gmail dan menyiapkan tab Sheet. */
function siapkanKonsultasi() {
  tab_('Klien', KOLOM_KLIEN);
  tab_('Konsultasi', KOLOM_KONS);
  folderKlienInduk_();
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
  const profil = cariKlien_(email);
  if (profil) setSel_('Klien', profil.baris, 'Terakhir masuk', waktu_());
  return { ok: true, token: token, jam: KONS.SESI_JAM, email: email, profil: profil ? profil.data : null, riwayat: riwayat_(email) };
}

function sesi_(d) {
  const raw = CacheService.getScriptCache().get('ksesi:' + hash_(String(d.token || '')));
  return raw ? JSON.parse(raw).email : null;
}

function konsRiwayat_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const p = cariKlien_(email);
  return { ok: true, profil: p ? p.data : null, riwayat: riwayat_(email) };
}

/* ---------- Profil ---------- */

function bersih_(v, n) { return String(v == null ? '' : v).trim().slice(0, n || 120); }

function konsProfil_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  const p = d.profil || {};
  const data = {
    nama: bersih_(p.nama, 80), jk: p.jk === 'P' ? 'P' : 'L', tglLahir: bersih_(p.tglLahir, 10), asal: bersih_(p.asal, 120),
    wa: String(p.wa || '').replace(/\D/g, '').slice(0, 16), cabor: bersih_(p.cabor, 40), caborLain: bersih_(p.caborLain, 60), level: bersih_(p.level, 40)
  };
  if (data.nama.length < 3) return { ok: false, pesan: 'Isi nama lengkap.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tglLahir)) return { ok: false, pesan: 'Isi tanggal lahir.' };
  if (data.asal.length < 3) return { ok: false, pesan: 'Isi asal (kota dan instansi/klub).' };
  if (!/^\d{9,16}$/.test(data.wa)) return { ok: false, pesan: 'Nomor WhatsApp belum benar.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ada = cariKlien_(email);
    const folder = ada && ada.data.folder ? ada.data.folder : folderKlien_(email, data.nama).getUrl();
    const baris = [aman_(email), aman_(data.nama), data.jk, data.tglLahir, aman_(data.asal), "'" + data.wa, aman_(data.cabor + (data.caborLain ? ' – ' + data.caborLain : '')), aman_(data.level),
      ada ? ada.data.terdaftar : waktu_(), waktu_(), ada ? ada.data.jumlah : 0, folder];
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
  const nama = klien.data.nama;

  // Laporan Google Doc di folder klien.
  const folder = folderKlien_(email, nama);
  const doc = DocumentApp.create('Program Gizi – ' + nama + ' – ' + tanggal);
  const body = doc.getBody();
  body.appendParagraph('Program Gizi Olahraga Personal').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph(nama + ' · ' + email + ' · ' + tanggal + ' · ID ' + id);
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
      num_(r.energi), num_(r.kh), num_(r.protein), num_(r.lemak), num_(r.ea), num_(r.sr), aman_(bersih_(input.tujuanKonsultasi, 1000)), file.getUrl(), aman_(json)
    ]);
    const k2 = cariKlien_(email);
    setSel_('Klien', k2.baris, 'Jumlah konsultasi', Number(k2.data.jumlah || 0) + 1);
    c.put(kk, String(n + 1), 86400);
  } finally {
    lock.releaseLock();
  }

  const html = laporanHtml_(nama, tanggal, input.tujuanKonsultasi, laporan);
  try {
    if (KONS.KIRIM_SALINAN_KLIEN && MailApp.getRemainingDailyQuota() > 5) {
      MailApp.sendEmail({ to: email, subject: 'Program Gizi Olahraga Anda – ' + tanggal, name: 'Program Gizi murykuswari.com', htmlBody: html, replyTo: KONS.EMAIL_PEMILIK });
    }
    if (KONS.KABARI_PEMILIK && MailApp.getRemainingDailyQuota() > 5) {
      MailApp.sendEmail({ to: KONS.EMAIL_PEMILIK, subject: 'Konsultasi baru: ' + nama + ' (' + (r.cabor || '-') + ')', name: 'Program Gizi murykuswari.com', replyTo: email,
        htmlBody: '<p><b>' + esc_(nama) + '</b> (' + esc_(email) + ', WA ' + esc_(klien.data.wa) + ', ' + esc_(klien.data.asal) + ')</p><p>Laporan: <a href="' + file.getUrl() + '">' + esc_(doc.getName()) + '</a></p>' + html });
    }
  } catch (err) { console.error(err); }

  return { ok: true, id: id, tanggal: tanggal, riwayat: riwayat_(email) };
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
  if (sh.getLastRow() === 0 || sh.getRange(1, 1).getValue() !== kolom[0]) {
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
      return { baris: i + 2, data: { email: email, nama: String(r[1]).replace(/^'/, ''), jk: r[2], tglLahir: tgl, asal: String(r[4]).replace(/^'/, ''), wa: String(r[5]).replace(/\D/g, ''), cabor: cab[0], caborLain: cab[1] || '', level: String(r[7]).replace(/^'/, ''), terdaftar: r[8], jumlah: r[10], folder: r[11] } };
    }
  }
  return null;
}

function setSel_(tab, baris, kolomNama, nilai) {
  const kol = (tab === 'Klien' ? KOLOM_KLIEN : KOLOM_KONS).indexOf(kolomNama) + 1;
  ss_().getSheetByName(tab).getRange(baris, kol).setValue(nilai);
}

function riwayat_(email) {
  const sh = tab_('Konsultasi', KOLOM_KONS);
  const n = sh.getLastRow();
  if (n < 2) return [];
  const v = sh.getRange(2, 1, n - 1, KOLOM_KONS.length).getValues();
  const out = [];
  v.forEach(function (r) {
    if (String(r[2]).replace(/^'/, '').toLowerCase() !== email) return;
    let data = {};
    try { data = JSON.parse(String(r[19]).replace(/^'/, '')); } catch (e) { /* abaikan baris rusak */ }
    out.push({ id: r[0], waktu: String(r[1]), input: data.input || {}, ringkas: data.ringkas || {} });
  });
  return out.slice(-30);
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
  h += '<p style="color:#6a7f96;font-size:13px">Hasil ini adalah estimasi berbasis rumus dan literatur, bukan diagnosis. Balas email ini untuk berdiskusi dengan Assoc. Prof. Dr. Mury Kuswari. Masuk lagi di murykuswari.com/program.html untuk melanjutkan program.</p></div>';
  return h;
}
