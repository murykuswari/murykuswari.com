# Pemasangan: Pendaftaran Konsultasi Atlet & Wellness Korporat

Paket ini memisahkan pendaftaran konsultasi menjadi dua jalur, **Atlet** dan **Wellness Korporat**. Setiap jalur punya formulir wajib sendiri, tab Sheet sendiri, dan tab sendiri di dashboard.

## Isi paket

| Berkas | Letak di situs | Fungsi |
|---|---|---|
| `pendaftaran/index.html` | murykuswari.com/pendaftaran/ | Formulir pendaftaran: pilih jenis, isi data lengkap (wajib), lihat hasil awal, unduh/bagikan kartu profil, lalu kirim pertanyaan via email/WhatsApp |
| `dashboard-pendaftaran.html` | murykuswari.com/dashboard-pendaftaran.html | Dashboard pengelola dengan tab Atlet dan Wellness Korporat, grafik, filter, status, catatan, dan CSV per jenis |
| `apps-script/Pendaftaran.gs` | Proyek Apps Script murykuswari.com | Simpan & validasi pendaftaran, data dashboard |

## Langkah (±10 menit)

1. **Apps Script**: buka proyek Apps Script murykuswari.com (yang sama dengan Kode.gs & Konsultasi.gs), lalu klik **+ › Script**, beri nama `Pendaftaran`, dan tempel isi `apps-script/Pendaftaran.gs`.
2. Di **Konsultasi.gs**, cari `function konsultasi_(d)` dan tambahkan dua baris di dalam `switch`:
   ```js
   case 'kons-daftar': return konsDaftar_(d);
   case 'kons-daftar-admin': return konsDaftarAdmin_(d);
   ```
   Kalau `doPost` di Kode.gs hanya meneruskan aksi yang diawali `kons-`, tidak ada yang perlu diubah lagi, karena kedua aksi baru juga diawali `kons-`.
3. Pilih fungsi `siapkanPendaftaran` lalu klik **Run**. Dua tab baru dibuat di Sheet *Database Konsultasi Gizi Olahraga*: **Konsultasi Atlet** dan **Konsultasi Wellness Korporat**.
4. **Deploy › Manage deployments › Edit › Version: New version › Deploy.** URL /exec tidak berubah.
5. **URL layanan**: kedua halaman membaca `window.MK_SCRIPT_URL`. Pilih salah satu cara:
   - muat `config.js` situs sebelum skrip halaman dan pastikan isinya `window.MK_SCRIPT_URL = 'https://script.google.com/macros/s/…/exec';`, atau
   - isi langsung baris `const SCRIPT_URL = …` di bagian atas skrip kedua halaman.
6. Unggah `pendaftaran/` dan `dashboard-pendaftaran.html` ke hosting.
7. Ganti tautan tombol konsultasi yang lama (di gizi.html dan wellness.html) agar mengarah ke:
   - Atlet: `/pendaftaran/?jenis=atlet`
   - Wellness korporat: `/pendaftaran/?jenis=korporat`
   - Pilih sendiri: `/pendaftaran/`

## Perilaku penting

- **Data wajib lengkap.** Tombol *Lanjut* tidak bisa dilewati bila ada kolom wajib yang kosong atau salah. Server memeriksa ulang (`validasiDaftar_`) sebelum menyimpan. Satu-satunya kolom opsional adalah % lemak tubuh, kode program perusahaan, dan lingkar pinggang (opsional hanya untuk atlet).
- **Kolom berbeda per jenis.**
  - Atlet: cabang, nomor/posisi/kelas, level, klub, pelatih, sesi dan durasi latihan, fase, jadwal kompetisi, tujuan, cedera.
  - Korporat: perusahaan, kode program, sektor, jabatan/divisi, pola kerja, jam kerja, lama duduk, aktivitas per minggu, jenis olahraga, sarapan, frekuensi makan, sumber makan siang, minuman manis, tidur, stres, merokok, MCU, tujuan, dan lingkar pinggang (wajib).
- **Kasus sensitif** ditandai *Perlu cek manual*: kondisi medis, obat/suplemen rutin, hamil/menyusui, usia < 18 tahun (wajib persetujuan wali), cedera berat, atau IMT < 17. Untuk kasus ini estimasi energi tidak ditampilkan dan dashboard memberi label merah.
- **Kartu profil**: PNG 1080×1350 (4:5) digambar di browser. Foto tidak dikirim ke server. Peserta bisa menyembunyikan BB/IMT. Di ponsel muncul tombol *Bagikan* (Web Share) untuk langsung memposting.
- **Pengiriman pertanyaan**: setelah data tersimpan, peserta menekan *Kirim via Email* atau *Kirim via WhatsApp*. Pesan sudah terisi otomatis. Subjek email berbentuk `Konsultasi Gizi Olahraga - Atlet - <Nama>` atau `Konsultasi Gizi Olahraga - Wellness Korporat - <Nama>`, sehingga filter Gmail dan rutinitas draf otomatis tetap berjalan, dan jenisnya bisa dikenali dari subjek.
- **Pemberitahuan ke pengelola** memakai subjek `[Pendaftaran Atlet] …` atau `[Pendaftaran Wellness Korporat] …`. Subjek ini sengaja tidak mengandung "Konsultasi Gizi Olahraga" agar tidak dianggap pertanyaan oleh rutinitas Gmail.
- **Dashboard**: login OTP yang sama dengan dashboard.html (hanya email di `KONS.ADMIN`). Klik batang grafik untuk memfilter. Status yang tersedia: Baru, Dijawab, Lanjut konsultasi, Selesai, Ditolak. Tambahkan `?demo=1` di URL untuk melihat contoh dengan data palsu.
- Formulir menyimpan isian sementara di browser peserta (localStorage), sehingga isian tidak hilang bila halaman tertutup.

## Pengaturan di Pendaftaran.gs

| Nama | Bawaan | Fungsi |
|---|---|---|
| `DAFTAR.MAX_PER_HARI` | 5 | Batas pendaftaran per email per hari |
| `DAFTAR.KABARI_PEMILIK` | true | Kirim email pemberitahuan ke `KONS.EMAIL_PEMILIK` |
