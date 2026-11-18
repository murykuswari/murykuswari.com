# Panduan Program Gizi Personal

Bagian **Program Gizi Personal** di `gizi.html#program` (`program.html` lama dialihkan ke sana) menghitung program gizi olahraga personal dan menyimpan setiap konsultasi ke Google Drive pemilik. Penyimpanan dijalankan oleh `apps-script/Konsultasi.gs`, yang dipasang di proyek Apps Script yang sama dengan layanan unduhan ber-OTP (`Kode.gs`), sehingga URL layanannya sama.

## Alur pengguna

1. **Masuk**: isi email, terima kode 6 digit, masukkan kode. Tidak ada kata sandi.
2. **Profil** (sekali, bisa diubah): nama lengkap, jenis kelamin, tanggal lahir, WhatsApp, asal, cabang olahraga, level, nomor/kelas tanding.
3. **Asesmen**: BB, TB, komposisi tubuh (skinfold JP3/JP7/Durnin–Womersley atau % lemak BIA/DXA), tujuan, fase, target, jadwal latihan satu minggu (jenis, durasi, RPE), tes laju keringat, skrining REDs, dan deskripsi tujuan konsultasi.
4. **Program & pembahasan**: energi, KH, protein, lemak per hari; makan sebelum/saat/sesudah latihan; hidrasi; suplemen; target BB; pembahasan; perkembangan dibanding konsultasi sebelumnya.
5. **Simpan**: data masuk ke Sheet, laporan dibuat sebagai Google Doc di folder klien, salinan dikirim ke email klien, dan pemilik menerima pemberitahuan.

Saat klien masuk lagi, isian terisi otomatis dari konsultasi terakhir dan riwayat BB serta % lemak tampil di samping.

## Tempat data di Drive

```
Claude 2026/
  Konsultasi Gizi Olahraga – murykuswari.com/
    Database Konsultasi Gizi Olahraga     ← Sheet: tab "Klien" dan "Konsultasi"
    Klien/
      <Nama> – <email>/                    ← satu Google Doc per konsultasi
```

- Tab **Klien**: satu baris per klien (email, nama, jenis kelamin, tanggal lahir, asal, WhatsApp, cabang, level, tanggal daftar, terakhir masuk, jumlah konsultasi, tautan folder).
- Tab **Konsultasi**: satu baris per konsultasi (ringkasan angka utama, tujuan konsultasi, tautan laporan) dan kolom **Data (JSON)** berisi seluruh isian, dipakai untuk mengisi ulang formulir dan menghitung perkembangan.

ID folder dan Sheet sudah ditulis di `KONS` pada `Konsultasi.gs`.

## Mengaktifkan (sekali, ±5 menit)

1. Buka proyek Apps Script `Unduhan murykuswari.com` (yang dipakai layanan unduhan) di [script.google.com](https://script.google.com).
2. Ganti isi `Kode.gs` dengan versi terbaru dari repo (hanya bertambah satu baris di `doPost` yang meneruskan permintaan `kons-…`).
3. Klik **+ > Script**, beri nama `Konsultasi`, tempel seluruh isi `apps-script/Konsultasi.gs`, lalu simpan.
4. Pilih fungsi `siapkanKonsultasi`, klik **Run**, dan setujui izin baru (Google Sheets, Google Docs, Drive). Tab Klien dan Konsultasi serta folder Klien dibuat otomatis.
5. **Deploy > Manage deployments > Edit (ikon pensil) > Version: New version > Deploy.** URL `/exec` tidak berubah, jadi `config.js` tidak perlu diubah.

Sebelum langkah 5 selesai, bagian Program Gizi Personal berjalan dalam **mode lokal**: program tetap dihitung, tetapi data hanya tersimpan di perangkat pengunjung.

## Pengaturan di `Konsultasi.gs`

| Nama | Bawaan | Fungsi |
|---|---|---|
| `SESI_JAM` | 6 | Lama sesi setelah masuk (maksimal 6 jam) |
| `KIRIM_SALINAN_KLIEN` | true | Kirim ringkasan program ke email klien |
| `KABARI_PEMILIK` | true | Kirim pemberitahuan setiap konsultasi baru ke `EMAIL_PEMILIK` |
| `MAX_SIMPAN_HARI` | 10 | Batas simpan per klien per hari |

Kuota email Apps Script: 100/hari untuk akun Gmail biasa, 1.500/hari untuk Google Workspace. Setiap konsultasi memakai 2 email (klien + pemilik) dan setiap masuk memakai 1.

## Dasar perhitungan

`assets/js/program-engine.js` (fungsi murni, bisa diuji dengan Node) mengikuti *Tinjauan Sistematik Perhitungan dalam Gizi Olahraga dan Kebugaran*:

- Komposisi tubuh: Jackson–Pollock 3/7 titik, Durnin–Womersley, Siri dan Brožek, FFM, FFMI ternormalisasi, BB target.
- REE: sembilan persamaan; dipilih Cunningham (1980) bila ada FFM, Tinsley untuk physique, ten Haaf berbasis BB bila FFM belum ada.
- Energi harian faktorial: REE × faktor aktivitas non-latihan + energi latihan neto ((MET − 1) × BB × jam); pembanding rumus Kemenkes 2021.
- Beban harian session-RPE → kategori KH (Burke 2011; Thomas 2016), dibatasi rentang kelompok cabang; protein menurut tujuan; lemak sisa energi 20–35%.
- Penurunan lemak/kelas berat: defisit dari laju % BB/minggu, lantai EA 30 kkal/kg FFM; target kelas dengan ruang penurunan akut (Reale 2017).
- Timing per jenis sesi, hidrasi dari laju keringat, suplemen IOC per kelompok (tidak untuk usia < 18 tahun), carbo loading menjelang lomba endurance.

## Privasi

Data konsultasi adalah data kesehatan pribadi. Sheet dan folder tetap privat (tidak dibagikan). Laporan Google Doc tidak dibagikan ke klien; klien menerima salinan isi laporan melalui email. Hapus baris dan folder klien bila klien meminta datanya dihapus.
