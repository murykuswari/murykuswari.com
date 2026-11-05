# murykuswari.com

Website personal branding **Dr. Mury Kuswari, S.Pd., M.Si**, Dosen Peneliti Gizi Olahraga & Kebugaran, Wakil Rektor Bidang Kemahasiswaan Universitas Esa Unggul.

Website statis (HTML, CSS, JavaScript murni), tanpa proses build, siap dihosting di **GitHub Pages** dengan domain `murykuswari.com`.

## Isi website

| Halaman | Fungsi |
|---|---|
| `index.html` | Landing page: profil, kepakaran, rak sampul buku, penghargaan, **unduh CV**, layanan, lalu kegiatan & dokumentasi di bagian bawah |
| `kegiatan.html` | Kabar kegiatan: foto, tanggal, tempat, peran, deskripsi, caption media sosial, link dokumentasi; filter kategori/tahun dan pencarian |
| `pembicara.html` | Portofolio pembicara per tahun: statistik, filter jenis/lingkup, pencarian, **cetak/PDF, unduh CSV** |
| `publikasi.html` | Penelitian, buku, abdimas, prosiding; filter, urut sitasi, **cetak/PDF, unduh CSV, salin gaya APA** |
| `berita.html` | Liputan media dengan thumbnail dan ringkasan, tautan ke artikel asli |
| `unduhan.html` | Unduhan modul dengan verifikasi **OTP email**, data pengunduh masuk ke Google Sheet |
| `gizi.html` | Kalkulator IMT, persen lemak tubuh, berat badan ideal, kebutuhan energi + **konsultasi online** (WhatsApp/email) |
| `input.html` | Ruang admin: formulir kegiatan baru dengan **generator caption otomatis** |

## Struktur folder

```
config.js              ← pengaturan utama (WhatsApp, email, link Sheet, statistik Scholar)
data/kegiatan.js       ← daftar kegiatan
data/publikasi.js      ← daftar karya ilmiah
data/buku.js           ← daftar buku + gambar sampul (tanpa file unduhan)
data/pembicara.js      ← portofolio pembicara per tahun
assets/cv/             ← file CV yang diunduh pengunjung
assets/img/            ← foto profil, logo Esa Unggul, foto kegiatan
assets/img/buku/       ← gambar sampul buku
assets/css/style.css   ← tampilan
assets/js/             ← logika halaman
docs/                  ← analisis branding & template Google Sheet
```

## Cara memperbarui konten

### Mengganti CV
Unggah PDF baru ke `assets/cv/` dengan nama yang sama (`CV-Dr-Mury-Kuswari-2026.pdf`), atau ubah nilai `cv` di `config.js`.

### Menambah data pembicara
Tambahkan satu baris di `data/pembicara.js` (format ada di bagian atas file). Website mengurutkan dan mengelompokkan per tahun secara otomatis, statistiknya juga menghitung sendiri. Jangan menautkan dokumen asli karena memuat data pribadi.

### Menambah buku
Unggah gambar sampul (JPG, lebar ±600 px) ke `assets/img/buku/`, lalu tambahkan satu baris di `data/buku.js` berisi tahun, judul, penulis, penerbit, sinopsis, dan path sampul. Sinopsis muncul saat sampul diklik. File buku tidak diunggah ke repositori.

### Menambah berita
Tambahkan satu entri di `data/berita.js`. Tulis ringkasan dengan kata-kata sendiri, jangan menyalin artikel. Thumbnail memakai tautan foto dari media asal; bila gagal dimuat, website menampilkan thumbnail desain.

### Abstrak karya ilmiah
`data/abstrak.js` menyimpan DOI dan teks abstrak berlisensi Creative Commons. Abstrak lain dimuat langsung dari Crossref atau OpenAlex saat judul diklik. Jika tidak ada, pengunjung diarahkan ke sumber aslinya.

### Unduhan ber-OTP
Berkas tetap privat di Google Drive dan diserahkan oleh Google Apps Script (`apps-script/Kode.gs`) setelah pengunjung memasukkan OTP dari email. Pemasangan dan cara menambah berkas ada di `docs/panduan-unduhan-otp.md`.

### Tampilan
Warna diambil dari logo Universitas Esa Unggul (biru `#0070B8`, oranye `#F05828`) dan didefinisikan di bagian atas `assets/css/style.css`. Font: Outfit untuk judul dan isi, JetBrains Mono untuk label dan angka.

### Menambah kegiatan (pilih salah satu)

1. **Google Sheet (paling mudah).** Impor `docs/template-kegiatan.csv` ke Google Sheet. Klik **File → Bagikan → Publikasikan ke web**, pilih sheet, format **CSV**, salin link. Tempel link itu ke `sheetKegiatanCsv` di `config.js`. Selanjutnya cukup tambah baris di Sheet.
2. **Formulir `input.html`.** Buka `murykuswari.com/input.html`, isi data. Caption dibuat otomatis. Salin hasilnya ke Google Sheet atau ke paling atas `data/kegiatan.js`.
3. **Edit langsung di GitHub.** Buka `data/kegiatan.js` di github.com → ikon pensil → tambah entri → Commit.
4. **Minta Claude.** Simpan undangan/foto/laporan ke folder Google Drive kegiatan, lalu minta Claude membaca dan menambahkannya.

**Foto dari Google Drive:** atur berbagi file menjadi *Siapa saja yang memiliki link dapat melihat*, lalu tempel link file di kolom `foto`. Jangan membagikan dokumen yang memuat data pribadi (KTP, nomor HP, tanda tangan) sebagai link dokumentasi publik.

### Mengaktifkan WhatsApp konsultasi
Isi `whatsapp: "62812xxxxxxx"` di `config.js`. Tombol WhatsApp di halaman konsultasi dan tombol mengambang akan muncul otomatis.

## Deploy ke GitHub Pages + domain murykuswari.com

1. Push repositori ini ke GitHub (branch `main`).
2. Di GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Workflow `.github/workflows/pages.yml` akan berjalan otomatis setiap ada perubahan.
3. **Settings → Pages → Custom domain:** isi `murykuswari.com` (file `CNAME` sudah tersedia), centang **Enforce HTTPS**.
4. Di panel DNS penyedia domain, tambahkan:

   | Tipe | Nama | Nilai |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | `<username-github>.github.io` |

   Propagasi DNS biasanya 10 menit sampai 24 jam.

## Menjalankan di komputer sendiri
Cukup buka `index.html` di browser. Untuk menguji pemuatan Google Sheet, jalankan server lokal, misalnya `python -m http.server 8000`.

## Sumber data
CV 2026, Google Scholar (`Z8e0i-0AAAAJ`, diperbarui November 2026), dan dokumen kegiatan di Google Drive pemilik. Lihat `docs/analisis-branding.md` untuk strategi personal branding dan pedoman caption.
