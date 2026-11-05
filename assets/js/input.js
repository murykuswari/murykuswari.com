/* Generator entri kegiatan + caption media sosial.
 * Struktur caption mengikuti pola personal branding: hook → konteks → wawasan → apresiasi → ajakan → hashtag. */
(function () {
  const MK = window.MK;
  const $ = (id) => document.getElementById(id);
  const v = (id) => ($(id).value || "").trim();
  const FIELDS = ["judul", "tanggal", "sampai", "tempat", "kategori", "penyelenggara", "peran", "topik", "peserta", "pesan", "deskripsi", "foto", "dokumentasi", "hashtag"];

  const HOOK = {
    Narasumber: ["Ilmu baru bermakna ketika dibagikan. 🎤", "Satu sesi, satu pesan penting untuk prestasi olahraga Indonesia. 💪", "Bertemu orang-orang hebat yang peduli pada gizi dan performa. 🙌"],
    Internasional: ["Membawa nama Indonesia ke panggung sport science dunia. 🌏🇮🇩", "Riset dari Indonesia, didengar di forum internasional. 🌏", "Ilmu tidak mengenal batas negara. ✈️"],
    Media: ["Edukasi gizi harus sampai ke ruang keluarga Indonesia. 📺", "Saatnya bicara gizi dan olahraga dengan bahasa yang mudah dipahami. 🎙️", "Satu tayangan, ribuan keluarga yang lebih paham gizi. 📡"],
    "Pendampingan Atlet": ["Di balik setiap medali, ada piring makan yang direncanakan. 🥇", "Prestasi adalah kerja tim, dan gizi salah satu pemainnya. 🏅", "Atlet hebat dibentuk di lapangan dan di meja makan. 🍽️"],
    Pengabdian: ["Riset kampus harus turun ke masyarakat. 🤝", "Sehat itu dimulai dari langkah kecil yang dilakukan bersama. 💚", "Ilmu yang bermanfaat adalah ilmu yang dirasakan langsung. 🌱"],
    Mengajar: ["Mendidik ilmuwan gizi olahraga berikutnya. 🎓", "Ruang kelas adalah tempat ide besar dimulai. 📚", "Berbagi pengalaman lapangan dengan generasi penerus. 🎓"],
    Penghargaan: ["Alhamdulillah, sebuah pengakuan dan pengingat untuk terus berkarya. 🏆", "Penghargaan ini milik tim yang bekerja keras. 🏆", "Kerja yang konsisten akhirnya berbicara. 🏆"]
  };
  const CTA = {
    Narasumber: "Apa topik gizi olahraga yang ingin Anda bahas berikutnya? Tulis di kolom komentar 👇",
    Internasional: "Terima kasih atas dukungan Universitas Esa Unggul. Mari terus membawa sains Indonesia ke dunia!",
    Media: "Sudahkah Anda menerapkannya hari ini? Bagikan pengalaman Anda di komentar 👇",
    "Pendampingan Atlet": "Doakan atlet-atlet kita meraih yang terbaik! 🇮🇩",
    Pengabdian: "Siapa yang ingin program seperti ini hadir di kantor atau komunitasnya? Tag di komentar!",
    Mengajar: "Untuk para mahasiswa: teruslah bertanya dan bergerak. Masa depan gizi olahraga ada di tangan kalian.",
    Penghargaan: "Terima kasih untuk semua yang terus mendukung. Ini baru awal."
  };
  const TAGS = {
    Narasumber: ["GiziOlahraga", "SportsNutrition"], Internasional: ["SportScience", "EsaUnggulGoGlobal"],
    Media: ["EdukasiGizi", "HidupSehat"], "Pendampingan Atlet": ["GiziAtlet", "AtletIndonesia"],
    Pengabdian: ["PengabdianMasyarakat", "HidupSehat"], Mengajar: ["DosenGizi", "KuliahTamu"], Penghargaan: ["Penghargaan", "Inovasi"]
  };
  let variant = 0;

  function slug(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }

  function data() {
    const kat = v("kategori");
    const tags = [...new Set([...(TAGS[kat] || []), ...v("hashtag").split(/[\s,#]+/).filter(Boolean), "UniversitasEsaUnggul", "MuryKuswari"])];
    const d = {
      id: slug(v("judul") + " " + v("tanggal").slice(0, 4)) || "kegiatan-baru",
      judul: v("judul"), tanggal: v("tanggal"), sampai: v("sampai") || undefined, tempat: v("tempat"),
      kategori: kat, peran: v("peran"), penyelenggara: v("penyelenggara"),
      deskripsi: v("deskripsi") || autoDesc(), caption: caption(), hashtag: tags,
      foto: v("foto"), dokumentasi: v("dokumentasi")
    };
    return d;
  }

  function autoDesc() {
    const parts = [];
    if (v("judul")) parts.push(`${v("judul")}${v("penyelenggara") ? " yang diselenggarakan " + v("penyelenggara") : ""}${v("tempat") ? " di " + v("tempat") : ""}.`);
    if (v("peran") || v("topik")) parts.push(`Assoc. Prof. Dr. Mury Kuswari hadir sebagai ${v("peran") || "narasumber"}${v("topik") ? " dengan materi \"" + v("topik") + "\"" : ""}${v("peserta") ? " di hadapan " + v("peserta") : ""}.`);
    if (v("pesan")) parts.push(v("pesan").replace(/\.?$/, "."));
    return parts.join(" ");
  }

  function caption() {
    const kat = v("kategori");
    const hooks = HOOK[kat] || HOOK.Narasumber;
    const hook = hooks[variant % hooks.length];
    const when = MK.fmtTanggal(v("tanggal"), v("sampai"));
    const lines = [hook, ""];
    let ctx = "";
    if (v("judul")) ctx += `${v("peran") ? "Sebagai " + v("peran").charAt(0).toLowerCase() + v("peran").slice(1) + " di " : "Di "}${v("judul")}`;
    if (v("tempat")) ctx += `, ${v("tempat")}`;
    if (when) ctx += ` (${when})`;
    if (ctx) {
      ctx += v("topik") ? `, saya membawakan materi "${v("topik")}"` : ", saya berbagi tentang gizi olahraga dan kebugaran";
      ctx += v("peserta") ? ` bersama ${v("peserta")}.` : ".";
      lines.push(ctx, "");
    }
    if (v("pesan")) lines.push(`Pesan utamanya: ${v("pesan").replace(/\.?$/, ".")}`, "");
    if (v("penyelenggara")) lines.push(`Terima kasih ${v("penyelenggara")} atas kepercayaan dan kolaborasinya. 🙏`, "");
    lines.push(CTA[kat] || CTA.Narasumber);
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  let fmt = "sheet";
  function render() {
    const d = data();
    $("preview").innerHTML = d.judul ? MK.cardHtml(Object.assign({}, d, { tanggal: d.tanggal || String(new Date().getFullYear()) }), { short: true }) : '<div class="card empty">Pratinjau kartu kegiatan muncul di sini.</div>';
    $("cap").innerHTML = MK.esc(d.caption) + `<div class="tags">${MK.esc(MK.hashtagText(d))}</div>`;
    if (fmt === "js") {
      const clean = JSON.parse(JSON.stringify(d));
      $("out").textContent = "  " + JSON.stringify(clean, null, 2).replace(/\n/g, "\n  ") + ",";
    } else {
      const cols = ["id", "judul", "tanggal", "sampai", "tempat", "kategori", "peran", "penyelenggara", "deskripsi", "caption", "hashtag", "foto", "dokumentasi"];
      // Format TSV agar langsung bisa ditempel ke satu baris Google Sheet.
      $("out").textContent = cols.map((c) => {
        const val = c === "hashtag" ? d.hashtag.join(" ") : (d[c] || "");
        return /[\t\n"]/.test(val) ? '"' + String(val).replace(/"/g, '""') + '"' : val;
      }).join("\t");
    }
  }

  document.getElementById("f").addEventListener("input", render);
  $("regen").addEventListener("click", () => { variant++; render(); });
  $("copy-cap").addEventListener("click", () => MK.copyText(MK.fullCaption(data()), "Caption tersalin"));
  $("copy-out").addEventListener("click", () => MK.copyText($("out").textContent, fmt === "js" ? "Kode tersalin, tempel di data/kegiatan.js" : "Baris tersalin, tempel di Google Sheet"));
  $("fmt").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    fmt = b.dataset.v;
    $("fmt").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    render();
  });

  // Simpan draf di perangkat ini agar tidak hilang saat halaman tertutup.
  try {
    const saved = JSON.parse(localStorage.getItem("draf-kegiatan") || "{}");
    FIELDS.forEach((k) => { if (saved[k] && $(k)) $(k).value = saved[k]; });
  } catch (e) {}
  document.getElementById("f").addEventListener("input", () => {
    try { localStorage.setItem("draf-kegiatan", JSON.stringify(Object.fromEntries(FIELDS.map((k) => [k, v(k)])))); } catch (e) {}
  });
  render();
})();
