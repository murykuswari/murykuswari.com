# Skema pembayaran konsultasi lanjutan

Konsultasi lanjutan dengan Assoc. Prof. Dr. Mury Kuswari dibayar lebih dulu melalui **Midtrans** (QRIS, transfer virtual account semua bank, GoPay/ShopeePay/OVO, kartu kredit). Status pembayaran divalidasi otomatis tanpa pengecekan manual.

## Alur

```
Klien (murykuswari.com/konsultasi)          Layanan Konsultasi (Apps Script)            Midtrans
──────────────────────────────────          ────────────────────────────────            ────────
1. Masuk, pilih paket, klik "Bayar"  ──────▶ 2. kons-bayar: buat order MK-…,
                                              catat "menunggu" di tab Pembayaran,
                                              minta tagihan Snap                  ──────▶ 3. tagihan + halaman bayar
4. Diarahkan ke halaman bayar Midtrans ◀──────────────────────────────────────────────────
5. Membayar (QRIS / VA / e-wallet)  ────────────────────────────────────────────────────▶ 6. pembayaran diterima
                                             7. Notifikasi HTTP masuk ke doPost  ◀──────
                                                - cek tanda tangan SHA-512
                                                  (order_id + status_code + gross_amount + server key)
                                                - cek ulang status resmi ke API Midtrans
                                                - cek nominal sama dengan tagihan
                                                - tandai "lunas", kirim email ke klien & pemilik
8. Kembali ke /konsultasi/?bayar=MK-…  ─────▶ 9. kons-status: bila masih "menunggu",
   halaman menampilkan "terverifikasi"         tanyakan langsung ke API Midtrans (cadangan
                                              bila notifikasi terlambat)
10. Email konfirmasi + tautan jadwal sesi
```

Validasi berlapis: tanda tangan digital Midtrans, pengecekan ulang ke API resmi, dan pencocokan nominal. Notifikasi yang dikirim ulang tidak menggandakan email, karena email hanya dikirim saat status pertama kali berubah menjadi lunas.

## Paket

Diatur di `PAKET` pada `apps-script/Konsultasi.gs`. Harga saat ini adalah **contoh** dan wajib dikonfirmasi pemilik:

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

Sebelum langkah 3, halaman konsultasi menampilkan daftar paket dengan keterangan "Pembayaran online segera dibuka".

## Data

Tab **Pembayaran** di spreadsheet Database Konsultasi Gizi Olahraga: Order ID, waktu, email, nama, paket, jumlah, status (`menunggu`, `lunas`, `kedaluwarsa`, `gagal`, `dikembalikan`), metode, waktu lunas, ID klien praktisi, catatan klien, status asli Midtrans. Dashboard menampilkan total pendapatan, tabel pembayaran, dan penanda "Konsultasi lanjutan" pada kartu peserta yang sudah lunas.

## Catatan

- Web app Apps Script membalas notifikasi dengan pengalihan (302). Midtrans dapat mengirim ulang notifikasi; hal ini aman karena pemrosesan bersifat idempoten, dan `kons-status` tetap memvalidasi langsung ke API.
- Tagihan berlaku 24 jam.
- Pengembalian dana dilakukan dari dashboard Midtrans; statusnya ikut tercatat sebagai `dikembalikan`.
