/*
 * KONFIGURASI WEBSITE murykuswari.com
 * Ubah nilai di bawah ini tanpa perlu menyentuh kode lain.
 */
window.SITE = {
  nama: "Assoc. Prof. Dr. Mury Kuswari, S.Pd., M.Si",
  namaPendek: "Mury Kuswari",
  tagline: "Ilmuwan Gizi Olahraga & Kebugaran",
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

  // URL layanan Program Gizi Personal (bagian #program di gizi.html). Kosongkan untuk memakai otpEndpoint,
  // karena Konsultasi.gs dipasang di proyek Apps Script yang sama. Panduan: docs/panduan-program-gizi.md
  programEndpoint: "https://script.google.com/macros/s/AKfycbyKDG8NtTPbpKb9R6t_wguvMCmbUcwVEnJKpO_q2a-N7qgOQ39iMKisPWeNrCHglXRw/exec",

  // Pembayaran konsultasi lanjutan langsung ke e-wallet Dr. Mury (dikonfirmasi manual di dashboard).
  // Isi nomor HP terdaftar dan nama pemilik akun. Dompet dengan nomor kosong tidak ditampilkan.
  // qris: (opsional) path gambar QRIS, mis. "assets/img/qris.jpg" — klien bisa memindai dari aplikasi apa pun.
  dompet: [
    { nama: "GoPay", nomor: "0811-8432-050", atasNama: "" },
    { nama: "DANA", nomor: "0811-8432-050", atasNama: "" },
    { nama: "OVO", nomor: "0811-8432-050", atasNama: "" },
    { nama: "LinkAja", nomor: "0811-8432-050", atasNama: "" }
  ],
  qris: "",

  // Statistik Google Scholar (perbarui berkala, mis. tiap semester).
  scholarStats: { sitasi: 1112, hIndex: 17, i10: 30, karya: 122, diperbarui: "November 2026" }
};
