/*
 * Kartu profil klien murykuswari.com: pratinjau, unduh PNG/JPEG, dan bagikan.
 * Dipakai di halaman konsultasi (klien & praktisi) dan dashboard pengelola.
 *
 * MKKartu.tampilkan({
 *   nama, eyebrow, sub, foto,                // foto = data URL (opsional)
 *   tiles: [["BB", "70,2 kg"], ...],         // angka tubuh (maks. 4)
 *   tilesPrivat: [["Konsultasi", "3"], ...], // dipakai bila "sembunyikan angka tubuh" dicentang
 *   seri: [{ t: "2026-10-01", bb: 71.2 }]    // titik grafik berat badan (opsional)
 * })
 */
(function () {
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inisial = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const slug = (n) => String(n || "klien").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "klien";
  const font = (w, s) => `${w} ${s}px Outfit, "Segoe UI", Arial, sans-serif`;
  const toast = (m) => (window.MK && window.MK.toast ? window.MK.toast(m) : alert(m));

  function rrect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function muatGambar(src) {
    return new Promise((ok) => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  }
  async function siapkanFont() {
    try { await Promise.all([document.fonts.load(font(800, 68)), document.fonts.load(font(500, 30)), document.fonts.load(font(700, 30))]); await document.fonts.ready; } catch (e) { /* pakai font cadangan */ }
  }

  // Kartu 1080×1350 (rasio Instagram 4:5).
  async function gambar(d, privat) {
    await siapkanFont();
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#003a63"); g.addColorStop(.55, "#0070b8"); g.addColorStop(1, "#f05828");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    [["#ffd166", 900, 160, 260, .35], ["#06d6a0", 120, 1180, 220, .3], ["#ef476f", 980, 1040, 160, .3], ["#ffffff", 140, 220, 120, .12]].forEach(([c, cx, cy, r, a]) => { x.globalAlpha = a; x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); });
    x.globalAlpha = 1;
    x.textAlign = "center";
    x.fillStyle = "rgba(255,255,255,.85)"; x.font = font(700, 30);
    x.fillText(String(d.eyebrow || "PROGRAM GIZI OLAHRAGA").toUpperCase(), W / 2, 110);

    const cx = W / 2, cy = 330, r = 170;
    x.save(); x.beginPath(); x.arc(cx, cy, r + 14, 0, 7); x.fillStyle = "#fff"; x.fill(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip();
    const im = await muatGambar(d.foto);
    if (im) {
      const s = Math.min(im.naturalWidth, im.naturalHeight);
      x.drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, cx - r, cy - r, 2 * r, 2 * r);
    } else {
      const gg = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r); gg.addColorStop(0, "#ffd166"); gg.addColorStop(1, "#ef476f");
      x.fillStyle = gg; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      x.fillStyle = "#fff"; x.font = font(800, 120); x.textBaseline = "middle"; x.fillText(inisial(d.nama), cx, cy + 6); x.textBaseline = "alphabetic";
    }
    x.restore();

    x.fillStyle = "#fff"; x.font = font(800, 68);
    let nama = String(d.nama || ""); while (x.measureText(nama).width > W - 120 && nama.length > 4) nama = nama.slice(0, -2) + "…";
    x.fillText(nama, W / 2, 610);
    x.font = font(500, 34); x.fillStyle = "rgba(255,255,255,.92)";
    let sub = String(d.sub || ""); while (x.measureText(sub).width > W - 120 && sub.length > 4) sub = sub.slice(0, -2) + "…";
    x.fillText(sub, W / 2, 662);

    const tiles = (privat ? d.tilesPrivat : d.tiles) || [];
    const warna = ["#ffd166", "#06d6a0", "#118ab2", "#ef476f"];
    if (tiles.length) {
      const tw = (W - 120 - (tiles.length - 1) * 24) / tiles.length;
      tiles.forEach(([l, v], i) => {
        const tx = 60 + i * (tw + 24), ty = 720;
        x.fillStyle = "rgba(255,255,255,.14)"; rrect(x, tx, ty, tw, 150, 28); x.fill();
        x.fillStyle = warna[i % 4]; rrect(x, tx, ty, 12, 150, 6); x.fill();
        x.fillStyle = "#fff"; x.textAlign = "center"; x.font = font(800, tiles.length > 2 ? 46 : 58);
        let val = String(v); while (x.measureText(val).width > tw - 30 && val.length > 2) val = val.slice(0, -2) + "…";
        x.fillText(val, tx + tw / 2 + 6, ty + 78);
        x.font = font(600, 26); x.fillStyle = "rgba(255,255,255,.85)"; x.fillText(String(l).toUpperCase(), tx + tw / 2 + 6, ty + 122);
      });
    }

    const pts = (d.seri || []).filter((p) => p && p.bb);
    if (!privat && pts.length >= 2) {
      const gx = 90, gy = 940, gw = W - 180, gh = 230;
      x.fillStyle = "rgba(0,0,0,.18)"; rrect(x, 60, 910, W - 120, 300, 28); x.fill();
      const lo = Math.min(...pts.map((p) => p.bb)) - 1, hi = Math.max(...pts.map((p) => p.bb)) + 1;
      const px = (i) => gx + (i * gw) / (pts.length - 1), py = (v) => gy + gh - ((v - lo) / (hi - lo)) * (gh - 40);
      x.strokeStyle = "#ffd166"; x.lineWidth = 7; x.lineJoin = "round"; x.beginPath();
      pts.forEach((p, i) => (i ? x.lineTo(px(i), py(p.bb)) : x.moveTo(px(i), py(p.bb)))); x.stroke();
      pts.forEach((p, i) => { x.fillStyle = "#fff"; x.beginPath(); x.arc(px(i), py(p.bb), 11, 0, 7); x.fill(); x.fillStyle = "#ffd166"; x.beginPath(); x.arc(px(i), py(p.bb), 6, 0, 7); x.fill(); });
      x.fillStyle = "#fff"; x.font = font(700, 26); x.textAlign = "left"; x.fillText("Perkembangan berat badan", gx, 950);
      x.textAlign = "center"; x.font = font(500, 22); x.fillStyle = "rgba(255,255,255,.8)";
      [0, pts.length - 1].forEach((i) => x.fillText(String(pts[i].t || ""), px(i), gy + gh + 30));
    } else {
      x.fillStyle = "rgba(255,255,255,.9)"; x.font = font(600, 38); x.textAlign = "center";
      x.fillText("Berlatih cerdas, makan tepat, juara!", W / 2, 1050);
    }
    x.textAlign = "center"; x.fillStyle = "#fff"; x.font = font(700, 30); x.fillText("murykuswari.com", W / 2, 1275);
    x.font = font(500, 22); x.fillStyle = "rgba(255,255,255,.85)"; x.fillText("Program Gizi Olahraga · Assoc. Prof. Dr. Mury Kuswari", W / 2, 1312);
    return cv;
  }

  const keBlob = (cv, type, q) => new Promise((ok) => {
    if (cv.toBlob) cv.toBlob((b) => ok(b), type, q);
    else { const u = cv.toDataURL(type, q); fetch(u).then((r) => r.blob()).then(ok); }
  });
  const dalamAplikasi = () => /FBAN|FBAV|Instagram|Line\/|WhatsApp|; wv\)|Twitter|TikTok/i.test(navigator.userAgent);

  async function unduh(cv, nama, fmt) {
    const type = fmt === "jpeg" ? "image/jpeg" : "image/png";
    const blob = await keBlob(cv, type, 0.92);
    if (!blob) { toast("Gambar tidak bisa dibuat"); return; }
    const file = `kartu-profil-${slug(nama)}.${fmt === "jpeg" ? "jpg" : "png"}`;
    if (dalamAplikasi()) { toast("Tekan lama gambar lalu pilih Simpan gambar"); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = file; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(`Mengunduh ${file}`);
  }
  async function bagikan(cv, nama) {
    const blob = await keBlob(cv, "image/png");
    const f = new File([blob], `kartu-profil-${slug(nama)}.png`, { type: "image/png" });
    try { await navigator.share({ files: [f], title: "Kartu profil " + nama, text: "Program Gizi Olahraga · murykuswari.com" }); } catch (e) { /* dibatalkan */ }
  }
  async function bukaTab(cv) {
    const blob = await keBlob(cv, "image/png");
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank", "noopener");
    if (!w) location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function tampilkan(d) {
    if (!window.MK || !window.MK.modal) return;
    const bisaPrivat = !!(d.tilesPrivat && d.tilesPrivat.length);
    const dlg = window.MK.modal(`
      <div class="kp-wrap">
        <h2 class="kp-judul">Kartu profil · ${esc(d.nama)}</h2>
        <div class="kp-pratinjau" id="kp-prev"><span class="note">Menyiapkan kartu…</span></div>
        ${bisaPrivat ? `<label class="kp-privat"><input type="checkbox" id="kp-privat"> Sembunyikan angka tubuh (BB, lemak, FFM)</label>` : ""}
        <div class="kp-aksi">
          <button type="button" class="btn btn-primary" data-kp="png">Unduh PNG</button>
          <button type="button" class="btn btn-ghost" data-kp="jpeg">Unduh JPEG</button>
          ${navigator.canShare ? `<button type="button" class="btn btn-ghost" data-kp="share" hidden>Bagikan</button>` : ""}
          <button type="button" class="btn-copy" data-kp="tab">Buka gambar di tab baru</button>
        </div>
        <p class="note kp-hint">Ukuran 1080 × 1350 px (rasio 4:5, siap untuk Instagram dan WhatsApp). Di iPhone atau di dalam aplikasi WhatsApp/Instagram, tekan lama gambar lalu pilih <b>Simpan gambar</b>.</p>
      </div>`, "Kartu profil " + d.nama);
    let cv = null;
    const render = async () => {
      const prev = dlg.querySelector("#kp-prev");
      prev.innerHTML = '<span class="note">Menyiapkan kartu…</span>';
      const priv = !!(dlg.querySelector("#kp-privat") && dlg.querySelector("#kp-privat").checked);
      cv = await gambar(d, priv);
      const img = new Image();
      img.alt = "Pratinjau kartu profil " + d.nama;
      img.src = cv.toDataURL("image/png");
      prev.innerHTML = ""; prev.appendChild(img);
      const sh = dlg.querySelector('[data-kp="share"]');
      if (sh) {
        try { const b = await keBlob(cv, "image/png"); sh.hidden = !navigator.canShare({ files: [new File([b], "k.png", { type: "image/png" })] }); } catch (e) { sh.hidden = true; }
      }
    };
    const p = dlg.querySelector("#kp-privat"); if (p) p.onchange = render;
    dlg.querySelector(".kp-aksi").onclick = async (e) => {
      const b = e.target.closest("[data-kp]"); if (!b || !cv) return;
      const k = b.dataset.kp;
      if (k === "png" || k === "jpeg") unduh(cv, d.nama, k);
      else if (k === "share") bagikan(cv, d.nama);
      else if (k === "tab") bukaTab(cv);
    };
    await render();
  }

  window.MKKartu = { gambar, tampilkan, unduh };
})();
