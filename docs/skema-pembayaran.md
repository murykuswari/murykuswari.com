# Skema pembayaran konsultasi lanjutan

Konsultasi lanjutan dengan Assoc. Prof. Dr. Mury Kuswari dibayar lebih dulu melalui **Midtrans** (QRIS, transfer virtual account semua bank, GoPay/ShopeePay/OVO, kartu kredit). Status pembayaran divalidasi otomatis tanpa pengecekan manual.

## Alur: ajukan dulu, bayar hanya bila diputuskan berbayar

```
Klien (murykuswari.com/konsultasi)            Pengelola (dashboard.html)                     Midtrans
──────────────────────────────────            ──────────────────────────                     ────────
1. "Tanya Dr. Mury": topik + pertanyaan
   (tanpa bayar) ── kons-tanya ─────────────▶ 2. Email "Permintaan konsultasi" + kartu di
                                                 "Permintaan konsultasi" (status: baru)
                                              3. Baca masalah + profil + riwayat program, pilih:
   ◀── email "diterima (gratis)" ───────────     • Gratis   → status "siap"
   ◀── email "Bayar Rp…" + tautan ──────────     • Berbayar → paket atau harga sendiri + catatan
                                                   → tagihan Snap, status "menunggu-bayar"
4. Membayar (QRIS / VA / e-wallet) ──────────────────────────────────────────────────────────▶ 5. diterima
                                              6. Notifikasi ke doPost: tanda tangan SHA-512,  ◀──
                                                 cek ulang API, cocok nominal → "lunas"
   ◀── email "Lunas, siap dijawab" ─────────     → status permintaan "siap"
   ◀── email alasan/saran ──────────────────     • Tolak    → status "ditolak"
7. Jawaban tampil di halaman klien  ◀────────  8. Tulis jawaban (kons-jawab) → status "dijawab",
   + email jawaban                                tersimpan di tab Permintaan
```

- Klien belum membayar apa pun saat mengajukan; maksimal 3 permintaan terbuka (baru/menunggu bayar) per akun.
- Harga sendiri: Rp10.000 – Rp50.000.000. Tagihan berlaku 24 jam; selama masih "menunggu-bayar" pengelola bisa memutuskan ulang (tagihan baru menggantikan yang lama di permintaan).
- Jawaban hanya bisa ditulis untuk status "siap" (gratis atau sudah lunas) dan bisa diperbarui; klien menerima email setiap kali.
- Data permintaan ada di tab **Permintaan**: ID, waktu, email, nama, ID klien praktisi, topik, pertanyaan, status (`baru`, `menunggu-bayar`, `siap`, `ditolak`, `dijawab`), keputusan, paket, harga, catatan pengelola, order ID, tautan bayar, jawaban, waktu dijawab.

Validasi pembayaran berlapis: tanda tangan digital Midtrans, pengecekan ulang ke API resmi, dan pencocokan nominal. Notifikasi yang dikirim ulang tidak menggandakan email, karena email hanya dikirim saat status pertama kali berubah menjadi lunas. Bila notifikasi terlambat, `kons-status` (saat klien kembali dari halaman bayar atau menekan "Cek") menanyakan langsung ke API Midtrans.

## Paket

Diatur di `PAKET` pada `apps-script/Konsultasi.gs`. Harga saat ini adalah **contoh** dan wajib dikonfirmasi pemilik. Paket dipilih pengelola saat memutuskan "berbayar" (atau pengelola menentukan harga sendiri); klien melihatnya sebagai daftar tarif:

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

Sebelum langkah 3, keputusan "berbayar" di dashboard ditolak dengan pesan bahwa pembayaran online belum aktif; keputusan gratis dan tolak tetap berjalan.

## Data

Tab **Pembayaran** di spreadsheet Database Konsultasi Gizi Olahraga: Order ID, waktu, email, nama, paket, jumlah, status (`menunggu`, `lunas`, `kedaluwarsa`, `gagal`, `dikembalikan`), metode, waktu lunas, ID klien praktisi, catatan klien, status asli Midtrans. Dashboard menampilkan total pendapatan, tabel pembayaran, dan penanda "Konsultasi lanjutan" pada kartu peserta yang sudah lunas.

## Catatan

- Web app Apps Script membalas notifikasi dengan pengalihan (302). Midtrans dapat mengirim ulang notifikasi; hal ini aman karena pemrosesan bersifat idempoten, dan `kons-status` tetap memvalidasi langsung ke API.
- Tagihan berlaku 24 jam.
- Pengembalian dana dilakukan dari dashboard Midtrans; statusnya ikut tercatat sebagai `dikembalikan`.
