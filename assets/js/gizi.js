/*
 * Kalkulator gizi olahraga murykuswari.com
 * IMT, persen lemak, berat badan ideal, kebutuhan energi & zat gizi makro,
 * makan sebelum-saat-setelah latihan, laju keringat, serta persen lemak terhadap VO2max.
 * Dasar: Panduan Pendampingan Gizi pada Atlet (Kemenkes RI 2021), Panduan Penyelenggaraan
 * Makanan Olahragawan dalam Kejuaraan Olahraga (Kemenkes RI 2022), dan literatur pada
 * bagian "Dasar perhitungan & daftar rujukan" di gizi.html.
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const num = (id) => { const el = $(id); if (!el) return null; const v = parseFloat(String(el.value).replace(",", ".")); return isFinite(v) && v > 0 ? v : null; };
  const num0 = (id) => { const el = $(id); if (!el) return null; const v = parseFloat(String(el.value).replace(",", ".")); return isFinite(v) && v >= 0 ? v : null; };
  const fx = (x, d) => Number(x).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });
  const f0 = (x) => Math.round(x).toLocaleString("id-ID");
  const f1 = (x) => fx(x, 1);
  const f2 = (x) => fx(x, 2);
  const r5 = (x) => Math.round(x / 5) * 5;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (r, t) => r[0] + (r[1] - r[0]) * t;
  const rng = (r, d = 1) => `${fx(r[0], d)}–${fx(r[1], d)}`;
  const ringkas = {}; // ringkasan hasil untuk dikirim ke konsultasi
  let jk = "L";
  let lastPct = null; // % lemak terakhir dari tab % Lemak
  let sweat = null;   // hasil tab laju keringat, dipakai tab makan sekitar latihan

  const EMPTY = '<div class="label">Isi data di sebelah kiri</div><p class="note">Hasil akan muncul otomatis begitu angka diisi.</p>';
  const EMPTY_TOP = '<div class="label">Isi data di atas</div><p class="note">Hasil akan muncul otomatis begitu angka diisi.</p>';

  /* ================= DATA RUJUKAN ================= */

  // Kelompok kebutuhan gizi (Kemenkes 2021 Tabel 1 & 27–29). Kelompok "ringan" dari ACSM 2016.
  const KEL = {
    power: { n: "Power / kekuatan (anaerobik)", cho: [8, 12], pro: [1.4, 1.7], fat: [1.8, 2.0], src: "Kemenkes 2021, Tabel 27–29" },
    endurance: { n: "Endurance / daya tahan (aerobik)", cho: [6, 10], pro: [1.2, 1.4], fat: [1.8, 2.1], src: "Kemenkes 2021, Tabel 27–29" },
    sprint: { n: "Sprint", cho: [5, 7], pro: [1.6, 1.7], fat: [1.8, 2.0], src: "Kemenkes 2021, Tabel 27–29" },
    permainan: { n: "Permainan (aerobik–anaerobik)", cho: [5, 7], pro: [1.4, 1.7], fat: [1.8, 2.2], src: "Kemenkes 2021, Tabel 27–29" },
    ringan: { n: "Keterampilan / beban fisik rendah", cho: [3, 5], pro: [1.2, 1.6], fat: null, src: "ACSM 2016 (Thomas dkk.)" }
  };

  // Pengelompokan KONI (Kemenkes 2022 Tabel 4): estimasi energi & distribusi % energi.
  const KONI = {
    akurasi: { n: "Akurasi", e: [2500, 3000], c: [50, 60], p: [16, 20], f: [20, 30] },
    konsentrasi: { n: "Konsentrasi", e: [2800, 3500], c: [50, 65], p: [16, 20], f: [25, 30] },
    permainan: { n: "Permainan", e: [3500, 4000], c: [50, 65], p: [12, 15], f: [30, 35] },
    beladiri: { n: "Bela diri", e: [3500, 4500], c: [45, 60], p: [17, 22], f: [25, 30] },
    terukur: { n: "Terukur", e: [4500, null], c: [60, 65], p: [15, 20], f: [20, 30] }
  };

  // Fase periodisasi (Kemenkes 2021 Tabel 10, 12, 14), g/kg BB/hari.
  const FASE = {
    pre: { n: "Persiapan (pre-season)", cho: [4, 7], pro: [1.2, 2.0], fat: [0.9, 1.3], preP: [5, 20], naH: [300, 500] },
    preWL: { n: "Persiapan dengan penurunan berat badan", cho: [3, 4], pro: [2.0, 2.5], fat: [0.8, 1.0], preP: [5, 20], naH: [300, 500] },
    in: { n: "Pertandingan (in-season)", cho: [5, 12], pro: [1.4, 2.0], fat: [1.0, 1.5], preP: [5, 15], naH: [500, 700] },
    off: { n: "Transisi (off-season)", cho: [3, 4], pro: [1.5, 2.3], fat: [1.0, 1.2], preP: [5, 10], naH: [0, 0] }
  };

  // Cabang olahraga: kelompok metabolik, kelompok KONI, MET [ringan, sedang, berat]
  // (nilai MET dibulatkan dari Compendium of Physical Activities, Ainsworth 2011).
  const SPORTS = [
    ["sepakbola", "Sepak bola / futsal", "permainan", "permainan", [7, 8, 10]],
    ["basket", "Bola basket", "permainan", "permainan", [6, 6.5, 8]],
    ["voli", "Bola voli (indoor/pasir)", "permainan", "permainan", [4, 6, 8]],
    ["bulutangkis", "Bulu tangkis", "permainan", "permainan", [5.5, 7, 8]],
    ["tenis", "Tenis lapangan", "permainan", "permainan", [5, 7.3, 8]],
    ["tenismeja", "Tenis meja", "permainan", "permainan", [3.5, 4, 5]],
    ["takraw", "Sepak takraw", "permainan", "permainan", [5, 7, 8]],
    ["hoki", "Hoki / rugby", "permainan", "permainan", [6, 7.8, 8.3]],
    ["beladiri", "Bela diri (pencak silat, taekwondo, karate, judo, wushu)", "permainan", "beladiri", [5.3, 7.8, 10.3]],
    ["tinju", "Tinju", "power", "beladiri", [5.5, 7.8, 12.8]],
    ["sprint", "Atletik sprint (100–400 m)", "sprint", "terukur", [5, 8, 10]],
    ["lompat", "Atletik lompat & lempar", "power", "terukur", [4, 5, 6]],
    ["larijauh", "Lari jarak menengah, jauh, maraton", "endurance", "terukur", [8.3, 9.8, 11.8]],
    ["sepeda", "Balap sepeda jalan raya", "endurance", "terukur", [6.8, 8, 10]],
    ["renangjauh", "Renang > 400 m / perairan terbuka", "endurance", "terukur", [5.8, 8.3, 9.8]],
    ["renangsprint", "Renang sprint (50–200 m)", "sprint", "terukur", [5.8, 8.3, 9.8]],
    ["dayung", "Dayung / kano", "endurance", "terukur", [4.8, 7, 8.5]],
    ["angkatbesi", "Angkat besi / angkat berat", "power", "terukur", [3.5, 5, 6]],
    ["binaraga", "Binaraga", "power", "konsentrasi", [3.5, 5, 6]],
    ["senam", "Senam artistik / ritmik", "power", "konsentrasi", [3, 3.8, 5.5]],
    ["panahan", "Panahan / menembak", "ringan", "akurasi", [2.5, 3.5, 4.3]],
    ["golf", "Golf / biliar / bowling", "ringan", "akurasi", [3, 3.8, 4.8]],
    ["catur", "Catur / bridge / e-sport", "ringan", "konsentrasi", [1.5, 1.5, 2]],
    ["hiit", "Sirkuit / HIIT / CrossFit", "permainan", null, [4.3, 8, 9]],
    ["gym", "Latihan beban untuk kebugaran", "ringan", null, [3.5, 5, 6]],
    ["kebugaran", "Kebugaran umum (jogging, bersepeda santai, senam aerobik)", "ringan", null, [4, 6, 8]]
  ].map(([k, n, kel, koni, met]) => ({ k, n, kel, koni, met }));
  const SPORT = Object.fromEntries(SPORTS.map((s) => [s.k, s]));
  const INT_LABEL = ["ringan", "sedang", "berat"];
  const INT_FACTOR = [0.6, 1, 1.4];

  // Beban latihan harian (ACSM 2016 / Burke 2011), g KH/kg BB/hari.
  const LOAD = [
    { n: "ringan (latihan teknik/intensitas rendah)", cho: [3, 5] },
    { n: "sedang (±1 jam/hari)", cho: [5, 7] },
    { n: "tinggi (1–3 jam/hari, intensitas sedang–tinggi)", cho: [6, 10] },
    { n: "sangat tinggi (>4–5 jam/hari)", cho: [8, 12] }
  ];

  // Koefisien aktivitas fisik (IOM 2005; Kemenkes 2021 Tabel 26).
  const PA_COEF = { L: [1.0, 1.11, 1.25, 1.48], P: [1.0, 1.12, 1.27, 1.45], La: [1.0, 1.13, 1.26, 1.42], Pa: [1.0, 1.16, 1.31, 1.56] };
  const PA_CAT = ["Sedentari", "Aktivitas ringan", "Aktif", "Sangat aktif"];
  const PA_RANGE = ["1,0–1,39", "1,4–1,59", "1,6–1,89", "1,9–2,49"];

  // Norma VO2max Shvartz & Reibold (1990), batas bawah kategori 2..7 per kelompok usia.
  const VO2_AGE = [24, 29, 34, 39, 44, 49, 54, 59, 200];
  const VO2_NORM = {
    L: [[32, 38, 44, 51, 57, 63], [31, 36, 43, 49, 54, 60], [29, 35, 41, 46, 52, 57], [28, 33, 39, 44, 49, 55], [26, 32, 36, 42, 47, 52], [25, 30, 35, 40, 44, 49], [24, 28, 33, 37, 42, 47], [22, 27, 31, 35, 40, 44], [21, 25, 29, 33, 37, 41]],
    P: [[27, 32, 37, 42, 47, 52], [26, 31, 36, 41, 45, 50], [25, 30, 34, 38, 43, 47], [24, 28, 32, 36, 41, 45], [22, 26, 30, 34, 38, 42], [21, 24, 28, 32, 36, 39], [19, 23, 26, 30, 33, 37], [18, 21, 24, 28, 31, 34], [16, 19, 22, 25, 28, 31]]
  };
  const VO2_CAT = [["Sangat kurang", "b-obese"], ["Kurang", "b-over"], ["Cukup", "b-under"], ["Rata-rata", "b-under"], ["Baik", "b-normal"], ["Sangat baik", "b-normal"], ["Istimewa", "b-normal"]];

  /* ================= UI DASAR ================= */

  // Isi pilihan cabang olahraga dan kelompok gizi.
  document.querySelectorAll(".cabor-select").forEach((sel) => {
    sel.innerHTML = SPORTS.map((s) => `<option value="${s.k}">${s.n}</option>`).join("");
    sel.value = "sepakbola";
  });
  document.querySelectorAll(".kel-select").forEach((sel) => {
    sel.innerHTML = Object.entries(KEL).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join("");
    sel.value = SPORT.sepakbola.kel;
  });

  const tabs = document.querySelectorAll(".calc-tab");
  function openTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      $(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach((t) => t.addEventListener("click", () => { openTab(t); history.replaceState(null, "", "#" + t.id.slice(2)); }));

  // Isian bersama antartab (BB, TB, usia, % lemak, cabor, durasi, intensitas, fase, jenis kelamin).
  function syncShare(el) {
    const k = el.dataset.share;
    if (!k) return;
    document.querySelectorAll(`[data-share="${k}"]`).forEach((x) => { if (x !== el) x.value = el.value; });
    if (k === "cabor" && SPORT[el.value]) document.querySelectorAll('[data-share="kel"]').forEach((x) => { x.value = SPORT[el.value].kel; });
  }
  document.addEventListener("input", (e) => { syncShare(e.target); calcAll(); });
  document.addEventListener("change", (e) => { syncShare(e.target); calcAll(); });
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
  $("pf-metode").addEventListener("change", () => {
    const m = $("pf-metode").value;
    document.querySelectorAll("[data-pm]").forEach((el) => { el.hidden = el.dataset.pm !== m; });
  });

  function scale(segments, value, min, max, labels) {
    const pos = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    return `<div class="scale">${segments.map(([w, c]) => `<span style="width:${w}%;background:${c}"></span>`).join("")}</div>
      <div class="scale-marker"><i style="left:${pos}%"></i></div>
      <div class="scale-labels">${labels.map((l) => `<span>${l}</span>`).join("")}</div>`;
  }
  const table = (head, rows, foot) => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((h) => `<th${h.startsWith("#") ? ' class="n"' : ""}>${h.replace(/^#/, "")}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${head[i] && head[i].startsWith("#") ? ' class="n"' : ""}>${c}</td>`).join("")}</tr>`).join("")}</tbody>${foot ? `<tfoot><tr>${foot.map((c, i) => `<td${head[i] && head[i].startsWith("#") ? ' class="n"' : ""}>${c}</td>`).join("")}</tr></tfoot>` : ""}</table></div>`;
  const steps = (title, items, open) => `<details class="steps"${open ? " open" : ""}><summary>${title}</summary><div><ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol></div></details>`;
  const broca = (tb) => ((jk === "L" && tb < 160) || (jk === "P" && tb < 150)) ? tb - 100 : (tb - 100) * 0.9;

  // Konversi ke porsi Daftar Bahan Makanan Penukar: nasi 100 g = 40 g KH; buah 1 porsi = 12 g KH.
  function choFood(g) {
    if (g < 6) return "—";
    let nasi = Math.floor((g * 0.8) / 20) / 2;
    if (g < 30) nasi = 0;
    const buah = Math.max(0, Math.round((g - nasi * 40) / 12));
    const parts = [];
    if (nasi) parts.push(`${fx(nasi, nasi % 1 ? 1 : 0)} porsi nasi (${f0(nasi * 100)} g) atau roti ${f0(nasi * 3)} iris`);
    if (buah) parts.push(`${buah} porsi buah (mis. pisang ambon ${buah} buah sedang)`);
    return parts.join(" + ");
  }
  function proFood(g) {
    if (g < 5) return "—";
    const lauk = Math.max(1, Math.round(g / 7));
    return `${lauk} porsi lauk hewani rendah lemak (mis. ${lauk > 1 ? lauk + " × " : ""}40 g dada ayam/ikan atau 1 butir telur per porsi)`;
  }

  /* ================= IMT ================= */
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
      <p class="note" style="margin-top:14px">IMT tidak membedakan otot dan lemak. Atlet berotot bisa ber-IMT tinggi tetapi berlemak rendah, jadi lengkapi dengan pengukuran persen lemak tubuh (Kemenkes 2021).</p>
      <p class="note" style="margin:0">Standar: ${std.src}</p>`;
    ringkas.imt = `IMT ${f1(imt)} (${kat[1]}, standar ${std.src}); BB ${bb} kg, TB ${tb} cm`;
  }

  /* ================= PERSEN LEMAK ================= */
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
    if (pct == null || !isFinite(pct)) { out.innerHTML = EMPTY; delete ringkas.lemak; lastPct = null; return; }
    pct = Math.max(2, pct);
    lastPct = pct;
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
      ${scale(segs, pct, s.min, s.max, bounds.map((b) => b + "%"))}
      ${fm ? `<dl class="kv"><dt>Massa lemak</dt><dd>${f1(fm)} kg</dd><dt>Massa bebas lemak (otot, tulang, air)</dt><dd>${f1(bb - fm)} kg</dd></dl>` : ""}
      <p class="note" style="margin-top:14px">Kategori mengacu pada American Council on Exercise (ACE). Metode: ${cara}. Untuk hasil lebih akurat gunakan BIA, skinfold, atau DEXA. Nilai ini otomatis dipakai di tab Energi dan Performa bila kolom % lemak di sana kosong.</p>`;
    ringkas.lemak = `Lemak tubuh ${f1(pct)}% (${kat[1]}, metode ${cara})`;
    document.querySelectorAll('[data-share="lemak"]').forEach((el) => { if (!el.value) el.placeholder = f1(pct).replace(",", "."); });
  }
  const pctLemak = (id) => num(id) || lastPct;

  /* ================= BERAT BADAN IDEAL ================= */
  function calcBBI() {
    const out = $("r-bbi");
    const tb = num("bbi-tb"), bb = num("bbi-bb");
    if (!tb) { out.innerHTML = EMPTY; delete ringkas.bbi; return; }
    const pendek = (jk === "L" && tb < 160) || (jk === "P" && tb < 150);
    const bro = broca(tb);
    const m = tb / 100;
    const inch = Math.max(0, tb / 2.54 - 60);
    const devine = (jk === "L" ? 50 : 45.5) + 2.3 * inch;
    let target = "";
    const lemak = pctLemak("bbi-lemak"), tl = num("bbi-target");
    if (bb && lemak && tl && tl < 60) {
      const lbm = bb * (1 - lemak / 100);
      const bt = lbm / (1 - tl / 100);
      target = `<dt>Berat target pada ${f1(tl)}% lemak (massa otot dipertahankan)</dt><dd>${f1(bt)} kg</dd>
        <dt>Perubahan yang diperlukan</dt><dd>${bt < bb ? "−" : "+"}${f1(Math.abs(bb - bt))} kg</dd>`;
    }
    out.innerHTML = `
      <div class="note">Berat badan ideal (Broca modifikasi)</div>
      <div class="big">${f1(bro)} kg</div>
      <span class="badge b-normal">Rentang sehat ${f1(18.5 * m * m)}–${f1(25 * m * m)} kg</span>
      <dl class="kv">
        <dt>Rumus Broca${pendek ? " (tanpa pengurangan 10%)" : " (TB − 100) − 10%"}</dt><dd>${f1(bro)} kg</dd>
        <dt>Rentang IMT normal Kemenkes 18,5–25</dt><dd>${f1(18.5 * m * m)}–${f1(25 * m * m)} kg</dd>
        <dt>Rumus Devine (rujukan klinis)</dt><dd>${f1(devine)} kg</dd>
        ${bb ? `<dt>Berat Anda saat ini</dt><dd>${f1(bb)} kg</dd>` : ""}
        ${target}
      </dl>
      <p class="note" style="margin-top:14px">Bagi atlet, "berat ideal" sebaiknya ditentukan dari target persen lemak dan kelas tanding, bukan hanya tinggi badan. Isi % lemak untuk menghitung berat target.</p>`;
    ringkas.bbi = `BB ideal (Broca) ${f1(bro)} kg, rentang sehat ${f1(18.5 * m * m)}–${f1(25 * m * m)} kg`;
  }

  /* ================= ENERGI & ZAT GIZI MAKRO ================= */
  function energiCore() {
    const bb = num("en-bb"), tb = num("en-tb"), usia = num("en-usia");
    if (!bb || !tb || !usia || usia < 9) return null;
    const dur = num0("en-dur") || 0;
    const sport = SPORT[$("en-cabor").value] || SPORTS[0];
    const kelKey = $("en-kel").value, kel = KEL[kelKey];
    const it = Number($("en-int").value);
    const met = sport.met[it];
    const base = Number($("en-base").value);
    const adj = Number($("en-tujuan").value);
    const faseKey = $("en-fase").value;
    const effFase = adj < 0 && faseKey === "pre" ? "preWL" : faseKey;
    const fase = FASE[effFase];
    const H = tb / 100;
    const anak = usia < 19;

    // 1. Tingkat aktivitas fisik (PAL) dari MET × durasi (IOM 2005).
    const dPAL = ((met - 1) * (1.15 / 0.9) * dur) / 1440;
    const pal = base + dPAL;
    const cat = pal < 1.4 ? 0 : pal < 1.6 ? 1 : pal < 1.9 ? 2 : 3;
    const pa = PA_COEF[jk + (anak ? "a" : "")][cat];

    // 2. Berat badan untuk perhitungan: BBI bila status gizi lebih (Kemenkes 2021).
    const imt = bb / (H * H);
    const bbi = broca(tb);
    const useBBI = !anak && imt > 25 && bbi < bb;
    const W = useBBI ? bbi : bb;

    // 3. Kebutuhan energi (Kemenkes 2021 / IOM 2005).
    let eer, rumus;
    if (!anak) {
      if (jk === "L") { eer = 662 - 9.53 * usia + pa * (15.91 * W + 539.6 * H); rumus = `662 − (9,53 × ${f0(usia)}) + ${f2(pa)} × (15,91 × ${f1(W)} + 539,6 × ${f2(H)})`; }
      else { eer = 354 - 6.91 * usia + pa * (9.36 * W + 726 * H); rumus = `354 − (6,91 × ${f0(usia)}) + ${f2(pa)} × (9,36 × ${f1(W)} + 726 × ${f2(H)})`; }
    } else {
      if (jk === "L") { eer = 88.5 - 61.9 * usia + pa * (26.7 * W + 903 * H) + 25; rumus = `88,5 − (61,9 × ${f0(usia)}) + ${f2(pa)} × (26,7 × ${f1(W)} + 903 × ${f2(H)}) + 25`; }
      else { eer = 135.3 - 30.8 * usia + pa * (10 * W + 934 * H) + 25; rumus = `135,3 − (30,8 × ${f0(usia)}) + ${f2(pa)} × (10 × ${f1(W)} + 934 × ${f2(H)}) + 25`; }
    }
    const E = eer + adj;
    const eee = met * bb * dur / 60; // energi latihan (gross)
    const bmr = 10 * bb + 6.25 * tb - 5 * usia + (jk === "L" ? 5 : -161);

    // 4. Beban latihan: durasi × intensitas → posisi dalam rentang (0 = batas bawah, 1 = batas atas).
    const effH = (dur / 60) * INT_FACTOR[it];
    const L = clamp(effH / 4, 0, 1);
    const loadIdx = dur === 0 ? 0 : effH < 1 ? 0 : effH < 2 ? 1 : effH < 4 ? 2 : 3;

    // 5. Karbohidrat & protein (g/kg BB).
    let choR = kel.cho, choSrc = `${kel.n}: ${rng(kel.cho, 0)} g/kg (${kel.src})`;
    if (effFase === "preWL" || effFase === "off") { choR = fase.cho; choSrc = `${fase.n}: ${rng(fase.cho, 0)} g/kg (Kemenkes 2021)`; }
    const choG = lerp(choR, L);
    let proR = kel.pro, proSrc = `${kel.n}: ${rng(kel.pro)} g/kg (${kel.src})`;
    if (effFase === "preWL") { proR = fase.pro; proSrc = `${fase.n}: ${rng(fase.pro)} g/kg (Kemenkes 2021)`; }
    let proG = lerp(proR, L);
    if (effFase === "off") { proG = clamp(proG, fase.pro[0], fase.pro[1]); proSrc += `; fase transisi ${rng(fase.pro)} g/kg`; }
    if (adj > 0 && proG < 1.6) { proG = 1.6; proSrc += "; menambah massa otot ≥1,6 g/kg (Kemenkes 2021)"; }
    if (adj < 0 && proG < 1.6) { proG = 1.6; proSrc += "; defisit energi ≥1,6 g/kg untuk menjaga massa otot"; }

    let P = proG * W, C = choG * W;
    const Ctable = C;

    // 6. Lemak = sisa energi, dibatasi % energi kelompok KONI (Kemenkes 2022) atau 20–35% (ACSM 2016).
    const koni = sport.koni ? KONI[sport.koni] : null;
    const fatPct = koni ? koni.f : [20, 35];
    let F = (E - 4 * P - 4 * C) / 9, fatNote = "";
    const Flo = (fatPct[0] / 100) * E / 9, Fhi = (fatPct[1] / 100) * E / 9;
    if (F < Flo) { F = Flo; C = Math.max(0, (E - 4 * P - 9 * F) / 4); fatNote = "cut"; }
    else if (F > Fhi) { F = Fhi; C = (E - 4 * P - 9 * F) / 4; fatNote = "add"; }

    const pctFat = pctLemak("en-lemak");
    const ffm = pctFat ? bb * (1 - pctFat / 100) : null;
    const ea = ffm ? (E - eee) / ffm : null;

    return { bb, tb, usia, dur, sport, kelKey, kel, it, met, base, adj, faseKey, effFase, fase, anak, dPAL, pal, cat, pa, imt, bbi, useBBI, W, eer, rumus, E, eee, bmr, effH, L, loadIdx, choR, choSrc, proR, proSrc, choG, proG, P, C, Ctable, F, fatPct, fatNote, koni, pctFat, ffm, ea };
  }

  function calcEnergi() {
    const out = $("r-energi"), det = $("r-energi-detail");
    const R = energiCore();
    if (!R) { out.innerHTML = EMPTY; det.innerHTML = ""; delete ringkas.energi; return; }
    const kk = (g, k) => g * k;
    const tot = R.E;
    const pc = (kcal) => f0((kcal / tot) * 100) + "%";
    const tujuanTxt = R.adj < 0 ? "Defisit untuk turun lemak" : R.adj > 0 ? "Surplus untuk massa otot" : "Pemeliharaan";
    const kelTxt = R.kel.n;
    const fatRef = R.kel.fat ? `${rng(R.kel.fat)} g/kg (Tabel 29); fase ${rng(R.fase.fat)} g/kg` : `fase ${rng(R.fase.fat)} g/kg`;

    out.innerHTML = `
      <div class="note">Kebutuhan energi pada hari ${R.dur ? "latihan" : "istirahat"}</div>
      <div class="big">${f0(R.E)} <span style="font-size:1.1rem">kkal</span></div>
      <span class="badge b-normal">${PA_CAT[R.cat]} · PAL ${f2(R.pal)}</span> <span class="badge ${R.adj < 0 ? "b-over" : R.adj > 0 ? "b-under" : "b-normal"}">${tujuanTxt}</span>
      ${table(["Zat gizi", "#g/kg BB", "#Gram", "#kkal", "#% energi"], [
        ["Karbohidrat", f1(R.C / R.W), f0(R.C), f0(kk(R.C, 4)), pc(R.C * 4)],
        ["Protein", f1(R.P / R.W), f0(R.P), f0(kk(R.P, 4)), pc(R.P * 4)],
        ["Lemak", f1(R.F / R.W), f0(R.F), f0(kk(R.F, 9)), pc(R.F * 9)]
      ], ["Total", "", "", f0(R.C * 4 + R.P * 4 + R.F * 9), "100%"])}
      <dl class="kv">
        <dt>Kelompok gizi</dt><dd>${kelTxt}</dd>
        <dt>Latihan</dt><dd>${R.dur ? `${f0(R.dur)} menit, ${INT_LABEL[R.it]} (${fx(R.met, 1)} MET)` : "Hari istirahat"}</dd>
        <dt>Beban latihan (ACSM 2016)</dt><dd>${LOAD[R.loadIdx].n.split(" (")[0]}</dd>
        <dt>Energi untuk latihan</dt><dd>±${f0(R.eee)} kkal</dd>
        <dt>Berat badan dasar hitung</dt><dd>${f1(R.W)} kg${R.useBBI ? " (BBI)" : ""}</dd>
        <dt>Cairan dasar harian</dt><dd>±${f1(R.bb * 35 / 1000)} L + keringat</dd>
      </dl>
      ${R.ea != null ? `<div class="callout ${R.ea < 30 ? "bad" : R.ea < 45 ? "warn" : "good"}"><strong>Ketersediaan energi: ${f0(R.ea)} kkal/kg massa bebas lemak.</strong> ${R.ea < 30 ? "Di bawah 30: risiko Relative Energy Deficiency in Sport (RED-S): gangguan hormon, tulang, imunitas, dan performa. Jangan memperbesar defisit." : R.ea < 45 ? "30–45: masih dapat diterima untuk penurunan berat bertahap, pantau kelelahan dan siklus haid." : "≥45: optimal untuk kesehatan dan adaptasi latihan."} (Loucks 2011; IOC 2018)</div>` : ""}
      ${R.fatNote === "cut" ? `<div class="callout warn">Kebutuhan karbohidrat menurut tabel (${f0(R.Ctable)} g) tidak muat dalam total energi bila lemak minimal ${R.fatPct[0]}% energi. Karbohidrat disesuaikan menjadi ${f0(R.C)} g. Bila performa menurun atau berat badan turun tanpa disengaja, naikkan asupan energi.</div>` : ""}
      ${R.fatNote === "add" ? `<div class="callout">Sisa energi setelah protein dan karbohidrat melebihi batas lemak ${R.fatPct[1]}% energi, sehingga kelebihannya dialokasikan ke karbohidrat (${f0(R.Ctable)} → ${f0(R.C)} g).</div>` : ""}
      ${R.kelKey === "power" ? `<p class="note" style="margin-top:12px">Catatan: Tabel 27 Kemenkes mencantumkan 8–12 g KH/kg untuk kelompok power, lebih tinggi dari anjuran ACSM/IOC untuk latihan kekuatan (±4–7 g/kg). Kalkulator tetap membatasi KH agar sesuai total energi.</p>` : ""}`;

    const koniTxt = R.koni ? `Kelompok KONI <strong>${R.koni.n}</strong>: estimasi ${R.koni.e[1] ? rng(R.koni.e, 0) : "> " + f0(R.koni.e[0])} kkal/hari; KH ${R.koni.c.join("–")}%, protein ${R.koni.p.join("–")}%, lemak ${R.koni.f.join("–")}% energi (Kemenkes 2022, Tabel 4).` : "Cabang ini tidak termasuk pengelompokan KONI; batas lemak memakai 20–35% energi (ACSM 2016).";
    det.innerHTML = steps("Cara menghitung (langkah demi langkah)", [
      `<strong>Tingkat aktivitas fisik (PAL).</strong> Aktivitas di luar latihan ${f2(R.base)}. Tambahan dari latihan: <code>(MET − 1) × (1,15/0,9) × durasi/1440 = (${fx(R.met, 1)} − 1) × 1,278 × ${f0(R.dur)}/1440 = ${f2(R.dPAL)}</code>. PAL = <strong>${f2(R.pal)}</strong> → kategori <strong>${PA_CAT[R.cat]}</strong> (${PA_RANGE[R.cat]}), koefisien AF <strong>${f2(R.pa)}</strong> (Kemenkes 2021 Tabel 26; IOM 2005${R.anak ? ", koefisien usia 9–18 tahun" : ""}). Nilai MET ${SPORT[R.sport.k].n.toLowerCase()} intensitas ${INT_LABEL[R.it]} dari Compendium of Physical Activities (Ainsworth 2011).`,
      `<strong>Berat badan dasar hitung.</strong> IMT ${f1(R.imt)}. ${R.useBBI ? `Status gizi lebih, sehingga dipakai BBI Broca = <strong>${f1(R.bbi)} kg</strong> (Kemenkes 2021).` : `Dipakai berat aktual <strong>${f1(R.W)} kg</strong>.`}`,
      `<strong>Kebutuhan energi.</strong> ${R.anak ? "Rumus IOM 2005 usia 9–18 tahun" : `Rumus Kemenkes 2021 (${jk === "L" ? "laki-laki" : "perempuan"})`}: <code>${R.rumus}</code> = <strong>${f0(R.eer)} kkal</strong>.${R.adj ? ` Penyesuaian tujuan ${R.adj > 0 ? "+" : "−"}${Math.abs(R.adj)} kkal${R.adj > 0 ? " (Kemenkes 2021: +360–480 kkal untuk menambah 1 kg massa otot)" : " (±0,5 kg/minggu)"} → <strong>${f0(R.E)} kkal</strong>.` : ""} Sebagai pembanding, metode faktorial BMR Mifflin-St Jeor ${f0(R.bmr)} × PAL ${f2(R.pal)} = ${f0(R.bmr * R.pal)} kkal.`,
      `<strong>Beban latihan.</strong> ${f0(R.dur)} menit × faktor intensitas ${fx(INT_FACTOR[R.it], 1)} = ${f1(R.effH)} jam-efektif → beban <strong>${LOAD[R.loadIdx].n}</strong>; ACSM 2016 menganjurkan ${rng(LOAD[R.loadIdx].cho, 0)} g KH/kg. Posisi dalam rentang tabel: ${f0(R.L * 100)}% (0% = batas bawah untuk hari ringan, 100% = batas atas untuk ≥4 jam latihan berat).`,
      `<strong>Karbohidrat.</strong> Rentang ${R.choSrc}. ${f2(R.choG)} g/kg × ${f1(R.W)} kg = ${f0(R.Ctable)} g${R.fatNote ? ` → disesuaikan ${f0(R.C)} g` : ""} = ${f0(R.C * 4)} kkal (1 g KH = 4 kkal).`,
      `<strong>Protein.</strong> Rentang ${R.proSrc}. ${f2(R.proG)} g/kg × ${f1(R.W)} kg = <strong>${f0(R.P)} g</strong> = ${f0(R.P * 4)} kkal. Bagi rata 0,3 g/kg (±${f0(0.3 * R.bb)} g) setiap 3–4 jam (ISSN 2017).`,
      `<strong>Lemak.</strong> Sisa energi: <code>(${f0(R.E)} − ${f0(R.P * 4)} − ${f0(R.C * 4)}) / 9 = ${f0(R.F)} g</code> (1 g lemak = 9 kkal), dibatasi ${R.fatPct[0]}–${R.fatPct[1]}% energi. Pembanding: ${fatRef} (Kemenkes 2021). Utamakan lemak tak jenuh.`,
      `<strong>Fase periodisasi.</strong> ${R.fase.n}: KH ${rng(R.fase.cho, 0)}, protein ${rng(R.fase.pro)}, lemak ${rng(R.fase.fat)} g/kg/hari (Kemenkes 2021 Tabel 10, 12, 14).`,
      koniTxt,
      `<strong>Pembagian makan.</strong> Latihan 1×/hari: 3 kali makan utama. Latihan 2–3×/hari atau sangat melelahkan: 4–6 kali makan dengan porsi lebih kecil (Kemenkes 2021). Lihat tab <em>Makan Sekitar Latihan</em> untuk takaran sebelum, saat, dan setelah latihan.`
    ], true);
    ringkas.energi = `Energi ±${f0(R.E)} kkal/hari (${R.sport.n}, ${R.dur} menit ${INT_LABEL[R.it]}, ${R.fase.n}); KH ${f0(R.C)} g, protein ${f0(R.P)} g, lemak ${f0(R.F)} g`;
  }

  /* ================= LAJU KERINGAT ================= */
  const NA_H = [[300, 500], [500, 700], [800, 800]]; // natrium mg/jam per intensitas (Kemenkes 2021 Tabel 11 & 13)
  function calcKeringat() {
    const out = $("r-keringat"), det = $("r-keringat-detail");
    const pre = num("kr-pre"), post = num("kr-post"), dur = num("kr-dur");
    const minum = num0("kr-minum") || 0, urin = num0("kr-urin") || 0;
    if (!pre || !post || !dur) { out.innerHTML = EMPTY; det.innerHTML = ""; sweat = null; delete ringkas.keringat; return; }
    const loss = pre - post;
    const sweatL = loss + minum / 1000 - urin / 1000;
    const h = dur / 60;
    const SR = sweatL / h;
    const pct = (loss / pre) * 100;
    if (SR <= 0) { out.innerHTML = '<div class="label">Periksa kembali data</div><p class="note">Hasil keringat nol atau negatif. Pastikan berat sesudah latihan ditimbang setelah keringat diseka dan volume minum/urin benar.</p>'; det.innerHTML = ""; sweat = null; return; }
    const st = pct < 0 ? ["Berat badan naik: minum melebihi keringat", "b-over"] : pct <= 1 ? ["Terhidrasi baik", "b-normal"] : pct <= 3 ? ["Dehidrasi minimal", "b-under"] : pct <= 5 ? ["Dehidrasi signifikan", "b-over"] : ["Dehidrasi serius", "b-obese"];
    const Dp = num("kr-rencana") || dur, hp = Dp / 60;
    const allow = 0.02 * pre;
    const minPH = Math.max(0, (SR * hp - allow) / hp);
    const maxPH = SR;
    let tgt = (minPH + maxPH) / 2, gutWarn = false;
    if (tgt > 1.2) { tgt = Math.max(1.2, minPH); gutWarn = minPH > 1.2; }
    const netLoss = Math.max(0, (SR - tgt) * hp);
    const it = Number($("kr-int").value);
    const na = NA_H[it];
    sweat = { SR, tgt, minPH, maxPH, netLoss, Dp };

    const iv = [10, 15, 20, 30].map((m) => [`Setiap ${m} menit`, `<strong>${f0(r5(tgt * 1000 * m / 60))} mL</strong>`, `${f0(r5(minPH * 1000 * m / 60))}–${f0(r5(maxPH * 1000 * m / 60))} mL`, `${fx(tgt * 1000 * m / 60 / 250, 1)} gelas`]);
    out.innerHTML = `
      <div class="note">Laju keringat</div>
      <div class="big">${f2(SR)} <span style="font-size:1.1rem">L/jam</span></div>
      <span class="badge ${st[1]}">${st[0]} (${pct >= 0 ? "−" : "+"}${f1(Math.abs(pct))}% BB)</span>
      <dl class="kv">
        <dt>Total keringat saat diukur</dt><dd>${f2(sweatL)} L</dd>
        <dt>Target minum sesi ${f0(Dp)} menit</dt><dd>${f0(r5(tgt * 1000))} mL/jam</dd>
        <dt>Kisaran aman</dt><dd>${f0(r5(minPH * 1000))}–${f0(r5(maxPH * 1000))} mL/jam</dd>
        <dt>Natrium saat latihan</dt><dd>${hp >= 1 ? (na[0] === na[1] ? f0(na[0]) : rng(na, 0)) + " mg/jam" : "tidak wajib (&lt;1 jam)"}</dd>
      </dl>
      <h3>Anjuran minum saat latihan</h3>
      ${table(["Interval", "#Target", "#Kisaran", "#Setara"], iv)}
      <p class="note">1 gelas = 250 mL. Pilih interval yang sesuai jeda alami cabang olahraga Anda (pergantian babak, time-out, pos minum).</p>
      ${gutWarn ? `<div class="callout warn">Untuk menjaga kehilangan cairan di bawah 2% BB, Anda perlu minum lebih dari 1,2 L/jam, sulit ditoleransi lambung. Latih kebiasaan minum bertahap (<em>training the gut</em>), pakai minuman isotonik dingin, dan manfaatkan setiap jeda.</div>` : ""}
      ${pct < 0 ? `<div class="callout bad">Berat badan naik selama latihan berarti minum melebihi keringat. Minum berlebihan berisiko hiponatremia; kurangi volume sesuai tabel.</div>` : ""}
      ${pct > 2 ? `<div class="callout warn">Kehilangan cairan &gt;2% BB menurunkan performa aerobik dan kemampuan kognitif (ACSM 2007). Ikuti tabel di atas pada sesi berikutnya.</div>` : ""}`;

    det.innerHTML = steps("Cara menghitung laju keringat dan anjuran minum", [
      `<strong>Perubahan berat badan:</strong> <code>${f2(pre)} − ${f2(post)} = ${f2(loss)} kg</code> (1 kg ≈ 1 L cairan) = ${f1(Math.abs(pct))}% BB.`,
      `<strong>Total keringat:</strong> <code>Δ BB + cairan diminum − urin = ${f2(loss)} + ${f2(minum / 1000)} − ${f2(urin / 1000)} = ${f2(sweatL)} L</code>.`,
      `<strong>Laju keringat:</strong> <code>${f2(sweatL)} L ÷ ${f2(h)} jam = ${f2(SR)} L/jam</code>. Rentang umum atlet 0,3–2,4 L/jam (ACSM 2007).`,
      `<strong>Status hidrasi</strong> menurut % perubahan BB (NATA, Casa 2000): ≤1% baik, 1–3% minimal, 3–5% signifikan, &gt;5% serius. Kehilangan &gt;2% BB menurunkan performa (ACSM 2007).`,
      `<strong>Batas minum minimal</strong> agar kehilangan ≤2% BB pada sesi ${f0(Dp)} menit: <code>(${f2(SR)} × ${f2(hp)} − 0,02 × ${f1(pre)}) ÷ ${f2(hp)} = ${f2(minPH)} L/jam</code>.`,
      `<strong>Batas minum maksimal</strong> = laju keringat (${f2(maxPH)} L/jam), agar tidak minum melebihi keringat (risiko hiponatremia).`,
      `<strong>Target</strong> = nilai tengah kedua batas${tgt === 1.2 || gutWarn ? ", dibatasi kemampuan pengosongan lambung ±1,2 L/jam" : ""} = <strong>${f0(r5(tgt * 1000))} mL/jam</strong>, lalu dibagi ke interval 10–30 menit. Panduan Kemenkes 2021 yang umum: 89–237 mL setiap 15–20 menit.`,
      `<strong>Natrium:</strong> ${rng(NA_H[0], 0)} mg/jam (latihan ringan–sedang, fase persiapan), 500–700 mg/jam (pertandingan sedang), 800 mg/jam (pertandingan berat) (Kemenkes 2021). Setara minuman dengan natrium 460–690 mg/L (20–30 mmol/L; ACSM 2007).`,
      `<strong>Setelah latihan:</strong> perkiraan defisit bila mengikuti target ${f2(netLoss)} kg → minum <strong>${f0(r5(netLoss * 1250))}–${f0(r5(netLoss * 1500))} mL</strong> (125–150% dari BB yang hilang) dalam 2–4 jam bersama makanan atau minuman bernatrium (Shirreffs 1996; ACSM 2007). Panduan Kemenkes menulis 710 mL per kg; angka asalnya 16–24 oz per pon (≈1,0–1,5 L per kg), sehingga kalkulator memakai 1,25–1,5 L per kg.`
    ], true);
    ringkas.keringat = `Laju keringat ${f2(SR)} L/jam (BB ${pct >= 0 ? "−" : "+"}${f1(Math.abs(pct))}%, ${st[0]}); anjuran minum ±${f0(r5(tgt * 1000))} mL/jam ≈ ${f0(r5(tgt * 250))} mL tiap 15 menit`;
  }

  /* ================= MAKAN SEKITAR LATIHAN ================= */
  const toMin = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : 960; };
  const clock = (t) => { t = ((Math.round(t) % 1440) + 1440) % 1440; return String(Math.floor(t / 60)).padStart(2, "0") + "." + String(t % 60).padStart(2, "0"); };

  function calcMakan() {
    const out = $("r-makan");
    const bb = num("mk-bb"), dur = num("mk-dur");
    if (!bb || !dur) { out.innerHTML = EMPTY_TOP; delete ringkas.makan; return; }
    const T = toMin($("mk-jam").value);
    const jarak = Number($("mk-jarak").value);
    const it = Number($("mk-int").value);
    const faseKey = $("mk-fase").value, fase = FASE[faseKey];
    const kelKey = $("en-kel").value;
    const strength = kelKey === "power" || kelKey === "sprint";
    const h = dur / 60;
    const rows = [];
    const sum = { C: 0, P: 0, F: 0 };
    const add = (c, p, f) => { sum.C += c; sum.P += p; sum.F += f; };

    // Sebelum latihan
    const preC = faseKey === "off" ? 1 * bb : jarak * bb; // 1 g/kg per jam sebelum latihan, rentang 1–4 g/kg (Kemenkes 2021)
    const preP = strength ? fase.preP[1] : Math.round((fase.preP[0] + fase.preP[1]) / 2);
    const preF = 10;
    rows.push([T - 240, "Sebelum", `Minum air ${f0(r5(5 * bb))}–${f0(r5(7 * bb))} mL (5–7 mL/kg BB).`, "", "", "Cairan"]);
    rows.push([T - jarak * 60, "Sebelum", `<strong>Makan ${jarak >= 2 ? "besar" : "ringan"} tinggi KH</strong>, rendah lemak, serat, dan protein agar mudah dicerna. ${choFood(preC)}; lauk ${f0(preP)} g protein. Natrium ±500 mg.`, f0(preC), f0(preP), `KH ${faseKey === "off" ? "1" : jarak} g/kg`]);
    add(preC, preP, preF);
    rows.push([T - 120, "Sebelum", `Tambahan ${f0(r5(3 * bb))}–${f0(r5(5 * bb))} mL (3–5 mL/kg) bila urin masih pekat.`, "", "", "Cairan"]);
    let snackC = 0;
    if (jarak >= 3 && faseKey !== "off") {
      snackC = 0.5 * bb;
      rows.push([T - 60, "Sebelum", `Camilan KH mudah cerna, mis. pisang, roti, atau jus buah: ${choFood(snackC)}.`, f0(snackC), "", "0,5 g/kg"]);
      add(snackC, 0, 0);
    }
    rows.push([T - 30, "Sebelum", "Hanya minuman (air atau sport drink ±200 mL). Hindari makanan padat 30–60 menit sebelum mulai.", "", "", "Cairan"]);

    // Saat latihan (karbohidrat menurut durasi; Kemenkes 2021, Jeukendrup 2014)
    let rate = 0, saatTxt;
    if (dur < 30) saatTxt = "Durasi &lt;30 menit: karbohidrat tidak diperlukan, cukup air.";
    else if (dur < 75) saatTxt = "Durasi 30–75 menit: karbohidrat dalam jumlah kecil atau berkumur minuman berkarbohidrat (<em>mouth rinse</em>).";
    else if (dur <= 120) { rate = 30; saatTxt = "Durasi 1–2 jam: hingga 30 g KH/jam dari sport drink."; }
    else if (dur <= 150) { rate = 60; saatTxt = "Durasi 2–3 jam: hingga 60 g KH/jam (glukosa/maltodekstrin) dari sport drink, gel, atau bar."; }
    else { rate = 90; saatTxt = "Durasi &gt;2,5 jam: hingga 90 g KH/jam dari campuran glukosa + fruktosa."; }
    const duringC = rate * h;
    const duringP = dur > 120 ? 6.5 * h : 0;
    const fl = sweat ? `Minum <strong>${f0(r5(sweat.tgt * 250))} mL setiap 15 menit</strong> (${f0(r5(sweat.tgt * 1000))} mL/jam, dari laju keringat Anda ${f2(sweat.SR)} L/jam).` : "Minum 150–250 mL setiap 15–20 menit (Kemenkes 2021: 89–237 mL). Hitung laju keringat untuk angka pribadi.";
    const na = NA_H[it];
    rows.push([T, "Saat", `${saatTxt}${rate ? ` Total ±${f0(duringC)} g ≈ ${f0(r5(duringC / 6 * 100))} mL sport drink (6 g/100 mL) atau ${fx(duringC / 25, 1)} sachet gel (25 g).` : ""} ${fl}${dur >= 60 ? ` Natrium ${na[0] === na[1] ? f0(na[0]) : rng(na, 0)} mg/jam.` : ""}${duringP ? " Protein 3–10 g/jam karena latihan &gt;2 jam." : ""}`, rate ? f0(duringC) : "—", duringP ? f0(duringP) : "—", rate ? `≤${rate} g/jam` : ""]);
    add(duringC, duringP, 0);

    // Setelah latihan
    const postC = 1.1 * bb, postP = clamp(0.3 * bb, 20, 40), postF = 5;
    const rehyd = sweat ? `Minum ${f0(r5(sweat.netLoss * 1250))}–${f0(r5(sweat.netLoss * 1500))} mL dalam 2–4 jam (125–150% BB yang hilang).` : "Timbang BB: minum 1,25–1,5 L untuk setiap 1 kg BB yang hilang.";
    rows.push([T + dur, "Setelah", `<strong>Pemulihan 0–60 menit:</strong> KH ${f0(bb)}–${f0(1.2 * bb)} g (1–1,2 g/kg) + protein ${f0(postP)} g (0,3 g/kg; Kemenkes 10–25 g). Mis. susu cokelat + roti isi telur, atau jus buah + yogurt. ${rehyd} Natrium ±500 mg.`, f0(postC), f0(postP), "1–1,2 g/kg"]);
    add(postC, postP, postF);
    rows.push([T + dur + 120, "Setelah", "<strong>Makan lengkap:</strong> ½ piring makanan pokok, ¼ lauk tanpa lemak, ¼ sayur dan buah (Kemenkes 2022). Bila ada sesi kedua &lt;8 jam lagi, lanjutkan 1–1,2 g KH/kg per jam selama 4 jam pertama (ACSM 2016).", "", "", ""]);

    rows.sort((a, b) => a[0] - b[0]);
    const tl = table(["Jam", "Tahap", "Anjuran", "#KH (g)", "#Protein (g)", "Dasar"], rows.map((r) => [`<span class="t-time">${clock(r[0])}</span>`, r[1], r[2], r[3], r[4], r[5]]));

    // Sisa kebutuhan harian
    let sisaHtml = "";
    const R = energiCore();
    if (R) {
      const rem = { C: R.C - sum.C, P: R.P - sum.P, F: R.F - sum.F };
      const warn = rem.C < 0 || rem.P < 0;
      const rC = Math.max(0, rem.C), rP = Math.max(0, rem.P), rF = Math.max(0, rem.F);
      const parts = [["Makan utama 1", 0.35], ["Makan utama 2", 0.35], ["Selingan 1", 0.15], ["Selingan 2", 0.15]];
      sisaHtml = `<h3>Sisa kebutuhan harian untuk waktu makan lainnya</h3>
        <p class="note">Total harian dari tab Energi: ${f0(R.E)} kkal, KH ${f0(R.C)} g, protein ${f0(R.P)} g, lemak ${f0(R.F)} g. Dikurangi asupan sekitar latihan (KH ${f0(sum.C)} g, protein ${f0(sum.P)} g, lemak ±${f0(sum.F)} g).</p>
        ${table(["Waktu makan", "#KH (g)", "#Protein (g)", "#Lemak (g)", "#kkal", "Contoh porsi"], parts.map(([n, k]) => [n, f0(rC * k), f0(rP * k), f0(rF * k), f0((rC * 4 + rP * 4 + rF * 9) * k), `${choFood(rC * k)}; ${proFood(rP * k)}`]))}
        ${warn ? `<div class="callout warn">Asupan sekitar latihan sudah melebihi sebagian kebutuhan harian. Pilih jarak makan sebelum latihan yang lebih pendek atau porsi pemulihan yang lebih kecil, atau periksa kembali isian tab Energi.</div>` : ""}`;
    } else {
      sisaHtml = `<div class="callout">Isi tab <strong>Energi &amp; Zat Gizi Makro</strong> (tinggi badan dan usia) agar sisa kebutuhan harian dibagi otomatis ke waktu makan lainnya.</div>`;
    }

    out.innerHTML = `
      <div class="mini-grid">
        <div class="mini"><b>${f0(preC)} g</b><span>KH makan sebelum latihan (${clock(T - jarak * 60)})</span></div>
        <div class="mini"><b>${rate ? f0(duringC) + " g" : "—"}</b><span>KH saat latihan ${f0(dur)} menit</span></div>
        <div class="mini"><b>${f0(bb)}–${f0(1.2 * bb)} g</b><span>KH pemulihan 0–60 menit</span></div>
        <div class="mini"><b>${f0(postP)} g</b><span>Protein pemulihan</span></div>
      </div>
      ${tl}
      ${sisaHtml}
      ${steps("Dasar perhitungan", [
        `<strong>Sebelum:</strong> KH 1–4 g/kg BB diberikan 1–4 jam sebelum latihan (Kemenkes 2021 Tabel 11 & 13; Kemenkes 2022 Tabel 1). Kalkulator memakai 1 g/kg untuk setiap jam jarak makan: ${jarak} jam × ${f1(bb)} kg = ${f0(jarak * bb)} g${faseKey === "off" ? " (fase transisi: cukup makanan kecil seimbang 1 g/kg)" : ""}. Protein ${rng(fase.preP, 0)} g (${strength ? "batas atas karena latihan kekuatan/sprint" : "nilai tengah"}). Cairan 5–7 mL/kg 4 jam sebelum dan 3–5 mL/kg 2 jam sebelum bila urin pekat (ACSM 2007; contoh kasus Kemenkes 2021).`,
        `<strong>Saat:</strong> KH menurut durasi: &lt;30 menit tidak perlu; 30–75 menit mouth rinse; 1–2 jam ≤30 g/jam; 2–3 jam ≤60 g/jam; &gt;2,5 jam ≤90 g/jam glukosa + fruktosa (Kemenkes 2021; Jeukendrup 2014). Protein 3–10 g/jam hanya bila latihan &gt;2 jam (Kemenkes 2021). Natrium 300–800 mg/jam menurut intensitas.`,
        `<strong>Setelah:</strong> KH 1–1,2 g/kg dan protein 10–25 g dalam 1–60 menit, natrium 500 mg, cairan mengandung KH, natrium, dan sedikit protein 355–592 mL (Kemenkes 2021 & 2022). Protein 0,3 g/kg (ISSN 2017; ACSM 2016). Rehidrasi 125–150% BB yang hilang (Shirreffs 1996).`,
        `<strong>Konversi porsi:</strong> Daftar Bahan Makanan Penukar: 1 porsi nasi 100 g = 40 g KH; roti tawar 3 iris = 40 g KH; 1 porsi buah = 12 g KH; 1 porsi lauk hewani rendah lemak = 7 g protein.`
      ])}`;
    ringkas.makan = `Latihan ${clock(T)} (${f0(dur)} menit): makan ${clock(T - jarak * 60)} KH ${f0(preC)} g; saat latihan KH ${rate ? f0(duringC) + " g" : "tidak perlu"}; pemulihan KH ${f0(bb)}–${f0(1.2 * bb)} g + protein ${f0(postP)} g`;
  }

  /* ================= PERFORMA & VO2MAX ================= */
  function vo2Category(v, age) {
    const i = VO2_AGE.findIndex((a) => age <= a);
    const b = VO2_NORM[jk][i < 0 ? VO2_NORM[jk].length - 1 : i];
    const k = b.filter((x) => v >= x).length;
    return { cat: VO2_CAT[k], bounds: b };
  }
  function calcPerforma() {
    const out = $("r-performa"), det = $("r-performa-detail");
    const bb = num("pf-bb"), tb = num("pf-tb"), age = num("pf-usia");
    if (!bb || !tb || !age) { out.innerHTML = EMPTY; det.innerHTML = ""; delete ringkas.performa; return; }
    const pct = pctLemak("pf-lemak");
    const par = Number($("pf-par").value);
    const male = jk === "L" ? 1 : 0;
    const H = tb / 100, imt = bb / (H * H);
    const m = $("pf-metode").value;
    const jackson = pct
      ? { v: 50.513 + 1.589 * par - 0.289 * age - 0.552 * pct + 5.863 * male, f: `50,513 + 1,589 × ${par} − 0,289 × ${f0(age)} − 0,552 × ${f1(pct)} + 5,863 × ${male}`, model: "% lemak" }
      : { v: 56.363 + 1.921 * par - 0.381 * age - 0.754 * imt + 10.987 * male, f: `56,363 + 1,921 × ${par} − 0,381 × ${f0(age)} − 0,754 × ${f1(imt)} + 10,987 × ${male}`, model: "IMT" };
    let vo2 = null, cara = "", rumus = "", extra = "";
    if (m === "mft") {
      const L = num("pf-level"); const s = num0("pf-shuttle") || 0;
      if (L) {
        const sp = 8 + 0.5 * L;
        const nNext = Math.floor(((8 + 0.5 * (L + 1)) * 1000 / 60) / 20);
        const S = sp + 0.5 * Math.min(s / nNext, 1);
        if (age >= 18) { vo2 = -24.4 + 6.0 * S; rumus = `−24,4 + 6,0 × ${f2(S)} km/jam`; }
        else { vo2 = 31.025 + 3.238 * S - 3.248 * age + 0.1536 * age * S; rumus = `31,025 + 3,238 × ${f2(S)} − 3,248 × ${f0(age)} + 0,1536 × ${f0(age)} × ${f2(S)}`; }
        cara = "Multistage 20 m shuttle run (Léger 1988)";
        extra = `Kecepatan level ${f0(L)} = 8 + 0,5 × ${f0(L)} = ${f1(sp)} km/jam${s ? `, ditambah ${f0(s)}/${nNext} shuttle level berikutnya` : ""} → ${f2(S)} km/jam.`;
      }
    } else if (m === "cooper") {
      const d = num("pf-jarak");
      if (d) { vo2 = (d - 504.9) / 44.73; rumus = `(${f0(d)} − 504,9) ÷ 44,73`; cara = "Tes lari 12 menit (Cooper 1968)"; }
    } else if (m === "rockport") {
      const t = num("pf-waktu"), hr = num("pf-hrjalan");
      if (t && hr) { vo2 = 132.853 - 0.0769 * bb * 2.20462 - 0.3877 * age + 6.315 * male - 3.2649 * t - 0.1565 * hr; rumus = `132,853 − 0,0769 × ${f1(bb * 2.20462)} lb − 0,3877 × ${f0(age)} + 6,315 × ${male} − 3,2649 × ${f1(t)} − 0,1565 × ${f0(hr)}`; cara = "Tes jalan 1 mil Rockport (Kline 1987)"; }
    } else if (m === "uth") {
      const hrr = num("pf-hrrest"); const hrm = num("pf-hrmax") || 208 - 0.7 * age;
      if (hrr) { vo2 = 15.3 * hrm / hrr; rumus = `15,3 × ${f0(hrm)} ÷ ${f0(hrr)}`; cara = "Rasio denyut nadi (Uth 2004)"; extra = num("pf-hrmax") ? "" : `HRmax diperkirakan 208 − 0,7 × ${f0(age)} = ${f0(hrm)}/menit (Tanaka 2001).`; }
    } else if (m === "lab") {
      vo2 = num("pf-vo2"); cara = "Uji laboratorium"; rumus = "nilai terukur";
    } else {
      vo2 = jackson.v; cara = `Model non-latihan Jackson 1990 (${jackson.model})`; rumus = jackson.f;
    }
    if (vo2 == null || !isFinite(vo2)) { out.innerHTML = `<div class="label">Lengkapi data tes</div><p class="note">Isi hasil tes untuk metode yang dipilih.</p>`; det.innerHTML = ""; delete ringkas.performa; return; }
    if (vo2 < 10 || vo2 > 95) { out.innerHTML = `<div class="label">Hasil di luar rentang wajar</div><p class="note">VO2max ${f1(vo2)} mL/kg/menit tidak masuk akal. Periksa kembali isian tes.</p>`; det.innerHTML = ""; return; }

    const { cat, bounds } = vo2Category(vo2, age);
    const abs = vo2 * bb / 1000;
    const ffm = pct ? bb * (1 - pct / 100) : null, fm = pct ? bb - ffm : null;
    const perFFM = ffm ? vo2 * bb / ffm : null;
    const tgt = num("pf-target");
    let sim = null;
    if (ffm && tgt && tgt < 60) {
      const nb = ffm / (1 - tgt / 100);
      sim = { nb, v: abs * 1000 / nb, dJ: -0.552 * (tgt - pct) };
    }
    const per1kg = vo2 * bb / (bb - 1) - vo2;
    const ffmi = ffm ? ffm / (H * H) : null;
    const ffmiN = ffmi ? ffmi + 6.1 * (1.8 - H) : null;
    const vj = num("pf-vj");
    const pp = vj ? 60.7 * vj + 45.3 * bb - 2055 : null;

    const lo = Math.min(bounds[0] - 6, vo2 - 2), hi = Math.max(bounds[5] + 6, vo2 + 2);
    const segColors = ["var(--red)", "var(--orange)", "var(--amber)", "#d9b40b", "#5fb98c", "var(--green)", "#13704a"];
    const edges = [lo].concat(bounds).concat([hi]);
    const segs = segColors.map((c, i) => [((edges[i + 1] - edges[i]) / (hi - lo)) * 100, c]);

    out.innerHTML = `
      <div class="note">VO2max (${cara})</div>
      <div class="big">${f1(vo2)} <span style="font-size:1.1rem">mL/kg/menit</span></div>
      <span class="badge ${cat[1]}">${cat[0]}</span>
      ${scale(segs, vo2, lo, hi, [f0(lo), bounds[0], bounds[2], bounds[4], f0(hi)])}
      <dl class="kv">
        <dt>VO2max absolut</dt><dd>${f2(abs)} L/menit</dd>
        ${perFFM ? `<dt>VO2max per kg massa bebas lemak</dt><dd>${f1(perFFM)} mL/kg FFM/menit</dd>` : ""}
        ${pct ? `<dt>Massa lemak · massa bebas lemak</dt><dd>${f1(fm)} · ${f1(ffm)} kg</dd>` : ""}
        <dt>Prediksi Jackson 1990 (${jackson.model})</dt><dd>${f1(jackson.v)} mL/kg/menit</dd>
        <dt>Efek turun 1 kg lemak (VO2 absolut tetap)</dt><dd>+${f2(per1kg)} mL/kg/menit</dd>
        ${ffmi ? `<dt>Indeks massa bebas lemak (FFMI)</dt><dd>${f1(ffmi)} kg/m² (norm. ${f1(ffmiN)})</dd>` : ""}
        ${pp ? `<dt>Daya puncak tungkai (lompat ${f1(vj)} cm)</dt><dd>${f0(pp)} W · ${f1(pp / bb)} W/kg</dd>` : ""}
      </dl>
      ${sim ? `<div class="callout good"><strong>Simulasi lemak tubuh ${f1(pct)}% → ${f1(tgt)}%</strong> dengan massa bebas lemak tetap ${f1(ffm)} kg: berat badan ${f1(bb)} → ${f1(sim.nb)} kg; VO2max relatif ${f1(vo2)} → <strong>${f1(sim.v)} mL/kg/menit</strong> (${sim.v >= vo2 ? "+" : ""}${f1(sim.v - vo2)}). Model Jackson 1990 memprediksi perubahan ${sim.dJ >= 0 ? "+" : ""}${f1(sim.dJ)} mL/kg/menit.${pp ? ` Rasio daya tungkai ${f1(pp / bb)} → ${f1(pp / sim.nb)} W/kg.` : ""}</div>` : pct ? `<p class="note" style="margin-top:12px">Isi <strong>target % lemak</strong> untuk menyimulasikan perubahan VO2max.</p>` : `<p class="note" style="margin-top:12px">Isi <strong>% lemak tubuh</strong> untuk melihat VO2max per massa bebas lemak dan simulasi penurunan lemak.</p>`}`;

    det.innerHTML = steps("Cara menghitung & interpretasi", [
      `<strong>VO2max ${cara}:</strong> <code>${rumus}</code> = <strong>${f1(vo2)} mL/kg/menit</strong>. ${extra}`,
      `<strong>Kategori</strong> menurut norma Shvartz &amp; Reibold (1990) untuk ${jk === "L" ? "laki-laki" : "perempuan"} usia ${f0(age)} tahun: batas Kurang ${bounds[0]}, Cukup ${bounds[1]}, Rata-rata ${bounds[2]}, Baik ${bounds[3]}, Sangat baik ${bounds[4]}, Istimewa ${bounds[5]} mL/kg/menit.${age < 20 ? " Usia &lt;20 tahun dibandingkan dengan kelompok 20–24 tahun." : ""}`,
      `<strong>VO2max absolut</strong> = relatif × BB = <code>${f1(vo2)} × ${f1(bb)} ÷ 1000 = ${f2(abs)} L/menit</code>. Nilai absolut menggambarkan kapasitas jantung-paru; nilai relatif menentukan performa saat tubuh harus dibawa bergerak (lari, permainan, bela diri).`,
      pct ? `<strong>Per massa bebas lemak:</strong> <code>${f2(abs)} × 1000 ÷ ${f1(ffm)} = ${f1(perFFM)} mL/kg FFM/menit</code>. Selisih besar antara nilai ini dan VO2max relatif menunjukkan seberapa besar massa lemak "membebani" kapasitas aerobik.` : "<strong>Per massa bebas lemak:</strong> isi % lemak tubuh untuk menghitungnya.",
      `<strong>Hubungan % lemak dengan VO2max (Jackson dkk. 1990, n = 2.009, R = 0,81, SEE ±5,35):</strong> <code>${jackson.f} = ${f1(jackson.v)}</code>. Koefisien −0,552 berarti setiap kenaikan 1% lemak tubuh berkaitan dengan VO2max lebih rendah 0,55 mL/kg/menit pada usia dan aktivitas yang sama. Model ini dikembangkan pada orang dewasa umum, sehingga cenderung meremehkan VO2max atlet terlatih.`,
      sim ? `<strong>Simulasi:</strong> BB baru = FFM ÷ (1 − target) = <code>${f1(ffm)} ÷ (1 − ${f2(tgt / 100)}) = ${f1(sim.nb)} kg</code>; VO2max baru = <code>${f2(abs)} × 1000 ÷ ${f1(sim.nb)} = ${f1(sim.v)}</code> mL/kg/menit, dengan asumsi VO2 absolut dan massa otot dipertahankan (defisit energi bertahap, protein cukup).` : "<strong>Simulasi:</strong> isi % lemak dan target % lemak.",
      ffmi ? `<strong>FFMI</strong> (Kouri 1995) = <code>${f1(ffm)} ÷ ${f2(H)}² = ${f1(ffmi)}</code>; dinormalkan ke tinggi 1,8 m: <code>${f1(ffmi)} + 6,1 × (1,8 − ${f2(H)}) = ${f1(ffmiN)}</code>. Rata-rata pria dewasa ±19–20; atlet kekuatan alami jarang melebihi ±25.` : "<strong>FFMI:</strong> isi % lemak tubuh.",
      pp ? `<strong>Daya puncak tungkai</strong> (Sayers 1999) = <code>60,7 × ${f1(vj)} + 45,3 × ${f1(bb)} − 2055 = ${f0(pp)} W</code>; rasio daya terhadap BB ${f1(pp / bb)} W/kg. Massa lemak menambah berat tanpa menambah daya, sehingga menurunkan rasio ini.` : "<strong>Daya tungkai:</strong> isi tinggi lompat vertikal (opsional)."
    ], true);
    ringkas.performa = `VO2max ${f1(vo2)} mL/kg/menit (${cat[0]}, ${cara}); ${pct ? `lemak ${f1(pct)}%, VO2max/FFM ${f1(perFFM)}` : "% lemak belum diisi"}${sim ? `; simulasi lemak ${f1(tgt)}% → VO2max ${f1(sim.v)}` : ""}`;
  }

  function calcAll() { calcIMT(); calcLemak(); calcBBI(); calcEnergi(); calcKeringat(); calcMakan(); calcPerforma(); }
  calcAll();

  const HASH = /^#(imt|lemak|bbi|energi|makan|keringat|performa)$/;
  if (location.hash && HASH.test(location.hash)) openTab($("t-" + location.hash.slice(1)));

  /* ================= KONSULTASI ================= */
  const S = window.SITE || {};
  if (S.formKonsultasi) {
    $("form-link").innerHTML = `<a class="btn btn-dark" href="${S.formKonsultasi}" target="_blank" rel="noopener">Isi formulir pendaftaran konsultasi</a>`;
  }
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
      ["c-nama", v("c-nama").length < 3 ? "Nama lengkap wajib diisi." : ""],
      ["c-asal", v("c-asal").length < 3 ? "Asal (kota dan instansi/klub) wajib diisi." : ""],
      ["c-wa-no", !/^62\d{8,13}$/.test(normWA(v("c-wa-no"))) ? "Nomor WhatsApp tidak valid. Contoh: 081234567890." : ""],
      ["c-email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("c-email")) ? "Alamat email tidak valid." : ""],
      ["c-pesan", v("c-pesan").length < 30 ? "Jelaskan tujuan konsultasi minimal 30 karakter." : ""],
      ["c-setuju", !$("c-setuju").checked ? "Centang persetujuan ketentuan konsultasi." : ""]
    ];
    let first = null;
    checks.forEach(([id, msg]) => { if (!setErr(id, msg) && !first) first = id; });
    if (first) { $(first).focus(); window.MK.toast("Mohon lengkapi data wajib"); return false; }
    return true;
  }
  ["c-nama", "c-asal", "c-wa-no", "c-email", "c-pesan"].forEach((id) => $(id).addEventListener("blur", () => { if (document.querySelector(`[data-err="${id}"]`).textContent) valid(); }));

  function pesan() {
    const lines = [
      "Halo Dr. Mury, saya ingin berkonsultasi gizi olahraga.",
      "",
      `Nama lengkap: ${v("c-nama")}`,
      `Asal: ${v("c-asal")}`,
      `No. WhatsApp: +${normWA(v("c-wa-no"))}`,
      `Email: ${v("c-email")}`,
      `Usia: ${v("c-usia") || "-"}`,
      `Kategori: ${v("c-kat")}`,
      `Cabang olahraga/aktivitas: ${v("c-cabor") || "-"}`,
      `Kategori tujuan: ${v("c-tujuan")}`,
      "",
      `Tujuan konsultasi: ${v("c-pesan")}`
    ];
    const hasil = Object.values(ringkas);
    if ($("c-hasil").checked && hasil.length) lines.push("", "Hasil kalkulator murykuswari.com:", ...hasil.map((h) => "• " + h));
    return lines.join("\n");
  }
  $("c-wa").addEventListener("click", () => { if (valid()) window.open(window.MK.waLink(pesan()), "_blank", "noopener"); });
  $("c-mail").addEventListener("click", () => {
    if (!valid()) return;
    location.href = `mailto:${S.email}?subject=${encodeURIComponent("Konsultasi Gizi Olahraga - " + v("c-nama") + " (" + v("c-asal") + ")")}&body=${encodeURIComponent(pesan())}`;
  });
})();
