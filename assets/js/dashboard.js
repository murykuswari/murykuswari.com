/*
 * Dashboard pengelola (dashboard.html): ringkasan, grafik, dan profil setiap peserta konsultasi.
 * Data diambil dari Apps Script (aksi kons-admin) dan hanya diberikan untuk email di KONS.ADMIN.
 */
document.addEventListener("DOMContentLoaded", () => {
  const MK = window.MK, S = window.SITE || {}, PG = window.PG, Chart = window.Chart;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => MK.esc(String(s == null ? "" : s));
  const fx = (x, d = 0) => Number(x).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
  const f1 = (x) => fx(x, 1), f0 = (x) => fx(Math.round(x));
  const ENDPOINT = S.programEndpoint || S.otpEndpoint || "";
  const SESI_KEY = "mk-program-sesi";
  const WARNA = ["#0070b8", "#f05828", "#06d6a0", "#ffd166", "#ef476f", "#118ab2", "#8338ec", "#3a86ff", "#fb5607", "#2a9d8f", "#e76f51", "#9b5de5"];
  const st = { token: "", email: "", peserta: [], foto: {}, charts: {} };

  async function api(payload) {
    const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), redirect: "follow" });
    if (!r.ok) throw new Error("http");
    return r.json();
  }
  function pesan(t) { const m = $("d-msg"); m.hidden = !t; m.textContent = t || ""; }
  if (!ENDPOINT) pesan("Layanan belum dipasang (otpEndpoint kosong di config.js).");

  /* ---------- Masuk ---------- */
  $("d-f-email").addEventListener("submit", async (e) => {
    e.preventDefault();
    st.email = $("d-email").value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(st.email)) { pesan("Format email belum benar."); return; }
    $("d-b-kirim").disabled = true;
    try {
      const j = await api({ aksi: "kons-kirim", email: st.email });
      if (j.pesan === "Permintaan tidak dikenali.") { pesan("Layanan konsultasi belum dipasang di Apps Script. Ikuti docs/panduan-program-gizi.md."); return; }
      if (!j.ok) { pesan(j.pesan || "Gagal mengirim kode."); return; }
      $("d-to").textContent = st.email; $("d-f-email").hidden = true; $("d-f-otp").hidden = false; pesan(""); $("d-otp").focus();
    } catch (er) { pesan("Layanan tidak bisa dihubungi."); } finally { $("d-b-kirim").disabled = false; }
  });
  $("d-f-otp").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("d-b-masuk").disabled = true;
    try {
      const j = await api({ aksi: "kons-masuk", email: st.email, otp: $("d-otp").value.trim() });
      if (!j.ok) { pesan(j.pesan || "Kode salah."); return; }
      if (!j.admin) { pesan("Akun ini bukan pengelola. Dashboard hanya untuk email pengelola."); return; }
      st.token = j.token;
      try { sessionStorage.setItem(SESI_KEY, JSON.stringify({ token: j.token, email: st.email, sampai: Date.now() + (j.jam || 6) * 3600e3 })); } catch (er) { /* abaikan */ }
      muat();
    } catch (er) { pesan("Layanan tidak bisa dihubungi."); } finally { $("d-b-masuk").disabled = false; }
  });
  $("d-keluar").addEventListener("click", () => { try { sessionStorage.removeItem(SESI_KEY); } catch (e) { /* abaikan */ } location.reload(); });
  $("d-refresh").addEventListener("click", () => muat());
  (async () => {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(SESI_KEY) || "null"); } catch (e) { /* abaikan */ }
    if (s && s.sampai > Date.now() && ENDPOINT) { st.token = s.token; st.email = s.email; muat(true); }
  })();

  async function muat(diam) {
    try {
      const j = await api({ aksi: "kons-admin", token: st.token });
      if (!j.ok) { if (!diam) pesan(j.pesan || "Gagal memuat."); if (j.ulang) { $("d-masuk").hidden = false; $("d-app").hidden = true; } return; }
      st.peserta = (j.peserta || []).map(olah);
      $("d-masuk").hidden = true; $("d-app").hidden = false;
      $("d-who").textContent = st.email;
      $("d-upd").textContent = "· diperbarui " + (j.dibuat || "");
      isiFilter(); renderKpi(); renderCharts(); renderGrid();
    } catch (er) { if (!diam) pesan("Layanan tidak bisa dihubungi."); }
  }

  /* ---------- Olah data ---------- */
  const CAT_LEMAK = (jk, p) => (jk === "P" ? [[14, "Esensial"], [21, "Atletis"], [25, "Bugar"], [32, "Rata-rata"], [99, "Berlebih"]] : [[6, "Esensial"], [14, "Atletis"], [18, "Bugar"], [25, "Rata-rata"], [99, "Berlebih"]]).find((c) => p < c[0])[1];
  function olah(p) {
    const R = (p.riwayat || []).slice().sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
    const last = R[R.length - 1] || null;
    const lr = last ? last.ringkas || {} : {};
    const usia = PG.usiaDari(p.tglLahir);
    const caborN = (PG.CABOR_MAP[p.cabor] || {}).n || p.cabor || "–";
    const risiko = !!last && ((lr.ea != null && lr.ea < 30) || (last.reds || []).length >= 2);
    const peranLabel = p.jenis === "klien-praktisi" ? "Klien praktisi" : p.peran === "pelatih" ? "Pelatih" : p.peran === "ahligizi" ? "Ahli gizi" : "Atlet";
    const kunci = p.jenis === "klien-praktisi" ? "kp:" + p.id : "a:" + p.email;
    return { ...p, R, last, lr, usia, caborN, risiko, peranLabel, kunci, tglTerakhir: last ? last.tanggal : "" };
  }
  function isiFilter() {
    const cab = [...new Set(st.peserta.map((p) => p.caborN))].sort();
    $("f-cabor").innerHTML = '<option value="">Semua cabang</option>' + cab.map((c) => `<option>${esc(c)}</option>`).join("");
    $("f-tujuan").innerHTML = '<option value="">Semua tujuan</option>' + Object.entries(PG.TUJUAN).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  }
  ["f-cari", "f-jenis", "f-cabor", "f-tujuan", "f-urut"].forEach((id) => $(id).addEventListener("input", renderGrid));

  /* ---------- KPI ---------- */
  function renderKpi() {
    const P = st.peserta;
    const semuaK = P.flatMap((p) => p.R);
    const bulanIni = new Date().toISOString().slice(0, 7);
    const t30 = Date.now() - 30 * 864e5;
    const k = [
      ["Peserta", P.filter((p) => p.peranLabel !== "Pelatih" && p.peranLabel !== "Ahli gizi").length, "Atlet & klien terdaftar", "k1"],
      ["Konsultasi", semuaK.length, "Total asesmen tersimpan", "k2"],
      ["30 hari terakhir", semuaK.filter((r) => new Date(r.tanggal).getTime() >= t30).length, "Asesmen baru", "k3"],
      ["Praktisi", P.filter((p) => p.peranLabel === "Pelatih" || p.peranLabel === "Ahli gizi").length, "Pelatih & ahli gizi", "k4"],
      ["Berisiko", P.filter((p) => p.risiko).length, "EA < 30 atau ≥ 2 tanda REDs", "k5"],
      ["Bulan ini", semuaK.filter((r) => String(r.tanggal).slice(0, 7) === bulanIni).length, "Konsultasi bulan berjalan", "k6"]
    ];
    $("d-kpi").innerHTML = k.map(([l, v, s, c]) => `<div class="db-k ${c}"><span>${l}</span><b data-n="${v}">0</b><small>${s}</small></div>`).join("");
    // Angka naik bertahap agar terasa dinamis.
    document.querySelectorAll(".db-k b").forEach((b) => {
      const n = Number(b.dataset.n), t0 = performance.now();
      const step = (t) => { const p = Math.min(1, (t - t0) / 700); b.textContent = f0(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Grafik ---------- */
  function chart(id, cfg) {
    if (!Chart) return;
    if (st.charts[id]) st.charts[id].destroy();
    st.charts[id] = new Chart($(id), cfg);
  }
  const hitung = (arr) => arr.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});
  const opsiDasar = { responsive: true, maintainAspectRatio: false, animation: { duration: 900, easing: "easeOutQuart" }, plugins: { legend: { labels: { font: { family: "Outfit" }, boxWidth: 12 } } } };
  function renderCharts() {
    const P = st.peserta.filter((p) => p.peranLabel !== "Pelatih" && p.peranLabel !== "Ahli gizi");
    const K = st.peserta.flatMap((p) => p.R);
    // Per bulan (12 bulan terakhir).
    const bulan = []; const d = new Date(); d.setDate(1);
    for (let i = 11; i >= 0; i--) { const t = new Date(d.getFullYear(), d.getMonth() - i, 1); bulan.push(t.toISOString().slice(0, 7)); }
    const perB = bulan.map((b) => K.filter((r) => String(r.tanggal).slice(0, 7) === b).length);
    let kum = 0; const kumulatif = perB.map((n) => (kum += n));
    const label = bulan.map((b) => new Date(b + "-01").toLocaleDateString("id-ID", { month: "short", year: "2-digit" }));
    chart("ch-bulan", { data: { labels: label, datasets: [
      { type: "bar", label: "Konsultasi", data: perB, backgroundColor: perB.map((_, i) => WARNA[i % WARNA.length]), borderRadius: 8 },
      { type: "line", label: "Kumulatif", data: kumulatif, borderColor: "#003a63", backgroundColor: "#003a63", tension: .35, yAxisID: "y1", pointRadius: 3 }
    ] }, options: { ...opsiDasar, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, y1: { position: "right", beginAtZero: true, grid: { display: false }, ticks: { precision: 0 } } } } });
    const donat = (id, obj) => {
      const ent = Object.entries(obj).sort((a, b) => b[1] - a[1]);
      chart(id, { type: "doughnut", data: { labels: ent.map((e) => e[0]), datasets: [{ data: ent.map((e) => e[1]), backgroundColor: ent.map((_, i) => WARNA[i % WARNA.length]), borderWidth: 2, borderColor: "#fff" }] }, options: { ...opsiDasar, cutout: "58%", plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { family: "Outfit", size: 11 } } } } } });
    };
    donat("ch-cabor", hitung(P.map((p) => p.caborN)));
    donat("ch-jk", hitung(P.map((p) => (p.jk === "P" ? "Perempuan" : "Laki-laki"))));
    const PENDEK = { performa: "Performa", hipertrofi: "Hipertrofi", turun_lemak: "Turun lemak", kelas_berat: "Kelas tanding", rekomposisi: "Rekomposisi" };
    const tj = hitung(P.filter((p) => p.last).map((p) => PENDEK[p.last.tujuan] || "Belum ada"));
    const tjE = Object.entries(tj).sort((a, b) => b[1] - a[1]);
    chart("ch-tujuan", { type: "bar", data: { labels: tjE.map((e) => e[0]), datasets: [{ label: "Peserta", data: tjE.map((e) => e[1]), backgroundColor: tjE.map((_, i) => WARNA[(i + 2) % WARNA.length]), borderRadius: 8 }] }, options: { ...opsiDasar, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } } });
    const lv = hitung(P.map((p) => (p.level || "–").split(" (")[0]));
    const lvE = Object.entries(lv);
    chart("ch-level", { type: "polarArea", data: { labels: lvE.map((e) => e[0]), datasets: [{ data: lvE.map((e) => e[1]), backgroundColor: lvE.map((_, i) => WARNA[(i + 4) % WARNA.length] + "cc") }] }, options: { ...opsiDasar, plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { family: "Outfit", size: 11 } } } }, scales: { r: { ticks: { precision: 0, backdropColor: "transparent" } } } } });
    const katUrut = ["Esensial", "Atletis", "Bugar", "Rata-rata", "Berlebih"];
    const lem = { L: katUrut.map(() => 0), P: katUrut.map(() => 0) };
    P.forEach((p) => { if (p.lr.pct != null) lem[p.jk === "P" ? "P" : "L"][katUrut.indexOf(CAT_LEMAK(p.jk, p.lr.pct))]++; });
    chart("ch-lemak", { type: "bar", data: { labels: katUrut, datasets: [{ label: "Laki-laki", data: lem.L, backgroundColor: "#0070b8", borderRadius: 6 }, { label: "Perempuan", data: lem.P, backgroundColor: "#ef476f", borderRadius: 6 }] }, options: { ...opsiDasar, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } } });
    const ea = [0, 0, 0];
    P.forEach((p) => { if (p.lr.ea != null) ea[p.lr.ea < 30 ? 0 : p.lr.ea < 45 ? 1 : 2]++; });
    chart("ch-ea", { type: "bar", data: { labels: ["< 30 (berisiko)", "30–45", "≥ 45 (optimal)"], datasets: [{ label: "Peserta", data: ea, backgroundColor: ["#ef476f", "#ffd166", "#06d6a0"], borderRadius: 10 }] }, options: { ...opsiDasar, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
  }

  /* ---------- Kartu peserta ---------- */
  const inisial = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const avatar = (p, cls) => st.foto[p.kunci] ? `<img class="pg-av ${cls}" src="${st.foto[p.kunci]}" alt="">` : `<span class="pg-av pg-av-ini ${cls}" style="background:linear-gradient(135deg,${WARNA[p.nama.length % WARNA.length]},${WARNA[(p.nama.length + 3) % WARNA.length]})">${esc(inisial(p.nama))}</span>`;
  function tersaring() {
    const q = $("f-cari").value.trim().toLowerCase(), j = $("f-jenis").value, c = $("f-cabor").value, t = $("f-tujuan").value, u = $("f-urut").value;
    let L = st.peserta.filter((p) => {
      if (q && ![p.nama, p.email, p.asal, p.praktisiNama, p.caborLain].join(" ").toLowerCase().includes(q)) return false;
      if (j === "atlet" && !(p.jenis === "akun" && p.peranLabel === "Atlet")) return false;
      if (j === "praktisi" && !(p.peranLabel === "Pelatih" || p.peranLabel === "Ahli gizi")) return false;
      if (j === "klien-praktisi" && p.jenis !== "klien-praktisi") return false;
      if (c && p.caborN !== c) return false;
      if (t && (!p.last || p.last.tujuan !== t)) return false;
      return true;
    });
    const by = { baru: (a, b) => String(b.tglTerakhir).localeCompare(String(a.tglTerakhir)), nama: (a, b) => a.nama.localeCompare(b.nama), banyak: (a, b) => b.R.length - a.R.length, risiko: (a, b) => (b.risiko - a.risiko) || String(b.tglTerakhir).localeCompare(String(a.tglTerakhir)) };
    return L.sort(by[u]);
  }
  function renderGrid() {
    const L = tersaring();
    $("d-jumlah").textContent = `${L.length} dari ${st.peserta.length} peserta`;
    $("d-grid").innerHTML = L.map((p, i) => `
      <button type="button" class="db-card" data-k="${esc(p.kunci)}" style="--ac:${WARNA[i % WARNA.length]}">
        <span class="db-card-top">${avatar(p, "pg-av-md")}<span class="db-card-nm"><strong>${esc(p.nama)}</strong><small>${esc(p.caborN)}${p.usia != null ? " · " + p.usia + " th" : ""}</small></span></span>
        <span class="db-chips"><span class="db-chip">${esc(p.peranLabel)}</span>${p.level ? `<span class="db-chip">${esc(p.level.split(" (")[0])}</span>` : ""}${p.risiko ? '<span class="db-chip db-risk">Berisiko</span>' : ""}</span>
        <span class="db-mini"><span><b>${p.last && p.last.bb ? f1(p.last.bb) : "–"}</b>BB kg</span><span><b>${p.lr.pct != null ? f1(p.lr.pct) + "%" : "–"}</b>Lemak</span><span><b>${p.R.length}</b>Konsul</span></span>
        <small class="note">${p.tglTerakhir ? "Terakhir " + esc(p.tglTerakhir) : "Belum ada asesmen"}${p.jenis === "klien-praktisi" ? " · via " + esc(p.praktisiNama) : ""}</small>
      </button>`).join("") || '<p class="note">Tidak ada peserta yang cocok.</p>';
    muatFoto(L.slice(0, 60));
  }
  $("d-grid").addEventListener("click", (e) => { const c = e.target.closest("[data-k]"); if (c) bukaDetail(c.dataset.k); });

  let antre = false;
  async function muatFoto(L) {
    if (antre) return;
    antre = true;
    for (const p of L) {
      if (!p.adaFoto || st.foto[p.kunci] != null) continue;
      st.foto[p.kunci] = "";
      try {
        const j = await api(p.jenis === "klien-praktisi" ? { aksi: "kons-foto-ambil", token: st.token, klienId: p.id, email: p.praktisiEmail } : { aksi: "kons-foto-ambil", token: st.token, email: p.email });
        if (j.ok && j.foto) {
          st.foto[p.kunci] = j.foto;
          document.querySelectorAll(`[data-k="${CSS.escape(p.kunci)}"] .pg-av`).forEach((el) => { el.outerHTML = avatar(p, "pg-av-md"); });
        }
      } catch (e) { /* lanjut */ }
    }
    antre = false;
  }

  /* ---------- Detail peserta ---------- */
  function bukaDetail(kunci) {
    const p = st.peserta.find((x) => x.kunci === kunci);
    if (!p) return;
    const lr = p.lr, last = p.last;
    const waLink = p.wa ? `https://wa.me/${p.wa}` : "";
    $("d-detail").innerHTML = `
      <button type="button" class="db-x" id="dm-tutup" aria-label="Tutup">×</button>
      <div class="pg-kartu db-dhead">
        <div class="pg-kartu-in">
          <div class="pg-kartu-foto">${avatar(p, "pg-av-lg")}</div>
          <div class="pg-kartu-teks">
            <span class="pg-kartu-eyebrow">${esc(p.peranLabel)}${p.jenis === "klien-praktisi" ? " · via " + esc(p.praktisiNama) : ""}</span>
            <h2 id="dm-nama">${esc(p.nama)}</h2>
            <p>${esc(p.caborN)}${p.caborLain ? " · " + esc(p.caborLain) : ""}${p.usia != null ? " · " + p.usia + " tahun" : ""}${p.jk ? " · " + (p.jk === "P" ? "perempuan" : "laki-laki") : ""}${p.level ? " · " + esc(p.level) : ""}</p>
            <div class="pg-tiles">
              <div class="pg-tile"><b>${last && last.bb ? f1(last.bb) + " kg" : "–"}</b><span>BB</span></div>
              <div class="pg-tile c2"><b>${lr.pct != null ? f1(lr.pct) + "%" : "–"}</b><span>Lemak</span></div>
              <div class="pg-tile c3"><b>${lr.energi ? f0(lr.energi) : "–"}</b><span>kkal/hari</span></div>
              <div class="pg-tile c4"><b>${lr.ea != null ? f1(lr.ea) : "–"}</b><span>EA</span></div>
            </div>
          </div>
        </div>
      </div>
      <div class="db-dbody">
        <div class="db-info">
          ${p.email ? `<a class="btn btn-ghost pg-sm" href="mailto:${esc(p.email)}">Email</a>` : ""}
          ${waLink ? `<a class="btn btn-primary pg-sm" href="${waLink}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
          ${p.folder ? `<a class="btn btn-ghost pg-sm" href="${esc(p.folder)}" target="_blank" rel="noopener">Folder Drive</a>` : ""}
          <span class="note">${esc(p.email || "")}${p.asal ? " · " + esc(p.asal) : ""}${p.profesi ? " · " + esc(p.profesi) : ""} · terdaftar ${esc(String(p.terdaftar || "").slice(0, 10))}</span>
        </div>
        ${p.risiko ? `<div class="callout bad">Perlu perhatian: ${lr.ea != null && lr.ea < 30 ? "ketersediaan energi " + f1(lr.ea) + " kkal/kg FFM (< 30)" : ""}${(last.reds || []).length ? " · tanda REDs: " + esc(last.reds.join(", ")) : ""}</div>` : ""}
        ${p.catatan ? `<p class="note"><strong>Catatan klien:</strong> ${esc(p.catatan)}</p>` : ""}
        ${p.R.length ? `
        <div class="db-dcharts">
          <div class="card db-ch"><h3>Berat badan & lemak tubuh</h3><div class="db-cv"><canvas id="dm-ch1"></canvas></div></div>
          <div class="card db-ch"><h3>Program energi & makro per konsultasi</h3><div class="db-cv"><canvas id="dm-ch2"></canvas></div></div>
        </div>
        ${last.tujuanKonsultasi ? `<h3>Tujuan konsultasi terakhir</h3><p>${esc(last.tujuanKonsultasi)}</p>` : ""}
        ${last.catatanPraktisi ? `<h3>Catatan praktisi</h3><p>${esc(last.catatanPraktisi)}</p>` : ""}
        <h3>Riwayat konsultasi</h3>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tanggal</th><th>Tujuan</th><th class="n">BB</th><th class="n">Lemak</th><th class="n">FFM</th><th class="n">kkal</th><th class="n">KH/P/L (g)</th><th class="n">EA</th><th>Laporan</th></tr></thead><tbody>
          ${p.R.slice().reverse().map((r) => { const g = r.ringkas || {}; return `<tr><td>${esc(r.tanggal)}</td><td>${esc((PG.TUJUAN[r.tujuan] || "").split(" (")[0])}</td><td class="n">${r.bb ? f1(r.bb) : "–"}</td><td class="n">${g.pct != null ? f1(g.pct) + "%" : "–"}</td><td class="n">${g.ffm != null ? f1(g.ffm) : "–"}</td><td class="n">${g.energi ? f0(g.energi) : "–"}</td><td class="n">${g.kh ? `${f0(g.kh)}/${f0(g.protein)}/${f0(g.lemak)}` : "–"}</td><td class="n">${g.ea != null ? f1(g.ea) : "–"}</td><td>${r.laporan ? `<a href="${esc(r.laporan)}" target="_blank" rel="noopener">Buka</a>` : "–"}</td></tr>`; }).join("")}
        </tbody></table></div>` : '<p class="note">Belum ada asesmen tersimpan.</p>'}
      </div>`;
    $("d-modal").hidden = false;
    document.body.style.overflow = "hidden";
    $("dm-tutup").onclick = tutup;
    if (p.R.length && Chart) {
      const lab = p.R.map((r) => String(r.tanggal).slice(2));
      chart("dm-ch1", { type: "line", data: { labels: lab, datasets: [
        { label: "BB (kg)", data: p.R.map((r) => r.bb || null), borderColor: "#0070b8", backgroundColor: "rgba(0,112,184,.15)", fill: true, tension: .35, yAxisID: "y", pointRadius: 5 },
        { label: "Lemak (%)", data: p.R.map((r) => (r.ringkas || {}).pct ?? null), borderColor: "#f05828", backgroundColor: "#f05828", tension: .35, yAxisID: "y1", pointRadius: 5, spanGaps: true },
        { label: "FFM (kg)", data: p.R.map((r) => (r.ringkas || {}).ffm ?? null), borderColor: "#06d6a0", backgroundColor: "#06d6a0", borderDash: [6, 4], tension: .35, yAxisID: "y", pointRadius: 4, spanGaps: true }
      ] }, options: { ...opsiDasar, interaction: { mode: "index", intersect: false }, scales: { y1: { position: "right", grid: { display: false } } } } });
      chart("dm-ch2", { type: "bar", data: { labels: lab, datasets: [
        { label: "KH (kkal)", data: p.R.map((r) => ((r.ringkas || {}).kh || 0) * 4), backgroundColor: "#ffd166", borderRadius: 6, stack: "e" },
        { label: "Protein (kkal)", data: p.R.map((r) => ((r.ringkas || {}).protein || 0) * 4), backgroundColor: "#ef476f", borderRadius: 6, stack: "e" },
        { label: "Lemak (kkal)", data: p.R.map((r) => ((r.ringkas || {}).lemak || 0) * 9), backgroundColor: "#118ab2", borderRadius: 6, stack: "e" }
      ] }, options: { ...opsiDasar, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } } });
    }
  }
  function tutup() { $("d-modal").hidden = true; document.body.style.overflow = ""; }
  $("d-modal").addEventListener("click", (e) => { if (e.target.id === "d-modal") tutup(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("d-modal").hidden) tutup(); });

  /* ---------- CSV ---------- */
  $("d-csv").addEventListener("click", () => {
    const rows = [["Nama", "Peran", "Praktisi", "Email", "WhatsApp", "Asal", "Cabang", "Level", "Usia", "JK", "Jumlah konsultasi", "Terakhir", "BB", "% lemak", "FFM", "Energi", "EA", "Berisiko"]];
    tersaring().forEach((p) => rows.push([p.nama, p.peranLabel, p.praktisiNama || "", p.email || "", p.wa || "", p.asal || "", p.caborN, p.level || "", p.usia ?? "", p.jk || "", p.R.length, p.tglTerakhir, p.last ? p.last.bb : "", p.lr.pct ?? "", p.lr.ffm ?? "", p.lr.energi ?? "", p.lr.ea ?? "", p.risiko ? "ya" : ""]));
    const csv = rows.map((r) => r.map((v) => { const s = String(v ?? ""); return /[",\n;]/.test(s) || /^[=+\-@]/.test(s) ? '"' + s.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""') + '"' : s; }).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `peserta-konsultasi-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  });
});
