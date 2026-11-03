/*
 * DATA KEGIATAN
 * Tambahkan kegiatan baru di PALING ATAS daftar. Cara termudah: buka /input.html,
 * isi formulirnya, lalu salin hasilnya ke sini. Lihat README untuk opsi Google Sheet.
 *
 * Kolom:
 *  id           : kode unik, huruf kecil dan tanda hubung
 *  tanggal      : "YYYY-MM-DD", atau "YYYY-MM" / "YYYY" bila tanggal pasti tidak ada
 *  sampai       : (opsional) tanggal selesai untuk kegiatan beberapa hari
 *  kategori     : Internasional | Narasumber | Media | Pendampingan Atlet | Pengabdian | Mengajar | Penghargaan
 *  peran        : peran Dr. Mury dalam kegiatan
 *  foto         : path lokal (assets/img/kegiatan/...) ATAU link/ID file Google Drive yang dibagikan publik
 *  dokumentasi  : (opsional) link folder/file dokumentasi yang bisa diakses publik
 */
window.KEGIATAN = [
  {
    id: "podcast-fkm-ui-malas-gerak",
    judul: "Podcast Kesehatan FKM UI: \"Kenapa Kita Malas Gerak?\"",
    tanggal: "2026-10-29",
    tempat: "Studio Podcast Fakultas Ekonomi dan Bisnis, Universitas Indonesia, Depok",
    kategori: "Media",
    peran: "Narasumber pakar, bersama figur publik Febby Rastanty",
    penyelenggara: "Program Doktor Ilmu Kesehatan Masyarakat FKM UI",
    deskripsi: "Video podcast mata kuliah Isu Terkini Kesehatan Masyarakat yang membedah rendahnya aktivitas fisik dari kacamata social and commercial determinants of health. Dr. Mury mengisi segmen \"Olahraga yang Benar\": porsi latihan realistis untuk pemula, kombinasi kardio dan latihan kekuatan, pentingnya pemulihan, serta gizi sebelum dan sesudah olahraga.",
    caption: "Malas gerak itu bukan sekadar soal niat. 🏃\n\nDi Podcast Kesehatan FKM UI, saya berbincang bersama Febby Rastanty tentang kenapa banyak dari kita sulit aktif: jadwal padat, kota yang kurang ramah pejalan kaki, sampai tren olahraga di media sosial yang membuat bugar terasa mahal.\n\nPesan saya sederhana: mulai dari langkah kecil yang realistis. Tidak harus mahal, tidak harus ikut tren. Yang penting konsisten dan sesuai kondisi tubuh.\n\nApa alasan terbesarmu sulit mulai olahraga? Tulis di kolom komentar 👇",
    hashtag: ["AyoBergerak", "OlahragaCerdas", "GiziOlahraga", "FKMUI", "MuryKuswari"],
    foto: "",
    dokumentasi: ""
  },
  {
    id: "webinar-pbsi-2026-sesi-7",
    judul: "Webinar Nasional Bulutangkis 2026 – Session 7",
    tanggal: "2026-10-28",
    tempat: "Live streaming YouTube \"Badminton Indonesia\"",
    kategori: "Narasumber",
    peran: "Narasumber, Pakar Gizi Olahraga Universitas Esa Unggul",
    penyelenggara: "Pengurus Pusat PBSI",
    deskripsi: "Penugasan resmi PP PBSI sebagai narasumber webinar nasional bagi pelatih dan insan bulutangkis Indonesia. Materi berfokus pada strategi gizi untuk olahraga intermiten berintensitas tinggi: kebutuhan karbohidrat, hidrasi, dan pemulihan antar-pertandingan.",
    caption: "Satu reli bulutangkis bisa memaksa tubuh sprint, melompat, dan berhenti mendadak puluhan kali. Tanpa bahan bakar yang tepat, teknik terbaik pun ikut turun di gim ketiga. 🏸\n\nTerima kasih PP PBSI atas kepercayaannya di Webinar Nasional Bulutangkis 2026 Session 7. Kita membahas cara mengatur karbohidrat, cairan, dan pemulihan agar atlet tetap tajam dari poin pertama sampai match point.\n\nPelatih dan atlet, bagian mana yang paling sering terlewat: sarapan sebelum latihan atau minum saat jeda?",
    hashtag: ["BadmintonIndonesia", "GiziAtlet", "SportsNutrition", "PBSI", "MuryKuswari"],
    foto: "",
    dokumentasi: ""
  },
  {
    id: "pelatihan-pelatih-forki-bekasi-2026",
    judul: "Pelatihan Pelatih Karate FORKI Kabupaten Bekasi",
    tanggal: "2026-10-27",
    sampai: "2026-10-29",
    tempat: "Stadion Wibawa Mukti, Cikarang Timur, Kabupaten Bekasi",
    kategori: "Narasumber",
    peran: "Narasumber gizi olahraga",
    penyelenggara: "Pengurus FORKI Kabupaten Bekasi",
    deskripsi: "Pembekalan bagi pelatih karate se-Kabupaten Bekasi tentang peran gizi dalam pembinaan prestasi: kebutuhan energi atlet usia muda, manajemen berat badan menjelang kompetisi yang aman, dan peran pelatih sebagai penghubung edukasi gizi kepada atlet.",
    caption: "Pelatih adalah orang yang paling sering ditemui atlet setiap hari. Karena itu, edukasi gizi paling efektif justru dimulai dari pelatih. 🥋\n\nTiga hari bersama para pelatih karate FORKI Kabupaten Bekasi di Stadion Wibawa Mukti, kita membahas cara menurunkan berat badan menjelang tanding tanpa mengorbankan tenaga, serta menyusun pola makan atlet muda yang mendukung prestasi jangka panjang.\n\nSalam olahraga untuk karate Kabupaten Bekasi! Osu!",
    hashtag: ["KarateIndonesia", "FORKI", "GiziAtlet", "PelatihHebat", "MuryKuswari"],
    foto: "",
    dokumentasi: ""
  },
  {
    id: "kuliah-pakar-ub-2026",
    judul: "Kuliah Pakar \"Work-Food-Balance: Corporate Wellness\"",
    tanggal: "2026-05-12",
    tempat: "Magister Ilmu Gizi, Fakultas Ilmu Kesehatan, Universitas Brawijaya, Malang",
    kategori: "Mengajar",
    peran: "Dosen tamu mata kuliah Current Issues of Food and Nutrition",
    penyelenggara: "Program Studi Magister Ilmu Gizi FIKES Universitas Brawijaya",
    deskripsi: "Atas undangan Dekan FIKES UB, Dr. Mury mengajar mahasiswa magister tentang program corporate wellness berbasis bukti: tele-exercise, pendampingan gizi personal, dan cara mengukur dampaknya terhadap komposisi tubuh serta produktivitas karyawan.",
    caption: "Karyawan yang bugar bukan bonus, tapi strategi. 💼🥗\n\nSenang berbagi dengan mahasiswa Magister Ilmu Gizi Universitas Brawijaya tentang Work-Food-Balance. Dari riset kami, IMT tinggi, persen lemak tinggi, dan aktivitas fisik rendah berkaitan erat dengan turunnya produktivitas kerja. Kabar baiknya, program sederhana seperti tele-exercise 20–30 menit plus pendampingan gizi terbukti bisa membalik keadaan.\n\nKampus dan industri perlu berjalan bersama di sini.",
    hashtag: ["CorporateWellness", "TeleExercise", "GiziKerja", "UniversitasBrawijaya", "MuryKuswari"],
    foto: "",
    dokumentasi: ""
  },
  {
    id: "tvri-arah-angin-ramadhan-2026",
    judul: "TVRI \"Arah Angin\": Sehat di Bulan Ramadhan",
    tanggal: "2026-02-12",
    tempat: "Studio 7 LPP TVRI Pusat, Senayan, Jakarta",
    kategori: "Media",
    peran: "Narasumber dialog, Pakar Gizi Olahraga",
    penyelenggara: "LPP TVRI, Tim Siaran Current Affairs",
    deskripsi: "Dialog televisi nasional tentang menjaga kebugaran selama puasa Ramadhan: waktu olahraga yang tepat, intensitas yang aman, serta strategi sahur dan berbuka agar energi dan hidrasi tetap terjaga. Topik ini juga dibahas dalam buku \"Fit Saat Berpuasa\" karya Dr. Mury dan tim.",
    caption: "Puasa bukan alasan berhenti bergerak. 🌙\n\nDi program Arah Angin TVRI, kita membahas cara tetap bugar selama Ramadhan: kapan waktu terbaik berolahraga, seberapa berat latihannya, dan apa yang perlu ada di piring saat sahur dan berbuka.\n\nRingkasnya: olahraga ringan–sedang menjelang berbuka atau setelah tarawih, sahur dengan karbohidrat kompleks dan protein, serta cukupi cairan secara bertahap dari berbuka sampai sahur.\n\nSelamat menjalankan ibadah, tetap sehat dan bugar!",
    hashtag: ["FitSaatBerpuasa", "SehatRamadhan", "TVRI", "GiziOlahraga", "MuryKuswari"],
    foto: "assets/img/kegiatan/2024-olahraga-puasa.jpg",
    fotoKeterangan: "Materi \"Strategi Berolahraga di Bulan Ramadan\" dan buku Fit Saat Berpuasa",
    dokumentasi: ""
  },
  {
    id: "wckss-2025-jeju",
    judul: "World Congress on Kinesiology and Sport Science (WCKSS) 2025 & KaSS Forum",
    tanggal: "2025-10-25",
    sampai: "2025-10-27",
    tempat: "International Convention Center Jeju, Korea Selatan",
    kategori: "Internasional",
    peran: "Oral presenter; Chairperson & Judge Young Investigators Award (YIA)",
    penyelenggara: "Asian Society of Kinesiology (ASK)",
    deskripsi: "Mempresentasikan riset \"Transforming the Workplace into a Health Hub: Impact of the 2024 Weight Loss Challenge at the Indonesian Ministry of Health\". Program 12 minggu ini menurunkan prevalensi obesitas peserta 14,26% dan menambah 25,04% peserta yang mencapai IMT normal. Dr. Mury juga ditunjuk sebagai Chairperson dan Juri YIA sesi Exercise, Rehabilitation & Functional Outcomes bersama juri dari berbagai negara.",
    caption: "Dari Jakarta ke Jeju: membawa cerita kantor yang berubah menjadi pusat kesehatan. 🇮🇩🇰🇷\n\nDi World Congress on Kinesiology and Sport Science 2025, saya mempresentasikan hasil Weight Loss Challenge 2024 di Kementerian Kesehatan RI. Dalam 12 minggu, prevalensi obesitas peserta turun 14,26% dan peserta dengan IMT normal naik 25,04%. Kuncinya bukan diet ekstrem, melainkan tele-exercise, pendampingan ahli gizi, dan dukungan antarrekan kerja.\n\nKehormatan besar juga dipercaya menjadi Chairperson dan Juri Young Investigators Award. Masa depan sport science Asia ada di tangan para peneliti muda ini.\n\nKamsahamnida, Jeju!",
    hashtag: ["WCKSS2025", "SportScience", "CorporateWellness", "UniversitasEsaUnggul", "MuryKuswari"],
    foto: "",
    dokumentasi: "https://drive.google.com/file/d/1xIH0p7RFzQhzNiq4DpMSudr54GJ9aeiV/view"
  },
  {
    id: "wlc-kemenkes-2024",
    judul: "Weight Loss Challenge (WLC) 2024 Kementerian Kesehatan RI",
    tanggal: "2024",
    tempat: "Kementerian Kesehatan RI, Jakarta",
    kategori: "Pengabdian",
    peran: "Konsultan dan ketua tim program wellness",
    penyelenggara: "Kementerian Kesehatan RI bersama Universitas Esa Unggul",
    deskripsi: "Program wellness korporat 12 minggu bagi pegawai Kemenkes dengan berat badan lebih dan obesitas (2.509 pegawai teridentifikasi). Intervensinya meliputi tele-exercise mingguan, daily healthy checklist, edukasi gizi digital dua kali sepekan, webinar bulanan, dan pendampingan ahli gizi personal. Hasilnya: prevalensi obesitas peserta turun 14,26%, peserta ber-IMT normal naik 25,04%, dan lingkar pinggang membaik pada 25,5% peserta.",
    caption: "Bagaimana membuat ribuan pegawai mau bergerak? Bukan dengan menyuruh, tapi dengan menemani. 🤝\n\nWeight Loss Challenge 2024 di Kementerian Kesehatan RI kami rancang supaya mudah dijalani orang sibuk: tele-exercise 30 menit, checklist harian, infografis gizi dua kali seminggu, dan ahli gizi yang siap menjawab lewat chat.\n\nHasil 12 minggu: obesitas turun 14,26%, peserta ber-IMT normal naik 25,04%. Mentoring antarrekan dan tantangan bergaya permainan terbukti menjaga semangat sampai akhir.\n\nKantor bisa jadi tempat paling sehat, asal didesain dengan benar.",
    hashtag: ["WeightLossChallenge", "Kemenkes", "WellnessCorporate", "TeleExercise", "MuryKuswari"],
    foto: "",
    dokumentasi: ""
  },
  {
    id: "ackss-2024-kuala-lumpur",
    judul: "The 14th Asia Conference on Kinesiology and Sport Science (ACKSS 2024)",
    tanggal: "2024-09-10",
    sampai: "2024-09-12",
    tempat: "Dorsett Grand Subang, Kuala Lumpur, Malaysia",
    kategori: "Internasional",
    peran: "Special Lecture Speaker; Juri Young Investigators Award; Executive Committee ASK",
    penyelenggara: "Asian Society of Kinesiology (ASK) & TAR UMT",
    deskripsi: "Konferensi tahunan dengan lebih dari 1.000 peserta dari 40+ negara. Dr. Mury, satu-satunya pembicara undangan dari Indonesia, membawakan special lecture \"Tele-Exercise: A New Approach to Overcome Obesity Problems among White-Collar Workers\" di hadapan 200+ peserta, menjadi juri lomba presentasi YIA, dan mewakili Indonesia dalam rapat Executive Committee ASK.",
    caption: "Obesitas pekerja kantoran adalah masalah Asia, bukan hanya Indonesia. 🌏\n\nDi ACKSS 2024 Kuala Lumpur, saya membawakan special lecture tentang tele-exercise: latihan terpandu daring 20–30 menit yang bisa dilakukan di sela jam kerja. Riset lima tahun kami di berbagai perusahaan Indonesia menunjukkan penurunan berat badan, IMT, dan lingkar pinggang yang nyata.\n\nBangga mewakili Indonesia dan Universitas Esa Unggul, sekaligus menjadi juri Young Investigators Award dan duduk di Executive Committee Asian Society of Kinesiology.\n\nTerima kasih Malaysia! 🇲🇾",
    hashtag: ["ACKSS2024", "TeleExercise", "AsianSocietyOfKinesiology", "EsaUnggulGoGlobal", "MuryKuswari"],
    foto: "",
    dokumentasi: "https://drive.google.com/file/d/1tX5hcxTPDmBPuX-Ii4Y032GmKvYhixoj/view"
  },
  {
    id: "dead-sea-conference-jordan-2024",
    judul: "3rd International Dead Sea Conference on Sport Development in Health & Competition",
    tanggal: "2024-04-24",
    sampai: "2024-04-26",
    tempat: "Crowne Plaza Dead Sea Resort, Yordania",
    kategori: "Internasional",
    peran: "International Guest Speaker dan oral presenter",
    penyelenggara: "Faculty of Sports Sciences, University of Jordan",
    deskripsi: "Satu-satunya pembicara dari Indonesia di kongres yang diikuti peserta lebih dari 30 negara. Dr. Mury membawakan \"Nutrition Periodization Program to Enhance Indonesian Elite Athletes\" di hadapan 150+ peserta dan 20+ profesor, serta mempresentasikan riset wellness berbasis tele-exercise. Ia juga diundang Jordan Scientific Committee dan Komite Olimpiade Yordania untuk berdiskusi tentang persiapan atlet menuju Olimpiade Paris 2024.",
    caption: "Satu-satunya dari Indonesia, berbicara di titik terendah bumi. 🇮🇩🇯🇴\n\nDi 3rd International Dead Sea Conference, University of Jordan, saya berbagi bagaimana periodisasi gizi membantu atlet elite Indonesia, dari taekwondo Pelatnas sampai petinju juara dunia, mencapai berat tanding dan performa puncak tepat waktu.\n\nYang paling berkesan: diskusi lanjutan dengan Komite Olimpiade Yordania tentang persiapan atlet mereka menuju Paris 2024. Ilmu gizi olahraga Indonesia ternyata punya tempat di panggung dunia.\n\nShukran, Jordan!",
    hashtag: ["NutritionPeriodization", "SportsNutrition", "UniversityOfJordan", "EsaUnggulGoGlobal", "MuryKuswari"],
    foto: "assets/img/kegiatan/2024-jordan.jpg",
    fotoKeterangan: "Certificate of Speaker, University of Jordan",
    dokumentasi: "https://drive.google.com/file/d/1TRP6NAfNAr-VsvTwUg3j0QOLsMMJ_5xC/view"
  },
  {
    id: "icans-2023-singapura",
    judul: "ICANS 2023: International Conference on Adaptations & Nutrition in Sports",
    tanggal: "2023-07-21",
    tempat: "Temasek Polytechnic, Singapura",
    kategori: "Internasional",
    peran: "Pembicara Symposium 14: Oxidative Stress & Cardiovascular Health",
    penyelenggara: "ICANS 2023",
    deskripsi: "Membawakan \"Nutrition Support for Peak Performance: Lessons Learned from Indonesian Elite Taekwondo and Boxing Athletes\", berbasis pengalaman mendampingi tim taekwondo nasional dan petinju peraih gelar WBO/WBA.",
    caption: "Apa yang dimakan juara sebelum naik ring? 🥊🥋\n\nDi ICANS 2023 Singapura, saya membagikan pelajaran dari lapangan saat mendampingi atlet taekwondo nasional dan petinju juara dunia asal Indonesia: membuat berat badan tanpa kehilangan tenaga, mengatur waktu makan di hari pertandingan, dan memantau pemulihan dengan data.\n\nBaru pertama kali dalam karier mereka, para petarung kami tetap bisa sarapan sebelum timbang badan. Sains yang diterapkan dengan tepat memang mengubah permainan.",
    hashtag: ["ICANS2023", "PeakPerformance", "GiziAtlet", "Taekwondo", "MuryKuswari"],
    foto: "assets/img/kegiatan/2023-icans-singapura.jpg",
    dokumentasi: ""
  },
  {
    id: "sea-games-2023-taekwondo",
    judul: "Pendampingan Gizi Pelatnas Taekwondo Indonesia – SEA Games 2023",
    tanggal: "2023-05",
    tempat: "Pelatnas Taekwondo Indonesia, menuju SEA Games Kamboja 2023",
    kategori: "Pendampingan Atlet",
    peran: "Ketua Tim Gizi Atlet Taekwondo Indonesia",
    penyelenggara: "Pelatnas Taekwondo Indonesia",
    deskripsi: "Monitoring dan evaluasi gizi atlet Pelatnas: kebutuhan energi individual, target berat dan persen lemak per kelas tanding, jadwal waktu makan di hari pertandingan, serta presentasi akhir bersama manajer, pelatih, terapis olahraga, dan psikolog sebelum keputusan final tim ke SEA Games Kamboja.",
    caption: "Di balik setiap tendangan di arena, ada piring makan yang direncanakan berbulan-bulan sebelumnya. 🥋🇮🇩\n\nBersama tim Pelatnas Taekwondo Indonesia, kami menyusun program gizi per atlet: target berat per kelas, persen lemak, hingga jam makan di hari pertandingan. Semuanya dipresentasikan bersama manajer, pelatih, terapis, dan psikolog sebelum keputusan akhir tim ke SEA Games Kamboja 2023.\n\nPrestasi adalah kerja tim, dan gizi adalah salah satu pemainnya.",
    hashtag: ["SEAGames2023", "TaekwondoIndonesia", "Pelatnas", "GiziAtlet", "MuryKuswari"],
    foto: "",
    dokumentasi: ""
  },
  {
    id: "juara-inovasi-kemenpora-2021",
    judul: "Juara II Kompetisi Nasional Inovasi dan Teknologi Terapan 2021",
    tanggal: "2021-09-07",
    sampai: "2021-09-10",
    tempat: "Jakarta",
    kategori: "Penghargaan",
    peran: "Inovator (INAFITGO), Bidang Olahraga Rekreasi",
    penyelenggara: "Deputi Peningkatan Prestasi Olahraga, Kemenpora RI",
    deskripsi: "Piagam penghargaan Kementerian Pemuda dan Olahraga RI untuk inovasi INAFITGO di bidang olahraga rekreasi, sebuah pendekatan teknologi untuk membantu masyarakat tetap aktif dan bugar.",
    caption: "Inovasi olahraga tidak selalu lahir di stadion. Kadang ia lahir dari pertanyaan sederhana: bagaimana orang sibuk tetap bisa bugar? 💡\n\nAlhamdulillah, INAFITGO meraih Juara II Kompetisi Nasional Inovasi dan Teknologi Terapan 2021 bidang Olahraga Rekreasi dari Kemenpora RI. Terima kasih kepada tim dan semua pihak yang mendukung.\n\nPenghargaan ini menjadi pengingat bahwa riset harus turun ke masyarakat dan memberi manfaat nyata.",
    hashtag: ["Kemenpora", "InovasiOlahraga", "OlahragaRekreasi", "INAFITGO", "MuryKuswari"],
    foto: "assets/img/kegiatan/2021-inovasi-kemenpora.jpg",
    fotoKeterangan: "Piagam Penghargaan Kemenpora RI",
    dokumentasi: ""
  },
  {
    id: "best-oral-spirit-2021",
    judul: "Best Oral Presentation, SPIRIT International Conference 2021",
    tanggal: "2021",
    tempat: "SPIRIT International Conference, Universitas Sumatera Utara (Erasmus+)",
    kategori: "Penghargaan",
    peran: "Oral presenter, Best Oral Presentation peringkat ke-3",
    penyelenggara: "SPIRIT Erasmus+ & Universitas Sumatera Utara",
    deskripsi: "Penghargaan Best Oral Presentation (3rd Place) untuk makalah \"Effects of Different Type of 6-Weeks Tele-Exercise Against Obese Employees' Body Composition and Fitness Level During Covid-19 Pandemic\", bagian dari riset disertasi doktoral Dr. Mury di IPB University.",
    caption: "Saat pandemi menutup pusat kebugaran, kami membawa latihan ke layar ponsel pekerja. 📱💪\n\nRiset tele-exercise 6 minggu pada karyawan dengan obesitas ini meraih Best Oral Presentation (3rd Place) di SPIRIT International Conference 2021. Hasilnya menunjukkan latihan terpandu daring mampu memperbaiki komposisi tubuh dan kebugaran, bahkan di masa paling sulit.\n\nKeterbatasan sering kali justru melahirkan cara baru.",
    hashtag: ["TeleExercise", "BestOralPresentation", "RisetGizi", "IPBUniversity", "MuryKuswari"],
    foto: "assets/img/kegiatan/2021-best-oral.jpg",
    fotoKeterangan: "Certificate of Completion, Best Oral Presentation 3rd Place",
    dokumentasi: ""
  }
];
