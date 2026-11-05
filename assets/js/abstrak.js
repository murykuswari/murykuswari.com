/* Popup abstrak di halaman Karya Ilmiah.
 * Urutan sumber: teks berlisensi di data/abstrak.js, lalu Crossref, lalu OpenAlex.
 * Jika tidak ditemukan, pengunjung diarahkan ke sumber aslinya. Tidak ada abstrak yang dikarang. */
window.MKAbstrak = (() => {
  const MK = window.MK;
  const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = (t) => norm(t).slice(0, 50);
  const clean = (s) => String(s || "").replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim().replace(/^(abstract|abstrak)[\s:.\-–]*/i, "");
  const fromIndex = (idx) => {
    if (!idx) return "";
    const words = [];
    Object.entries(idx).forEach(([w, pos]) => pos.forEach((p) => { words[p] = w; }));
    return words.join(" ").trim();
  };
  async function getJson(url) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 9000);
    try {
      const r = await fetch(url, { signal: c.signal });
      return r.ok ? await r.json() : null;
    } catch (e) { return null; } finally { clearTimeout(t); }
  }
  async function lookup(p, rec) {
    if (rec && rec.teks) return { teks: rec.teks, sumber: rec.lisensi ? "lisensi " + rec.lisensi : "" };
    const doi = rec && rec.doi;
    if (doi) {
      const c = await getJson("https://api.crossref.org/works/" + encodeURIComponent(doi));
      const a = c && clean(c.message && c.message.abstract);
      if (a && a.length > 80) return { teks: a, sumber: "dimuat langsung dari Crossref" };
      const o = await getJson("https://api.openalex.org/works/doi:" + encodeURIComponent(doi) + "?select=abstract_inverted_index");
      const b = o && fromIndex(o.abstract_inverted_index);
      if (b && b.length > 80) return { teks: b, sumber: "dimuat langsung dari OpenAlex" };
      return null;
    }
    const o = await getJson("https://api.openalex.org/works?per-page=3&select=title,doi,abstract_inverted_index&filter=title.search:" + encodeURIComponent(p.title.replace(/[,:|]/g, " ")));
    const hit = o && (o.results || []).find((w) => norm(w.title) === norm(p.title));
    const b = hit && fromIndex(hit.abstract_inverted_index);
    return b && b.length > 80 ? { teks: b, sumber: "dimuat langsung dari OpenAlex", doi: hit.doi } : null;
  }
  let run = 0;
  async function open(p, label, fallbackUrl) {
    const rec = (window.ABSTRAK || {})[key(p.title)];
    const mine = ++run;
    const src = rec && rec.doi ? "https://doi.org/" + rec.doi : fallbackUrl;
    const d = MK.modal(`
      <span class="eyebrow">${MK.esc(label)} · ${p.y}</span>
      <h2>${MK.esc(p.title)}</h2>
      <p class="mk-by">${MK.esc(p.au)}<br>${MK.esc(p.v)}</p>
      <h3 class="mk-h">Abstrak</h3>
      <div id="abs-out" class="mk-abs"><p class="mk-note">Memuat abstrak…</p></div>
      <p class="mk-actions"><a class="btn btn-ghost btn-sm" id="abs-src" href="${MK.esc(src)}" target="_blank" rel="noopener">Buka sumber asli</a></p>`, "Abstrak " + p.title);
    const res = await lookup(p, rec);
    if (mine !== run || !d.open) return;
    const out = d.querySelector("#abs-out");
    if (res) {
      out.innerHTML = `<p>${MK.esc(res.teks)}</p>${res.sumber ? `<p class="mk-note">Sumber abstrak: ${MK.esc(res.sumber)}.</p>` : ""}`;
      if (res.doi) d.querySelector("#abs-src").href = res.doi;
    } else {
      out.innerHTML = '<p class="mk-note">Abstrak karya ini belum tersedia di basis data terbuka. Silakan baca langsung di sumber aslinya.</p>';
    }
  }
  return { open };
})();
