/**
 * Pendaftaran konsultasi murykuswari.com — dipisah per jenis: ATLET dan WELLNESS KORPORAT.
 *
 * Berkas ini satu proyek dengan Kode.gs dan Konsultasi.gs (memakai hash_, aman_, sesi_, isAdmin_,
 * ss_, tab_, waktu_, num_, esc_, bersih_, KONS dari sana).
 *
 * PEMASANGAN: di Konsultasi.gs, fungsi konsultasi_(d), tambahkan dua baris di dalam switch:
 *     case 'kons-daftar': return konsDaftar_(d);
 *     case 'kons-daftar-admin': return konsDaftarAdmin_(d);
 * Lalu jalankan siapkanPendaftaran() sekali, dan buat versi deployment baru.
 *
 * Data disimpan di Sheet "Database Konsultasi Gizi Olahraga" pada dua tab terpisah:
 *   - "Konsultasi Atlet"
 *   - "Konsultasi Wellness Korporat"
 */

const DAFTAR = {
  TAB: { atlet: 'Konsultasi Atlet', korporat: 'Konsultasi Wellness Korporat' },
  MAX_PER_HARI: 5,          // batas pendaftaran per email per hari
  KABARI_PEMILIK: true      // email pemberitahuan ke KONS.EMAIL_PEMILIK
};

const KOLOM_UMUM_AWAL = ['ID', 'Waktu', 'Status', 'Perlu cek manual', 'Alasan cek', 'Email', 'Nama', 'Panggilan', 'Jenis kelamin', 'Tanggal lahir', 'Usia', 'WhatsApp', 'Kota',
  'BB (kg)', 'TB (cm)', 'IMT', 'Kategori IMT', 'Lingkar pinggang (cm)', 'Pinggang berisiko', '% lemak'];
const KOLOM_UMUM_AKHIR = ['Kondisi medis', 'Obat/suplemen', 'Hamil/menyusui', 'Pertanyaan', 'Estimasi energi (kkal)', 'Catatan pengelola', 'Data (JSON)'];

const KOLOM_ATLET = KOLOM_UMUM_AWAL.concat(['Cabang olahraga', 'Nomor/posisi/kelas', 'Level', 'Klub/instansi', 'Pelatih', 'Sesi/minggu', 'Durasi/sesi (menit)', 'Jam latihan/minggu',
  'Fase', 'Kompetisi terdekat', 'Tujuan', 'Cedera 3 bulan']).concat(KOLOM_UMUM_AKHIR);
const KOLOM_KORP = KOLOM_UMUM_AWAL.concat(['Perusahaan/instansi', 'Kode program', 'Sektor', 'Jabatan/divisi', 'Pola kerja', 'Jam kerja/hari', 'Jam duduk/hari', 'Aktivitas (menit/minggu)',
  'Aktivitas cukup (≥150)', 'Jenis olahraga', 'Sarapan', 'Makan utama/hari', 'Sumber makan siang', 'Minuman manis/hari', 'Tidur (jam)', 'Stres kerja', 'Merokok', 'MCU 12 bulan', 'Tujuan'])
  .concat(KOLOM_UMUM_AKHIR);

/** Jalankan sekali dari editor untuk membuat kedua tab. */
function siapkanPendaftaran() {
  tab_(DAFTAR.TAB.atlet, KOLOM_ATLET);
  tab_(DAFTAR.TAB.korporat, KOLOM_KORP);
  console.log('Tab pendaftaran siap.');
}

/* ---------- Validasi (sama dengan formulir; server tetap memeriksa ulang) ---------- */

const PILIH = {
  jk: ['L', 'P'], ya: ['ya', 'tidak'], medis: ['ada', 'tidak'], hamil: ['tidak', 'hamil', 'menyusui'], cedera: ['tidak', 'ringan', 'berat'],
  kompetisi: ['ada', 'belum'], sarapan: ['rutin', 'kadang', 'tidak'], makan: ['1-2', '3', '>3'], manis: ['0', '1', '2+'], stres: ['1', '2', '3']
};

function usiaDari_(t) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t || '')) return null;
  const b = new Date(t + 'T00:00:00'), n = new Date();
  let u = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) u--;
  return u;
}

