/*
 * DATA PROYEK RISET (halaman publikasi.html, bagian "Proyek Riset").
 * Urutkan terbaru dulu. Field:
 *   periode, status ("berjalan" | "selesai"), judul, judulResmi (opsional), peran,
 *   pendanaan: [{ label, nilai }], mitra: [nama resmi], lokasi (opsional),
 *   ringkas (1–2 kalimat), deskripsi (paragraf), sorotan: [[angka, keterangan]],
 *   luaran: [{ jenis, jumlah, ket }], luaranLabel ("Luaran" | "Target luaran"),
 *   kataKunci: [kata] untuk menautkan publikasi terkait dari data/publikasi.js,
 *   tautan: [{ label, url }], warna: [warna1, warna2]
 */
window.PROYEK = [
  {
    periode: "2026–2027",
    status: "berjalan",
    judul: "Pre-Diabetes Cocoon Research",
    judulResmi: "Evaluating the Efficacy of Biostacked Modalities (Passive Whole Body Hyperthermic Conditioning, Red Light, and Body Vibration) on Pre-Type 2 Diabetes Mellitus (Pre-T2DM) Management",
    peran: "Ketua peneliti",
    pendanaan: [{ label: "Hibah riset Wellness USA", nilai: "USD 40.000" }, { label: "Dukungan alat", nilai: "Cocoon Deluxe Fitness Pod (2 unit)" }],
    mitra: ["Wellness USA", "Universitas Esa Unggul"],
    lokasi: "Laboratorium Kampus UEU Kebon Jeruk, Jakarta",
    ringkas: "Menguji apakah sesi rutin di Cocoon Deluxe Fitness Pod, yang menggabungkan pemanasan seluruh tubuh, cahaya merah, dan getaran, dapat membantu pengelolaan prediabetes.",
    deskripsi: "Prediabetes adalah tahap ketika gula darah sudah di atas normal tetapi belum diabetes, dan masih bisa diperbaiki. Penelitian ini mengukur apakah intervensi non-obat di dalam Cocoon Pod, yaitu hyperthermic conditioning pasif (suhu inti dinaikkan terkontrol hingga ±38,5 °C), cahaya merah (fotobiomodulasi), dan getaran seluruh tubuh, mengubah penanda gula darah, tekanan darah, dan komposisi tubuh peserta. Kombinasi panas dan cahaya merah dalam satu kabin belum pernah diuji dalam penelitian bertelaah sejawat. Peserta menjalani skrining, tes awal, 12 minggu intervensi (November 2026–Januari 2027), lalu tes akhir, dengan pemantauan petugas setiap 5 menit selama sesi.",
    sorotan: [["30 mnt", "sesi aktif"], ["3×", "per minggu"], ["12 mgg", "intervensi"], ["38,5 °C", "suhu inti target"]],
    luaranLabel: "Target luaran",
    luaran: [
      { jenis: "jurnal", jumlah: "> 10", ket: "Artikel jurnal nasional terakreditasi dan internasional bereputasi" },
      { jenis: "ajar", jumlah: "1", ket: "Buku ajar / Buku Referensi Hyperthermic Conditioning" },
      { jenis: "panduan", jumlah: "1", ket: "Buku panduan peserta dan protokol sesi Cocoon Pod" }
    ],
    kataKunci: ["hyperthermic", "prediabetes", "pre-diabetes", "cocoon"],
    tautan: [{ label: "cocoonwellness.id", url: "https://cocoonwellness.id/" }],
    warna: ["#06d6a0", "#118ab2"]
  },
  {
    periode: "2020–2025",
    status: "selesai",
    judul: "Tele-exercise & Wellness Corporate Program",
    peran: "Ketua peneliti dan konsultan program",
    pendanaan: [{ label: "Kerja sama korporat dan pemerintah", nilai: "> USD 25.000" }],
    mitra: ["PT Indofood Sukses Makmur Tbk", "PT Nutrifood Indonesia", "PT Nestlé Indonesia", "PT Pamapersada Nusantara (PAMA)", "Kementerian Kesehatan Republik Indonesia"],
    ringkas: "Program kebugaran dan gizi berbasis tele-exercise untuk karyawan dengan obesitas dan risiko penyakit tidak menular, dijalankan bersama perusahaan dan Kementerian Kesehatan RI.",
    deskripsi: "Program menggabungkan latihan daring terpandu (tele-exercise strength dan strength-cardio, durasi 30 dan 60 menit) dengan tele-konseling gizi dan tantangan penurunan berat badan (Weight Loss Challenge) bagi karyawan. Rangkaian uji intervensi mengukur perubahan berat badan, IMT, lingkar pinggang, massa lemak, tingkat kebugaran, kepatuhan latihan, profil lipid, kesehatan mental, hingga ekspresi gen SIRT1 pada karyawan kantor dengan obesitas. Hasilnya menjadi dasar model wellness korporat yang dapat diterapkan perusahaan di Indonesia.",
    sorotan: [["5", "mitra korporat & pemerintah"], ["6 th", "pelaksanaan"], ["30 vs 60", "menit per sesi diuji"]],
    luaranLabel: "Luaran",
    luaran: [
      { jenis: "jurnal", jumlah: "> 10", ket: "Artikel jurnal nasional terakreditasi dan internasional (antara lain OAMJMS, Media Gizi Indonesia, ARGIPA, JUARA, Physical Activity)" },
      { jenis: "ajar", jumlah: "1", ket: "Buku: Metode Peningkatan Kebugaran Fisik Pekerja (Tele-exercise Strength dan Strength-Cardio)" },
      { jenis: "panduan", jumlah: "1", ket: "Buku panduan program wellness dan Weight Loss Challenge korporat" }
    ],
    kataKunci: ["tele-exercise", "tele-exerise", "wellness program", "employee", "pekerja", "indofood"],
    tautan: [],
    warna: ["#f05828", "#ffd166"]
  },
  {
    periode: "2018–2019",
    status: "selesai",
    judul: "Peanut Project",
    peran: "Ketua peneliti",
    pendanaan: [{ label: "Hibah eksternal dan internal Universitas Esa Unggul", nilai: "> USD 5.000" }],
    mitra: ["Universitas Esa Unggul", "Mitra pendana eksternal"],
    ringkas: "Proyek riset gizi yang dibiayai hibah eksternal dan internal Universitas Esa Unggul.",
    deskripsi: "Peanut Project dilaksanakan pada 2018–2019 dengan pendanaan gabungan dari hibah eksternal dan internal Universitas Esa Unggul. Proyek ini menghasilkan lebih dari 10 artikel jurnal nasional dan internasional, buku ajar, serta buku panduan.",
    sorotan: [["2", "tahun pelaksanaan"], ["2", "sumber pendanaan"]],
    luaranLabel: "Luaran",
    luaran: [
      { jenis: "jurnal", jumlah: "> 10", ket: "Artikel jurnal nasional dan internasional" },
      { jenis: "ajar", jumlah: "1", ket: "Buku ajar" },
      { jenis: "panduan", jumlah: "1", ket: "Buku panduan" }
    ],
    kataKunci: ["peanut"],
    tautan: [],
    warna: ["#8338ec", "#ef476f"]
  }
];
