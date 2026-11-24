# Skema pembayaran konsultasi lanjutan

Konsultasi lanjutan dengan Assoc. Prof. Dr. Mury Kuswari dibayar lebih dulu melalui **Midtrans** (QRIS, transfer virtual account semua bank, GoPay/ShopeePay/OVO, kartu kredit). Status pembayaran divalidasi otomatis tanpa pengecekan manual.

## Alur: admin memutuskan gratis atau berbayar

Klien tidak membeli paket sendiri. Setiap konsultasi lanjutan dimulai dari **pertanyaan/masalah klien**, lalu **admin memutuskan** apakah ditangani gratis, berbayar (dengan harga yang disesuaikan masalahnya), atau tidak dilayani, sebelum menjawab.

```
Klien (murykuswari.com/konsultasi)            Admin (dashboard.html)                     Midtrans
──────────────────────────────────            ──────────────────────                     ────────
1. "Ajukan ke Dr. Mury": topik + masalah ──▶  2. Email "Permintaan konsultasi baru" +
   status: Ditinjau Dr. Mury                     muncul di "Permintaan konsultasi"
                                              3. Baca masalah, profil, riwayat program,
                                                 lalu pilih:
   ◀── email "diterima (gratis)"  ─────────────   • Gratis   → status gratis (siap dijawab)
   ◀── email "Rp… untuk paket …"  ─────────────   • Berbayar → paket atau harga sendiri + catatan
   ◀── email alasan/saran          ─────────────   • Tolak    → status ditolak
4. (berbayar) klik "Bayar Rp…"  ────────────▶ kons-bayar: tagihan sesuai harga admin ───▶ 5. halaman bayar
6. Membayar (QRIS / VA / e-wallet) ──────────────────────────────────────────────────────▶ 7. notifikasi
                                              8. Validasi otomatis: tanda tangan SHA-512,  ◀──
                                                 cek ulang API Midtrans, cek nominal
                                                 → pembayaran "lunas", permintaan "lunas",
                                                 email ke klien & admin ("Siap dijawab")
9. Kembali ke /konsultasi → "terverifikasi"   10. Tulis jawaban → "Kirim jawaban"
11. Jawaban tampil di halaman + email  ◀──────    status: dijawab
```

Aturan yang dijaga server:
- Harga tagihan selalu diambil dari keputusan admin pada permintaan, bukan dari klien.
- Klien tidak bisa membayar sebelum admin memutuskan "berbayar".
- Jawaban hanya bisa dikirim bila permintaan gratis atau sudah lunas.
- Keputusan masih bisa diubah selama klien belum membayar; setelah lunas terkunci.
- Maksimal 3 permintaan terbuka per klien agar tidak membanjiri antrean.

Validasi pembayaran berlapis: tanda tangan digital Midtrans, pengecekan ulang ke API resmi, dan pencocokan nominal. Notifikasi yang terkirim ulang tidak menggandakan email.

## Bayar langsung ke GoPay / DANA / LinkAja (konfirmasi admin)

Cara utama yang aktif tanpa Midtrans. Uang langsung masuk ke e-wallet Dr. Mury, dan setiap transaksi tercatat di tab **Pembayaran**.

1. Admin memutuskan **berbayar** di dashboard.
2. Klien membuka /konsultasi lalu klik **Bayar via GoPay / DANA / LinkAja**. Server membuat tagihan dengan **kode unik 3 digit** (contoh: Rp250.000 menjadi Rp250.437). Kode ini tidak dipakai tagihan lain yang masih terbuka.
3. Klien mentransfer tepat sejumlah itu ke salah satu nomor, lalu klik **Saya sudah bayar**. Klien memilih dompet tujuan, menulis akun pengirim, dan mengunggah tangkapan layar bukti. Bukti disimpan di folder Drive klien.
4. Admin menerima email "Cek pembayaran …". Kartu oranye juga muncul di dashboard › Pembayaran, dengan 3 digit terakhir disorot dan tautan bukti.
5. Admin mencocokkan nominal di riwayat aplikasi e-wallet, lalu:
   - **Konfirmasi lunas**: pembayaran menjadi `lunas`, permintaan menjadi `lunas` (siap dijawab), dan email terkirim ke klien serta admin.
   - **Tolak** (wajib dengan alasan): pembayaran menjadi `gagal`, klien menerima email alasan dan bisa membayar ulang.

Tracker di dashboard: total diterima, total bulan ini, total per dompet, jumlah yang perlu dikonfirmasi, tabel lengkap dengan bukti, dan tombol **Unduh rekap pembayaran (CSV)**.

**Mengatur nomor dompet:** isi `dompet` di `config.js` (nomor HP dan nama pemilik akun). Dompet dengan nomor kosong tidak ditampilkan. Gambar QRIS opsional: simpan misalnya di `assets/img/qris.jpg` lalu isi `qris: "assets/img/qris.jpg"`. Jika Midtrans juga aktif, klien melihat dua tombol.

Status pembayaran e-wallet: `menunggu` → `dicek` (klien mengirim bukti) → `lunas` atau `gagal`. Kolom baru di tab Pembayaran: Bukti, Catatan verifikasi, Diverifikasi oleh.

