/* Komponen bersama: header, footer, tema, helper data kegiatan. */
(function () {
  const S = window.SITE || {};

  const ICON = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    sun: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M20.8 8.6a5 5 0 0 0-8.8-3.2 5 5 0 0 0-8.8 3.2c0 5.4 8.8 11 8.8 11s8.8-5.6 8.8-11z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13"/></svg>',
    run: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="14" cy="4" r="2"/><path d="M6 21l3-6 3 2v5M9 15l2-6 4 2 3-1M11 9 8 8l-3 3"/></svg>'
  };
  const KAT_ICON = { Internasional: "globe", Media: "mic", Narasumber: "mic", Pengabdian: "heart", Mengajar: "book", Penghargaan: "trophy", "Pendampingan Atlet": "run" };

  const NAV = [
    ["index.html", "Beranda"],
    ["kegiatan.html", "Kegiatan"],
    ["pembicara.html", "Pembicara"],
    ["publikasi.html", "Karya Ilmiah"],
    ["berita.html", "Berita"],
    ["unduhan.html", "Unduhan"],
    ["gizi.html", "Kalkulator"],
    ["gizi.html#konsultasi", "Konsultasi"]
  ];

  function currentPage() {
    const p = location.pathname.split("/").pop() || "index.html";
    return p === "" ? "index.html" : p;
  }

  function renderHeader() {
    const el = document.getElementById("site-header");
    if (!el) return;
    const cur = currentPage();
    el.className = "site-header";
    el.innerHTML = `
      <div class="wrap">
        <a class="brand" href="index.html" aria-label="Beranda Mury Kuswari">
          <img class="brand-logo" src="assets/img/logo-mk.svg?v=6" alt="" width="40" height="40">
          <span>Mury Kuswari<small>Gizi Olahraga &amp; Kebugaran</small></span>
        </a>
        <button class="menu-toggle" aria-label="Buka menu" aria-expanded="false">${ICON.menu}</button>
        <nav class="nav" aria-label="Navigasi utama">
          ${NAV.map(([href, label]) => `<a href="${href}"${href === cur ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
          <button class="theme-toggle" type="button" aria-label="Ganti tema terang/gelap"></button>
          <a class="btn btn-primary btn-sm" href="${S.cv}" download>${ICON.download} Unduh CV</a>
        </nav>
      </div>`;
    const nav = el.querySelector(".nav");
    const tog = el.querySelector(".menu-toggle");
    tog.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      tog.setAttribute("aria-expanded", open);
    });
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) nav.classList.remove("open"); });
    setupTheme(el.querySelector(".theme-toggle"));
  }

  function setupTheme(btn) {
    let saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    const isDark = () => {
      const t = document.documentElement.getAttribute("data-theme");
      return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    };
    const paint = () => { btn.innerHTML = isDark() ? ICON.sun : ICON.moon; };
    paint();
    btn.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      paint();
    });
  }

  function renderFooter() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.className = "site-footer";
    const year = new Date().getFullYear();
    el.innerHTML = `
      <div class="wrap">
        <div class="foot-grid">
          <div>
            <a class="brand" href="index.html" style="color:#fff"><img class="brand-logo" src="assets/img/logo-mk.svg?v=6" alt="" width="40" height="40"><span>Mury Kuswari<small style="color:#9fb3c8">${S.tagline}</small></span></a>
            <p class="foot-nama">${S.nama}</p>
            <p class="foot-sign">Bukan sekadar hadir. Datang untuk menang, dan bertahan.</p>
            <p style="max-width:420px">Menghubungkan riset gizi olahraga dengan prestasi atlet, kebugaran pekerja, dan kesehatan masyarakat Indonesia.</p>
            <a class="foot-ueu" href="https://www.esaunggul.ac.id" target="_blank" rel="noopener"><img src="assets/img/logo-esaunggul.png" alt="Universitas Esa Unggul" width="170" height="96"></a>
          </div>
          <div>
            <h4>Jelajahi</h4>
            <ul>
              <li><a href="kegiatan.html">Kabar Kegiatan</a></li>
              <li><a href="pembicara.html">Portofolio Pembicara</a></li>
              <li><a href="publikasi.html">Penelitian, Buku &amp; Abdimas</a></li>
              <li><a href="berita.html">Berita &amp; Liputan Media</a></li>
              <li><a href="unduhan.html">Unduhan Modul</a></li>
              <li><a href="gizi.html">Kalkulator Gizi Olahraga</a></li>
              <li><a href="${S.cv}" download>Unduh CV / Profil</a></li>
            </ul>
          </div>
          <div>
            <h4>Terhubung</h4>
            <ul>
              <li><a href="mailto:${S.email}">${S.email}</a></li>
              <li><a href="${S.instagram}" target="_blank" rel="noopener">Instagram @murykuswari</a></li>
              <li><a href="${S.linkedin}" target="_blank" rel="noopener">LinkedIn</a></li>
              <li><a href="${S.scholar}" target="_blank" rel="noopener">Google Scholar</a></li>
            </ul>
          </div>
        </div>
        <div class="foot-bottom">
          <span>© ${year} Mury Kuswari. Seluruh hak cipta dilindungi.</span>
          <span><a href="input.html">Panduan update konten</a></span>
        </div>
      </div>`;
  }

  function renderFab() {
    if (!S.whatsapp || document.querySelector(".fab")) return;
    const a = document.createElement("a");
    a.className = "fab no-print";
    a.href = waLink("Halo Dr. Mury, saya ingin berkonsultasi tentang gizi olahraga.");
    a.target = "_blank"; a.rel = "noopener";
    a.setAttribute("aria-label", "Konsultasi via WhatsApp");
    a.innerHTML = ICON.wa;
    document.body.appendChild(a);
  }

  function waLink(text) {
    return `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2200);
  }

  async function copyText(text, msg) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e2) {}
      ta.remove();
    }
    toast(msg || "Tersalin ke clipboard");
  }

  function revealOnScroll() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- Data kegiatan ---------- */
  const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  function parseTgl(s) {
    const [y, m, d] = String(s || "").split("-").map(Number);
    return { y, m, d };
  }
  function fmtTanggal(a, b) {
    const s = parseTgl(a);
    if (!s.y) return "";
    if (!s.m) return String(s.y);
    if (!s.d) return `${BULAN[s.m - 1]} ${s.y}`;
    if (b) {
      const e = parseTgl(b);
      if (e.y === s.y && e.m === s.m) return `${s.d}–${e.d} ${BULAN[s.m - 1]} ${s.y}`;
      return `${s.d} ${BULAN[s.m - 1]} ${s.y} – ${e.d} ${BULAN[e.m - 1]} ${e.y}`;
    }
    return `${s.d} ${BULAN[s.m - 1]} ${s.y}`;
  }
  function sortKey(t) {
    const s = parseTgl(t);
    return (s.y || 0) * 10000 + (s.m || 12) * 100 + (s.d || 28);
  }

  // Ubah link/ID Google Drive menjadi URL gambar yang bisa ditampilkan.
  function imgSrc(src) {
    if (!src) return "";
    const s = String(src).trim();
    const m = s.match(/(?:\/d\/|id=)([\w-]{20,})/);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}=w1200`;
    if (/^[\w-]{25,}$/.test(s)) return `https://lh3.googleusercontent.com/d/${s}=w1200`;
    return s;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function hashtagText(k) {
    const tags = Array.isArray(k.hashtag) ? k.hashtag : String(k.hashtag || "").split(/[\s,]+/).filter(Boolean);
    return tags.map((t) => "#" + t.replace(/^#/, "")).join(" ");
  }

  function fullCaption(k) {
    const tags = hashtagText(k);
    return (k.caption || "") + (tags ? "\n\n" + tags : "");
  }

  function placeholder(k) {
    const s = parseTgl(k.tanggal);
    const kat = (k.kategori || "").replace(/\s+/g, "-");
    return `<div class="ph k-${esc(kat)}">${ICON[KAT_ICON[k.kategori] || "globe"]}
      <span class="sm">${esc(k.kategori || "Kegiatan")}</span>
      <span class="big">${s.m ? BULAN[s.m - 1].slice(0, 3) + " " : ""}${s.y || ""}</span></div>`;
  }

  function mediaHtml(k) {
    const src = imgSrc(k.foto);
    const alt = esc(k.fotoKeterangan || k.judul);
    return `<div class="act-media">
      ${placeholder(k)}
      ${src ? `<img src="${esc(src)}" alt="${alt}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
      <div class="cat"><span class="chip">${esc(k.kategori || "Kegiatan")}</span></div>
    </div>`;
  }

  function cardHtml(k, opts) {
    opts = opts || {};
    const meta = `<div class="act-meta">
        <span>${ICON.cal}${esc(fmtTanggal(k.tanggal, k.sampai))}</span>
        ${k.tempat ? `<span>${ICON.pin}${esc(k.tempat)}</span>` : ""}
      </div>`;
    const capId = "cap-" + esc(k.id);
    return `<article class="card act-card${opts.feature ? " feature" : ""}"${opts.feature ? "" : ` id="${esc(k.id)}"`}>
      ${mediaHtml(k)}
      <div class="act-body">
        ${meta}
        <h3>${esc(k.judul)}</h3>
        ${k.peran ? `<div class="role">${esc(k.peran)}</div>` : ""}
        ${opts.short ? "" : `<p class="desc">${esc(k.deskripsi || "")}</p>`}
        ${opts.short || !k.caption ? "" : `<details>
            <summary style="cursor:pointer;font-weight:700;font-size:.88rem;color:var(--blue)">Caption media sosial</summary>
            <div class="caption-box" id="${capId}">${esc(k.caption)}<div class="tags">${esc(hashtagText(k))}</div></div>
          </details>`}
        <div class="act-actions">
          ${opts.short ? `<a class="btn btn-ghost btn-sm" href="kegiatan.html#${esc(k.id)}">Selengkapnya</a>` : ""}
          ${!opts.short && k.caption ? `<button class="btn btn-ghost btn-sm" data-copy-caption="${esc(k.id)}">${ICON.copy} Salin caption</button>` : ""}
          ${k.dokumentasi ? `<a class="btn btn-ghost btn-sm" href="${esc(k.dokumentasi)}" target="_blank" rel="noopener">${ICON.link} Dokumentasi</a>` : ""}
        </div>
      </div>
    </article>`;
  }

  // CSV sederhana yang mendukung tanda kutip dan baris baru di dalam sel.
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
    return rows.filter((r) => r.some((c) => c.trim())).map((r) => {
      const o = {}; head.forEach((h, i) => { o[h] = (r[i] || "").trim(); }); return o;
    });
  }

  async function loadKegiatan() {
    let list = (window.KEGIATAN || []).slice();
    if (S.sheetKegiatanCsv) {
      try {
        const res = await fetch(S.sheetKegiatanCsv, { cache: "no-store" });
        if (res.ok) {
          const rows = parseCSV(await res.text());
          const fromSheet = rows.filter((r) => r.judul && r.tanggal).map((r, i) => ({
            id: r.id || "sheet-" + i + "-" + r.tanggal,
            judul: r.judul, tanggal: r.tanggal, sampai: r.sampai, tempat: r.tempat,
            kategori: r.kategori || "Narasumber", peran: r.peran, penyelenggara: r.penyelenggara,
            deskripsi: r.deskripsi, caption: r.caption, hashtag: r.hashtag,
            foto: r.foto, dokumentasi: r.dokumentasi
          }));
          const ids = new Set(fromSheet.map((k) => k.id));
          list = fromSheet.concat(list.filter((k) => !ids.has(k.id)));
        }
      } catch (e) { console.warn("Gagal memuat Google Sheet kegiatan:", e); }
    }
    return list.sort((a, b) => sortKey(b.tanggal) - sortKey(a.tanggal));
  }

  function bindCopyCaption(root, list) {
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-copy-caption]");
      if (!b) return;
      const k = list.find((x) => x.id === b.dataset.copyCaption);
      if (k) copyText(fullCaption(k), "Caption tersalin, siap diunggah");
    });
  }

  /* ---------- Popup umum: sinopsis buku, abstrak, dan berita ---------- */
  function modal(html, label) {
    let d = document.getElementById("mk-modal");
    if (!d) {
      d = document.createElement("dialog");
      d.id = "mk-modal";
      d.className = "mk-modal";
      d.innerHTML = '<div class="mk-inner"><button class="mk-close" type="button" aria-label="Tutup">&times;</button><div class="mk-body"></div></div>';
      document.body.appendChild(d);
      d.addEventListener("click", (e) => { if (e.target === d || e.target.closest(".mk-close")) d.close(); });
    }
    d.setAttribute("aria-label", label || "Detail");
    d.querySelector(".mk-body").innerHTML = html;
    if (!d.open) d.showModal();
    d.querySelector(".mk-inner").scrollTop = 0;
    return d;
  }

  /* ---------- Rak buku: klik sampul untuk membaca sinopsis ---------- */
  function coverHtml(b) {
    return b.sampul
      ? `<img src="${esc(b.sampul)}" alt="Sampul buku ${esc(b.judul)}" loading="lazy" draggable="false">`
      : `<div class="design"><span>${b.tahun}</span><b>${esc(b.judul)}</b><span>${esc(b.penerbit)}</span></div>`;
  }
  function shelfHtml(books) {
    return books.map((b) => `
      <article class="shelf-item">
        <button class="shelf-open" type="button" data-book="${esc(b.judul)}" aria-label="Lihat sinopsis ${esc(b.judul)}">
          <span class="shelf-cover">${coverHtml(b)}</span>
          <span class="shelf-meta">
            <span class="y">${b.tahun}${b.unduh ? ' · <em>Bisa diunduh</em>' : ""}</span>
            <strong>${esc(b.judul)}</strong>
            <small>${esc(b.penerbit)}</small>
          </span>
        </button>
      </article>`).join("");
  }
  function bookModal(b) {
    modal(`
      <div class="mk-book">
        <div class="shelf-cover mk-cover">${coverHtml(b)}</div>
        <div>
          <span class="eyebrow">Sinopsis buku</span>
          <h2>${esc(b.judul)}</h2>
          ${b.sub ? `<p class="mk-sub">${esc(b.sub)}</p>` : ""}
          <p class="mk-by">${esc(b.penulis)}<br>${esc(b.penerbit)}, ${b.tahun}</p>
          <p>${esc(b.sinopsis || "Sinopsis buku ini belum tersedia.")}</p>
          ${b.unduh
            ? `<a class="btn btn-primary" href="unduhan.html?item=${esc(b.unduh)}">Unduh dengan verifikasi email</a>`
            : `<p class="mk-note">Buku ini ditampilkan sebagai referensi dan tidak tersedia untuk diunduh.</p>`}
        </div>
      </div>`, "Sinopsis " + b.judul);
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-book]");
    if (!t) return;
    const b = (window.BUKU || []).find((x) => x.judul === t.dataset.book);
    if (b) bookModal(b);
  });
  // Sampul hanya untuk dilihat: matikan menu klik kanan dan seret gambar di rak buku.
  document.addEventListener("contextmenu", (e) => { if (e.target.closest(".shelf-cover")) e.preventDefault(); });
  document.addEventListener("dragstart", (e) => { if (e.target.closest(".shelf-cover")) e.preventDefault(); });

  window.MK = { ICON, esc, modal, bookModal, fmtTanggal, imgSrc, cardHtml, shelfHtml, loadKegiatan, bindCopyCaption, fullCaption, hashtagText, copyText, toast, waLink, parseCSV, revealOnScroll, BULAN };

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    renderFab();
    document.querySelectorAll("[data-cv]").forEach((a) => { a.href = S.cv; a.setAttribute("download", ""); });
    revealOnScroll();
  });
})();
