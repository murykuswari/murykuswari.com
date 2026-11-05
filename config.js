/*
 * KONFIGURASI WEBSITE murykuswari.com
 * Ubah nilai di bawah ini tanpa perlu menyentuh kode lain.
 */
window.SITE = {
  nama: "Dr. Mury Kuswari, S.Pd., M.Si",
  namaPendek: "Mury Kuswari",
  tagline: "Dosen Peneliti Gizi Olahraga & Kebugaran",
  jabatan: "Wakil Rektor Bidang Kemahasiswaan, Universitas Esa Unggul",
  domain: "https://murykuswari.com",

  email: "mury@esaunggul.ac.id",
  instagram: "https://www.instagram.com/murykuswari/",
  linkedin: "https://www.linkedin.com/in/murykuswari",
  scholar: "https://scholar.google.com/citations?user=Z8e0i-0AAAAJ&hl=en",

  // Nomor WhatsApp untuk konsultasi, format internasional tanpa "+" atau spasi.
  // Contoh: "6281234567890". Jika kosong, tombol konsultasi memakai email.
  whatsapp: "",

  // (Opsional) Link Google Form konsultasi. Jika diisi, muncul tombol "Isi Formulir".
  formKonsultasi: "",

  // File CV/profil yang bisa diunduh pengunjung.
  cv: "assets/cv/CV-Dr-Mury-Kuswari-2026.pdf",

  // (Opsional) Google Sheet kegiatan yang dipublikasikan sebagai CSV.
  // File > Bagikan > Publikasikan ke web > pilih sheet > format CSV > salin link.
  // Jika diisi, kegiatan dari Sheet otomatis tampil di website (digabung dengan data/kegiatan.js).
  sheetKegiatanCsv: "",

  // URL layanan unduhan ber-OTP (Google Apps Script, berakhiran /exec).
  // Panduan: docs/panduan-unduhan-otp.md. Jika kosong, formulir unduhan dinonaktifkan.
  otpEndpoint: "https://script.google.com/macros/s/AKfycbz2dqqXvIyjTKSYWazlR5ZQ91pD-_a0oq9X1qPkrcuJyvgw9bUFfzy0rxAZGiGzcMxFwA/exec",

  // Statistik Google Scholar (perbarui berkala, mis. tiap semester).
  scholarStats: { sitasi: 1112, hIndex: 17, i10: 30, karya: 122, diperbarui: "November 2026" }
};