## Email konfirmasi & instruksi pembayaran (otomatis)

Begitu admin memilih **berbayar** di dashboard, server langsung membuat tagihan dengan kode unik 3 digit dan mengirim email **"Konfirmasi konsultasi lanjutan & instruksi pembayaran"** ke klien, berisi:

1. **Rincian tagihan**: layanan, biaya, kode unik, total yang ditransfer, nomor order, batas waktu (`PEMBAYARAN.batasJam`, bawaan 72 jam).
2. **Tujuan pembayaran**: semua e-wallet dan rekening bank yang nomornya terisi di `PEMBAYARAN` (`apps-script/Konsultasi.gs`), plus gambar QRIS bila diisi.
3. **Langkah konfirmasi**: unggah bukti di /konsultasi (tombol *Saya sudah bayar*), atau balas email / kirim via WhatsApp; admin lalu menekan **Konfirmasi lunas** dan klien menerima email *Pembayaran diterima*.

Bila keputusan diubah menjadi gratis atau tolak, tagihan yang masih terbuka otomatis dibatalkan. Untuk melihat contoh email tanpa membuat tagihan, jalankan `ujiEmailInstruksiBayar` dari editor Apps Script (email terkirim ke `KONS.EMAIL_PEMILIK`).

**Samakan tujuan pembayaran di dua tempat:** `PEMBAYARAN` di `apps-script/Konsultasi.gs` (untuk email) dan `dompet` / `rekening` / `qris` di `config.js` (untuk halaman konsultasi).

## Paket

Diatur di `PAKET` pada `apps-script/Konsultasi.gs` dan muncul sebagai **pilihan cepat** di formulir keputusan admin (admin tetap bisa menetapkan harga lain). Harga saat ini adalah **contoh** dan wajib dikonfirmasi pemilik:

| ID | Paket | Harga contoh | Isi |
|---|---|---|---|
| `sesi-1` | Konsultasi lanjutan 1 sesi | Rp250.000 | Video call 45 menit, telaah program, rekomendasi tertulis |
| `paket-4` | Pendampingan 4 minggu | Rp750.000 | 2 sesi, evaluasi mingguan via WhatsApp, penyesuaian program tiap 2 minggu |
| `paket-12` | Pendampingan 12 minggu | Rp1.800.000 | 6 sesi, evaluasi mingguan, periodisasi gizi sampai kompetisi |

`KONS.JADWAL_URL` dapat diisi tautan Google Calendar "Appointment schedule" agar klien yang sudah lunas langsung memilih jadwal sendiri.

## Mengaktifkan

1. **Daftar Midtrans** di https://dashboard.midtrans.com (gratis; biaya per transaksi dipotong dari pembayaran). Mode **Sandbox** langsung tersedia untuk uji coba; mode **Production** aktif setelah verifikasi data usaha/rekening.
2. Ambil **Server Key** di Midtrans › Settings › Access Keys.
3. Di proyek Apps Script **Layanan Konsultasi murykuswari.com** › Project Settings (ikon roda gigi) › **Script Properties** › Add:
   - `MIDTRANS_SERVER_KEY` = server key (jangan pernah ditulis di kode atau repo)
   - `MIDTRANS_PRODUKSI` = `true` hanya setelah memakai server key Production (kosongkan untuk Sandbox)
4. Di Midtrans › Settings › **Payment** › Notification URL, isi URL web app layanan konsultasi (nilai `programEndpoint` di `config.js`).
5. Uji di Sandbox memakai simulator pembayaran Midtrans, lalu periksa tab **Pembayaran** di spreadsheet dan dashboard.

Sebelum langkah 3, admin tetap bisa memutuskan "berbayar"; klien diberi tahu bahwa instruksi pembayaran dikirim lewat email.

## Data

Tab **Permintaan**: ID, waktu, email, nama, ID klien praktisi, topik, pertanyaan, status (`menunggu-keputusan`, `gratis`, `menunggu-bayar`, `lunas`, `dijawab`, `ditolak`), jenis, paket, harga, catatan admin, order ID, jawaban, waktu dijawab.


Tab **Pembayaran** di spreadsheet Database Konsultasi Gizi Olahraga: Order ID, waktu, email, nama, paket, jumlah, status (`menunggu`, `lunas`, `kedaluwarsa`, `gagal`, `dikembalikan`), metode, waktu lunas, ID klien praktisi, catatan klien, status asli Midtrans. Dashboard menampilkan total pendapatan, tabel pembayaran, dan penanda "Konsultasi lanjutan" pada kartu peserta yang sudah lunas.

## Catatan

- Web app Apps Script membalas notifikasi dengan pengalihan (302). Midtrans dapat mengirim ulang notifikasi; hal ini aman karena pemrosesan bersifat idempoten, dan `kons-status` tetap memvalidasi langsung ke API.
- Tagihan berlaku 24 jam.
- Pengembalian dana dilakukan dari dashboard Midtrans; statusnya ikut tercatat sebagai `dikembalikan`.
