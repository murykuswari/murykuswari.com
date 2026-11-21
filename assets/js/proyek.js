/* Bagian "Proyek Riset" di publikasi.html. Data: data/proyek.js (window.PROYEK). */
(function () {
  var el = document.getElementById("proyek");
  var data = window.PROYEK || [];
  if (!el || !data.length) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var IKON = {
    jurnal: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    ajar: '<path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/>',
    panduan: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>'
  };
  var NAMA = { jurnal: "Jurnal nasional & internasional", ajar: "Buku ajar", panduan: "Buku panduan" };

  function terkait(p) {
    var rows = window.PUBLIKASI || [];
    var kk = (p.kataKunci || []).map(function (k) { return k.toLowerCase(); });
    if (!kk.length) return [];
    return rows.filter(function (r) {
      var t = String(r[2] || "").toLowerCase();
      return kk.some(function (k) { return t.indexOf(k) !== -1; });
    }).sort(function (a, b) { return b[0] - a[0]; });
  }

  var totalUsd = 0;
  data.forEach(function (p) {
    (p.pendanaan || []).forEach(function (f) {
      var m = /USD\s*([\d.]+)/.exec(f.nilai || "");
      if (m) totalUsd += parseInt(m[1].replace(/\./g, ""), 10);
    });
  });
  var mitraSet = {};
  data.forEach(function (p) { (p.mitra || []).forEach(function (m) { if (!/^Mitra /.test(m)) mitraSet[m] = 1; }); });
  var tahunAwal = Math.min.apply(null, data.map(function (p) { return parseInt(p.periode, 10); }));

  var html = '<div class="pj-head">' +
    '<div><span class="eyebrow">Proyek riset</span><h2>Riset berdasarkan tahun pelaksanaan</h2>' +
    '<p>Proyek riset yang dipimpin bersama mitra industri, pemerintah, dan lembaga internasional, beserta pendanaan dan luarannya.</p></div>' +
    '<div class="pj-sum">' +
    '<div><strong>' + data.length + '</strong><span>proyek</span></div>' +
    '<div><strong>&gt; USD ' + totalUsd.toLocaleString("id-ID") + '</strong><span>total pendanaan</span></div>' +
    '<div><strong>' + Object.keys(mitraSet).length + '</strong><span>mitra</span></div>' +
    '<div><strong>' + tahunAwal + '–kini</strong><span>rentang riset</span></div>' +
    '</div></div><ol class="pj-line">';

  data.forEach(function (p, i) {
    var c1 = (p.warna && p.warna[0]) || "#0070b8", c2 = (p.warna && p.warna[1]) || "#f05828";
    var rel = terkait(p);
    var berjalan = p.status === "berjalan";
    html += '<li class="pj-item" style="--c1:' + esc(c1) + ';--c2:' + esc(c2) + '">' +
      '<div class="pj-dot" aria-hidden="true"></div>' +
      '<article class="pj-card">' +
      '<div class="pj-band">' +
      '<span class="pj-yr">' + esc(p.periode) + '</span>' +
      '<span class="pj-st' + (berjalan ? ' on' : '') + '">' + (berjalan ? "Sedang berjalan" : "Selesai") + '</span>' +
      '</div>' +
      '<div class="pj-body">' +
      '<h3>' + esc(p.judul) + '</h3>' +
      (p.judulResmi ? '<p class="pj-official">' + esc(p.judulResmi) + '</p>' : '') +
      '<p class="pj-lead">' + esc(p.ringkas) + '</p>' +
      '<div class="pj-fund">' + (p.pendanaan || []).map(function (f) {
        return '<div><span>' + esc(f.label) + '</span><strong>' + esc(f.nilai) + '</strong></div>';
      }).join("") + '</div>' +
      '<div class="pj-meta">' +
      (p.peran ? '<span><b>Peran</b> ' + esc(p.peran) + '</span>' : '') +
      (p.lokasi ? '<span><b>Lokasi</b> ' + esc(p.lokasi) + '</span>' : '') +
      '</div>' +
      '<div class="pj-mitra" aria-label="Mitra">' + (p.mitra || []).map(function (m) {
        return '<span>' + esc(m) + '</span>';
      }).join("") + '</div>' +
      '<p class="pj-desc">' + esc(p.deskripsi) + '</p>' +
      (p.sorotan && p.sorotan.length ? '<div class="pj-hi">' + p.sorotan.map(function (s) {
        return '<div><strong>' + esc(s[0]) + '</strong><span>' + esc(s[1]) + '</span></div>';
      }).join("") + '</div>' : '') +
      '<h4>' + esc(p.luaranLabel || "Luaran") + '</h4>' +
      '<ul class="pj-out">' + (p.luaran || []).map(function (o) {
        return '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IKON[o.jenis] || IKON.jurnal) + '</svg>' +
          '<div><strong>' + esc(o.jumlah) + '</strong><b>' + esc(NAMA[o.jenis] || o.jenis) + '</b><span>' + esc(o.ket) + '</span></div></li>';
      }).join("") + '</ul>' +
      (rel.length ? '<details class="pj-rel"><summary>Lihat ' + rel.length + ' karya terkait di daftar ini</summary><ol>' +
        rel.map(function (r) {
          var t = esc(r[2]);
          return '<li><span>' + esc(r[0]) + '</span>' + (r[6] ? '<a href="' + esc(r[6]) + '" target="_blank" rel="noopener">' + t + '</a>' : t) +
            (r[4] ? ' <em>' + esc(r[4]) + '</em>' : '') + '</li>';
        }).join("") + '</ol></details>' : '') +
      ((p.tautan || []).length ? '<div class="pj-links">' + p.tautan.map(function (t) {
        return '<a class="btn btn-ghost btn-sm" href="' + esc(t.url) + '" target="_blank" rel="noopener">' + esc(t.label) + ' ↗</a>';
      }).join("") + '</div>' : '') +
      '</div></article></li>';
  });
  html += '</ol>';
  el.innerHTML = html;
})();
