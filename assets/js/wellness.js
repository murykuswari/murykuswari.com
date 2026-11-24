/*
 * Kalkulator wellness korporat murykuswari.com
 * Skrining risiko pekerja, energi & zat gizi pekerja, aktivitas fisik & zona latihan,
 * tes kebugaran, kesejahteraan (WHO-5) dan perencanaan program corporate wellness.
 * Dasar perhitungan dan rujukan tercantum di bagian "Dasar perhitungan & daftar rujukan"
 * pada wellness.html (ACSM 2021, WHO 2020, AKG 2019, CDC Workplace Health Model, dll.).
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const num = (id) => { const el = $(id); if (!el) return null; const v = parseFloat(String(el.value).replace(",", ".")); return isFinite(v) && v > 0 ? v : null; };
  const num0 = (id) => { const el = $(id); if (!el) return null; const v = parseFloat(String(el.value).replace(",", ".")); return isFinite(v) && v >= 0 ? v : null; };
  const fx = (x, d) => Number(x).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
  const f0 = (x) => Math.round(x).toLocaleString("id-ID");
  const f1 = (x) => fx(x, 1);
  const f2 = (x) => fx(x, 2);
  const rp = (x) => "Rp" + Math.round(x).toLocaleString("id-ID");
  const ringkas = {};
  let jk = "L";

  const EMPTY = '<div class="label">Isi data di sebelah kiri</div><p class="note">Hasil akan muncul otomatis begitu angka diisi.</p>';
  const steps = (title, items, open) => `<details class="steps"${open ? " open" : ""}><summary>${title}</summary><div><ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol></div></details>`;
  const table = (head, rows) => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const mini = (items) => `<div class="mini-grid">${items.map(([b, s]) => `<div class="mini"><b>${b}</b><span>${s}</span></div>`).join("")}</div>`;
  function scale(segments, value, min, max, labels) {
    const pos = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    return `<div class="scale">${segments.map(([w, c]) => `<span style="width:${w}%;background:${c}"></span>`).join("")}</div>
      <div class="scale-marker"><i style="left:${pos}%"></i></div>
      <div class="scale-labels">${labels.map((l) => `<span>${l}</span>`).join("")}</div>`;
  }

  /* ================= DATA RUJUKAN ================= */

  // IMT WHO Asia-Pasifik (2000).
  const IMT_ASIA = [[18.5, "Berat badan kurang", "b-under"], [23, "Normal", "b-normal"], [25, "Berisiko (overweight)", "b-over"], [30, "Obesitas I", "b-obese"], [99, "Obesitas II", "b-obese"]];

  // AKG 2019 (Permenkes 28/2019): energi (kkal) dan protein (g) dewasa.
  const AKG = {
    L: [[29, 2650, 65], [49, 2550, 65], [64, 2150, 65], [80, 1800, 64], [200, 1600, 64]],
    P: [[29, 2250, 60], [49, 2150, 60], [64, 1800, 60], [80, 1550, 58], [200, 1400, 58]]
  };
  const AKG_LBL = ["19–29", "30–49", "50–64", "65–80", "80+"];

  // Norma VO2max Shvartz & Reibold (1990), batas bawah kategori per kelompok usia.
  const VO2_AGE = [24, 29, 34, 39, 44, 49, 54, 59, 200];
  const VO2_NORM = {
    L: [[32, 38, 44, 51, 57, 63], [31, 36, 43, 49, 54, 60], [29, 35, 41, 46, 52, 57], [28, 33, 39, 44, 49, 55], [26, 32, 36, 42, 47, 52], [25, 30, 35, 40, 44, 49], [24, 28, 33, 37, 42, 47], [22, 27, 31, 35, 40, 44], [21, 25, 29, 33, 37, 41]],
    P: [[27, 32, 37, 42, 47, 52], [26, 31, 36, 41, 45, 50], [25, 30, 34, 38, 43, 47], [24, 28, 32, 36, 41, 45], [22, 26, 30, 34, 38, 42], [21, 24, 28, 32, 36, 39], [19, 23, 26, 30, 33, 37], [18, 21, 24, 28, 31, 34], [16, 19, 22, 25, 28, 31]]
  };
  const VO2_CAT = [["Sangat kurang", "b-obese"], ["Kurang", "b-over"], ["Cukup", "b-under"], ["Rata-rata", "b-under"], ["Baik", "b-normal"], ["Sangat baik", "b-normal"], ["Istimewa", "b-normal"]];
  function vo2Category(v, age) {
    const i = VO2_AGE.findIndex((a) => age <= a);
    const b = VO2_NORM[jk][i < 0 ? VO2_NORM[jk].length - 1 : i];
    return { cat: VO2_CAT[b.filter((x) => v >= x).length], bounds: b };
  }

  /* ================= UI DASAR ================= */
  const tabs = document.querySelectorAll('.calc-tab[role="tab"]');
  function openTab(tab) {
    tabs.forEach((t) => { const on = t === tab; t.setAttribute("aria-selected", on); $(t.getAttribute("aria-controls")).hidden = !on; });
  }
  tabs.forEach((t) => t.addEventListener("click", () => { openTab(t); history.replaceState(null, "", "#" + t.id.slice(2)); }));

  function syncShare(el) {
    const k = el.dataset && el.dataset.share;
    if (!k) return;
    document.querySelectorAll(`[data-share="${k}"]`).forEach((x) => { if (x !== el) x.value = el.value; });
  }
  document.addEventListener("input", (e) => { syncShare(e.target); calcAll(); });
  document.addEventListener("change", (e) => { syncShare(e.target); calcAll(); });
  document.querySelectorAll("[data-share-seg]").forEach((seg) => seg.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    jk = b.dataset.v;
    document.querySelectorAll("[data-share-seg] button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.v === jk));
    calcAll();
  }));
  $("bg-metode").addEventListener("change", () => {
    const m = $("bg-metode").value;
    document.querySelectorAll("[data-bm]").forEach((el) => { el.hidden = el.dataset.bm !== m; });
  });

  /* ================= SKRINING ================= */
  function calcSkrining() {
    const out = $("r-skrining"), det = $("r-skrining-detail");
    const bb = num("sk-bb"), tb = num("sk-tb"), lp = num("sk-lp"), usia = num("sk-usia");
    if (!bb || !tb) { out.innerHTML = EMPTY; det.innerHTML = ""; delete ringkas.skrining; return; }
    const m = tb / 100, imt = bb / (m * m);
    const kat = IMT_ASIA.find((c) => imt < c[0]);
    const whtr = lp ? lp / tb : null;
    const lpCut = jk === "L" ? 90 : 80;

    // Sindrom metabolik (Alberti 2009, lingkar pinggang Asia).
    const sis = num("sk-sis"), dia = num("sk-dia"), gdp = num("sk-gdp"), tg = num("sk-tg"), hdl = num("sk-hdl");
    const obat = $("sk-obat").value === "1";
    const komp = [];
    if (lp) komp.push(["Lingkar pinggang ≥" + lpCut + " cm", lp >= lpCut, f1(lp) + " cm"]);
    if (sis || dia) komp.push(["Tekanan darah ≥130/85 mmHg", (sis || 0) >= 130 || (dia || 0) >= 85 || obat, `${sis || "–"}/${dia || "–"}`]);
    if (gdp) komp.push(["Glukosa puasa ≥100 mg/dL", gdp >= 100, f0(gdp)]);
    if (tg) komp.push(["Trigliserida ≥150 mg/dL", tg >= 150, f0(tg)]);
    if (hdl) komp.push(["HDL <" + (jk === "L" ? 40 : 50) + " mg/dL", hdl < (jk === "L" ? 40 : 50), f0(hdl)]);
    const nMs = komp.filter((k) => k[1]).length;

    // FINDRISC (Lindström & Tuomilehto 2003).
    let fr = null, frKat = null;
    if (usia && lp) {
      const sAge = usia < 45 ? 0 : usia < 55 ? 2 : usia < 65 ? 3 : 4;
      const sImt = imt < 25 ? 0 : imt <= 30 ? 1 : 3;
      const sLp = jk === "L" ? (lp < 94 ? 0 : lp <= 102 ? 3 : 4) : (lp < 80 ? 0 : lp <= 88 ? 3 : 4);
      fr = sAge + sImt + sLp + ["fr-pa", "fr-sayur", "fr-ht", "fr-glu", "fr-kel"].reduce((a, id) => a + Number($(id).value), 0);
      frKat = fr < 7 ? ["Rendah", "±1 dari 100", "b-normal"] : fr <= 11 ? ["Sedikit meningkat", "±1 dari 25", "b-under"] : fr <= 14 ? ["Sedang", "±1 dari 6", "b-over"] : fr <= 20 ? ["Tinggi", "±1 dari 3", "b-obese"] : ["Sangat tinggi", "±1 dari 2", "b-obese"];
    }
    const izin = nMs >= 3 || (fr !== null && fr >= 15) || (sis || 0) >= 160 || (dia || 0) >= 100;

    out.innerHTML = `
      <div class="note">IMT (WHO Asia-Pasifik)</div>
      <div class="big">${f1(imt)}</div>
      <span class="badge ${kat[2]}">${kat[1]}</span>
      ${scale([[13, "var(--amber)"], [18, "var(--green)"], [8, "var(--orange)"], [61, "var(--red)"]], imt, 15, 40, ["15", "18,5", "23", "25", "40"])}
      <dl class="kv">
        <dt>Waist-to-height ratio</dt><dd>${whtr ? `${f2(whtr)} · ${whtr >= 0.5 ? "<strong>berisiko</strong> (≥0,5)" : "aman (&lt;0,5)"}` : "isi lingkar pinggang"}</dd>
        <dt>Lingkar pinggang</dt><dd>${lp ? `${f1(lp)} cm · ${lp >= lpCut ? "<strong>obesitas sentral</strong>" : "normal"} (batas ${lpCut} cm)` : "—"}</dd>
        <dt>Komponen sindrom metabolik</dt><dd>${komp.length ? `${nMs} dari ${komp.length} yang diukur${nMs >= 3 ? " · <strong>memenuhi kriteria</strong>" : ""}` : "isi data MCU"}</dd>
        <dt>FINDRISC</dt><dd>${fr !== null ? `${fr} poin · <span class="badge ${frKat[2]}">${frKat[0]}</span> (${frKat[1]} orang dalam 10 tahun)` : "isi usia dan lingkar pinggang"}</dd>
      </dl>
      ${izin ? `<div class="callout warn"><strong>Perlu izin dokter sebelum program latihan.</strong> Hasil skrining menunjukkan risiko kardiometabolik tinggi. Mulai dengan intensitas ringan setelah evaluasi medis (prinsip pra-partisipasi ACSM).</div>` : `<p class="note" style="margin-top:12px">Tetap gunakan kuesioner PAR-Q+ sebelum karyawan mengikuti latihan terstruktur.</p>`}`;

    det.innerHTML = steps("Cara menghitung & interpretasi", [
      `<strong>IMT</strong> = BB ÷ TB² = <code>${f1(bb)} ÷ ${f2(m)}² = ${f1(imt)}</code>. Batas Asia-Pasifik: &lt;18,5 kurang; 18,5–22,9 normal; 23–24,9 berisiko; 25–29,9 obesitas I; ≥30 obesitas II. Untuk populasi Asia, risiko metabolik sudah naik pada IMT yang lebih rendah.`,
      whtr ? `<strong>WHtR</strong> = LP ÷ TB = <code>${f1(lp)} ÷ ${f1(tb)} = ${f2(whtr)}</code>. Batas 0,5 berlaku lintas jenis kelamin dan etnis (Ashwell 2012), mudah disampaikan: “lingkar pinggang kurang dari setengah tinggi badan”.` : "<strong>WHtR:</strong> isi lingkar pinggang.",
      komp.length ? `<strong>Sindrom metabolik</strong> (Alberti 2009, lingkar pinggang Asia) bila ≥3 dari 5 komponen. ${komp.map((k) => `${k[0]}: ${k[2]} → ${k[1] ? "<strong>ya</strong>" : "tidak"}`).join("; ")}.${obat ? " Konsumsi obat dihitung sebagai komponen tekanan darah positif." : ""}` : "<strong>Sindrom metabolik:</strong> isi tekanan darah, glukosa puasa, trigliserida, atau HDL dari hasil MCU.",
      fr !== null ? `<strong>FINDRISC</strong> = usia + IMT + lingkar pinggang + aktivitas fisik + sayur/buah + obat hipertensi + riwayat gula tinggi + riwayat keluarga = <strong>${fr} poin</strong>. Kategori: &lt;7 rendah, 7–11 sedikit meningkat, 12–14 sedang, 15–20 tinggi, &gt;20 sangat tinggi. Skor ≥15 sebaiknya dilanjutkan dengan pemeriksaan gula darah. Batas lingkar pinggang FINDRISC mengikuti versi asli (L 94/102 cm, P 80/88 cm).` : "<strong>FINDRISC:</strong> isi usia dan lingkar pinggang."
    ], true);
    ringkas.skrining = `IMT ${f1(imt)} (${kat[1]}, Asia-Pasifik)${whtr ? `; WHtR ${f2(whtr)}` : ""}${lp ? `; LP ${f1(lp)} cm` : ""}${komp.length ? `; sindrom metabolik ${nMs}/${komp.length} komponen` : ""}${fr !== null ? `; FINDRISC ${fr} (${frKat[0]})` : ""}`;
  }

  /* ================= ENERGI ================= */
  function calcEnergi() {
    const out = $("r-energi"), det = $("r-energi-detail");
    const bb = num("en-bb"), tb = num("en-tb"), usia = num("en-usia");
    if (!bb || !tb || !usia) { out.innerHTML = EMPTY; det.innerHTML = ""; delete ringkas.energi; return; }
    const pal = Number($("en-pal").value), goal = Number($("en-tujuan").value);
    const bmr = 10 * bb + 6.25 * tb - 5 * usia + (jk === "L" ? 5 : -161);
    const tee = bmr * pal;
    const floor = jk === "L" ? 1500 : 1200;
    let target = tee + goal;
    const capped = target < floor;
    if (capped) target = floor;
    const proK = num("en-pro") || (goal < 0 ? 1.2 : goal > 0 ? 1.6 : 1.0);
    const fatPct = num("en-lemak") || 25;
    const proG = proK * bb, proKcal = proG * 4;
    const fatKcal = target * fatPct / 100, fatG = fatKcal / 9;
    const choKcal = Math.max(0, target - proKcal - fatKcal), choG = choKcal / 4;
    const serat = target / 1000 * 14;
    const olah = num0("en-olahraga") || 0;
    const air = [30 * bb, 35 * bb].map((x) => x + olah / 60 * 500);
    const perMinggu = goal < 0 ? -(tee - target) * 7 / 7700 : goal > 0 ? (target - tee) * 7 / 7700 : 0;
    const ak = AKG[jk].findIndex((r) => usia <= r[0]);
    const akg = AKG[jk][ak];
    const meals = [["Sarapan", 0.25], ["Selingan pagi", 0.10], ["Makan siang", 0.30], ["Selingan sore", 0.10], ["Makan malam", 0.25]];

    out.innerHTML = `
      <div class="note">Target energi harian</div>
      <div class="big">${f0(target)} <span style="font-size:1.1rem">kkal</span></div>
      <span class="badge ${goal < 0 ? "b-over" : goal > 0 ? "b-under" : "b-normal"}">${$("en-tujuan").selectedOptions[0].text}</span>
      ${mini([[`${f0(proG)} g`, `Protein (${f1(proK)} g/kg · ${f0(proKcal / target * 100)}%)`], [`${f0(fatG)} g`, `Lemak (${f0(fatPct)}% energi)`], [`${f0(choG)} g`, `Karbohidrat (${f0(choKcal / target * 100)}%)`], [`${fx(air[0] / 1000, 1)}–${fx(air[1] / 1000, 1)} L`, "Cairan per hari"]])}
      <dl class="kv">
        <dt>BMR (Mifflin-St Jeor)</dt><dd>${f0(bmr)} kkal</dd>
        <dt>Total kebutuhan (TEE, PAL ${fx(pal, 2)})</dt><dd>${f0(tee)} kkal</dd>
        <dt>Perkiraan perubahan BB</dt><dd>${goal === 0 ? "dipertahankan" : `${perMinggu > 0 ? "+" : "−"}${f2(Math.abs(perMinggu))} kg/minggu (minggu-minggu awal)`}</dd>
        <dt>Serat</dt><dd>±${f0(serat)} g/hari</dd>
        <dt>AKG 2019 (${jk === "L" ? "laki-laki" : "perempuan"} ${AKG_LBL[ak]} th)</dt><dd>${f0(akg[1])} kkal · protein ${akg[2]} g</dd>
      </dl>
      ${capped ? `<div class="callout warn">Target dibatasi minimal <strong>${f0(floor)} kkal</strong> agar kebutuhan zat gizi tetap terpenuhi tanpa pengawasan klinis.</div>` : ""}
      ${table(["Waktu makan", "Energi", "Isi Piringku"], meals.map(([n, p]) => [n, `${f0(target * p)} kkal`, p >= 0.25 ? "½ sayur-buah, ½ makanan pokok + lauk" : "buah, yoghurt, kacang"]))}
      <p class="note" style="margin-top:10px">Batas harian gula 50 g (4 sdm), natrium 2.000 mg (1 sdt garam), lemak 67 g (5 sdm minyak) menurut Permenkes 30/2013.</p>`;

    det.innerHTML = steps("Cara menghitung", [
      `<strong>BMR</strong> (Mifflin 1990) = <code>10 × ${f1(bb)} + 6,25 × ${f1(tb)} − 5 × ${f0(usia)} ${jk === "L" ? "+ 5" : "− 161"} = ${f0(bmr)} kkal</code>.`,
      `<strong>TEE</strong> = BMR × PAL = <code>${f0(bmr)} × ${fx(pal, 2)} = ${f0(tee)} kkal</code>. PAL 1,40–1,69 untuk gaya hidup sedentari/ringan, 1,70–1,99 aktif, 2,00–2,40 sangat aktif (FAO/WHO/UNU 2004).`,
      `<strong>Target</strong> = TEE ${goal >= 0 ? "+" : "−"} ${f0(Math.abs(goal))} = ${f0(tee + goal)} kkal${capped ? `, dibatasi minimal ${f0(floor)} kkal` : ""}. Defisit 500–750 kkal/hari dianjurkan pedoman AHA/ACC/TOS 2013 untuk penurunan bertahap.`,
      `<strong>Perkiraan laju</strong> = defisit × 7 ÷ 7.700 kkal/kg. Penurunan akan melambat seiring adaptasi metabolik (model dinamis Hall 2011), jadi evaluasi ulang setiap 4 minggu.`,
      `<strong>Makronutrien:</strong> protein ${f1(proK)} g/kg × ${f1(bb)} kg = ${f0(proG)} g; lemak ${f0(fatPct)}% × ${f0(target)} ÷ 9 = ${f0(fatG)} g; karbohidrat = sisa energi ÷ 4 = ${f0(choG)} g. Protein 1,2–1,6 g/kg membantu mempertahankan massa otot saat defisit energi.`,
      `<strong>Cairan</strong> = 30–35 mL/kg${olah ? ` + 500 mL/jam olahraga (${f0(olah)} menit)` : ""} = ${fx(air[0] / 1000, 1)}–${fx(air[1] / 1000, 1)} L/hari.`
    ]);
    ringkas.energi = `BMR ${f0(bmr)} kkal, TEE ${f0(tee)} kkal (PAL ${fx(pal, 2)}); target ${f0(target)} kkal: protein ${f0(proG)} g, lemak ${f0(fatG)} g, KH ${f0(choG)} g; cairan ${fx(air[0] / 1000, 1)}–${fx(air[1] / 1000, 1)} L`;
  }

  /* ================= LATIHAN ================= */
  function calcLatihan() {
    const out = $("r-latihan"), det = $("r-latihan-detail");
    const usia = num("la-usia");
    if (!usia) { out.innerHTML = EMPTY; det.innerHTML = ""; delete ringkas.latihan; return; }
    const hrRest = num("la-hr"), bb = num("la-bb");
    const hrMax = 208 - 0.7 * usia;
    const z = (lo, hi) => hrRest ? [hrRest + lo * (hrMax - hrRest), hrRest + hi * (hrMax - hrRest)] : null;
    const zonaRows = hrRest
      ? [["Ringan (30–39% HRR)", z(0.30, 0.39)], ["Sedang (40–59% HRR)", z(0.40, 0.59)], ["Berat (60–89% HRR)", z(0.60, 0.89)]].map(([n, r]) => [n, `${f0(r[0])}–${f0(r[1])} bpm`])
      : [["Ringan (57–63% HRmax)", [0.57, 0.63]], ["Sedang (64–76% HRmax)", [0.64, 0.76]], ["Berat (77–95% HRmax)", [0.77, 0.95]]].map(([n, r]) => [n, `${f0(r[0] * hrMax)}–${f0(r[1] * hrMax)} bpm`]);

    const sedang = num0("la-sedang") || 0, berat = num0("la-berat") || 0, kek = num0("la-kekuatan") || 0, langkah = num0("la-langkah");
    const ekuiv = sedang + 2 * berat;
    const metMin = 4 * sedang + 8 * berat;
    const statusPA = ekuiv >= 300 ? ["Melebihi target WHO", "b-normal"] : ekuiv >= 150 ? ["Memenuhi target WHO", "b-normal"] : ekuiv > 0 ? ["Belum memenuhi target", "b-over"] : ["Belum aktif", "b-obese"];
    const stepKat = langkah === null ? null : langkah < 5000 ? "sedentari" : langkah < 7500 ? "aktivitas rendah" : langkah < 10000 ? "cukup aktif" : "aktif";

    const met = Number($("la-jenis").value), dur = num("la-durasi"), sesi = num("la-sesi"), rpe = num0("la-rpe");
    const kcal = bb && dur ? met * bb * dur / 60 : null;
    const srpe = dur && rpe !== null ? rpe * dur : null;
    const mingguan = srpe && sesi ? srpe * sesi : null;

    out.innerHTML = `
      <div class="note">Denyut nadi maksimal (Tanaka)</div>
      <div class="big">${f0(hrMax)} <span style="font-size:1.1rem">bpm</span></div>
      <span class="badge ${statusPA[1]}">${statusPA[0]}</span>
      ${table(["Zona latihan", hrRest ? "Target (Karvonen)" : "Target (% HRmax)"], zonaRows)}
      ${mini([[`${f0(ekuiv)} mnt`, "Setara aktivitas sedang/minggu (target 150–300)"], [`${f0(metMin)}`, "MET-menit/minggu"], [`${f0(kek)} hari`, "Latihan kekuatan (target ≥2)"], [langkah !== null ? f0(langkah) : "—", stepKat ? `Langkah/hari · ${stepKat}` : "Langkah/hari"]])}
      ${kcal || srpe ? mini([[kcal ? `${f0(kcal)} kkal` : "—", "Energi per sesi"], [kcal && sesi ? `${f0(kcal * sesi)} kkal` : "—", "Energi latihan per minggu"], [srpe ? `${f0(srpe)} AU` : "—", "Beban sesi (sRPE)"], [mingguan ? `${f0(mingguan)} AU` : "—", mingguan ? `Beban minggu · naik maks. ${f0(mingguan * 1.1)} AU` : "Beban per minggu"]]) : ""}
      ${ekuiv < 150 ? `<div class="callout good"><strong>Rencana tambahan:</strong> kurang ${f0(150 - ekuiv)} menit setara sedang per minggu, misalnya ${Math.ceil((150 - ekuiv) / 30)}× sesi 30 menit tele-exercise di jam kerja atau ${f0((150 - ekuiv) / 5)} menit jalan cepat per hari kerja.</div>` : ""}`;

    det.innerHTML = steps("Cara menghitung", [
      `<strong>HRmax</strong> (Tanaka 2001) = <code>208 − 0,7 × ${f0(usia)} = ${f0(hrMax)} bpm</code>.`,
      hrRest ? `<strong>Karvonen:</strong> HR target = HR istirahat + % × (HRmax − HR istirahat) = <code>${f0(hrRest)} + % × ${f0(hrMax - hrRest)}</code>. Zona sedang 40–59% HRR dan berat 60–89% HRR (ACSM 2021).` : "<strong>Zona % HRmax</strong> dipakai karena denyut nadi istirahat belum diisi. Isi HR istirahat untuk metode Karvonen yang lebih personal.",
      `<strong>Volume aktivitas:</strong> setara sedang = ${f0(sedang)} + 2 × ${f0(berat)} = ${f0(ekuiv)} menit; MET-menit = 4 × ${f0(sedang)} + 8 × ${f0(berat)} = ${f0(metMin)}. Target WHO 2020: 150–300 menit sedang atau 75–150 menit berat per minggu, plus latihan kekuatan ≥2 hari.`,
      langkah !== null ? `<strong>Langkah:</strong> &lt;5.000 sedentari; 5.000–7.499 rendah; 7.500–9.999 cukup aktif; ≥10.000 aktif (Tudor-Locke &amp; Bassett 2004). Penurunan risiko kematian mendatar pada ±8.000–10.000 langkah untuk usia &lt;60 tahun (Paluch 2022).` : "<strong>Langkah:</strong> isi rata-rata langkah harian dari pedometer atau smartwatch.",
      kcal ? `<strong>Energi sesi</strong> = MET × BB × jam = <code>${fx(met, 1)} × ${f1(bb)} × ${f2(dur / 60)} = ${f0(kcal)} kkal</code> (nilai bruto, termasuk metabolisme istirahat).` : "<strong>Energi sesi:</strong> isi berat badan dan durasi.",
      srpe ? `<strong>Beban sRPE</strong> (Foster 2001) = RPE × durasi = <code>${f0(rpe)} × ${f0(dur)} = ${f0(srpe)} AU</code>${mingguan ? `; per minggu ${f0(mingguan)} AU. Naikkan beban mingguan maksimal ±10% agar adaptasi aman.` : "."} Riset tele-exercise karyawan: sesi 30 menit di jam kerja sudah memperbaiki kebugaran (Kuswari 2022).` : "<strong>Beban sRPE:</strong> isi durasi dan RPE sesi."
    ]);
    ringkas.latihan = `HRmax ${f0(hrMax)} bpm; zona sedang ${zonaRows[1][1]}; aktivitas setara sedang ${f0(ekuiv)} menit/minggu (${statusPA[0]})${langkah !== null ? `; ${f0(langkah)} langkah/hari` : ""}${srpe ? `; sRPE ${f0(srpe)} AU/sesi` : ""}`;
  }

  /* ================= KEBUGARAN ================= */
  function calcBugar() {
    const out = $("r-bugar"), det = $("r-bugar-detail");
    const usia = num("bg-usia"), bb = num("bg-bb"), m = $("bg-metode").value;
    let vo2 = null, rumus = "", cara = "";
    if (m === "step") {
      const hr = num("bg-stephr");
      if (hr) { vo2 = jk === "L" ? 111.33 - 0.42 * hr : 65.81 - 0.1847 * hr; rumus = jk === "L" ? `111,33 − 0,42 × ${f0(hr)}` : `65,81 − 0,1847 × ${f0(hr)}`; cara = "Queens College Step Test"; }
    } else if (m === "rockport") {
      const mn = num0("bg-rmin"), dt = num0("bg-rdet") || 0, hr = num("bg-rhr");
      if (mn && hr && bb && usia) {
        const t = mn + dt / 60, lb = bb * 2.2046;
        vo2 = 132.853 - 0.0769 * lb - 0.3877 * usia + 6.315 * (jk === "L" ? 1 : 0) - 3.2649 * t - 0.1565 * hr;
        rumus = `132,853 − 0,0769 × ${f1(lb)} − 0,3877 × ${f0(usia)} + 6,315 × ${jk === "L" ? 1 : 0} − 3,2649 × ${f2(t)} − 0,1565 × ${f0(hr)}`;
        cara = "Rockport 1-mile walk";
      }
    } else {
      const d = num("bg-cjarak");
      if (d) { vo2 = (d - 504.9) / 44.73; rumus = `(${f0(d)} − 504,9) ÷ 44,73`; cara = "Cooper 12 menit"; }
    }
    const grip = num("bg-grip"), push = num0("bg-pushup");
    const gripCut = jk === "L" ? 28 : 18;
    if (vo2 === null && !grip) { out.innerHTML = EMPTY; det.innerHTML = ""; delete ringkas.bugar; return; }
    let catHtml = "", catTxt = "";
    if (vo2 !== null && usia) {
      const { cat, bounds } = vo2Category(vo2, usia);
      catHtml = `<span class="badge ${cat[1]}">${cat[0]}</span>`;
      catTxt = `${cat[0]} (norma Shvartz &amp; Reibold 1990; batas Rata-rata ${bounds[2]}, Baik ${bounds[3]} mL/kg/menit)`;
    }
    out.innerHTML = `
      ${vo2 !== null ? `<div class="note">Estimasi VO2max (${cara})</div><div class="big">${f1(vo2)} <span style="font-size:1.1rem">mL/kg/menit</span></div>${catHtml}` : `<div class="note">Kapasitas aerobik</div><p class="note">Isi data tes untuk estimasi VO2max.</p>`}
      <dl class="kv">
        ${vo2 !== null && bb ? `<dt>VO2max absolut</dt><dd>${f2(vo2 * bb / 1000)} L/menit</dd>` : ""}
        ${vo2 !== null ? `<dt>Kapasitas kerja aerobik</dt><dd>±${f1(vo2 / 3.5)} MET</dd>` : ""}
        <dt>Handgrip</dt><dd>${grip ? `${f1(grip)} kg · ${grip < gripCut ? "<strong>kekuatan rendah</strong>" : "normal"} (batas ${gripCut} kg)` : "—"}</dd>
        <dt>Push-up 1 menit</dt><dd>${push !== null ? `${f0(push)} kali` : "—"}</dd>
      </dl>
      <p class="note" style="margin-top:12px">Ulangi tes yang sama dengan protokol yang sama pada minggu ke-0, ke-6, dan ke-12 agar perubahan dapat dibandingkan.</p>`;
    det.innerHTML = steps("Cara menghitung & protokol", [
      vo2 !== null ? `<strong>${cara}:</strong> <code>VO2max = ${rumus} = ${f1(vo2)} mL/kg/menit</code>.${catTxt ? " Kategori: " + catTxt + "." : " Isi usia untuk kategori."}` : "<strong>VO2max:</strong> isi data tes.",
      "<strong>Queens College Step Test</strong> (McArdle 1972): naik-turun bangku 41,3 cm selama 3 menit dengan metronom 96 ketukan (L, 24 langkah/menit) atau 88 ketukan (P, 22 langkah/menit); hitung nadi 15 detik mulai detik ke-5 setelah selesai, kalikan 4. Cocok untuk ruang rapat atau tangga kantor.",
      "<strong>Rockport</strong> (Kline 1987): jalan secepat mungkin 1 mil (1.609 m), catat waktu dan denyut nadi akhir. Aman untuk karyawan obesitas atau yang jarang berolahraga.",
      "<strong>Cooper</strong> (1968): lari/jalan sejauh mungkin dalam 12 menit. Hanya untuk karyawan yang sudah terbiasa berolahraga dan lolos skrining.",
      `<strong>Handgrip</strong>: batas kekuatan rendah &lt;28 kg (L) dan &lt;18 kg (P) menurut AWGS 2019. VO2max ÷ 3,5 = kapasitas dalam MET, berguna untuk memilih aktivitas dari Compendium yang sesuai.`
    ]);
    ringkas.bugar = `${vo2 !== null ? `VO2max ${f1(vo2)} mL/kg/menit (${cara}${usia ? ", " + vo2Category(vo2, usia).cat[0] : ""})` : "VO2max belum diukur"}${grip ? `; handgrip ${f1(grip)} kg` : ""}${push !== null ? `; push-up ${f0(push)}` : ""}`;
  }

  /* ================= WELLBEING ================= */
  function calcWellbeing() {
    const out = $("r-wellbeing"), det = $("r-wellbeing-detail");
    const vals = [...document.querySelectorAll(".w5")].map((s) => s.value === "" ? null : Number(s.value));
    const tidur = num("wb-tidur"), shift = $("wb-shift").value === "1";
    const lengkap = vals.every((x) => x !== null);
    if (!lengkap && !tidur) { out.innerHTML = '<div class="label">Jawab kelima pertanyaan</div><p class="note">Skor muncul setelah semua pertanyaan dijawab.</p>'; det.innerHTML = ""; delete ringkas.wellbeing; return; }
    const raw = lengkap ? vals.reduce((a, b) => a + b, 0) : null;
    const skor = raw !== null ? raw * 4 : null;
    const kat = skor === null ? null : skor <= 28 ? ["Sangat rendah: rujuk skrining depresi", "b-obese"] : skor < 50 ? ["Rendah: perlu perhatian", "b-over"] : skor < 70 ? ["Cukup", "b-under"] : ["Baik", "b-normal"];
    const tKat = !tidur ? null : tidur < 7 ? ["Kurang dari anjuran", "b-over"] : tidur <= 9 ? ["Sesuai anjuran", "b-normal"] : ["Lebih dari anjuran", "b-under"];
    out.innerHTML = `
      ${skor !== null ? `<div class="note">Indeks WHO-5</div><div class="big">${skor} <span style="font-size:1.1rem">/ 100</span></div><span class="badge ${kat[1]}">${kat[0]}</span>
      ${scale([[28, "var(--red)"], [22, "var(--orange)"], [20, "var(--amber)"], [30, "var(--green)"]], skor, 0, 100, ["0", "28", "50", "70", "100"])}` : `<div class="note">Indeks WHO-5</div><p class="note">Jawab kelima pertanyaan.</p>`}
      <dl class="kv">
        <dt>Tidur malam</dt><dd>${tidur ? `${fx(tidur, 1)} jam · <span class="badge ${tKat[1]}">${tKat[0]}</span>` : "—"}</dd>
      </dl>
      ${skor !== null && skor <= 28 ? `<div class="callout warn">Skor ≤28 mengarah pada kemungkinan depresi. Sarankan karyawan berkonsultasi dengan psikolog atau dokter perusahaan; jangan ditangani hanya dengan program olahraga.</div>` : ""}
      ${shift ? `<p class="note" style="margin-top:12px">Pekerja shift: jaga jadwal tidur utama yang konsisten, tidur siang singkat 10–20 menit sebelum shift malam, dan hindari kafein 6 jam sebelum tidur.</p>` : ""}`;
    det.innerHTML = steps("Cara menghitung", [
      `<strong>WHO-5</strong> = jumlah skor 5 butir (0–25) × 4 = ${raw !== null ? `<code>${raw} × 4 = ${skor}</code>` : "—"}. Skor &lt;50 menandakan kesejahteraan rendah; ≤28 mengarah pada kemungkinan depresi dan perlu rujukan (Topp 2015). Perubahan ≥10 poin dianggap bermakna secara klinis.`,
      "<strong>Tidur</strong>: dewasa 18–64 tahun dianjurkan 7–9 jam per malam (National Sleep Foundation, Hirshkowitz 2015). Kurang tidur mendorong pilihan makanan padat energi dan menurunkan motivasi berolahraga.",
      "<strong>Untuk tingkat perusahaan</strong>, laporkan rerata WHO-5 dan % karyawan dengan skor &lt;50 sebelum dan sesudah program, bersama data absensi."
    ]);
    ringkas.wellbeing = `${skor !== null ? `WHO-5 ${skor}/100 (${kat[0]})` : "WHO-5 belum lengkap"}${tidur ? `; tidur ${fx(tidur, 1)} jam` : ""}${shift ? "; pekerja shift" : ""}`;
  }

  /* ================= PROGRAM ================= */
  function calcProgram() {
    const out = $("r-program"), det = $("r-program-detail");
    const K = num("pg-karyawan"), prev = num("pg-prev");
    if (!K || !prev) { out.innerHTML = EMPTY; det.innerHTML = ""; delete ringkas.program; return; }
    const ikut = (num0("pg-ikut") ?? 60) / 100, drop = (num0("pg-drop") ?? 20) / 100;
    const sasaran = K * prev / 100, peserta = sasaran * ikut, selesai = peserta * (1 - drop);
    const target3 = selesai * 0.5;

    const d = num("pg-d"), sd = num("pg-sd"), zb = Number($("pg-power").value);
    const n = d && sd ? Math.ceil(Math.pow((1.96 + zb) * sd / d, 2)) : null;
    const nAdj = n ? Math.ceil(n / (1 - drop)) : null;

    const biaya = num0("pg-biaya"), upah = num0("pg-upah"), sakit = num0("pg-sakit") || 0, turunSakit = (num0("pg-turunsakit") || 0) / 100;
    const wpai = (num0("pg-wpai") || 0) / 100, turunWpai = (num0("pg-turunwpai") || 0) / 100, hari = num("pg-hari") || 240, kg = num0("pg-kg");
    const biayaTot = biaya ? Math.round(peserta) * biaya : null;
    const absBase = upah ? Math.round(peserta) * sakit * upah : null;
    const absHemat = absBase !== null ? absBase * turunSakit : null;
    const presBase = upah ? Math.round(peserta) * wpai * hari * upah : null;
    const presHemat = upah ? Math.round(peserta) * turunWpai * hari * upah : null;
    const manfaat = absHemat !== null && presHemat !== null ? absHemat + presHemat : null;
    const roi = biayaTot && manfaat !== null ? (manfaat - biayaTot) / biayaTot * 100 : null;
    const roiAbs = biayaTot && absHemat !== null ? (absHemat - biayaTot) / biayaTot * 100 : null;
    const perKg = biayaTot && kg ? biayaTot / (Math.round(selesai) * kg) : null;

    out.innerHTML = `
      <div class="note">Peserta program (perkiraan)</div>
      <div class="big">${f0(peserta)} <span style="font-size:1.1rem">orang</span></div>
      <span class="badge b-under">${f0(selesai)} diperkirakan menyelesaikan program</span>
      ${mini([[f0(sasaran), "Karyawan sasaran (berisiko)"], [f0(target3), "Target turun BB ≥3% (50% penyelesai)"], [n ? `${f0(nAdj)}` : "—", n ? `Sampel evaluasi minimal (${f0(n)} + drop-out)` : "Isi perubahan & SD untuk sampel"], [nAdj ? (Math.round(peserta) >= nAdj ? "Cukup" : "Kurang") : "—", "Kecukupan peserta untuk evaluasi"]])}
      ${biayaTot ? table(["Komponen ekonomi (per tahun)", "Nilai"], [
        ["Biaya program", rp(biayaTot)],
        ["Biaya absensi peserta saat ini", absBase !== null ? rp(absBase) : "—"],
        ["Penghematan absensi", absHemat !== null ? rp(absHemat) : "—"],
        ["Biaya presenteeism peserta saat ini", presBase !== null ? rp(presBase) : "—"],
        ["Penghematan presenteeism", presHemat !== null ? rp(presHemat) : "—"],
        ["Biaya per kg BB turun", perKg ? rp(perKg) : "—"],
        ["<strong>ROI (absensi + presenteeism)</strong>", roi !== null ? `<strong>${roi >= 0 ? "+" : ""}${f0(roi)}%</strong>` : "—"],
        ["ROI konservatif (absensi saja)", roiAbs !== null ? `${roiAbs >= 0 ? "+" : ""}${f0(roiAbs)}%` : "—"]
      ]) : `<p class="note" style="margin-top:12px">Isi <strong>biaya per peserta</strong> dan <strong>upah harian</strong> untuk menghitung nilai ekonomi.</p>`}
      ${roi !== null ? `<div class="callout ${roiAbs !== null && roiAbs < 0 ? "warn" : "good"}">${roiAbs !== null && roiAbs < 0 ? "Bila hanya absensi yang dihitung, program belum balik modal dalam setahun." : "Program diperkirakan balik modal dari penghematan absensi saja."} RCT besar (Song &amp; Baicker 2019) tidak menemukan penghematan biaya dalam 18 bulan, jadi sajikan juga <strong>Value on Investment</strong>: kebugaran, keterlibatan, retensi, dan citra perusahaan.</div>` : ""}`;

    det.innerHTML = steps("Cara menghitung & tujuan SMART", [
      `<strong>Sasaran</strong> = ${f0(K)} × ${fx(prev, 1)}% = ${f0(sasaran)}; <strong>peserta</strong> = sasaran × ${f0(ikut * 100)}% = ${f0(peserta)}; <strong>penyelesai</strong> = peserta × (1 − ${f0(drop * 100)}%) = ${f0(selesai)}. Reach (RE-AIM) = peserta ÷ sasaran = ${f0(ikut * 100)}%.`,
      `<strong>Tujuan SMART contoh:</strong> dalam 12 minggu, ≥50% penyelesai (±${f0(target3)} orang) menurunkan BB ≥3% dari baseline; kehadiran tele-exercise ≥75%. Target klinis jangka panjang ≥5% (AHA/ACC/TOS 2013).`,
      n ? `<strong>Besar sampel</strong> uji t berpasangan: <code>n = [(1,96 + ${fx(zb, 2)}) × ${f1(sd)} ÷ ${f1(d)}]² = ${f0(n)}</code>; ditambah drop-out: <code>${f0(n)} ÷ (1 − ${f2(drop)}) = ${f0(nAdj)}</code> orang.` : "<strong>Besar sampel:</strong> isi perubahan yang ingin dideteksi dan SD selisih.",
      biayaTot ? `<strong>Absensi</strong> = peserta × hari sakit × upah harian = <code>${f0(peserta)} × ${fx(sakit, 1)} × ${rp(upah)}</code>; penghematan = × ${f0(turunSakit * 100)}%. <strong>Presenteeism</strong> (WPAI) = peserta × % hendaya × hari kerja × upah; penghematan memakai perbaikan ${f0(turunWpai * 100)} poin %.` : "<strong>Nilai ekonomi:</strong> isi biaya dan upah.",
      roi !== null ? `<strong>ROI</strong> = (manfaat − biaya) ÷ biaya = <code>(${rp(manfaat)} − ${rp(biayaTot)}) ÷ ${rp(biayaTot)} = ${f0(roi)}%</code>. Meta-analisis Baicker 2010 melaporkan penghematan US$3,27 biaya medis dan US$2,73 absensi per US$1, tetapi studi observasional cenderung bias seleksi.` : "<strong>ROI:</strong> isi seluruh komponen biaya.",
      "<strong>Evaluasi</strong>: ukur antropometri, kebugaran, WHO-5, dan WPAI pada minggu 0, 6, dan 12; laporkan kelima dimensi RE-AIM (reach, effectiveness, adoption, implementation, maintenance) dan pertahankan pemantauan hingga bulan ke-6."
    ]);
    ringkas.program = `Program: ${f0(K)} karyawan, ${fx(prev, 1)}% berisiko → ${f0(sasaran)} sasaran, ${f0(peserta)} peserta, ${f0(selesai)} penyelesai${nAdj ? `; sampel evaluasi ${f0(nAdj)}` : ""}${biayaTot ? `; biaya ${rp(biayaTot)}` : ""}${roi !== null ? `; ROI ${f0(roi)}% (konservatif ${f0(roiAbs)}%)` : ""}`;
  }

  function calcAll() { calcSkrining(); calcEnergi(); calcLatihan(); calcBugar(); calcWellbeing(); calcProgram(); }
  calcAll();

  const HASH = /^#(skrining|energi|latihan|bugar|wellbeing|program)$/;
  if (location.hash && HASH.test(location.hash)) openTab($("t-" + location.hash.slice(1)));

  /* ================= KONSULTASI ================= */
  const S = window.SITE || {};
  if (!S.whatsapp) { $("c-wa").hidden = true; $("c-mail").className = "btn btn-primary"; }
  const v = (id) => ($(id).value || "").trim();
  const normWA = (s) => { let d = s.replace(/[^\d]/g, ""); if (d.startsWith("0")) d = "62" + d.slice(1); else if (d.startsWith("8")) d = "62" + d; return d; };
  $("c-pesan").addEventListener("input", () => { $("c-count").textContent = v("c-pesan").length; });

  function setErr(id, msg) {
    const el = document.querySelector(`[data-err="${id}"]`);
    if (el) el.textContent = msg || "";
    const inp = $(id);
    if (inp && inp.type !== "checkbox") inp.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  function valid() {
    const checks = [
      ["c-nama", v("c-nama").length < 3 ? "Nama PIC wajib diisi." : ""],
      ["c-asal", v("c-asal").length < 3 ? "Nama perusahaan/instansi wajib diisi." : ""],
      ["c-wa-no", !/^62\d{8,13}$/.test(normWA(v("c-wa-no"))) ? "Nomor WhatsApp tidak valid. Contoh: 081234567890." : ""],
      ["c-email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("c-email")) ? "Alamat email tidak valid." : ""],
      ["c-pesan", v("c-pesan").length < 30 ? "Jelaskan tujuan program minimal 30 karakter." : ""],
      ["c-setuju", !$("c-setuju").checked ? "Centang persetujuan ketentuan konsultasi." : ""]
    ];
    let first = null;
    checks.forEach(([id, msg]) => { if (!setErr(id, msg) && !first) first = id; });
    if (first) { $(first).focus(); window.MK.toast("Mohon lengkapi data wajib"); return false; }
    return true;
  }
  ["c-nama", "c-asal", "c-wa-no", "c-email", "c-pesan"].forEach((id) => $(id).addEventListener("blur", () => { if (document.querySelector(`[data-err="${id}"]`).textContent) valid(); }));

  const hasilLines = () => Object.values(ringkas).map((h) => "• " + h.replace(/&amp;/g, "&"));
  function pesan() {
    const lines = [
      "Halo Dr. Mury, saya ingin berkonsultasi tentang program wellness korporat.",
      "",
      `Nama PIC: ${v("c-nama")}`,
      `Perusahaan/instansi: ${v("c-asal")}`,
      `No. WhatsApp: +${normWA(v("c-wa-no"))}`,
      `Email: ${v("c-email")}`,
      `Jumlah karyawan: ${v("c-jml") || "-"}`,
      `Fokus program: ${v("c-tujuan")}`,
      "",
      `Tujuan program: ${v("c-pesan")}`
    ];
    const hasil = hasilLines();
    if ($("c-hasil").checked && hasil.length) lines.push("", "Hasil kalkulator wellness murykuswari.com:", ...hasil);
    return lines.join("\n");
  }
  $("c-wa").addEventListener("click", () => { if (valid()) window.open(window.MK.waLink(pesan()), "_blank", "noopener"); });
  $("c-mail").addEventListener("click", () => {
    if (!valid()) return;
    location.href = `mailto:${S.email}?subject=${encodeURIComponent("Konsultasi Wellness Korporat - " + v("c-asal"))}&body=${encodeURIComponent(pesan())}`;
  });
  $("c-salin").addEventListener("click", () => {
    const hasil = hasilLines();
    if (!hasil.length) { window.MK.toast("Belum ada hasil kalkulator"); return; }
    window.MK.copyText(["Ringkasan kalkulator wellness murykuswari.com:", ...hasil].join("\n"), "Ringkasan hasil tersalin");
  });
})();