function validasiDaftar_(jenis, d) {
  const salah = [];
  const teks = function (k, min, label) { if (String(d[k] || '').trim().length < min) salah.push(label); };
  const angka = function (k, lo, hi, label) { const x = Number(d[k]); if (d[k] === '' || d[k] == null || !isFinite(x) || x < lo || x > hi) salah.push(label); };
  const pilih = function (k, list, label) { if (list.indexOf(String(d[k])) < 0) salah.push(label); };

  teks('nama', 3, 'nama lengkap'); teks('panggilan', 2, 'nama panggilan'); pilih('jk', PILIH.jk, 'jenis kelamin');
  const u = usiaDari_(d.tglLahir); if (u === null || u < 8 || u > 90) salah.push('tanggal lahir');
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(d.email || ''))) salah.push('email');
  if (!/^628\d{7,12}$/.test(String(d.wa || ''))) salah.push('nomor WhatsApp');
  teks('kota', 3, 'kota');
  angka('bb', 25, 250, 'berat badan'); angka('tb', 100, 230, 'tinggi badan');
  if (jenis === 'korporat') angka('pinggang', 40, 200, 'lingkar pinggang');

  if (jenis === 'atlet') {
    teks('cabor', 2, 'cabang olahraga'); if (d.cabor === 'Lainnya') teks('caborLain', 3, 'nama cabang olahraga');
    teks('posisi', 1, 'nomor/posisi/kelas'); teks('level', 2, 'level'); teks('klub', 2, 'klub/instansi'); teks('pelatih', 2, 'pelatih');
    angka('sesi', 1, 21, 'sesi latihan'); angka('durasi', 15, 360, 'durasi latihan'); teks('fase', 2, 'fase latihan');
    pilih('kompetisi', PILIH.kompetisi, 'jadwal kompetisi'); if (d.kompetisi === 'ada' && !/^\d{4}-\d{2}-\d{2}$/.test(d.tglKompetisi || '')) salah.push('tanggal kompetisi');
    pilih('cedera', PILIH.cedera, 'riwayat cedera');
  } else {
    teks('perusahaan', 2, 'perusahaan/instansi'); teks('sektor', 2, 'sektor'); teks('jabatan', 2, 'jabatan/divisi'); teks('pola', 2, 'pola kerja');
    angka('jamKerja', 1, 18, 'jam kerja'); angka('jamDuduk', 0, 18, 'lama duduk'); angka('aktivitas', 0, 3000, 'aktivitas fisik'); teks('jenisOlahraga', 2, 'jenis olahraga');
    pilih('sarapan', PILIH.sarapan, 'sarapan'); pilih('makan', PILIH.makan, 'frekuensi makan'); teks('sumberMakan', 2, 'sumber makan siang'); pilih('manis', PILIH.manis, 'minuman manis');
    angka('tidur', 2, 14, 'lama tidur'); pilih('stres', PILIH.stres, 'tingkat stres'); pilih('rokok', PILIH.ya, 'merokok'); pilih('mcu', PILIH.ya, 'medical check-up');
  }
  teks('tujuan', 2, 'tujuan utama');
  pilih('medis', PILIH.medis, 'kondisi medis'); if (d.medis === 'ada') teks('medisDetail', 3, 'detail kondisi medis');
  pilih('obat', PILIH.ya, 'obat/suplemen'); if (d.obat === 'ya') teks('obatDetail', 2, 'nama obat/suplemen');
  if (d.jk === 'P') pilih('hamil', PILIH.hamil, 'status hamil/menyusui');
  teks('pertanyaan', 30, 'pertanyaan konsultasi (minimal 30 karakter)');
  if (u !== null && u < 18 && d.wali !== true) salah.push('persetujuan orang tua/wali');
  if (d.setuju !== true) salah.push('persetujuan penyimpanan data');
  return { salah: salah, usia: u };
}

/* ---------- Simpan pendaftaran ---------- */

