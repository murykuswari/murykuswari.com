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
  const SESI_KEY = "mk-program-sesi", INGAT_KEY = "mk-ingat";
  const WARNA = ["#0070b8", "#f05828", "#06d6a0", "#ffd166", "#ef476f", "#118ab2", "#8338ec", "#3a86ff", "#fb5607", "#2a9d8f", "#e76f51", "#9b5de5"];
  const st = { token: "", email: "", peserta: [], bayar: [], tanya: [], paket: [], bayarAktif: false, filterTanya: "aksi", foto: {}, charts: {} };
  const bacaIngat = () => { try { const t = JSON.parse(localStorage.getItem(INGAT_KEY) || "null"); return t && t.sampai > Date.now() ? t : null; } catch (e) { return null; } };

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
      const j = await api({ aksi: "kons-masuk", email: st.email, otp: $("d-otp").value.trim(), ingat: $("d-ingat").checked });
      if (!j.ok) { pesan(j.pesan || "Kode salah."); return; }
      if (!j.admin) { pesan("Akun ini bukan pengelola. Dashboard hanya untuk email pengelola."); return; }
      simpanSesi(j);
      muat();
    } catch (er) { pesan("Layanan tidak bisa dihubungi."); } finally { $("d-b-masuk").disabled = false; }
  });
  function simpanSesi(j) {
    st.token = j.token; st.email = j.email || st.email;
    try { sessionStorage.setItem(SESI_KEY, JSON.stringify({ token: j.token, email: st.email, sampai: Date.now() + (j.jam || 6) * 3600e3 })); } catch (er) { /* abaikan */ }
    if (j.ingat) { try { localStorage.setItem(INGAT_KEY, JSON.stringify({ token: j.ingat.token, sampai: j.ingat.sampai, email: st.email })); } catch (er) { /* abaikan */ } }
  }
  $("d-keluar").addEventListener("click", async () => {
    const t = bacaIngat();
    try { await api({ aksi: "kons-keluar", token: st.token, ingat: t ? t.token : "" }); } catch (e) { /* tetap keluar */ }
    try { sessionStorage.removeItem(SESI_KEY); localStorage.removeItem(INGAT_KEY); } catch (e) { /* abaikan */ }
    location.reload();
  });
  $("d-refresh").addEventListener("click", () => muat());
  (async () => {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(SESI_KEY) || "null"); } catch (e) { /* abaikan */ }
    if (!ENDPOINT) return;
    if (s && s.sampai > Date.now()) { st.token = s.token; st.email = s.email; if (await muat(true)) return; }
    const t = bacaIngat();
    if (t) {
      try {
        const j = await api({ aksi: "kons-lanjut", ingat: t.token });
        if (j.ok && j.admin) { simpanSesi(j); muat(); }
        else if (!j.ok) { try { localStorage.removeItem(INGAT_KEY); } catch (e) { /* abaikan */ } }
      } catch (e) { /* tetap di halaman masuk */ }
    }
  })();

  async function muat(diam) {
    try {
      const j = await api({ aksi: "kons-admin", token: st.token });
      if (!j.ok) { if (!diam) pesan(j.pesan || "Gagal memuat."); if (j.ulang) { $("d-masuk").hidden = false; $("d-app").hidden = true; } return false; }
      st.bayar = j.pembayaran || [];
      st.tanya = j.permintaan || []; st.paket = j.paket || []; st.bayarAktif = !!j.bayarAktif;
      st.peserta = (j.peserta || []).map(olah);
      $("d-masuk").hidden = true; $("d-app").hidden = false;
      $("d-who").textContent = st.email;
      $("d-upd").textContent = "· diperbarui " + (j.dibuat || "");
      isiFilter(); renderKpi(); renderCharts(); renderTanya(); renderBayar(); renderGrid();
      return true;
    } catch (er) { if (!diam) pesan("Layanan tidak bisa dihubungi."); return false; }
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
    const lunas = st.bayar.filter((b) => b.status === "lunas" && b.email === p.email && (p.jenis === "klien-praktisi" ? b.klienId === p.id : !b.klienId));
    return { ...p, R, last, lr, usia, caborN, risiko, peranLabel, kunci, lunas, tglTerakhir: last ? last.tanggal : "" };
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
      ["Perlu tindakan", st.tanya.filter((t) => ["menunggu-keputusan", "gratis", "lunas"].includes(t.status)).length + st.bayar.filter((b) => b.status === "dicek").length, `${st.tanya.filter((t) => t.status === "menunggu-keputusan").length} perlu keputusan · ${st.bayar.filter((b) => b.status === "dicek").length} bayar perlu dicek · ${P.filter((p) => p.peranLabel === "Pelatih" || p.peranLabel === "Ahli gizi").length} praktisi`, "k4"],
      ["Berisiko", P.filter((p) => p.risiko).length, "EA < 30 atau ≥ 2 tanda REDs", "k5"],
      ["Pendapatan (Rp)", st.bayar.filter((b) => b.status === "lunas").reduce((a, b) => a + b.jumlah, 0), `${st.bayar.filter((b) => b.status === "lunas").length} pembayaran lunas · ${semuaK.filter((r) => String(r.tanggal).slice(0, 7) === bulanIni).length} konsultasi bulan ini`, "k6"]
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
        <span class="db-chips"><span class="db-chip">${esc(p.peranLabel)}</span>${p.level ? `<span class="db-chip">${esc(p.level.split(" (")[0])}</span>` : ""}${p.risiko ? '<span class="db-chip db-risk">Berisiko</span>' : ""}${p.lunas.length ? '<span class="db-chip db-paid">Konsultasi lanjutan</span>' : ""}</span>
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
          <button type="button" class="btn btn-ghost pg-sm" id="dm-kartu">Lihat &amp; unduh profil (PNG/JPEG)</button>
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
    $("dm-kartu").onclick = () => kartuPeserta(p);
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
  async function kartuPeserta(p) {
    if (!window.MKKartu) { window.MK.toast("Muat ulang halaman lalu coba lagi"); return; }
    if (p.adaFoto && !st.foto[p.kunci]) {
      try {
        const j = await api(p.jenis === "klien-praktisi" ? { aksi: "kons-foto-ambil", token: st.token, klienId: p.id, email: p.praktisiEmail } : { aksi: "kons-foto-ambil", token: st.token, email: p.email });
        if (j.ok && j.foto) st.foto[p.kunci] = j.foto;
      } catch (e) { /* tanpa foto */ }
    }
    const lr = p.lr || {}, last = p.last || {};
    window.MKKartu.tampilkan({
      nama: p.nama,
      eyebrow: p.jenis === "klien-praktisi" ? "Program Gizi Olahraga · via " + (p.praktisiNama || "praktisi") : "Program Gizi Olahraga",
      sub: [p.caborN, p.caborLain, p.usia != null ? p.usia + " tahun" : "", p.level].filter(Boolean).join(" · "),
      foto: st.foto[p.kunci] || "",
      tiles: [["BB", last.bb ? f1(last.bb) + " kg" : "–"], ["Lemak", lr.pct != null ? f1(lr.pct) + "%" : "–"], ["FFM", lr.ffm != null ? f1(lr.ffm) + " kg" : "–"], ["Konsultasi", String(p.R.length)]],
      tilesPrivat: [["Konsultasi", String(p.R.length)], ["Cabang", String(p.caborN || "-").split(" ")[0]]],
      seri: p.R.map((r) => ({ t: String(r.tanggal || ""), bb: Number(r.bb) || null }))
    });
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

  /* ---------- Pembayaran (Midtrans otomatis + e-wallet dikonfirmasi admin) ---------- */
  const isDompet = (b) => String(b.metode).indexOf("dompet") === 0;
  const namaMetode = (b) => isDompet(b) ? (String(b.metode).split(":")[1] || "E-wallet (belum dipilih)") : (b.metode || "–");
  const perluVerif = () => st.bayar.filter((b) => isDompet(b) && (b.status === "dicek" || b.status === "menunggu"));
  function renderBayar() {
    const L = st.bayar.slice().sort((a, b) => String(b.dibuat).localeCompare(String(a.dibuat)));
    const chip = { lunas: "db-paid", menunggu: "", dicek: "db-risk", kedaluwarsa: "db-risk", gagal: "db-risk", dikembalikan: "db-risk" };
    const lunas = L.filter((b) => b.status === "lunas"), bln = new Date().toISOString().slice(0, 7);
    const perDompet = {};
    lunas.forEach((b) => { const n = namaMetode(b); perDompet[n] = (perDompet[n] || 0) + b.jumlah; });
    const V = perluVerif().sort((a, b) => (b.status === "dicek") - (a.status === "dicek"));
    const ringkas = `<div class="db-bsum">
      <div><strong>Rp${f0(lunas.reduce((a, b) => a + b.jumlah, 0))}</strong><span>Total diterima · ${lunas.length} transaksi</span></div>
      <div><strong>Rp${f0(lunas.filter((b) => String(b.dibayar).slice(0, 7) === bln).reduce((a, b) => a + b.jumlah, 0))}</strong><span>Bulan ini</span></div>
      ${Object.keys(perDompet).map((n) => `<div><strong>Rp${f0(perDompet[n])}</strong><span>${esc(n)}</span></div>`).join("")}
      <div class="${V.some((b) => b.status === "dicek") ? "warn" : ""}"><strong>${V.filter((b) => b.status === "dicek").length}</strong><span>Perlu dikonfirmasi</span></div>
    </div>`;
    const kartu = V.length ? `<h4 style="margin:0 0 8px">Cocokkan di aplikasi e-wallet Anda, lalu konfirmasi</h4><div class="db-verif">${V.map((b) => {
      const s = String(Math.round(b.jumlah));
      return `<div class="db-vc" data-order="${esc(b.orderId)}">
        <div><div class="rp">Rp${f0(Math.floor(b.jumlah / 1000))}.<em>${s.slice(-3)}</em></div>
          <strong>${esc(b.nama)}</strong> <small class="note">${esc(b.email)}</small><br>
          <small>${esc(b.paket)} · ke <b>${esc(namaMetode(b))}</b>${b.info ? " · " + esc(b.info) : ""} · ${esc(String(b.dibuat).slice(0, 16))}</small></div>
        <div><span class="db-chip ${b.status === "dicek" ? "db-risk" : ""}">${b.status === "dicek" ? "Klien sudah bayar" : "Belum ada konfirmasi klien"}</span>${b.bukti ? `<br><a href="${esc(b.bukti)}" target="_blank" rel="noopener">Lihat bukti ↗</a>` : ""}</div>
        <div class="db-vc-act"><input class="db-vcat" placeholder="Catatan (wajib bila menolak, mis. nominal tidak ditemukan)">
          <button type="button" class="btn btn-primary pg-sm" data-verif="1">Konfirmasi lunas</button>
          <button type="button" class="btn btn-ghost pg-sm" data-verif="0">Tolak</button></div>
      </div>`;
    }).join("")}</div>` : "";
    const tabel = L.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Dibuat</th><th>Nama</th><th>Paket</th><th class="n">Jumlah</th><th>Status</th><th>Metode</th><th>Bukti</th><th>Order ID</th></tr></thead><tbody>${L.slice(0, 80).map((b) => `<tr><td>${esc(String(b.dibuat).slice(0, 16))}</td><td>${esc(b.nama)}<br><small class="note">${esc(b.email)}</small></td><td>${esc(b.paket)}</td><td class="n">Rp${f0(b.jumlah)}</td><td><span class="db-chip ${chip[b.status] || ""}">${esc(b.status === "dicek" ? "perlu konfirmasi" : b.status)}</span>${b.catatanVerifikasi ? `<br><small class="note">${esc(b.catatanVerifikasi)}</small>` : ""}</td><td>${esc(namaMetode(b))}</td><td>${b.bukti ? `<a href="${esc(b.bukti)}" target="_blank" rel="noopener">Lihat</a>` : "–"}</td><td><small>${esc(b.orderId)}</small></td></tr>`).join("")}</tbody></table></div>
      <button type="button" class="btn btn-ghost pg-sm" id="d-bayar-csv" style="margin-top:10px">Unduh rekap pembayaran (CSV)</button>`
      : '<p class="note">Belum ada pembayaran. Klien membayar ke e-wallet Anda (nomor di config.js → dompet) setelah Anda menetapkan "berbayar".</p>';
    $("d-bayar").innerHTML = ringkas + kartu + tabel;
  }
  $("d-bayar").addEventListener("click", async (e) => {
    if (e.target.id === "d-bayar-csv") {
      const rows = [["Dibuat", "Dibayar", "Nama", "Email", "Paket", "Jumlah (Rp)", "Status", "Metode", "Pengirim", "Bukti", "Catatan verifikasi", "Order ID"]];
      st.bayar.forEach((b) => rows.push([b.dibuat, b.dibayar, b.nama, b.email, b.paket, b.jumlah, b.status, namaMetode(b), b.info, b.bukti, b.catatanVerifikasi, b.orderId]));
      const csv = rows.map((r) => r.map((v) => { const x = String(v ?? ""); return /[",\n;]/.test(x) || /^[=+\-@]/.test(x) ? '"' + x.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""') + '"' : x; }).join(",")).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      a.download = `pembayaran-konsultasi-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      return;
    }
    const v = e.target.closest("[data-verif]");
    if (!v) return;
    const box = v.closest(".db-vc"), terima = v.dataset.verif === "1", catatan = box.querySelector(".db-vcat").value.trim();
    if (!terima && !catatan) { MK.toast("Tulis alasan penolakan untuk klien"); box.querySelector(".db-vcat").focus(); return; }
    if (terima && !confirm("Pastikan nominal sudah masuk ke e-wallet Anda. Konfirmasi lunas?")) return;
    box.querySelectorAll("button").forEach((x) => (x.disabled = true));
    try {
      const j = await api({ aksi: "kons-verifikasi", token: st.token, orderId: box.dataset.order, terima, catatan });
      if (!j.ok) { MK.toast(j.pesan || "Gagal menyimpan"); return; }
      st.bayar = j.pembayaran || st.bayar; st.tanya = j.permintaan || st.tanya;
      renderBayar(); renderTanya(); renderKpi();
      MK.toast(terima ? "Lunas. Klien menerima email; permintaan siap dijawab." : "Ditolak. Klien menerima email alasan.");
    } catch (er) { MK.toast("Layanan tidak bisa dihubungi"); } finally { box.querySelectorAll("button").forEach((x) => (x.disabled = false)); }
  });

  /* ---------- Permintaan konsultasi: keputusan admin ---------- */
  const rp = (n) => "Rp" + f0(n);
  const LBL = { "menunggu-keputusan": ["Perlu keputusan", "db-risk"], gratis: ["Gratis · siap dijawab", "db-paid"], "menunggu-bayar": ["Menunggu bayar", ""], lunas: ["Lunas · siap dijawab", "db-paid"], dijawab: ["Dijawab", ""], ditolak: ["Ditolak", ""] };
  $("tq-filter").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    st.filterTanya = b.dataset.v;
    $("tq-filter").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    renderTanya();
  });
  function formPutus(t) {
    const opsi = st.paket.map((p) => `<option value="${esc(p.id)}" data-harga="${p.harga}" data-nama="${esc(p.nama)}">${esc(p.nama)} – ${rp(p.harga)}</option>`).join("");
    return `<div class="db-putus" data-id="${esc(t.id)}">
      <div class="seg db-seg db-jenis"><button type="button" data-j="gratis" aria-pressed="${t.jenis === "gratis"}">Gratis</button><button type="button" data-j="berbayar" aria-pressed="${t.status === "menunggu-bayar"}">Berbayar</button><button type="button" data-j="tolak" aria-pressed="false">Tolak</button></div>
      <div class="db-harga" ${t.status === "menunggu-bayar" ? "" : "hidden"}>
        <select class="db-paket">${opsi}<option value="">Harga lain…</option></select>
        <input class="db-nama" placeholder="Nama paket" value="${esc(t.paket || (st.paket[0] || {}).nama || "Konsultasi lanjutan")}">
        <input class="db-rp" type="number" inputmode="numeric" min="10000" step="5000" placeholder="Harga (Rp)" value="${t.harga || (st.paket[0] || {}).harga || ""}">
        <small class="note">Klien membayar ke e-wallet Anda dengan kode unik, lalu mengunggah bukti. Konfirmasi di bagian Pembayaran.</small>
      </div>
      <textarea class="db-cat" rows="2" placeholder="Catatan untuk klien (alasan, saran, atau apa yang didapat)">${esc(t.catatan || "")}</textarea>
      <button type="button" class="btn btn-primary pg-sm db-simpan">Simpan keputusan & kirim email</button>
    </div>`;
  }
  function renderTanya() {
    const aksi = (t) => ["menunggu-keputusan", "gratis", "lunas"].includes(t.status);
    const L = st.tanya.filter((t) => st.filterTanya === "semua" || aksi(t)).sort((a, b) => (aksi(b) - aksi(a)) || String(b.dibuat).localeCompare(String(a.dibuat)));
    $("d-tanya").innerHTML = L.length ? L.map((t) => {
      const l = LBL[t.status] || [t.status, ""];
      const peserta = st.peserta.find((p) => p.email === t.email && (t.klienId ? p.id === t.klienId : p.jenis === "akun"));
      return `<div class="db-tq">
        <div class="db-tq-h"><span>${peserta ? `<button type="button" class="dl-link" data-k="${esc(peserta.kunci)}">${esc(t.nama)}</button>` : esc(t.nama)} <small class="note">· ${esc(t.email)} · ${esc(String(t.dibuat).slice(0, 16))}</small></span><span class="db-chip ${l[1]}">${l[0]}</span></div>
        <strong>${esc(t.topik)}</strong>
        <p class="db-tq-isi">${esc(t.pertanyaan)}</p>
        ${t.status === "menunggu-bayar" ? `<p class="note">Ditetapkan berbayar: ${esc(t.paket)} · ${rp(t.harga)}. Masih bisa diubah sebelum klien membayar.${st.bayar.some((b) => b.orderId === t.orderId && b.status === "dicek") ? ' <b style="color:var(--orange)">Klien sudah mengirim bukti bayar: konfirmasi di bagian Pembayaran.</b>' : ""}</p>` : ""}
        ${["menunggu-keputusan", "menunggu-bayar"].includes(t.status) ? formPutus(t) : ""}
        ${["gratis", "lunas", "dijawab"].includes(t.status) ? `<div class="db-jawab" data-id="${esc(t.id)}"><textarea rows="5" class="db-jwb" placeholder="Tulis jawaban/rekomendasi untuk klien…">${esc(t.jawaban || "")}</textarea><button type="button" class="btn btn-primary pg-sm db-kirim">${t.status === "dijawab" ? "Perbarui jawaban" : "Kirim jawaban"}</button>${t.dijawab ? `<small class="note"> Dijawab ${esc(String(t.dijawab).slice(0, 16))}</small>` : ""}</div>` : ""}
        ${t.status === "ditolak" && t.catatan ? `<p class="note">Catatan: ${esc(t.catatan)}</p>` : ""}
      </div>`;
    }).join("") : `<p class="note">${st.filterTanya === "aksi" ? "Tidak ada permintaan yang perlu ditindaklanjuti." : "Belum ada permintaan konsultasi."}</p>`;
  }
  $("d-tanya").addEventListener("click", async (e) => {
    const k = e.target.closest("[data-k]");
    if (k) { bukaDetail(k.dataset.k); return; }
    const jb = e.target.closest(".db-jenis button");
    if (jb) {
      const box = jb.closest(".db-putus");
      box.querySelectorAll(".db-jenis button").forEach((x) => x.setAttribute("aria-pressed", x === jb));
      box.querySelector(".db-harga").hidden = jb.dataset.j !== "berbayar";
      return;
    }
    const sv = e.target.closest(".db-simpan");
    if (sv) {
      const box = sv.closest(".db-putus");
      const pilih = box.querySelector(".db-jenis [aria-pressed='true']");
      if (!pilih) { MK.toast("Pilih gratis, berbayar, atau tolak"); return; }
      const sel = box.querySelector(".db-paket");
      const data = { aksi: "kons-putus", token: st.token, id: box.dataset.id, jenis: pilih.dataset.j, catatan: box.querySelector(".db-cat").value.trim() };
      if (data.jenis === "berbayar") { data.paket = sel.value; data.namaPaket = box.querySelector(".db-nama").value.trim(); data.harga = Number(box.querySelector(".db-rp").value); if (!(data.harga >= 10000)) { MK.toast("Isi harga minimal Rp10.000"); return; } }
      if (data.jenis === "tolak" && !data.catatan) { MK.toast("Tulis alasan/saran untuk klien"); return; }
      sv.disabled = true; sv.textContent = "Menyimpan…";
      try {
        const j = await api(data);
        if (!j.ok) { MK.toast(j.pesan || "Gagal menyimpan"); return; }
        st.tanya = j.permintaan || st.tanya; renderTanya(); renderKpi();
        MK.toast("Keputusan tersimpan dan email terkirim ke klien");
      } catch (er) { MK.toast("Layanan tidak bisa dihubungi"); } finally { if (sv.isConnected) { sv.disabled = false; sv.textContent = "Simpan keputusan & kirim email"; } }
      return;
    }
    const kr = e.target.closest(".db-kirim");
    if (kr) {
      const box = kr.closest(".db-jawab"), jawaban = box.querySelector(".db-jwb").value.trim();
      if (jawaban.length < 10) { MK.toast("Tulis jawaban"); return; }
      kr.disabled = true;
      try {
        const j = await api({ aksi: "kons-jawab", token: st.token, id: box.dataset.id, jawaban });
        if (!j.ok) { MK.toast(j.pesan || "Gagal mengirim"); return; }
        st.tanya = j.permintaan || st.tanya; renderTanya(); renderKpi();
        MK.toast("Jawaban terkirim ke email klien");
      } catch (er) { MK.toast("Layanan tidak bisa dihubungi"); } finally { if (kr.isConnected) kr.disabled = false; }
    }
  });
  $("d-tanya").addEventListener("change", (e) => {
    const sel = e.target.closest(".db-paket"); if (!sel) return;
    const o = sel.selectedOptions[0], box = sel.closest(".db-putus");
    if (o && o.dataset.harga) { box.querySelector(".db-rp").value = o.dataset.harga; box.querySelector(".db-nama").value = o.dataset.nama; }
    else { box.querySelector(".db-rp").value = ""; box.querySelector(".db-rp").focus(); }
  });
});
