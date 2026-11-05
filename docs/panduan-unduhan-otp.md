# Panduan unduhan ber-OTP

Website ini statis, jadi pengiriman OTP dan penyerahan berkas dijalankan oleh Google Apps Script milik pemilik website (gratis, tanpa server). Kodenya ada di `apps-script/Kode.gs`.

## Memasang layanan

1. Buka [script.new](https://script.new) dengan akun Google pemilik, beri nama `Unduhan murykuswari.com`.
2. Tempel seluruh isi `apps-script/Kode.gs`, lalu simpan.
3. Pilih fungsi `siapkan`, klik **Run**, dan setujui izin yang diminta. Sheet data pengunduh dibuat otomatis.
4. Klik **Deploy > New deployment > Web app**. Isi **Execute as: Me** dan **Who has access: Anyone**, lalu **Deploy**.
5. Salin URL yang berakhiran `/exec`, tempel ke `otpEndpoint` di `config.js`, lalu commit.

Setiap kali `Kode.gs` berubah, buat versi baru melalui **Deploy > Manage deployments > Edit > New version** agar URL-nya tetap sama.

## Menambah berkas

1. Tambahkan id berkas Drive di `FILES` pada `Kode.gs`, lalu buat versi deployment baru.
2. Tambahkan item dengan id yang sama di `data/unduhan.js`.
3. Jika berkas itu juga buku di rak, isi `unduh: "id-berkas"` di `data/buku.js`.

Berkas tidak perlu dibagikan ke publik. Google Docs otomatis diubah menjadi PDF, jadi perubahan pada dokumen langsung ikut ke unduhan.

## Keamanan dan batasan

- OTP berlaku 10 menit, dihapus setelah 5 kali salah, dan hanya disimpan sebagai hash.
- Satu email dibatasi jeda 60 detik dan 5 kode per jam. Seluruh layanan dibatasi 300 kode per hari.
- Izin unduh berlaku 30 menit.
- Yang diverifikasi OTP adalah email. Nomor WhatsApp hanya diperiksa formatnya, karena verifikasi kepemilikan nomor butuh layanan WhatsApp API berbayar.
- Ukuran berkas sebaiknya di bawah 30 MB, karena berkas dikirim melalui respons Apps Script.
- Data pengunduh adalah data pribadi. Simpan Sheet secara privat dan gunakan sesuai persetujuan yang tertulis di formulir.
