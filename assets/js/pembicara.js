/* Portofolio pembicara: statistik, filter, pengelompokan per tahun, cetak, dan CSV. */
document.addEventListener("DOMContentLoaded", () => {
  const MK = window.MK;
  const JENIS = {
    semua: "Semua",
    konferensi: "Konferensi",
    kuliah: "Kuliah Tamu",
    seminar: "Seminar & Webinar",
    pelatihan: "Pelatihan",
    media: "Media & Podcast",
    masyarakat: "Masyarakat & Instansi"
  };
  const BUKTI = { U: "Undangan", S: "Sertifikat", US: "Undangan + Sertifikat", A: "Arsip" };
  const NEGARA = ["Malaysia", "Singapura", "Yordania", "Korea Selatan"];

  const rows = (window.PEMBICARA || []).map((r) => ({
    t: r[0], s: r[1], l: r[2], j: r[3], n: r[4], o: r[5], w: r[6], p: r[7], b: r[8], y: r[0].slice(0, 4)
  }));
  const key = (t) => {
    const [y, m, d] = t.split("-").map(Number);
    return y * 10000 + (m || 0) * 100 + (d || 0);
  };
  rows.sort((a, b) => key(b.t) - key(a.t));

  const intl = rows.filter((r) => r.l === "I").length;
  const years = [...new Set(rows.map((r) => r.y))];
  document.getElementById("stats").innerHTML = `
    <div class="card"><strong>${rows.length}</strong><span>Kegiatan tercatat</span></div>
    <div class="card"><strong>${intl}</strong><span>Forum internasional</span></div>
    <div class="card"><strong>${NEGARA.length}</strong><span>Negara tujuan di luar Indonesia</span></div>
    <div class="card"><strong>${years[years.length - 1]}–${years[0]}</strong><span>Rentang tahun</span></div>`;
  document.getElementById("negara").textContent = NEGARA.join(", ") + ", serta berbagai kota di Indonesia";

  let jenis = "semua";
  const filters = document.getElementById("filters");
  const count = (k) => k === "semua" ? rows.length : rows.filter((r) => r.j === k).length;
  filters.innerHTML = Object.entries(JENIS).map(([k, v]) =>
    `<button class="filter-btn" data-j="${k}" aria-pressed="${k === jenis}">${v} <span style="opacity:.6">${count(k)}</span></button>`).join("");

  const q = document.getElementById("q");
  const scope = document.getElementById("scope");
  const out = document.getElementById("out");
  const yearNav = document.getElementById("years");
  let view = rows;

  const item = (r) => `<li class="sp-item">
      <div class="sp-date">${MK.esc(MK.fmtTanggal(r.t, r.s))}</div>
      <div>
        <div class="sp-title">${MK.esc(r.n)}</div>
        <div class="sp-org">${MK.esc([r.o, r.w].filter(Boolean).join(" · "))}</div>
        <div class="sp-meta">
          ${r.l === "I" ? '<span class="chip orange">Internasional</span>' : ""}
          <span class="chip blue">${JENIS[r.j]}</span>
          <span class="chip">${MK.esc(r.p)}</span>
          <span class="sp-proof">${BUKTI[r.b]}</span>
        </div>
      </div>
    </li>`;

  function render() {
    const term = q.value.trim().toLowerCase();
    view = rows.filter((r) => (jenis === "semua" || r.j === jenis) &&
      (!scope.value || r.l === scope.value) &&
      (!term || [r.n, r.o, r.w, r.p, r.y].join(" ").toLowerCase().includes(term)));
    document.getElementById("count").textContent = view.length + " kegiatan";
    if (!view.length) { out.innerHTML = '<p class="empty">Tidak ada kegiatan yang cocok.</p>'; yearNav.innerHTML = ""; return; }
    const by = {};
    view.forEach((r) => (by[r.y] = by[r.y] || []).push(r));
    const ys = Object.keys(by).sort((a, b) => b - a);
    yearNav.innerHTML = ys.map((y) => `<a href="#th-${y}">${y}</a>`).join("");
    out.innerHTML = ys.map((y) => `
      <section class="sp-year" id="th-${y}">
        <h2 class="sp-year-head">${y} <span>${by[y].length} kegiatan</span></h2>
        <ol class="sp-list">${by[y].map(item).join("")}</ol>
      </section>`).join("");
  }

  filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-j]"); if (!b) return;
    jenis = b.dataset.j;
    filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    render();
  });
  q.addEventListener("input", render);
  scope.addEventListener("change", render);
  document.getElementById("print").addEventListener("click", () => window.print());
  document.getElementById("csv").addEventListener("click", () => {
    const cell = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const csv = ["Tanggal,Lingkup,Jenis,Topik/Acara,Penyelenggara,Tempat,Peran,Bukti"].concat(
      view.map((r) => [MK.fmtTanggal(r.t, r.s), r.l === "I" ? "Internasional" : "Nasional", JENIS[r.j], r.n, r.o, r.w, r.p, BUKTI[r.b]].map(cell).join(","))).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "portofolio-pembicara-mury-kuswari.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  render();
});