function konsDaftar_(d) {
  if (d.website) return { ok: true, id: 'X' };                               // honeypot bot
  const jenis = d.jenis === 'korporat' ? 'korporat' : d.jenis === 'atlet' ? 'atlet' : '';
  if (!jenis) return { ok: false, pesan: 'Jenis konsultasi tidak dikenali.' };
  const x = d.data || {};
  const v = validasiDaftar_(jenis, x);
  if (v.salah.length) return { ok: false, pesan: 'Data belum lengkap: ' + v.salah.join(', ') + '.' };
  const email = String(x.email).trim().toLowerCase();

  const c = CacheService.getScriptCache();
  const kk = 'kdaftar:' + hash_(email) + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyyMMdd');
  const n = Number(c.get(kk) || 0);
  if (n >= DAFTAR.MAX_PER_HARI) return { ok: false, pesan: 'Batas pendaftaran hari ini untuk email ini tercapai.' };

  // Hitungan ulang di server (tidak mengandalkan angka dari browser).
  const bb = Number(x.bb), tb = Number(x.tb), m = tb / 100;
  const imt = Math.round(bb / (m * m) * 10) / 10;
  const katImt = imt < 17 ? 'Sangat kurus' : imt < 18.5 ? 'Kurus' : imt <= 25 ? 'Normal' : imt <= 27 ? 'Gemuk' : 'Obesitas';
  const pinggang = x.pinggang ? Number(x.pinggang) : '';
  const pinggangRisiko = pinggang === '' ? '' : (pinggang >= (x.jk === 'P' ? 80 : 90) ? 'Ya' : 'Tidak');
  const alasan = [];
  if (x.medis === 'ada') alasan.push('kondisi medis');
  if (x.obat === 'ya') alasan.push('obat/suplemen');
  if (x.jk === 'P' && (x.hamil === 'hamil' || x.hamil === 'menyusui')) alasan.push(x.hamil);
  if (v.usia < 18) alasan.push('usia < 18');
  if (jenis === 'atlet' && x.cedera === 'berat') alasan.push('cedera berat');
  if (imt < 17) alasan.push('IMT sangat rendah');
  const energi = d.hasil && !alasan.length ? num_(d.hasil.energi) : '';

  const id = (jenis === 'atlet' ? 'A' : 'W') + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMdd-HHmm') + '-' + Utilities.getUuid().slice(0, 3).toUpperCase();
  const t = function (k, max) { return aman_(bersih_(x[k], max || 120)); };
  const awal = [id, waktu_(), 'Baru', alasan.length ? 'Ya' : 'Tidak', alasan.join(', '), aman_(email), t('nama', 80), t('panggilan', 30), x.jk, x.tglLahir, v.usia, "'" + x.wa, t('kota', 60),
    num_(bb), num_(tb), imt, katImt, num_(pinggang), pinggangRisiko, num_(x.lemak)];
  const akhir = [aman_(x.medis === 'ada' ? 'Ada: ' + bersih_(x.medisDetail, 400) : 'Tidak ada'), aman_(x.obat === 'ya' ? 'Ya: ' + bersih_(x.obatDetail, 200) : 'Tidak'),
    x.jk === 'P' ? x.hamil : '-', aman_(bersih_(x.pertanyaan, 800)), energi, '', aman_(JSON.stringify(x).slice(0, 45000))];

  let tengah;
  if (jenis === 'atlet') {
    const jam = Math.round(Number(x.sesi) * Number(x.durasi) / 60 * 10) / 10;
    tengah = [aman_(x.cabor === 'Lainnya' ? 'Lainnya – ' + bersih_(x.caborLain, 60) : bersih_(x.cabor, 40)), t('posisi', 60), t('level', 40), t('klub', 80), t('pelatih', 60),
      num_(x.sesi), num_(x.durasi), jam, t('fase', 40), x.kompetisi === 'ada' ? x.tglKompetisi : 'Belum ada', t('tujuan', 60), x.cedera];
  } else {
    const mnt = Number(x.aktivitas);
    tengah = [t('perusahaan', 100), t('kodeProgram', 30), t('sektor', 40), t('jabatan', 80), t('pola', 40), num_(x.jamKerja), num_(x.jamDuduk), mnt, mnt >= 150 ? 'Ya' : 'Tidak',
      t('jenisOlahraga', 80), x.sarapan, x.makan, t('sumberMakan', 40), x.manis, num_(x.tidur), ['', 'Rendah', 'Sedang', 'Tinggi'][Number(x.stres)] || '', x.rokok, x.mcu, t('tujuan', 60)];
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    tab_(DAFTAR.TAB[jenis], jenis === 'atlet' ? KOLOM_ATLET : KOLOM_KORP).appendRow(awal.concat(tengah, akhir));
    c.put(kk, String(n + 1), 86400);
  } finally {
    lock.releaseLock();
  }

  // Pemberitahuan ke pemilik. Subjek sengaja TIDAK memakai "Konsultasi Gizi Olahraga"
  // agar tidak tercampur dengan email pertanyaan dari peserta yang diproses rutinitas Gmail.
  try {
    if (DAFTAR.KABARI_PEMILIK && MailApp.getRemainingDailyQuota() > 5) {
      const label = jenis === 'atlet' ? 'Atlet' : 'Wellness Korporat';
      const ket = jenis === 'atlet' ? (x.cabor === 'Lainnya' ? x.caborLain : x.cabor) + ', ' + x.level : x.perusahaan + ', ' + x.jabatan;
      MailApp.sendEmail({
        to: KONS.EMAIL_PEMILIK, replyTo: email, name: 'Pendaftaran murykuswari.com',
        subject: '[Pendaftaran ' + label + '] ' + x.nama + (alasan.length ? ' – PERLU CEK MANUAL' : ''),
        htmlBody: '<p><b>' + esc_(x.nama) + '</b> (' + esc_(email) + ', WA ' + esc_(x.wa) + ')<br>' + esc_(ket) + '</p>' +
          '<p>ID ' + esc_(id) + ' · IMT ' + imt + ' (' + katImt + ')' + (pinggang ? ' · pinggang ' + pinggang + ' cm' : '') + ' · tujuan: ' + esc_(x.tujuan) + '</p>' +
          (alasan.length ? '<p style="color:#b42318"><b>Perlu cek manual:</b> ' + esc_(alasan.join(', ')) + '</p>' : '') +
          '<p><b>Pertanyaan:</b><br>' + esc_(x.pertanyaan) + '</p>'
      });
    }
  } catch (err) { console.error(err); }

  return { ok: true, id: id };
}

