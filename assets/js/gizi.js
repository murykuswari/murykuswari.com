/* Kalkulator gizi olahraga: IMT, persen lemak tubuh, berat badan ideal, kebutuhan energi. */
(function () {
  const $ = (id) => document.getElementById(id);
  const num = (id) => { const v = parseFloat(($(id) || {}).value); return isFinite(v) && v > 0 ? v : null; };
  const f1 = (x) => x.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const f0 = (x) => Math.round(x).toLocaleString("id-ID");
  const ringkas = {}; // ringkasan hasil untuk dikirim ke konsultasi
  let jk = "L";

  const EMPTY = '<div class="label">Isi data di sebelah kiri</div><p class="note">Hasil akan muncul otomatis begitu angka diisi.</p>';

  /* ---------- Tabs ---------- */
  const tabs = document.querySelectorAll(".calc-tab");
  function openTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      $(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach((t) => t.addEventListener("click", () => openTab(t)));

  /* ---------- Isian bersama (BB, TB, usia, jenis kelamin) ---------- */
  document.addEventListener("input", (e) => {
    const k = e.target.dataset.share;
    if (k) document.querySelectorAll(`[data-share="${k}"]`).forEach((el) => { if (el !== e.target) el.value = e.target.value; });
    calcAll();
  });
  document.querySelectorAll("[data-share-seg]").forEach((seg) => seg.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    jk = b.dataset.v;
    document.querySelectorAll("[data-share-seg] button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.v === jk));
    document.querySelectorAll("[data-only]").forEach((el) => { el.hidden = el.dataset.only !== jk; });
    calcAll();
  }));
  let metode = "navy";
  $("lemak-metode").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    metode = b.dataset.v;
    $("lemak-metode").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    document.querySelectorAll("[data-show]").forEach((el) => { el.hidden = el.dataset.show !== metode; });
    calcAll();
  });
  $("imt-std").addEventListener("change", calcAll);
  ["en-tujuan", "en-akt"].forEach((id) => $(id).addEventListener("change", calcAll));

  function scale(segments, value, min, max, labels) {
    const pos = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    return `<div class="scale">${segments.map(([w, c]) => `<span style="width:${w}%;background:${c}"></span>`).join("")}</div>
      <div class="scale-marker"><i style="left:${pos}%"></i></div>
      <div class="scale-labels">${labels.map((l) => `<span>${l}</span>`).join("")}</div>`;
  }

  /* ---------- IMT ---------- */
  const IMT_STD = {
    kemenkes: { min: 14, max: 35, cut: [[17, "Kurus (kekurangan BB tingkat berat)", "b-under"], [18.5, "Kurus (kekurangan BB tingkat ringan)", "b-under"], [25.1, "Normal", "b-normal"], [27.1, "Gemuk (kelebihan BB tingkat ringan)", "b-over"], [99, "Obesitas (kelebihan BB tingkat berat)", "b-obese"]], normal: [18.5, 25], src: "Kemenkes RI (P2PTM)" },
    asia: { min: 14, max: 35, cut: [[18.5, "Berat badan kurang", "b-under"], [23, "Normal", "b-normal"], [25, "Berisiko (overweight)", "b-over"], [30, "Obesitas I", "b-obese"], [99, "Obesitas II", "b-obese"]], normal: [18.5, 22.9], src: "WHO Asia-Pasifik (2000)" },
    who: { min: 14, max: 42, cut: [[18.5, "Berat badan kurang", "b-under"], [25, "Normal", "b-normal"], [30, "Overweight (pra-obesitas)", "b-over"], [35, "Obesitas kelas I", "b-obese"], [40, "Obesitas kelas II", "b-obese"], [99, "Obesitas kelas III", "b-obese"]], normal: [18.5, 24.9], src: "WHO" }
  };
  function calcIMT() {
    const bb = num("imt-bb"), tb = num("imt-tb"), out = $("r-imt");
    if (!bb || !tb) { out.innerHTML = EMPTY; delete ringkas.imt; return; }
    const m = tb / 100, imt = bb / (m * m);
    const std = IMT_STD[$("imt-std").value];
    const kat = std.cut.find((c) => imt < c[0]);
    const [lo, hi] = std.normal;
    const bbMin = lo * m * m, bbMax = hi * m * m;
    const span = std.max - std.min;
    const seg = (a, b) => ((Math.min(b, std.max) - Math.max(a, std.min)) / span) * 100;
    out.innerHTML = `
      <div class="note">IMT Anda</div>
      <div class="big">${f1(imt)}</div>
      <span class="badge ${kat[2]}">${kat[1]}</span>
      ${scale([[seg(std.min, lo), "var(--amber)"], [seg(lo, hi), "var(--green)"], [seg(hi, hi + 3), "var(--orange)"], [seg(hi + 3, std.max), "var(--red)"]], imt, std.min, std.max, [std.min, lo, hi, std.max])}
      <dl class="kv">
        <dt>Rentang berat normal untuk tinggi Anda</dt><dd>${f1(bbMin)}–${f1(bbMax)} kg</dd>
        <dt>${bb > bbMax ? "Selisih ke batas atas normal" : bb < bbMin ? "Selisih ke batas bawah normal" : "Status"}</dt>
        <dd>${bb > bbMax ? "−" + f1(bb - bbMax) + " kg" : bb < bbMin ? "+" + f1(bbMin - bb) + " kg" : "Dalam rentang normal"}</dd>
      </dl>
      <p class="note" style="margin-top:14px">IMT tidak membedakan otot dan lemak. Atlet berotot bisa ber-IMT tinggi tetapi berlemak rendah, jadi lengkapi dengan pengukuran persen lemak tubuh.</p>
      <p class="note" style="margin:0">Standar: ${std.src}</p>`;
    ringkas.imt = `IMT ${f1(imt)} (${kat[1]}, standar ${std.src}); BB ${bb} kg, TB ${tb} cm`;
  }

  /* ---------- Persen lemak ---------- */
  const BF = {
    L: { cut: [[6, "Lemak esensial", "b-under"], [14, "Atletis", "b-normal"], [18, "Bugar (fitness)", "b-normal"], [25, "Rata-rata", "b-over"], [99, "Obesitas", "b-obese"]], min: 2, max: 40 },
    P: { cut: [[14, "Lemak esensial", "b-under"], [21, "Atletis", "b-normal"], [25, "Bugar (fitness)", "b-normal"], [32, "Rata-rata", "b-over"], [99, "Obesitas", "b-obese"]], min: 10, max: 48 }
  };
  function calcLemak() {
    const out = $("r-lemak");
    const bb = num("lm-bb"), tb = num("lm-tb");
    let pct = null, cara = "";
    if (metode === "navy") {
      const w = num("lm-pinggang"), n = num("lm-leher"), h = num("lm-panggul");
      if (tb && w && n && (jk === "L" ? w > n : h && w + h > n)) {
        pct = jk === "L"
          ? 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(tb)) - 450
          : 495 / (1.29579 - 0.35004 * Math.log10(w + h - n) + 0.221 * Math.log10(tb)) - 450;
        cara = "US Navy (Hodgdon & Beckett)";
      }
    } else {
      const usia = num("lm-usia");
      if (bb && tb && usia) {
        const imt = bb / Math.pow(tb / 100, 2);
        pct = 1.2 * imt + 0.23 * usia - 10.8 * (jk === "L" ? 1 : 0) - 5.4;
        cara = "Deurenberg (1991), dari IMT dan usia";
      }
    }
    if (pct == null || !isFinite(pct)) { out.innerHTML = EMPTY; delete ringkas.lemak; return; }
    pct = Math.max(2, pct);
    const s = BF[jk];
    const kat = s.cut.find((c) => pct < c[0]);
    const span = s.max - s.min;
    const bounds = [s.min].concat(s.cut.slice(0, 4).map((c) => c[0])).concat([s.max]);
    const colors = ["var(--amber)", "var(--green)", "#5fb98c", "var(--orange)", "var(--red)"];
    const segs = colors.map((c, i) => [((bounds[i + 1] - bounds[i]) / span) * 100, c]);
    const fm = bb ? (bb * pct) / 100 : null;
    out.innerHTML = `
      <div class="note">Perkiraan lemak tubuh</div>
      <div class="big">${f1(pct)}%</div>
      <span class="badge ${kat[2]}">${kat[1]}</span>
      ${scale(segs, pct, s.min, s.max, bounds.filter((_, i) => i % 1 === 0).map((b) => b + "%"))}
      ${fm ? `<dl class="kv"><dt>Massa lemak</dt><dd>${f1(fm)} kg</dd><dt>Massa bebas lemak (otot, tulang, air)</dt><dd>${f1(bb - fm)} kg</dd></dl>` : ""}
      <p class="note" style="margin-top:14px">Kategori mengacu pada American Council on Exercise (ACE). Metode: ${cara}. Untuk hasil lebih akurat gunakan BIA, skinfold, atau DEXA.</p>`;
    ringkas.lemak = `Lemak tubuh ${f1(pct)}% (${kat[1]}, metode ${cara})`;
    const shared = document.querySelector('[data-share="lemak"]');
    if (shared && !shared.value) shared.placeholder = f1(pct).replace(",", ".");
  }

  /* ---------- Berat badan ideal ---------- */
  function calcBBI() {
    const out = $("r-bbi");
    const tb = num("bbi-tb"), bb = num("bbi-bb");
    if (!tb) { out.innerHTML = EMPTY; delete ringkas.bbi; return; }
    const pendek = (jk === "L" && tb < 160) || (jk === "P" && tb < 150);
    const broca = pendek ? tb - 100 : (tb - 100) * 0.9;
    const m = tb / 100;
    const inch = Math.max(0, tb / 2.54 - 60);
    const devine = (jk === "L" ? 50 : 45.5) + 2.3 * inch;
    let target = "";
    const lemak = num("bbi-lemak"), tl = num("bbi-target");
    if (bb && lemak && tl && tl < 60) {
      const lbm = bb * (1 - lemak / 100);
      const bt = lbm / (1 - tl / 100);
      target = `<dt>Berat target pada ${f1(tl)}% lemak (massa otot dipertahankan)</dt><dd>${f1(bt)} kg</dd>
        <dt>Perubahan yang diperlukan</dt><dd>${bt < bb ? "−" : "+"}${f1(Math.abs(bb - bt))} kg</dd>`;
    }
    out.innerHTML = `
      <div class="note">Berat badan ideal (Broca modifikasi)</div>
      <div class="big">${f1(broca)} kg</div>
      <span class="badge b-normal">Rentang sehat ${f1(18.5 * m * m)}–${f1(25 * m * m)} kg</span>
      <dl class="kv">
        <dt>Rumus Broca${pendek ? " (tanpa pengurangan 10%)" : " (TB − 100) − 10%"}</dt><dd>${f1(broca)} kg</dd>
        <dt>Rentang IMT normal Kemenkes 18,5–25</dt><dd>${f1(18.5 * m * m)}–${f1(25 * m * m)} kg</dd>
        <dt>Rumus Devine (rujukan klinis)</dt><dd>${f1(devine)} kg</dd>
        ${bb ? `<dt>Berat Anda saat ini</dt><dd>${f1(bb)} kg</dd>` : ""}
        ${target}
      </dl>
      <p class="note" style="margin-top:14px">Bagi atlet, "berat ideal" sebaiknya ditentukan dari target persen lemak dan kelas tanding, bukan hanya tinggi badan. Isi % lemak untuk menghitung berat target.</p>`;
    ringkas.bbi = `BB ideal (Broca) ${f1(broca)} kg, rentang sehat ${f1(18.5 * m * m)}–${f1(25 * m * m)} kg`;
  }

  /* ---------- Energi ---------- */
  function calcEnergi() {
    const out = $("r-energi");
    const bb = num("en-bb"), tb = num("en-tb"), usia = num("en-usia");
    if (!bb || !tb || !usia) { out.innerHTML = EMPTY; delete ringkas.energi; return; }
    const [pal, cho, pro] = $("en-akt").value.split("|").map(Number);
    const adj = Number($("en-tujuan").value);
    const bmr = 10 * bb + 6.25 * tb - 5 * usia + (jk === "L" ? 5 : -161);
    const tdee = bmr * pal;
    const target = Math.max(bmr * 1.1, tdee + adj);
    // Saat defisit atau membangun otot, protein minimal 1,6 g/kg untuk menjaga massa otot.
    const proG = (adj !== 0 ? Math.max(pro, 1.6) : pro) * bb;
    const choG = Math.min(cho * bb, (target * 0.65) / 4);
    const fatG = Math.max((target - proG * 4 - choG * 4) / 9, (target * 0.2) / 9);
    const air = bb * 35 / 1000;
    out.innerHTML = `
      <div class="note">Target energi harian</div>
      <div class="big">${f0(target)} <span style="font-size:1.1rem">kkal</span></div>
      <span class="badge b-normal">${adj < 0 ? "Defisit untuk turun lemak" : adj > 0 ? "Surplus untuk massa otot" : "Pemeliharaan"}</span>
      <dl class="kv">
        <dt>Metabolisme basal (Mifflin-St Jeor)</dt><dd>${f0(bmr)} kkal</dd>
        <dt>Total pengeluaran energi (× ${String(pal).replace(".", ",")})</dt><dd>${f0(tdee)} kkal</dd>
        <dt>Karbohidrat</dt><dd>${f0(choG)} g · ${f1(choG / bb)} g/kg</dd>
        <dt>Protein</dt><dd>${f0(proG)} g · ${f1(proG / bb)} g/kg</dd>
        <dt>Lemak</dt><dd>${f0(fatG)} g</dd>
        <dt>Cairan dasar (di luar keringat latihan)</dt><dd>±${f1(air)} L</dd>
      </dl>
      <p class="note" style="margin-top:14px">Tambahkan sekitar 400–800 ml cairan per jam latihan. Bagi protein merata 20–40 g per makan, dan atur karbohidrat mengikuti beban latihan harian (periodisasi gizi).</p>`;
    ringkas.energi = `Energi ±${f0(target)} kkal/hari; KH ${f0(choG)} g, protein ${f0(proG)} g, lemak ${f0(fatG)} g`;
  }

  function calcAll() { calcIMT(); calcLemak(); calcBBI(); calcEnergi(); }
  calcAll();

  if (location.hash && /^#(imt|lemak|bbi|energi)$/.test(location.hash)) openTab($("t-" + location.hash.slice(1)));

  /* ---------- Konsultasi ---------- */
  const S = window.SITE || {};
  if (S.formKonsultasi) {
    $("form-link").innerHTML = `<a class="btn btn-dark" href="${S.formKonsultasi}" target="_blank" rel="noopener">Isi formulir pendaftaran konsultasi</a>`;
  }
  if (!S.whatsapp) { $("c-wa").hidden = true; $("c-mail").className = "btn btn-primary"; }

  function pesan() {
    const v = (id) => ($(id).value || "").trim();
    const lines = [
      "Halo Dr. Mury, saya ingin berkonsultasi gizi olahraga.",
      "",
      `Nama: ${v("c-nama") || "-"}`,
      `Usia: ${v("c-usia") || "-"}`,
      `Kategori: ${v("c-kat")}`,
      `Cabang olahraga/aktivitas: ${v("c-cabor") || "-"}`,
      `Tujuan: ${v("c-tujuan")}`,
      "",
      `Pertanyaan: ${v("c-pesan") || "-"}`
    ];
    const hasil = Object.values(ringkas);
    if ($("c-hasil").checked && hasil.length) lines.push("", "Hasil kalkulator murykuswari.com:", ...hasil.map((h) => "• " + h));
    return lines.join("\n");
  }
  function valid() {
    if (!$("c-nama").value.trim()) { $("c-nama").focus(); window.MK.toast("Mohon isi nama Anda"); return false; }
    return true;
  }
  $("c-wa").addEventListener("click", () => { if (valid()) window.open(window.MK.waLink(pesan()), "_blank", "noopener"); });
  $("c-mail").addEventListener("click", () => {
    if (!valid()) return;
    location.href = `mailto:${S.email}?subject=${encodeURIComponent("Konsultasi Gizi Olahraga - " + $("c-nama").value.trim())}&body=${encodeURIComponent(pesan())}`;
  });
})();
