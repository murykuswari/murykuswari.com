/*
 * Bagian Program Gizi Olahraga Personal (gizi.html#program).
 * Masuk dengan OTP email lewat Google Apps Script (SITE.programEndpoint atau SITE.otpEndpoint),
 * menghitung program dengan PG (program-engine.js), lalu menyimpan asesmen + laporan ke Drive pemilik.
 * Bila layanan belum aktif, halaman tetap jalan dalam "mode lokal" (data hanya di perangkat ini).
 */
document.addEventListener("DOMContentLoaded", () => {
  const PG = window.PG, MK = window.MK, S = window.SITE || {};
  const $ = (id) => document.getElementById(id);
  const esc = (s) => MK.esc(String(s == null ? "" : s));
  const fx = (x, d = 0) => Number(x).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
  const f0 = (x) => fx(Math.round(x));
  const f1 = (x) => fx(x, 1);
  const ENDPOINT = S.programEndpoint || S.otpEndpoint || "";
  const SESI_KEY = "mk-program-sesi", LOKAL_KEY = "mk-program-lokal";
  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const st = { token: "", email: "", profil: null, riwayat: [], klien: [], aktif: null, foto: "", fotoKlien: {}, lokal: !ENDPOINT, jk: "L", H: null, input: null, tersimpan: false };

  /* ---------- Pilihan ---------- */
  const CABOR_OPT = PG.CABOR.map((c) => `<option value="${c.k}">${esc(c.n)}</option>`).join("");
  $("p-cabor").innerHTML = CABOR_OPT; $("kl-cabor").innerHTML = CABOR_OPT;
  $("p-cabor").value = "bulutangkis";
  $("a-tujuan").innerHTML = Object.entries(PG.TUJUAN).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  $("a-fase").innerHTML = Object.entries(PG.FASE).map(([k, v]) => `<option value="${k}">${esc(v.n)}</option>`).join("");
  $("a-tgl").value = today();

  /* ---------- Langkah ---------- */
  const PANEL = ["s-masuk", "s-profil", "s-klien", "s-asesmen", "s-hasil"];
  const praktisi = () => !!st.profil && st.profil.peran && st.profil.peran !== "atlet";
  const subjek = () => st.aktif || st.profil || {};
  function step(n) {
    PANEL.forEach((id, i) => { $(id).hidden = i !== n; });
    [...$("steps").children].forEach((li, i) => li.classList.toggle("on", i <= n));
    window.scrollTo({ top: Math.max(0, $("steps").getBoundingClientRect().top + window.scrollY - 100), behavior: "smooth" });
  }
  function msg(el, t, ok) { el.hidden = !t; el.textContent = t || ""; el.classList.toggle("ok", !!ok); }
  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.t = btn.textContent; btn.textContent = label; } else if (btn.dataset.t) btn.textContent = btn.dataset.t;
  }
  function modeLokal(alasan) {
    st.lokal = true;
    const b = $("lokal");
    b.hidden = false;
    b.innerHTML = `<strong>Mode lokal.</strong> ${esc(alasan)} Program tetap bisa dihitung; data disimpan di perangkat ini saja dan laporan bisa dicetak. Untuk konsultasi langsung, kirim laporan ke <a href="mailto:${esc(S.email)}">${esc(S.email)}</a>.`;
  }
  if (!ENDPOINT) modeLokal("Layanan penyimpanan online belum dipasang.");

  /* ---------- API ---------- */
  async function api(payload) {
    const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), redirect: "follow" });
    if (!r.ok) throw new Error("http");
    const j = await r.json();
    if (j && j.pesan === "Permintaan tidak dikenali.") { const e = new Error("belum-aktif"); e.belumAktif = true; throw e; }
    return j;
  }
  const lokalDb = {
    baca() { try { return JSON.parse(localStorage.getItem(LOKAL_KEY) || "{}"); } catch (e) { return {}; } },
    tulis(d) { try { localStorage.setItem(LOKAL_KEY, JSON.stringify(d)); } catch (e) { /* penyimpanan diblokir */ } },
    akun(email) { const d = this.baca(); return d[email] || { profil: null, riwayat: [] }; },
    simpanAkun(email, a) { const d = this.baca(); d[email] = a; this.tulis(d); }
  };

  /* ---------- 1. Masuk ---------- */
  const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e);
  let jedaSampai = 0;
  async function kirimKode() {
    const email = $("m-email").value.trim().toLowerCase();
    if (!emailValid(email)) { MK.toast("Format email belum benar"); $("m-email").focus(); return; }
    st.email = email;
    if (st.lokal) return masukLokal();
    if (Date.now() < jedaSampai) { MK.toast("Tunggu sebentar sebelum meminta kode baru"); return; }
    const b = $("b-kirim");
    busy(b, true, "Mengirim…");
    try {
      const j = await api({ aksi: "kons-kirim", email, website: $("m-hp").value });
      if (!j.ok) { MK.toast(j.pesan || "Gagal mengirim kode"); return; }
      jedaSampai = Date.now() + (j.jeda || 60) * 1000;
      $("m-to").textContent = email;
      $("f-email").hidden = true; $("f-otp").hidden = false; $("m-otp").focus();
    } catch (e) {
      if (e.belumAktif) { modeLokal("Layanan konsultasi online sedang disiapkan."); return masukLokal(); }
      MK.toast("Layanan tidak bisa dihubungi. Coba lagi.");
    } finally { busy(b, false); }
  }
  $("f-email").addEventListener("submit", (e) => { e.preventDefault(); kirimKode(); });
  $("m-ulang").addEventListener("click", kirimKode);
  $("m-ganti").addEventListener("click", () => { $("f-otp").hidden = true; $("f-email").hidden = false; });
  $("f-otp").addEventListener("submit", async (e) => {
    e.preventDefault();
    const otp = $("m-otp").value.trim();
    if (!/^\d{6}$/.test(otp)) { MK.toast("Masukkan 6 digit kode"); return; }
    const b = $("b-masuk");
    busy(b, true, "Memeriksa…");
    try {
      const j = await api({ aksi: "kons-masuk", email: st.email, otp });
      if (!j.ok) { MK.toast(j.pesan || "Kode salah"); return; }
      st.token = j.token;
      try { sessionStorage.setItem(SESI_KEY, JSON.stringify({ token: j.token, email: st.email, sampai: Date.now() + (j.jam || 6) * 3600e3 })); } catch (er) { /* abaikan */ }
      st.foto = j.foto || ""; st.admin = !!j.admin;
      setelahMasuk(j.profil, j.riwayat || [], j.klienPraktisi);
    } catch (er) { MK.toast("Layanan tidak bisa dihubungi. Coba lagi."); } finally { busy(b, false); }
  });
  function masukLokal() {
    const a = lokalDb.akun(st.email);
    st.foto = a.foto || ""; (a.klien || []).forEach((k) => { if (k.foto) st.fotoKlien[k.id] = k.foto; });
    setelahMasuk(a.profil, a.riwayat || [], a.klien || []);
  }
  function setelahMasuk(profil, riwayat, klien) {
    st.profil = profil; st.riwayat = riwayat; st.klien = klien || []; st.riwayatSendiri = riwayat;
    $("u-status").innerHTML = `Masuk sebagai <strong>${esc(st.email)}</strong>${st.lokal ? " (mode lokal)" : ""}.${st.admin ? ' <a href="dashboard.html">Buka dashboard pengelola →</a>' : ""}`;
    $("u-keluar").hidden = false;
    renderRiwayat();
    if (profil) { isiProfil(profil); lanjutSetelahProfil(); }
    else step(1);
  }
  $("u-keluar").addEventListener("click", () => {
    try { sessionStorage.removeItem(SESI_KEY); } catch (e) { /* abaikan */ }
    location.reload();
  });
  // Lanjutkan sesi yang masih berlaku.
  (async () => {
    if (st.lokal) return;
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(SESI_KEY) || "null"); } catch (e) { /* abaikan */ }
    if (!s || s.sampai < Date.now()) return;
    st.token = s.token; st.email = s.email;
    try {
      const j = await api({ aksi: "kons-riwayat", token: s.token });
      if (j.ok) { st.foto = j.foto || ""; st.admin = !!j.admin; setelahMasuk(j.profil, j.riwayat || [], j.klienPraktisi); }
    } catch (e) { /* tetap di langkah masuk */ }
  })();

  /* ---------- 2. Profil ---------- */
  $("p-jk").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    st.jk = b.dataset.v;
    $("p-jk").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    renderSkinfold();
    document.querySelectorAll("[data-only-p]").forEach((el) => { el.closest("label").hidden = st.jk !== "P"; });
  });
  $("p-lahir").addEventListener("input", () => {
    const u = PG.usiaDari($("p-lahir").value);
    $("p-usia").textContent = u != null && u >= 0 ? `Usia ${u} tahun` : "";
  });
  function isiProfil(p) {
    $("p-nama").value = p.nama || "";
    st.jk = p.jk === "P" ? "P" : "L";
    $("p-jk").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.v === st.jk));
    $("p-lahir").value = p.tglLahir || ""; $("p-lahir").dispatchEvent(new Event("input"));
    $("p-wa").value = p.wa ? "0" + String(p.wa).replace(/^62/, "") : "";
    $("p-asal").value = p.asal || "";
    if (PG.CABOR_MAP[p.cabor]) $("p-cabor").value = p.cabor;
    $("p-level").value = p.level || $("p-level").value;
    $("p-cabor-lain").value = p.caborLain || "";
    $("p-peran").value = p.peran || "atlet"; $("p-profesi").value = p.profesi || ""; aturPeran();
    document.querySelectorAll("[data-only-p]").forEach((el) => { el.closest("label").hidden = st.jk !== "P"; });
    renderSkinfold();
  }
  const normWa = (v) => { let d = String(v).replace(/[^\d]/g, ""); if (d.startsWith("0")) d = "62" + d.slice(1); else if (d.startsWith("8")) d = "62" + d; return d; };
  $("s-profil").addEventListener("submit", async (e) => {
    e.preventDefault();
    const p = { nama: $("p-nama").value.trim(), jk: st.jk, tglLahir: $("p-lahir").value, wa: normWa($("p-wa").value), asal: $("p-asal").value.trim(), cabor: $("p-cabor").value, level: $("p-level").value, caborLain: $("p-cabor-lain").value.trim(), peran: $("p-peran").value, profesi: $("p-profesi").value.trim() };
    const usia = PG.usiaDari(p.tglLahir);
    const prak = p.peran !== "atlet";
    const err = p.nama.length < 3 ? "Isi nama lengkap." : prak && p.profesi.length < 3 ? "Isi profesi dan lisensi/instansi." : (!prak || p.tglLahir) && (!p.tglLahir || usia == null || usia < 8 || usia > 90) ? "Isi tanggal lahir yang benar." : !/^\d{9,16}$/.test(p.wa) ? "Nomor WhatsApp belum benar." : p.asal.length < 3 ? "Isi asal (kota dan instansi/klub)." : "";
    $("p-err").textContent = err;
    if (err) return;
    const b = $("b-profil");
    busy(b, true, "Menyimpan…");
    try {
      if (st.lokal) {
        const a = lokalDb.akun(st.email); a.profil = { ...p, email: st.email }; lokalDb.simpanAkun(st.email, a); st.profil = a.profil;
      } else {
        const j = await api({ aksi: "kons-profil", token: st.token, profil: p });
        if (!j.ok) { $("p-err").textContent = j.pesan || "Gagal menyimpan."; if (j.ulang) sesiHabis(); return; }
        st.profil = j.profil;
      }
      lanjutSetelahProfil();
    } catch (er) { $("p-err").textContent = "Layanan tidak bisa dihubungi. Coba lagi."; } finally { busy(b, false); }
  });
  function aturPeran() {
    const prak = $("p-peran").value !== "atlet";
    $("p-profesi-wrap").hidden = !prak;
    $("p-lahir-req").hidden = prak;
    $("p-cabor-lbl").textContent = prak ? "Cabang olahraga utama yang ditangani" : "Cabang olahraga";
  }
  $("p-peran").addEventListener("change", aturPeran);
  function lanjutSetelahProfil() {
    $("step-klien").hidden = !praktisi();
    $("a-catatan-wrap").hidden = !praktisi();
    $("a-desk-lbl").textContent = praktisi() ? "Tujuan program untuk klien" : "Tujuan konsultasi";
    if (praktisi()) { st.aktif = null; renderKlien(); renderRiwayat(); step(2); }
    else { st.aktif = null; st.riwayat = st.riwayatSendiri || st.riwayat; isiAsesmenDariRiwayat(); step(3); }
  }
  function sesiHabis() { MK.toast("Sesi berakhir, silakan masuk lagi"); $("f-otp").hidden = true; $("f-email").hidden = false; step(0); }

  /* ---------- Klien milik pelatih / ahli gizi ---------- */
  function terakhir(k) { const r = (k.riwayat || [])[k.riwayat.length - 1]; return r ? { tgl: (r.input || {}).tanggal || String(r.waktu).slice(0, 10), bb: (r.input || {}).bb, pct: (r.ringkas || {}).pct, kkal: (r.ringkas || {}).energi } : null; }
  function renderKlien() {
    const L = st.klien;
    $("kl-daftar").innerHTML = L.length ? tbl(["Klien", "Cabang", "#Usia", "Terakhir", "#BB", "#Lemak", "#Asesmen", ""], L.map((k, i) => {
      const t = terakhir(k), c = PG.CABOR_MAP[k.cabor];
      return [`<span class="pg-av-row">${avatarHtml(st.fotoKlien[k.id], k.nama, "pg-av-sm")}<span><strong>${esc(k.nama)}</strong>${k.caborLain ? `<br><span class="note">${esc(k.caborLain)}</span>` : ""}</span></span>`, esc(c ? c.n : k.cabor), PG.usiaDari(k.tglLahir) ?? "–", t ? esc(t.tgl) : "–", t && t.bb ? f1(t.bb) : "–", t && t.pct != null ? f1(t.pct) + "%" : "–", (k.riwayat || []).length,
        `<button type="button" class="btn btn-primary pg-sm" data-pilih="${i}">Asesmen</button> <button type="button" class="dl-link" data-ubah="${i}">Ubah</button>`];
    })) : '<p class="note">Belum ada klien. Tambahkan klien pertama Anda di bawah.</p>';
    $("kl-form-wrap").open = !L.length;
    muatFotoKlien();
  }
  $("kl-daftar").addEventListener("click", (e) => {
    const a = e.target.closest("[data-pilih]"), u = e.target.closest("[data-ubah]");
    if (a) pilihKlien(st.klien[Number(a.dataset.pilih)]);
    if (u) {
      const k = st.klien[Number(u.dataset.ubah)];
      $("kl-id").value = k.id; $("kl-nama").value = k.nama; $("kl-jk").value = k.jk; $("kl-lahir").value = k.tglLahir;
      if (PG.CABOR_MAP[k.cabor]) $("kl-cabor").value = k.cabor;
      $("kl-kelas").value = k.caborLain || ""; $("kl-level").value = k.level || $("kl-level").value; $("kl-email").value = k.email || ""; $("kl-wa").value = k.wa ? "0" + String(k.wa).replace(/^62/, "") : ""; $("kl-catatan").value = k.catatan || "";
      $("kl-setuju").checked = true; $("kl-form-judul").textContent = "Ubah data " + k.nama; $("kl-form-wrap").open = true; $("kl-nama").focus();
    }
  });
  function pilihKlien(k) {
    st.aktif = k; st.riwayat = k.riwayat || [];
    renderRiwayat();
    isiAsesmenDariRiwayat();
    step(3);
  }
  $("kl-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const k = { id: $("kl-id").value, nama: $("kl-nama").value.trim(), jk: $("kl-jk").value, tglLahir: $("kl-lahir").value, cabor: $("kl-cabor").value, caborLain: $("kl-kelas").value.trim(), level: $("kl-level").value, email: $("kl-email").value.trim().toLowerCase(), wa: $("kl-wa").value ? normWa($("kl-wa").value) : "", catatan: $("kl-catatan").value.trim() };
    const u = PG.usiaDari(k.tglLahir);
    const err = k.nama.length < 2 ? "Isi nama klien." : !k.tglLahir || u == null || u < 6 || u > 90 ? "Isi tanggal lahir klien yang benar." : k.email && !emailValid(k.email) ? "Email klien belum benar." : !$("kl-setuju").checked ? "Centang persetujuan klien." : "";
    $("kl-err").textContent = err;
    if (err) return;
    const b = $("b-klien");
    busy(b, true, "Menyimpan…");
    try {
      if (st.lokal) {
        const a = lokalDb.akun(st.email); a.klien = a.klien || [];
        const ada = a.klien.find((x) => x.id === k.id);
        if (ada) Object.assign(ada, k); else a.klien.push({ ...k, id: "K" + Date.now(), riwayat: [] });
        lokalDb.simpanAkun(st.email, a); st.klien = a.klien;
      } else {
        const j = await api({ aksi: "kons-klien", token: st.token, klien: k });
        if (!j.ok) { $("kl-err").textContent = j.pesan || "Gagal menyimpan."; if (j.ulang) sesiHabis(); return; }
        st.klien = j.klienPraktisi || st.klien;
      }
      $("kl-form").reset(); $("kl-id").value = ""; $("kl-form-judul").textContent = "+ Tambah klien";
      renderKlien();
      renderRiwayat();
      MK.toast("Klien tersimpan");
    } catch (er) { $("kl-err").textContent = "Layanan tidak bisa dihubungi. Coba lagi."; } finally { busy(b, false); }
  });

  /* ---------- 3. Asesmen ---------- */
  const SK_LABEL = { dada: "Dada", perut: "Perut", paha: "Paha", trisep: "Trisep", suprailiaka: "Suprailiaka", midaksila: "Midaksila", subskapula: "Subskapula", bisep: "Bisep" };
  function titikSkinfold() {
    const m = $("a-metode").value;
    if (m === "jp3") return st.jk === "L" ? ["dada", "perut", "paha"] : ["trisep", "suprailiaka", "paha"];
    if (m === "jp7") return ["dada", "midaksila", "trisep", "subskapula", "perut", "suprailiaka", "paha"];
    if (m === "dw") return ["bisep", "trisep", "subskapula", "suprailiaka"];
    return [];
  }
  function renderSkinfold(nilai) {
    const lama = nilai || bacaSkinfold();
    const t = titikSkinfold();
    $("a-sk").innerHTML = t.length ? `<div class="pg-skgrid">${t.map((k) => `<div class="field"><label for="sk-${k}">${SK_LABEL[k]} (mm)</label><input id="sk-${k}" data-sk="${k}" type="number" inputmode="decimal" step="0.5" min="2" max="80" value="${lama[k] != null ? esc(lama[k]) : ""}"></div>`).join("")}</div>` : "";
    document.querySelectorAll("[data-m]").forEach((el) => { el.hidden = el.dataset.m !== $("a-metode").value; });
  }
  function bacaSkinfold() { const o = {}; document.querySelectorAll("[data-sk]").forEach((el) => { if (el.value) o[el.dataset.sk] = Number(el.value); }); return o; }
  $("a-metode").addEventListener("change", () => renderSkinfold());

  const LAJU = {
    hipertrofi: [["0.25", "+0,25% BB/minggu (atlet terlatih)"], ["0.5", "+0,5% BB/minggu (pemula)"]],
    turun_lemak: [["0.5", "−0,5% BB/minggu (paling aman)"], ["0.7", "−0,7% BB/minggu (dianjurkan)"], ["1", "−1,0% BB/minggu (batas atas)"]],
    kelas_berat: [["0.5", "−0,5% BB/minggu"], ["0.7", "−0,7% BB/minggu"], ["1", "−1,0% BB/minggu"]]
  };
  function aturTujuan() {
    const t = $("a-tujuan").value;
    document.querySelectorAll("[data-t]").forEach((el) => { el.hidden = !el.dataset.t.split(" ").includes(t); });
    const opt = LAJU[t];
    if (opt) { const v = $("a-laju").value; $("a-laju").innerHTML = opt.map(([k, n]) => `<option value="${k}">${n}</option>`).join(""); if (opt.some((o) => o[0] === v)) $("a-laju").value = v; else $("a-laju").value = opt[Math.min(1, opt.length - 1)][0]; }
  }
  $("a-tujuan").addEventListener("change", aturTujuan);

  // Jadwal: 7 hari, tiap hari boleh beberapa sesi.
  let jadwal = [];
  const JENIS_OPT = Object.entries(PG.JENIS).map(([k, v]) => `<option value="${k}">${esc(v.n)}</option>`).join("");
  function renderJadwal() {
    $("a-jadwal").innerHTML = PG.HARI.map((h, i) => {
      const rows = jadwal.map((s, idx) => ({ s, idx })).filter((x) => x.s.hari === i);
      return `<div class="pg-day"><div class="pg-day-h"><strong>${h}</strong><button type="button" class="dl-link" data-add="${i}">+ sesi</button></div>
        ${rows.length ? rows.map(({ s, idx }) => `<div class="pg-sesi" data-idx="${idx}">
          <select data-f="jenis" aria-label="Jenis latihan ${h}">${JENIS_OPT}</select>
          <label class="pg-mini">Menit<input data-f="durasi" type="number" inputmode="numeric" min="0" max="600" step="5" value="${esc(s.durasi)}"></label>
          <label class="pg-mini">RPE<input data-f="rpe" type="number" inputmode="numeric" min="0" max="10" step="1" value="${esc(s.rpe)}"></label>
          <button type="button" class="pg-x" data-del="${idx}" aria-label="Hapus sesi">×</button></div>`).join("") : '<p class="note pg-libur">Istirahat</p>'}</div>`;
    }).join("");
    $("a-jadwal").querySelectorAll(".pg-sesi").forEach((row) => { row.querySelector('[data-f="jenis"]').value = jadwal[row.dataset.idx].jenis; });
  }
  $("a-jadwal").addEventListener("click", (e) => {
    const a = e.target.closest("[data-add]"), d = e.target.closest("[data-del]");
    if (a) { jadwal.push({ hari: Number(a.dataset.add), jenis: "teknik", durasi: 60, rpe: 5 }); renderJadwal(); }
    if (d) { jadwal.splice(Number(d.dataset.del), 1); renderJadwal(); }
  });
  $("a-jadwal").addEventListener("input", (e) => {
    const row = e.target.closest(".pg-sesi"); if (!row) return;
    const s = jadwal[row.dataset.idx], f = e.target.dataset.f;
    s[f] = f === "jenis" ? e.target.value : Number(e.target.value);
  });
  const TEMPLATE = {
    intermiten: [[0, "kekuatan", 60, 7], [0, "teknik", 90, 5], [1, "hiit", 60, 8], [1, "teknik", 90, 5], [2, "lit", 45, 4], [2, "teknik", 60, 5], [3, "kekuatan", 60, 7], [3, "interval", 75, 7], [4, "conditioning", 120, 7], [5, "pertandingan", 90, 8], [5, "circuit", 30, 6]],
    endurance: [[0, "lit", 60, 4], [1, "interval", 75, 8], [2, "lit", 60, 4], [2, "kekuatan", 45, 6], [3, "interval", 60, 7], [4, "recovery", 30, 2], [5, "endurance", 150, 6], [6, "lit", 60, 3]],
    power: [[0, "kekuatan", 90, 8], [1, "plyo", 45, 7], [1, "teknik", 60, 5], [3, "kekuatan", 90, 8], [4, "plyo", 45, 7], [5, "hipertrofi", 60, 7]],
    physique: [[0, "hipertrofi", 75, 8], [1, "hipertrofi", 75, 8], [2, "lit", 40, 4], [3, "hipertrofi", 75, 8], [4, "hipertrofi", 75, 8], [5, "lit", 40, 4]],
    tarung: [[0, "kekuatan", 60, 7], [0, "teknik", 90, 6], [1, "conditioning", 90, 8], [2, "lit", 45, 4], [2, "teknik", 60, 5], [3, "hiit", 45, 8], [3, "teknik", 90, 6], [4, "conditioning", 90, 8], [5, "circuit", 45, 7]],
    presisi: [[0, "teknik", 120, 4], [1, "kekuatan", 45, 5], [2, "teknik", 120, 4], [3, "lit", 40, 4], [4, "teknik", 120, 4], [5, "pertandingan", 180, 5]],
    kebugaran: [[0, "hipertrofi", 60, 7], [2, "circuit", 45, 7], [4, "lit", 45, 5], [5, "hipertrofi", 60, 7]]
  };
  $("a-template").addEventListener("click", () => {
    const g = (PG.CABOR_MAP[subjek().cabor] || PG.CABOR_MAP.kebugaran).grup;
    jadwal = TEMPLATE[g].map(([hari, jenis, durasi, rpe]) => ({ hari, jenis, durasi, rpe }));
    renderJadwal();
  });

  function isiAsesmenDariRiwayat() {
    const last = st.riwayat.length ? st.riwayat[st.riwayat.length - 1].input || {} : null;
    const g = (PG.CABOR_MAP[subjek().cabor] || PG.CABOR_MAP.kebugaran).grup;
    st.jk = subjek().jk === "P" ? "P" : "L";
    document.querySelectorAll("[data-only-p]").forEach((el) => { el.closest("label").hidden = st.jk !== "P"; });
    const u = $("a-untuk");
    u.hidden = !st.aktif;
    if (st.aktif) u.innerHTML = `Asesmen untuk <strong>${esc(st.aktif.nama)}</strong> (${esc((PG.CABOR_MAP[st.aktif.cabor] || {}).n || st.aktif.cabor)}, ${PG.usiaDari(st.aktif.tglLahir)} tahun). <button type="button" class="dl-link" id="a-ganti">Ganti klien</button>`;
    $("a-desk").value = ""; $("a-catatan").value = ""; $("a-count").textContent = "0";
    if (last) {
      $("a-prefill").textContent = `Diisi otomatis dari konsultasi terakhir (${last.tanggal || "-"}). Perbarui BB, komposisi tubuh, dan jadwal minggu ini.`;
      $("a-bb").value = last.bb || ""; $("a-tb").value = last.tb || "";
      $("a-metode").value = last.metodeKomposisi || "jp3";
      $("a-pct").value = last.persenLemak || ""; $("a-alat").value = last.alatLemak || "";
      $("a-tujuan").value = last.tujuan || "performa"; aturTujuan();
      if (last.lajuTarget) $("a-laju").value = String(last.lajuTarget);
      $("a-target").value = last.targetLemak || ""; $("a-fase").value = last.fase || "umum";
      $("a-kelas").value = last.kelasBerat || ""; $("a-jeda").value = String(last.jedaTimbang || 24); $("a-timbang").value = last.tglTimbang || "";
      $("a-lomba").value = last.tglKompetisi || ""; $("a-non").value = String(last.aktivitasNon || 1.4);
      jadwal = (last.jadwal || []).map((s) => ({ ...s }));
      renderSkinfold(last.skinfold || {});
    } else {
      jadwal = TEMPLATE[g].map(([hari, jenis, durasi, rpe]) => ({ hari, jenis, durasi, rpe }));
      if (g === "tarung") { $("a-tujuan").value = "kelas_berat"; }
      aturTujuan(); renderSkinfold();
    }
    $("a-tgl").value = today();
    renderJadwal();
  }
  $("a-desk").addEventListener("input", () => { $("a-count").textContent = $("a-desk").value.trim().length; });

  function bacaInput() {
    const p = subjek();
    return {
      tanggal: $("a-tgl").value || today(), jk: p.jk || st.jk, tglLahir: p.tglLahir, usia: PG.usiaDari(p.tglLahir, $("a-tgl").value),
      cabor: p.cabor, bb: Number($("a-bb").value), tb: Number($("a-tb").value), metodeKomposisi: $("a-metode").value, skinfold: bacaSkinfold(),
      persenLemak: $("a-pct").value ? Number($("a-pct").value) : null, alatLemak: $("a-alat").value.trim(),
      tujuan: $("a-tujuan").value, lajuTarget: $("a-laju").value ? Number($("a-laju").value) : null, targetLemak: $("a-target").value ? Number($("a-target").value) : null,
      kelasBerat: $("a-kelas").value ? Number($("a-kelas").value) : null, jedaTimbang: Number($("a-jeda").value), tglTimbang: $("a-timbang").value,
      fase: $("a-fase").value, tglKompetisi: $("a-lomba").value, aktivitasNon: Number($("a-non").value),
      jadwal: jadwal.filter((s) => s.durasi > 0).map((s) => ({ hari: s.hari, jenis: s.jenis, durasi: Number(s.durasi) || 0, rpe: Number(s.rpe) || 0 })),
      keringat: { pre: num("k-pre"), post: num("k-post"), minum: num("k-minum"), urin: num("k-urin"), durasi: num("k-dur") },
      reds: [...$("a-reds").querySelectorAll("input:checked")].filter((x) => !x.closest("label").hidden).map((x) => x.value),
      tujuanKonsultasi: $("a-desk").value.trim(),
      catatanPraktisi: praktisi() ? $("a-catatan").value.trim() : "",
      klienId: st.aktif ? st.aktif.id : ""
    };
  }
  function num(id) { const v = parseFloat($(id).value); return isFinite(v) ? v : null; }

  $("s-asesmen").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = bacaInput();
    const err = !(inp.bb >= 20 && inp.bb <= 250) ? "Isi berat badan (20–250 kg)." : !(inp.tb >= 100 && inp.tb <= 230) ? "Isi tinggi badan (100–230 cm)." :
      inp.tujuan === "kelas_berat" && !inp.kelasBerat ? "Isi batas kelas tanding." :
      inp.tujuanKonsultasi.length < 30 ? "Tuliskan tujuan konsultasi minimal 30 karakter." : !$("a-setuju").checked ? "Centang persetujuan penyimpanan data." : "";
    $("a-err").textContent = err;
    if (err) return;
    try {
      st.H = PG.hitung(inp); st.input = inp; st.tersimpan = false;
    } catch (er) { $("a-err").textContent = "Data belum lengkap: " + er.message; return; }
    renderHasil();
    msg($("h-msg"), "");
    $("b-simpan").disabled = false;
    $("b-simpan").textContent = st.lokal ? "Simpan di perangkat ini" : "Simpan & kirim ke email";
    step(4);
  });
  $("b-ubah").addEventListener("click", () => step(3));
  document.addEventListener("click", (e) => { if (e.target.id === "a-ganti") { st.aktif = null; renderKlien(); step(2); } });
  $("b-cetak").addEventListener("click", () => {
    document.body.classList.add("cetak-program");
    window.print();
    setTimeout(() => document.body.classList.remove("cetak-program"), 500);
  });

  /* ---------- 4. Hasil ---------- */
  const tbl = (head, rows, foot) => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th${h[0] === "#" ? ' class="n"' : ""}>${h.replace(/^#/, "")}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${head[i] && head[i][0] === "#" ? ' class="n"' : ""}>${c}</td>`).join("")}</tr>`).join("")}</tbody>${foot ? `<tfoot><tr>${foot.map((c, i) => `<td${head[i] && head[i][0] === "#" ? ' class="n"' : ""}>${c}</td>`).join("")}</tr></tfoot>` : ""}</table></div>`;
  function riwayatSeri() {
    const seri = st.riwayat.map((r) => ({ tanggal: (r.input || {}).tanggal || String(r.waktu).slice(0, 10), bb: Number((r.input || {}).bb), pct: (r.ringkas || {}).pct != null ? Number(r.ringkas.pct) : null, ffm: (r.ringkas || {}).ffm != null ? Number(r.ringkas.ffm) : null }));
    return seri;
  }
  function renderHasil() {
    const H = st.H, inp = st.input, p = subjek();
    const seri = riwayatSeri().concat(st.tersimpan ? [] : [{ tanggal: inp.tanggal, bb: inp.bb, pct: H.kom.estimasi ? null : H.kom.pct, ffm: H.kom.estimasi ? null : H.kom.ffm }]);
    const prog = PG.progres(seri.filter((s) => s.bb));
    const bahas = PG.pembahasan(H, prog);
    st.bahas = bahas;
    const k = H.kom;
    const minC = Math.min(...H.hari.map((d) => d.cgkg)), maxC = Math.max(...H.hari.map((d) => d.cgkg));

    const jenisDipakai = [...new Set(H.hari.flatMap((d) => d.sesi.map((s) => s.jenis)))];
    const timingRows = jenisDipakai.map((j) => {
      const J = PG.JENIS[j];
      const durMax = Math.max(...H.hari.flatMap((d) => d.sesi.filter((s) => s.jenis === j).map((s) => s.dur)));
      const saatKH = durMax < 45 ? "tidak perlu" : durMax < 75 ? "kumur KH / sedikit" : durMax <= 150 ? `${f0(30 * durMax / 60)}–${f0(60 * durMax / 60)} g total (30–60 g/jam)` : `hingga ${f0(90 * durMax / 60)} g total (≤ 90 g/jam)`;
      return [esc(J.n), `${esc(J.pre)}${J.pre_g ? `<br><strong>≈ ${f0(J.pre_g * H.bb)} g KH</strong>` : ""}`, `${esc(J.saat)}${J.khSaat ? `<br><span class="note">Sesi terpanjang ${f0(durMax)} menit: ${saatKH}</span>` : ""}`, `${esc(J.pasca)}${J.post_c || J.post_p ? `<br><strong>≈ ${f0(J.post_c * H.bb)} g KH + ${f0(J.post_p * H.bb)} g protein</strong>` : ""}`];
    });

    const hid = H.hidrasi;
    const html = `
      <div class="pg-head">
        <div><span class="eyebrow">Program gizi personal</span><h2>${esc(p.nama || "")}</h2>${st.aktif ? `<p class="note" style="margin:0">Disusun oleh ${esc(st.profil.nama)}${st.profil.profesi ? " · " + esc(st.profil.profesi) : ""}</p>` : ""}
        <p class="note">${esc(H.cabor.n)}${p.caborLain ? " · " + esc(p.caborLain) : ""} · ${H.usia} tahun · ${H.jk === "L" ? "laki-laki" : "perempuan"} · ${esc(PG.TUJUAN[H.tujuan])} · fase ${esc(H.fase.n.toLowerCase())} · ${esc(inp.tanggal)}</p></div>
      </div>
      ${H.peringatan.map((t) => `<div class="callout warn">${esc(t)}</div>`).join("")}
      <div class="mini-grid">
        <div class="mini"><b>${f0(H.rata.E)}</b><span>kkal/hari rata-rata (${f0(H.hariRingan.E)}–${f0(H.hariBerat.E)})</span></div>
        <div class="mini"><b>${f1(minC)}–${f1(maxC)}</b><span>g KH/kg BB per hari, mengikuti beban</span></div>
        <div class="mini"><b>${f0(H.rata.P)} g</b><span>protein/hari (${f1(H.pro.gkg)} g/kg)</span></div>
        <div class="mini"><b>${f0(H.rata.F)} g</b><span>lemak/hari rata-rata</span></div>
        <div class="mini"><b>${f1(k.pct)}%</b><span>lemak tubuh · FFM ${f1(k.ffm)} kg${k.estimasi ? " (estimasi)" : ""}</span></div>
        <div class="mini"><b>${f1(H.rata.ea)}</b><span>EA kkal/kg FFM/hari</span></div>
      </div>

      <h3>Program per hari latihan</h3>
      ${tbl(["Hari", "Sesi (menit·RPE)", "#Beban (AU)", "Kategori", "#Energi (kkal)", "#KH g (g/kg)", "#Protein g", "#Lemak g (%E)", "#EA"],
        H.hari.map((d) => [d.nama, d.sesi.length ? d.sesi.map((s) => `${esc(s.singkat)} ${f0(s.dur)}′·${s.rpe}`).join("<br>") : '<span class="note">Istirahat</span>', f0(d.au), d.kat.n, f0(d.E), `${f0(d.C)} (${f1(d.cgkg)})`, f0(d.P), `${f0(d.F)} (${f0(d.fatPct * 100)}%)`, f1(d.ea)]),
        ["Rata-rata", "", f0(H.rata.au), "", f0(H.rata.E), f0(H.rata.C), f0(H.rata.P), f0(H.rata.F), f1(H.rata.ea)])}
      <p class="note">Energi = REE × ${f1(H.faktorNon)} + energi latihan neto ((MET − 1) × BB × jam). KH ditetapkan dari beban harian dan kelompok cabang, protein dari tujuan, lemak sebagai sisa energi (${f0(H.lemakMin * 100)}–35%). ${H.eerKemenkes ? `Pembanding rumus Kemenkes 2021: ${f0(H.eerKemenkes)} kkal/hari (PAL ≈ ${f1(H.palKasar)}).` : ""}</p>

      <h3>Makan sebelum, saat, dan setelah latihan</h3>
      ${timingRows.length ? tbl(["Jenis sesi", "Sebelum (1–4 jam)", "Saat", "Sesudah"], timingRows) : '<p class="note">Belum ada sesi latihan di jadwal.</p>'}
      <p class="note">Protein dibagi 4 waktu makan × ${f0(0.3 * H.bb)}–${f0(0.4 * H.bb)} g. Bila jarak ke sesi berikutnya &lt; 8 jam: KH ${f0(1 * H.bb)}–${f0(1.2 * H.bb)} g/jam selama 4 jam pertama (Burke et al., 2011).</p>

      ${H.target ? `<h3>Target berat badan</h3><dl class="kv"><dt>Target</dt><dd>${f1(H.target.bb)} kg</dd><dt>Dasar</dt><dd>${esc(H.target.alasan)}</dd><dt>Selisih dari sekarang</dt><dd>${H.target.delta > 0 ? "−" : "+"}${f1(Math.abs(H.target.delta))} kg</dd>${H.target.minggu ? `<dt>Perkiraan waktu</dt><dd>±${H.target.minggu} minggu</dd>` : ""}</dl>` : ""}

      <h3>Hidrasi</h3>
      ${hid ? `<dl class="kv"><dt>Laju keringat</dt><dd>${fx(hid.sr, 2)} L/jam</dd><dt>Perubahan BB saat tes</dt><dd>${hid.pct >= 0 ? "−" : "+"}${f1(Math.abs(hid.pct))}%</dd><dt>Minum saat latihan</dt><dd>${f0(Math.round(hid.tgt * 250 / 10) * 10)} mL / 15 menit (${f0(Math.round(hid.tgt * 1000 / 50) * 50)} mL/jam)</dd><dt>Rehidrasi setelah tes</dt><dd>${f0(hid.rehid[0] * 1000)}–${f0(hid.rehid[1] * 1000)} mL</dd></dl>` : `<p class="note">Lakukan tes laju keringat agar anjuran minum dihitung dari keringat Anda. Sementara: ${f0(5 * H.bb)}–${f0(7 * H.bb)} mL 4 jam sebelum latihan; 125–150% BB yang hilang setelahnya; natrium 460–690 mg/L untuk sesi panjang.</p>`}

      ${H.suplemen.length ? `<h3>Suplemen berbasis bukti (bila diperlukan)</h3>${tbl(["Suplemen", "Dosis untuk Anda", "Waktu", "Rujukan"], H.suplemen.map((s) => [esc(s.n), esc(s.dosis), esc(s.waktu), esc(s.ref)]))}<p class="note">Pilih produk bersertifikat uji pihak ketiga (antidoping). Uji coba saat latihan, bukan saat lomba.</p>` : ""}
      ${H.lomba ? `<h3>Kompetisi (${H.lomba.hariKe} hari lagi)</h3><p>Makan 1–4 jam sebelum tanding: ${f0(H.lomba.pre[0])}–${f0(H.lomba.pre[1])} g KH, rendah serat dan lemak.${H.lomba.loading ? ` Lomba &gt; 90 menit: carbo loading ${f0(H.lomba.loading[0])}–${f0(H.lomba.loading[1])} g KH/hari (10–12 g/kg) selama 36–48 jam sebelum start.` : ""}</p>` : ""}

      ${inp.catatanPraktisi ? `<h3>Catatan dari ${esc(st.profil.nama)}</h3><p>${esc(inp.catatanPraktisi)}</p>` : ""}
      <h3>Pembahasan</h3>
      ${bahas.map((b) => `<div class="pg-bahas"><h4>${esc(b.judul)}</h4><p>${esc(b.isi)}</p></div>`).join("")}

      <details class="steps"><summary>Detail perhitungan komposisi tubuh &amp; REE</summary><div>
        <p><strong>Metode:</strong> ${esc(k.metode)}</p>
        ${k.langkah.length ? `<ol>${k.langkah.map((l) => `<li>${l}</li>`).join("")}</ol>` : ""}
        <dl class="kv"><dt>IMT</dt><dd>${f1(k.imt)} kg/m²</dd><dt>Massa lemak · FFM</dt><dd>${f1(k.fm)} · ${f1(k.ffm)} kg</dd><dt>FFMI (ternormalisasi)</dt><dd>${f1(k.ffmi)} (${f1(k.ffmiN)}) kg/m²</dd></dl>
        ${tbl(["Persamaan REE", "#kkal/hari", "Kapan dipakai"], H.ree.rows.map((r) => [`${r.pilih ? "<strong>" : ""}${esc(r.n)}${r.pilih ? " ✓</strong>" : ""}`, f0(r.v), esc(r.k)]))}
        <p class="note">${esc(H.ree.alasan)}</p>
      </div></details>
      <p class="disclaimer">Program ini adalah estimasi berbasis rumus dan literatur (Tinjauan Sistematik Perhitungan Gizi Olahraga; Kemenkes RI 2021; ACSM, ISSN, IOC), bukan diagnosis. Hitung ulang setiap 2–4 minggu.</p>`;
    $("hasil").innerHTML = html;
  }

  function laporanTeks() {
    const H = st.H;
    const L = [];
    L.push({ judul: "Ringkasan", baris: [`Energi rata-rata ${f0(H.rata.E)} kkal/hari (${f0(H.hariRingan.E)}–${f0(H.hariBerat.E)}). KH ${f1(Math.min(...H.hari.map((d) => d.cgkg)))}–${f1(Math.max(...H.hari.map((d) => d.cgkg)))} g/kg/hari. Protein ${f0(H.rata.P)} g/hari (${f1(H.pro.gkg)} g/kg). Lemak rata-rata ${f0(H.rata.F)} g/hari. EA ${f1(H.rata.ea)} kkal/kg FFM.`, `Komposisi: ${f1(H.kom.pct)}% lemak, FFM ${f1(H.kom.ffm)} kg (${H.kom.metode}).`] });
    if (st.aktif) L.unshift({ judul: "Klien", baris: [`${st.aktif.nama} · ${H.cabor.n}${st.aktif.caborLain ? " · " + st.aktif.caborLain : ""} · ${H.usia} tahun · ${H.jk === "L" ? "laki-laki" : "perempuan"}`, `Disusun oleh ${st.profil.nama}${st.profil.profesi ? " (" + st.profil.profesi + ")" : ""}`] });
    if (st.input.catatanPraktisi) L.push({ judul: "Catatan praktisi", baris: [st.input.catatanPraktisi] });
    if (H.peringatan.length) L.push({ judul: "Perhatian", baris: H.peringatan });
    L.push({ judul: "Program per hari", baris: H.hari.map((d) => `${d.nama}: ${d.sesi.length ? d.sesi.map((s) => `${s.nama} ${s.dur} menit RPE ${s.rpe}`).join(" + ") : "istirahat"} | beban ${f0(d.au)} AU (${d.kat.n.toLowerCase()}) | ${f0(d.E)} kkal | KH ${f0(d.C)} g (${f1(d.cgkg)} g/kg) | protein ${f0(d.P)} g | lemak ${f0(d.F)} g`) });
    const jenis = [...new Set(H.hari.flatMap((d) => d.sesi.map((s) => s.jenis)))];
    L.push({ judul: "Makan sekitar latihan", baris: jenis.map((j) => { const J = PG.JENIS[j]; return `${J.n} — sebelum: ${J.pre}${J.pre_g ? ` (≈ ${f0(J.pre_g * H.bb)} g KH)` : ""}; saat: ${J.saat}; sesudah: ${J.pasca}${J.post_c || J.post_p ? ` (≈ ${f0(J.post_c * H.bb)} g KH + ${f0(J.post_p * H.bb)} g protein)` : ""}`; }) });
    if (H.hidrasi) L.push({ judul: "Hidrasi", baris: [`Laju keringat ${fx(H.hidrasi.sr, 2)} L/jam; minum ±${f0(Math.round(H.hidrasi.tgt * 250 / 10) * 10)} mL setiap 15 menit saat latihan.`] });
    if (H.suplemen.length) L.push({ judul: "Suplemen", baris: H.suplemen.map((s) => `${s.n}: ${s.dosis}; ${s.waktu} (${s.ref})`) });
    st.bahas.forEach((b) => L.push({ judul: b.judul, baris: [b.isi] }));
    return L;
  }
  function ringkas() {
    const H = st.H;
    return { tanggal: st.input.tanggal, cabor: H.cabor.n, tujuan: PG.TUJUAN[H.tujuan], fase: H.fase.n, pct: H.kom.estimasi ? null : +H.kom.pct.toFixed(1), ffm: H.kom.estimasi ? null : +H.kom.ffm.toFixed(1), energi: Math.round(H.rata.E), kh: Math.round(H.rata.C), protein: Math.round(H.rata.P), lemak: Math.round(H.rata.F), ea: +H.rata.ea.toFixed(1), sr: H.hidrasi ? +H.hidrasi.sr.toFixed(2) : null };
  }

  $("b-simpan").addEventListener("click", async () => {
    const b = $("b-simpan");
    if (st.tersimpan) return;
    busy(b, true, "Menyimpan…");
    try {
      if (st.lokal) {
        const a = lokalDb.akun(st.email);
        a.profil = a.profil || st.profil;
        const entri = { id: "lokal-" + Date.now(), waktu: new Date().toISOString(), input: st.input, ringkas: ringkas() };
        if (st.aktif) {
          a.klien = a.klien || [];
          const k = a.klien.find((x) => x.id === st.aktif.id);
          k.riwayat = (k.riwayat || []).concat([entri]);
          st.klien = a.klien; st.aktif = k; st.riwayat = k.riwayat;
        } else {
          a.riwayat = (a.riwayat || []).concat([entri]);
          st.riwayat = a.riwayat;
        }
        lokalDb.simpanAkun(st.email, a);
        msg($("h-msg"), "Tersimpan di perangkat ini. Cetak laporan atau kirim ke " + S.email + " untuk konsultasi.", true);
      } else {
        const j = await api({ aksi: "kons-simpan", token: st.token, klienId: st.aktif ? st.aktif.id : "", input: st.input, ringkas: ringkas(), laporan: laporanTeks() });
        if (!j.ok) { msg($("h-msg"), j.pesan || "Gagal menyimpan."); if (j.ulang) sesiHabis(); return; }
        st.riwayat = j.riwayat || st.riwayat;
        if (st.aktif) { if (j.klienPraktisi) st.klien = j.klienPraktisi; const k = st.klien.find((x) => x.id === st.aktif.id); if (k) { k.riwayat = st.riwayat; st.aktif = k; } }
        msg($("h-msg"), `Tersimpan (ID ${j.id}). Salinan program dikirim ke ${st.email}${st.aktif ? " (untuk diteruskan ke klien)" : ""}, dan Dr. Mury menerima pemberitahuan untuk meninjau.`, true);
      }
      st.tersimpan = true;
      b.textContent = "Tersimpan";
      renderRiwayat();
      renderHasil();
      return;
    } catch (er) {
      msg($("h-msg"), "Layanan tidak bisa dihubungi. Data Anda masih ada di halaman ini; coba simpan lagi.");
    } finally { if (!st.tersimpan) busy(b, false); else b.disabled = true; }
  });

  /* ---------- Riwayat ---------- */
  function grafik(seri) {
    const pts = seri.filter((s) => s.bb > 0);
    if (pts.length < 2) return "";
    const W = 300, Hh = 110, pad = 26;
    const xs = pts.map((_, i) => pad + (i * (W - 2 * pad)) / (pts.length - 1));
    const lo = Math.min(...pts.map((p) => p.bb)) - 1, hi = Math.max(...pts.map((p) => p.bb)) + 1;
    const y = (v) => Hh - pad / 2 - ((v - lo) / (hi - lo)) * (Hh - pad);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${xs[i].toFixed(1)},${y(p.bb).toFixed(1)}`).join(" ");
    return `<svg class="pg-chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Tren berat badan">
      <path d="${line}" fill="none" stroke="var(--blue)" stroke-width="2.5"/>
      ${pts.map((p, i) => `<circle cx="${xs[i].toFixed(1)}" cy="${y(p.bb).toFixed(1)}" r="3.5" fill="var(--blue)"><title>${esc(p.tanggal)}: ${f1(p.bb)} kg${p.pct != null ? ", " + f1(p.pct) + "% lemak" : ""}</title></circle><text x="${xs[i].toFixed(1)}" y="${(y(p.bb) - 8).toFixed(1)}" text-anchor="middle" font-size="10" fill="var(--ink-2)">${f1(p.bb)}</text>`).join("")}
    </svg><p class="note" style="margin:0">Tren berat badan (kg)</p>`;
  }
  function renderRiwayat() {
    renderKartu();
    $("u-klien").innerHTML = praktisi() ? `<p class="note" style="margin:10px 0 0">${esc(st.profil.profesi || "")} · ${st.klien.length} klien${st.aktif ? ` · aktif: <strong>${esc(st.aktif.nama)}</strong>` : ""}</p>` : "";
    if (praktisi() && !st.aktif) { $("u-riwayat").innerHTML = ""; return; }
    const seri = riwayatSeri();
    if (!seri.length) { $("u-riwayat").innerHTML = '<p class="note">Belum ada konsultasi tersimpan.</p>'; return; }
    $("u-riwayat").innerHTML = `<h4 style="margin:14px 0 6px">Riwayat ${st.aktif ? esc(st.aktif.nama) : "konsultasi"}</h4>${grafik(seri)}
      ${tbl(["Tanggal", "#BB", "#Lemak", "#kkal"], st.riwayat.slice().reverse().slice(0, 8).map((r) => [esc((r.input || {}).tanggal || String(r.waktu).slice(0, 10)), f1((r.input || {}).bb || 0), (r.ringkas || {}).pct != null ? f1(r.ringkas.pct) + "%" : "–", (r.ringkas || {}).energi ? f0(r.ringkas.energi) : "–"]))}`;
  }

  /* ---------- Foto & kartu profil ---------- */
  const inisial = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  function avatarHtml(src, nama, cls) {
    return src ? `<img class="pg-av ${cls || ""}" src="${src}" alt="Foto ${esc(nama)}">` : `<span class="pg-av pg-av-ini ${cls || ""}" aria-hidden="true">${esc(inisial(nama))}</span>`;
  }
  let memuatFoto = false;
  async function muatFotoKlien() {
    if (st.lokal || memuatFoto || !praktisi()) return;
    const perlu = st.klien.filter((k) => k.foto && st.fotoKlien[k.id] == null);
    if (!perlu.length) return;
    memuatFoto = true;
    try {
      for (const k of perlu) {
        st.fotoKlien[k.id] = "";
        const j = await api({ aksi: "kons-foto-ambil", token: st.token, klienId: k.id });
        if (j.ok && j.foto) st.fotoKlien[k.id] = j.foto;
      }
    } catch (e) { /* foto opsional */ }
    memuatFoto = false;
    renderKlien(); renderKartu();
  }
  function fotoSubjek() { return st.aktif ? st.fotoKlien[st.aktif.id] || "" : st.foto; }

  function statSubjek() {
    const R = st.riwayat || [];
    const last = R[R.length - 1];
    const first = R[0];
    const v = (r, f) => (r ? f(r) : null);
    return {
      n: R.length,
      bb: v(last, (r) => Number((r.input || {}).bb) || null),
      pct: v(last, (r) => (r.ringkas || {}).pct),
      ffm: v(last, (r) => (r.ringkas || {}).ffm),
      kkal: v(last, (r) => (r.ringkas || {}).energi),
      dBB: last && first && R.length > 1 ? Number(last.input.bb) - Number(first.input.bb) : null,
      seri: R.map((r) => ({ t: (r.input || {}).tanggal || String(r.waktu).slice(0, 10), bb: Number((r.input || {}).bb) || null, pct: (r.ringkas || {}).pct, ffm: (r.ringkas || {}).ffm }))
    };
  }
  let chartKartu = null;
  function renderKartu() {
    const box = $("kartu");
    if (!st.profil) { box.hidden = true; return; }
    box.hidden = false;
    const prakTanpaKlien = praktisi() && !st.aktif;
    const subj = subjek();
    const c = PG.CABOR_MAP[subj.cabor];
    const usia = PG.usiaDari(subj.tglLahir);
    const S = statSubjek();
    const tiles = prakTanpaKlien
      ? [["Klien", st.klien.length, "c1"], ["Asesmen", st.klien.reduce((a, k) => a + (k.riwayat || []).length, 0), "c2"], ["Cabang", new Set(st.klien.map((k) => k.cabor)).size, "c3"], ["Aktif bulan ini", st.klien.filter((k) => (k.riwayat || []).some((r) => String((r.input || {}).tanggal || "").slice(0, 7) === today().slice(0, 7))).length, "c4"]]
      : [["BB", S.bb ? f1(S.bb) + " kg" : "–", "c1"], ["Lemak", S.pct != null ? f1(S.pct) + "%" : "–", "c2"], ["FFM", S.ffm != null ? f1(S.ffm) + " kg" : "–", "c3"], ["Konsultasi", S.n, "c4"]];
    box.innerHTML = `
      <div class="pg-kartu-in">
        <div class="pg-kartu-foto">${avatarHtml(fotoSubjek(), subj.nama, "pg-av-lg")}
          <button type="button" class="pg-foto-btn" id="k-foto" aria-label="Ganti foto">${fotoSubjek() ? "Ganti foto" : "Unggah foto"}</button></div>
        <div class="pg-kartu-teks">
          <span class="pg-kartu-eyebrow">${prakTanpaKlien ? (st.profil.peran === "pelatih" ? "Pelatih" : "Ahli gizi") : st.aktif ? "Klien" : "Member"} · Program Gizi Olahraga</span>
          <h2>${esc(subj.nama || "")}</h2>
          <p>${prakTanpaKlien ? esc(st.profil.profesi || "") : `${esc(c ? c.n : subj.cabor || "")}${subj.caborLain ? " · " + esc(subj.caborLain) : ""}${usia != null ? " · " + usia + " tahun" : ""}${subj.level ? " · " + esc(subj.level) : ""}`}</p>
          <div class="pg-tiles">${tiles.map(([l, v, cl]) => `<div class="pg-tile ${cl}"><b>${v}</b><span>${l}</span></div>`).join("")}</div>
          ${!prakTanpaKlien && S.dBB != null ? `<p class="pg-kartu-delta">Sejak konsultasi pertama: BB ${S.dBB >= 0 ? "+" : "−"}${f1(Math.abs(S.dBB))} kg</p>` : ""}
        </div>
        ${!prakTanpaKlien && S.seri.filter((x) => x.bb).length >= 2 ? `<div class="pg-kartu-chart"><canvas id="k-chart" aria-label="Grafik perkembangan berat badan dan persen lemak"></canvas></div>` : ""}
      </div>
      ${!prakTanpaKlien ? `<div class="pg-kartu-aksi"><label class="pg-cek-inline"><input type="checkbox" id="k-privat"> Sembunyikan angka tubuh di kartu</label><button type="button" class="btn btn-ghost pg-sm" id="k-unduh">Unduh kartu profil (PNG)</button></div>` : ""}`;
    $("k-foto").onclick = () => $("foto-input").click();
    const u = $("k-unduh"); if (u) u.onclick = unduhKartu;
    const cv = $("k-chart");
    if (chartKartu) { chartKartu.destroy(); chartKartu = null; }
    if (cv && window.Chart) {
      const pts = S.seri.filter((x) => x.bb);
      chartKartu = new window.Chart(cv, {
        type: "line",
        data: { labels: pts.map((x) => x.t.slice(5)), datasets: [
          { label: "BB (kg)", data: pts.map((x) => x.bb), borderColor: "#ffd166", backgroundColor: "rgba(255,209,102,.25)", fill: true, tension: .35, yAxisID: "y", pointRadius: 4, pointBackgroundColor: "#ffd166" },
          { label: "Lemak (%)", data: pts.map((x) => x.pct ?? null), borderColor: "#06d6a0", backgroundColor: "#06d6a0", tension: .35, yAxisID: "y1", pointRadius: 4, spanGaps: true }
        ] },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 900 }, interaction: { mode: "index", intersect: false },
          plugins: { legend: { labels: { color: "#fff", boxWidth: 12, font: { family: "Outfit" } } } },
          scales: { x: { ticks: { color: "rgba(255,255,255,.85)" }, grid: { color: "rgba(255,255,255,.12)" } },
            y: { position: "left", ticks: { color: "#ffd166" }, grid: { color: "rgba(255,255,255,.12)" } },
            y1: { position: "right", ticks: { color: "#06d6a0" }, grid: { display: false } } } }
      });
    }
  }

  $("foto-input").addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (!/^image\//.test(f.type)) { MK.toast("Pilih berkas gambar"); return; }
    if (f.size > 15 * 1024 * 1024) { MK.toast("Foto maksimal 15 MB"); return; }
    let data;
    try { data = await perkecilFoto(f, 480); } catch (er) { MK.toast("Foto tidak bisa dibaca"); return; }
    const klienId = st.aktif ? st.aktif.id : "";
    try {
      if (st.lokal) {
        const a = lokalDb.akun(st.email);
        if (klienId) { const k = (a.klien || []).find((x) => x.id === klienId); if (k) k.foto = data; } else a.foto = data;
        lokalDb.simpanAkun(st.email, a);
      } else {
        MK.toast("Mengunggah foto…");
        const j = await api({ aksi: "kons-foto", token: st.token, klienId, foto: data });
        if (!j.ok) { MK.toast(j.pesan || "Gagal mengunggah"); if (j.ulang) sesiHabis(); return; }
      }
      if (klienId) { st.fotoKlien[klienId] = data; const k = st.klien.find((x) => x.id === klienId); if (k) k.foto = "ada"; } else st.foto = data;
      MK.toast("Foto tersimpan");
      renderKartu(); if (praktisi()) renderKlien();
    } catch (er) { MK.toast("Layanan tidak bisa dihubungi. Coba lagi."); }
  });
  function perkecilFoto(file, sisi) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        const cv = document.createElement("canvas"); cv.width = cv.height = sisi;
        const ctx = cv.getContext("2d");
        ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, sisi, sisi);
        URL.revokeObjectURL(url);
        res(cv.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("img")); };
      img.src = url;
    });
  }

  // Kartu 1080×1350 (rasio Instagram 4:5) untuk diunduh dan diposting.
  async function unduhKartu() {
    try { await document.fonts.ready; } catch (e) { /* lanjut dengan font cadangan */ }
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const font = (w, s) => `${w} ${s}px Outfit, "Segoe UI", sans-serif`;
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#003a63"); g.addColorStop(.55, "#0070b8"); g.addColorStop(1, "#f05828");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    [["#ffd166", 900, 160, 260, .35], ["#06d6a0", 120, 1180, 220, .3], ["#ef476f", 980, 1040, 160, .3], ["#ffffff", 140, 220, 120, .12]].forEach(([c, cx, cy, r, a]) => { x.globalAlpha = a; x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); });
    x.globalAlpha = 1;
    x.fillStyle = "rgba(255,255,255,.85)"; x.font = font(700, 30); x.textAlign = "center";
    x.fillText("PROGRAM GIZI OLAHRAGA", W / 2, 110);
    const subj = subjek(), S = statSubjek(), privat = $("k-privat") && $("k-privat").checked;
    const cx = W / 2, cy = 330, r = 170;
    x.save(); x.beginPath(); x.arc(cx, cy, r + 14, 0, 7); x.fillStyle = "#fff"; x.fill(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip();
    const src = fotoSubjek();
    if (src) { const im = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; }); if (im) x.drawImage(im, cx - r, cy - r, 2 * r, 2 * r); }
    else { const gg = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r); gg.addColorStop(0, "#ffd166"); gg.addColorStop(1, "#ef476f"); x.fillStyle = gg; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); x.fillStyle = "#fff"; x.font = font(800, 120); x.textBaseline = "middle"; x.fillText(inisial(subj.nama), cx, cy + 6); x.textBaseline = "alphabetic"; }
    x.restore();
    x.fillStyle = "#fff"; x.font = font(800, 68);
    let nama = subj.nama || ""; while (x.measureText(nama).width > W - 120 && nama.length > 4) nama = nama.slice(0, -2) + "…";
    x.fillText(nama, W / 2, 610);
    const c = PG.CABOR_MAP[subj.cabor], usia = PG.usiaDari(subj.tglLahir);
    x.font = font(500, 34); x.fillStyle = "rgba(255,255,255,.92)";
    x.fillText([c ? c.n : subj.cabor, subj.caborLain, usia != null ? usia + " tahun" : ""].filter(Boolean).join(" · "), W / 2, 662);
    const tiles = privat ? [["Konsultasi", String(S.n)], ["Cabang", c ? c.n.split(" ")[0] : "-"]] : [["BB", S.bb ? f1(S.bb) + " kg" : "–"], ["Lemak", S.pct != null ? f1(S.pct) + "%" : "–"], ["FFM", S.ffm != null ? f1(S.ffm) + " kg" : "–"], ["Konsultasi", String(S.n)]];
    const warna = ["#ffd166", "#06d6a0", "#118ab2", "#ef476f"];
    const tw = (W - 120 - (tiles.length - 1) * 24) / tiles.length;
    tiles.forEach(([l, v], i) => {
      const tx = 60 + i * (tw + 24), ty = 720;
      x.fillStyle = "rgba(255,255,255,.14)"; rrect(x, tx, ty, tw, 150, 28); x.fill();
      x.fillStyle = warna[i % 4]; rrect(x, tx, ty, 12, 150, 6); x.fill();
      x.fillStyle = "#fff"; x.textAlign = "center"; x.font = font(800, tiles.length > 2 ? 46 : 58); x.fillText(v, tx + tw / 2 + 6, ty + 78);
      x.font = font(600, 26); x.fillStyle = "rgba(255,255,255,.85)"; x.fillText(l.toUpperCase(), tx + tw / 2 + 6, ty + 122);
    });
    const pts = S.seri.filter((p) => p.bb);
    if (!privat && pts.length >= 2) {
      const gx = 90, gy = 940, gw = W - 180, gh = 230;
      x.fillStyle = "rgba(0,0,0,.18)"; rrect(x, 60, 910, W - 120, 300, 28); x.fill();
      const lo = Math.min(...pts.map((p) => p.bb)) - 1, hi = Math.max(...pts.map((p) => p.bb)) + 1;
      const px = (i) => gx + (i * gw) / (pts.length - 1), py = (v) => gy + gh - ((v - lo) / (hi - lo)) * (gh - 40);
      x.strokeStyle = "#ffd166"; x.lineWidth = 7; x.lineJoin = "round"; x.beginPath();
      pts.forEach((p, i) => (i ? x.lineTo(px(i), py(p.bb)) : x.moveTo(px(i), py(p.bb)))); x.stroke();
      pts.forEach((p, i) => { x.fillStyle = "#fff"; x.beginPath(); x.arc(px(i), py(p.bb), 11, 0, 7); x.fill(); x.fillStyle = "#ffd166"; x.beginPath(); x.arc(px(i), py(p.bb), 6, 0, 7); x.fill(); });
      x.fillStyle = "#fff"; x.font = font(700, 26); x.textAlign = "left"; x.fillText("Perkembangan berat badan", gx, 900 + 50);
      x.textAlign = "center"; x.font = font(500, 22); x.fillStyle = "rgba(255,255,255,.8)";
      [0, pts.length - 1].forEach((i) => x.fillText(pts[i].t, px(i), gy + gh + 30));
    } else {
      x.fillStyle = "rgba(255,255,255,.9)"; x.font = font(600, 38); x.textAlign = "center";
      x.fillText("Berlatih cerdas, makan tepat, juara!", W / 2, 1050);
    }
    x.textAlign = "center"; x.fillStyle = "#fff"; x.font = font(700, 30); x.fillText("murykuswari.com", W / 2, 1275);
    x.font = font(500, 22); x.fillStyle = "rgba(255,255,255,.85)"; x.fillText("Program Gizi Olahraga · Assoc. Prof. Dr. Mury Kuswari", W / 2, 1312);
    const a = document.createElement("a");
    a.download = `kartu-profil-${String(subj.nama || "member").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    a.href = cv.toDataURL("image/png"); document.body.appendChild(a); a.click(); a.remove();
  }
  function rrect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
});