/* ---------- Dashboard pengelola: data per jenis ---------- */

function bacaTab_(nama, kolom) {
  const sh = tab_(nama, kolom);
  const n = sh.getLastRow();
  if (n < 2) return [];
  const tz = 'Asia/Jakarta';
  return sh.getRange(2, 1, n - 1, kolom.length).getValues().map(function (r, i) {
    const o = { baris: i + 2 };
    kolom.forEach(function (k, j) {
      let v = r[j];
      if (v instanceof Date) v = Utilities.formatDate(v, tz, k === 'Waktu' ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd');
      o[k] = typeof v === 'string' ? v.replace(/^'/, '') : v;
    });
    delete o['Data (JSON)'];
    return o;
  });
}

function konsDaftarAdmin_(d) {
  const email = sesi_(d);
  if (!email) return { ok: false, ulang: true, pesan: 'Sesi berakhir. Silakan masuk lagi.' };
  if (!isAdmin_(email)) return { ok: false, pesan: 'Dashboard hanya untuk pengelola.' };

  // Ubah status / catatan satu baris.
  if (d.ubah && d.ubah.jenis && d.ubah.id) {
    const jenis = d.ubah.jenis === 'korporat' ? 'korporat' : 'atlet';
    const kolom = jenis === 'atlet' ? KOLOM_ATLET : KOLOM_KORP;
    const sh = tab_(DAFTAR.TAB[jenis], kolom);
    const ids = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues().map(function (r) { return String(r[0]); });
    const i = ids.indexOf(String(d.ubah.id));
    if (i < 0) return { ok: false, pesan: 'ID tidak ditemukan.' };
    const status = ['Baru', 'Dijawab', 'Lanjut konsultasi', 'Selesai', 'Ditolak'];
    if (status.indexOf(d.ubah.status) >= 0) sh.getRange(i + 2, kolom.indexOf('Status') + 1).setValue(d.ubah.status);
    if (typeof d.ubah.catatan === 'string') sh.getRange(i + 2, kolom.indexOf('Catatan pengelola') + 1).setValue(aman_(bersih_(d.ubah.catatan, 1000)));
  }
  return { ok: true, dibuat: waktu_(), atlet: bacaTab_(DAFTAR.TAB.atlet, KOLOM_ATLET), korporat: bacaTab_(DAFTAR.TAB.korporat, KOLOM_KORP) };
}
