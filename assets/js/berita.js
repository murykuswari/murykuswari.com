/* Berita: kartu thumbnail, popup ringkasan, serta teaser beranda. */
window.MKBerita = (() => {
  const MK = window.MK;
  const list = () => (window.BERITA || []).slice().sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));

  const thumb = (n) => `
    <span class="news-thumb" data-media="${MK.esc(n.media)}">
      <span class="news-fallback"><b>${MK.esc(n.media)}</b><small>${MK.esc(n.kategori)}</small></span>
      ${n.gambar ? `<img src="${MK.esc(n.gambar)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
      ${n.video ? '<span class="news-play" aria-hidden="true"></span>' : ""}
    </span>`;

  const card = (n) => `
    <article class="news-card">
      <button type="button" data-news="${MK.esc(n.url)}">
        ${thumb(n)}
        <span class="news-body">
          <span class="news-src">${MK.esc(n.media)} · ${MK.esc(MK.fmtTanggal(n.tanggal))}</span>
          <strong>${MK.esc(n.judul)}</strong>
          <span class="news-text">${MK.esc(n.ringkasan)}</span>
        </span>
      </button>
    </article>`;

  function open(n) {
    MK.modal(`
      ${thumb(n)}
      <div class="mk-pad">
        <span class="eyebrow">${MK.esc(n.kategori)} · ${MK.esc(MK.fmtTanggal(n.tanggal))}</span>
        <h2>${MK.esc(n.judul)}</h2>
        <p class="mk-by">Sumber: ${MK.esc(n.media)}</p>
        <p>${MK.esc(n.ringkasan)}</p>
        <ul class="mk-list">${(n.poin || []).map((p) => `<li>${MK.esc(p)}</li>`).join("")}</ul>
        <p class="mk-actions"><a class="btn btn-primary" href="${MK.esc(n.url)}" target="_blank" rel="noopener">${n.tombol ? MK.esc(n.tombol) : n.video ? "Tonton video di YouTube" : "Baca artikel lengkap di " + MK.esc(n.media)}</a></p>
      </div>`, n.judul);
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-news]");
    if (!b) return;
    const n = list().find((x) => x.url === b.dataset.news);
    if (n) open(n);
  });

  return { list, card };
})();

document.addEventListener("DOMContentLoaded", () => {
  const MK = window.MK;
  const home = document.getElementById("news-latest");
  if (home) { home.innerHTML = MKBerita.list().slice(0, 3).map(MKBerita.card).join(""); return; }

  const out = document.getElementById("out");
  if (!out) return;
  const all = MKBerita.list();
  const cats = ["Semua", ...new Set(all.map((n) => n.kategori))];
  let cat = "Semua";
  const filters = document.getElementById("filters");
  const q = document.getElementById("q");
  filters.innerHTML = cats.map((c) => {
    const n = c === "Semua" ? all.length : all.filter((x) => x.kategori === c).length;
    return `<button class="filter-btn" data-c="${MK.esc(c)}" aria-pressed="${c === cat}">${MK.esc(c)} <span style="opacity:.6">${n}</span></button>`;
  }).join("");

  function render() {
    const term = q.value.trim().toLowerCase();
    const view = all.filter((n) => (cat === "Semua" || n.kategori === cat) &&
      (!term || [n.judul, n.media, n.ringkasan].join(" ").toLowerCase().includes(term)));
    document.getElementById("count").textContent = view.length + " berita";
    out.innerHTML = view.length ? view.map(MKBerita.card).join("") : '<p class="empty">Tidak ada berita yang cocok.</p>';
  }
  filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-c]");
    if (!b) return;
    cat = b.dataset.c;
    filters.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    render();
  });
  q.addEventListener("input", render);
  render();
});
