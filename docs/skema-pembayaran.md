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
