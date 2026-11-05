/*
 * DATA BUKU untuk galeri sampul (beranda & halaman Karya Ilmiah).
 * sampul  : path gambar di assets/img/buku/. Kosongkan jika belum ada; website membuat sampul desain.
 * sinopsis: muncul saat buku diklik.
 * unduh   : (opsional) id berkas di data/unduhan.js. Tanpa nilai ini, buku tidak bisa diunduh.
 */
window.BUKU = [
  { tahun: 2026, judul: "Modul Bahan Bacaan UTS: Kondisi Fisik dan Program Latihan", penulis: "Dr. Mury Kuswari, S.Pd., M.Si.", penerbit: "Universitas Esa Unggul", sampul: "", unduh: "modul-kondisi-fisik",
    sinopsis: "Modul untuk mahasiswa Ilmu Gizi yang merangkum sembilan pokok bahasan: prinsip latihan dan FITT-M, pengukuran aktivitas fisik dan kebugaran, somatotype Heath-Carter, latihan kekuatan dan kardio, core training, plyometric, SAQ, serta latihan endurance. Setiap bab berisi tujuan belajar, tabel ringkas, contoh perhitungan, dan poin penting, dilengkapi kisi-kisi UTS dan ringkasan rumus." },
  { tahun: 2024, judul: "Sports Nutrition: Uncommon Knowledge in Shape, Physical Fitness, and Longevity", penulis: "Kuo, Nicholls, Dewi, Kuswari, et al.", penerbit: "Asian Nutrition Society for Sports and Health", sampul: "",
    sinopsis: "Buku rujukan lintas negara dari para penulis Asian Nutrition Society for Sports and Health tentang peran gizi olahraga dalam pembentukan tubuh, kebugaran fisik, dan umur panjang yang sehat. Buku ini diperkenalkan kepada publik Indonesia pada forum ISPEN 2024." },
  { tahun: 2024, judul: "Metode Peningkatan Kebugaran Fisik Pekerja", sub: "Tele-exercise Strength dan Strength-Cardio", penulis: "Kuswari, Gifari, Rimbawan, Hardinsyah, Dewi, Himarwan", penerbit: "Selat Media", sampul: "assets/img/buku/2024-metode-kebugaran-pekerja.jpg",
    sinopsis: "Berangkat dari masalah obesitas dan rendahnya kebugaran pada pekerja, buku ini menyajikan landasan teori dan model latihan daring yang bisa dilakukan di rumah atau kantor. Dua program utamanya adalah tele-exercise strength dan kombinasi strength-cardio, yang dikembangkan dari riset penulis pada karyawan." },
  { tahun: 2022, judul: "Gizi Olahraga: Kesehatan Jantung dan Kebugaran", penulis: "Maigoda, Kuswari, Gifari", penerbit: "Penerbit NEM", sampul: "assets/img/buku/2022-gizi-olahraga-jantung.jpg",
    sinopsis: "Membahas gizi atlet secara runtut, mulai dari kebutuhan karbohidrat, protein, lemak, vitamin, mineral, dan cairan, lalu kebutuhan gizi menurut periode latihan dan pertandingan. Bagian berikutnya mengulas manajemen berat badan, pengaturan waktu makan, serta kaitan olahraga dengan kesehatan jantung." },
  { tahun: 2022, judul: "Panduan Penyelenggaraan Makanan Olahragawan dalam Kejuaraan Olahraga", penulis: "Gifari, Kuswari, et al.", penerbit: "Kementerian Kesehatan RI", sampul: "assets/img/buku/2022-panduan-makanan-olahragawan.jpg",
    sinopsis: "Panduan resmi Kementerian Kesehatan yang menjelaskan gambaran dan langkah penyelenggaraan makanan bagi olahragawan selama kejuaraan, agar kebutuhan gizi terpenuhi dan menunjang daya saing. Ditujukan bagi tenaga gizi dan panitia penyelenggara makanan pada kejuaraan olahraga." },
  { tahun: 2021, judul: "Panduan Pendampingan Gizi pada Atlet", penulis: "Kuswari, Gifari, et al.", penerbit: "Kementerian Kesehatan RI", sampul: "assets/img/buku/2021-pedoman-pendampingan-gizi-atlet.jpg",
    sinopsis: "Panduan Kementerian Kesehatan tentang tata cara pendampingan dan asuhan gizi yang tepat bagi atlet dari berbagai cabang olahraga, supaya kondisi fisik prima dan performa optimal dapat tercapai." },
  { tahun: 2021, judul: "Buku Pintar Gizi bagi Atlet", penulis: "Kuswari, Gifari, et al.", penerbit: "Kementerian Kesehatan RI", sampul: "assets/img/buku/2021-buku-pintar-gizi-atlet.jpg",
    sinopsis: "Rujukan praktis dari Kementerian Kesehatan bagi atlet, pelatih, dan tenaga gizi tentang kebutuhan zat gizi, cairan, dan pengaturan makan untuk latihan dan pertandingan, termasuk batas asupan protein dan panduan penggantian cairan." },
  { tahun: 2020, judul: "Periodisasi Gizi dan Latihan", penulis: "Mury Kuswari, Nazhif Gifari", penerbit: "RajaGrafindo Persada", sampul: "assets/img/buku/2020-periodisasi-gizi-latihan.jpg",
    sinopsis: "Menyatukan program latihan dan program gizi agar performa atlet meningkat secara terencana. Dalam delapan bab, buku ini mengulas kebugaran, energi dan sistem energi, periodisasi latihan, penatalaksanaan gizi di tiap periode, hidrasi, dan optimalisasi performa, disertai contoh kasus untuk mahasiswa, pelatih, dan praktisi." },
  { tahun: 2019, judul: "Fit Saat Berpuasa: Tetap Bugar di Bulan Ramadhan", penulis: "Kuswari, Gifari, Nuzrina, Aryawan, Marcelina, Justickarin", penerbit: "IPB Press", sampul: "assets/img/buku/2019-fit-saat-berpuasa.jpg",
    sinopsis: "Buku populer dari tim gizi olahraga tentang cara menjaga pola makan dan kebugaran selama berpuasa, agar ibadah Ramadhan tetap dijalani dengan tubuh yang sehat dan bugar." },
  { tahun: 2017, judul: "Ilmu Gizi: Teori & Aplikasi (bab Gizi Olahraga)", penulis: "Hardinsyah, Supariasa (ed.), Kuswari, et al.", penerbit: "Penerbit Buku Kedokteran EGC", sampul: "assets/img/buku/2017-ilmu-gizi-teori-aplikasi.jpg",
    sinopsis: "Buku ajar ilmu gizi yang disunting Hardinsyah dan Supariasa. Mury Kuswari berkontribusi pada bab Gizi Olahraga, yang menghubungkan prinsip ilmu gizi dengan kebutuhan orang yang aktif berolahraga dan atlet." }
];
