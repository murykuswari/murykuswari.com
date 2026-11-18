/*
 * Mesin perhitungan Program Gizi Olahraga Personal (murykuswari.com).
 * Fungsi murni tanpa DOM, dipakai halaman program.html dan dapat diuji dengan Node.
 * Dasar: "Tinjauan Sistematik Perhitungan dalam Gizi Olahraga dan Kebugaran" (Kuswari, 2026)
 * serta Panduan Pendampingan Gizi pada Atlet (Kemenkes RI 2021). Label bukti: A, B, C.
 */
(function (root) {
  "use strict";

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const r0 = (x) => Math.round(x);
  const r1 = (x) => Math.round(x * 10) / 10;
  const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  /* ---------- Data rujukan ---------- */

  // Kelompok cabang (Tinjauan Bagian 11): rentang CHO & protein hari latihan biasa.
  const GRUP = {
    endurance: { s: "Endurance panjang", khSaat: true, n: "Endurance", cho: [6, 12], pro: [1.2, 1.6], proPerforma: 1.5, sup: ["kafein", "nitrat", "bikarbonat"] },
    intermiten: { n: "Permainan intermiten", cho: [5, 8], pro: [1.4, 1.8], proPerforma: 1.6, sup: ["kafein", "kreatin", "betaalanin"] },
    power: { n: "Kekuatan dan power", cho: [3, 6], pro: [1.6, 2.2], proPerforma: 1.8, sup: ["kreatin", "kafein"] },
    physique: { n: "Physique / estetika", cho: [3, 6], pro: [1.6, 2.2], proPerforma: 1.8, sup: ["kreatin", "kafein"] },
    tarung: { n: "Kelas berat / tarung", cho: [4, 7], pro: [1.6, 2.2], proPerforma: 1.8, sup: ["bikarbonat", "kafein"] },
    presisi: { n: "Keterampilan / presisi", cho: [3, 5], pro: [1.2, 1.6], proPerforma: 1.4, sup: ["kafein"] },
    kebugaran: { n: "Kebugaran umum", cho: [3, 6], pro: [1.2, 1.6], proPerforma: 1.4, sup: [] }
  };

  // Cabang olahraga → kelompok, MET pertandingan/conditioning (dibulatkan dari kisaran Compendium), kelas berat.
  const CABOR = [
    ["bulutangkis", "Bulu tangkis", "intermiten", 7.5],
    ["sepakbola", "Sepak bola / futsal", "intermiten", 9],
    ["basket", "Bola basket", "intermiten", 8],
    ["voli", "Bola voli", "intermiten", 6],
    ["tenis", "Tenis lapangan / tenis meja", "intermiten", 7],
    ["hoki", "Hoki / rugby", "intermiten", 8],
    ["maraton", "Lari jarak menengah, jauh, maraton", "endurance", 10],
    ["sepeda", "Balap sepeda / triatlon", "endurance", 9],
    ["renang", "Renang", "endurance", 8.5],
    ["dayung", "Dayung / kano", "endurance", 8.5],
    ["sprint", "Atletik sprint & lompat", "power", 8],
    ["angkatbesi", "Angkat besi / powerlifting / lempar", "power", 6],
    ["binaraga", "Binaraga / physique", "physique", 5],
    ["senam", "Senam ritmik / artistik", "physique", 5],
    ["taekwondo", "Taekwondo", "tarung", 10, true],
    ["pencaksilat", "Pencak silat", "tarung", 10, true],
    ["judo", "Judo / gulat / wushu sanda", "tarung", 10, true],
    ["karate", "Karate", "tarung", 10, true],
    ["tinju", "Tinju / muay thai", "tarung", 10, true],
    ["panahan", "Panahan / menembak", "presisi", 3.5],
    ["golf", "Golf / biliar / bowling", "presisi", 4],
    ["esport", "E-sport / catur", "presisi", 1.5],
    ["hyrox", "Hyrox / CrossFit / fungsional", "intermiten", 8.5],
    ["kebugaran", "Kebugaran umum / gym / rekreasi", "kebugaran", 6]
  ].map(([k, n, grup, met, kelas]) => ({ k, n, grup, met, kelas: !!kelas }));
  const CABOR_MAP = Object.fromEntries(CABOR.map((c) => [c.k, c]));

  // Jenis latihan (Tinjauan Bagian 12–13). MET adalah perkiraan rata-rata (label C).
  const JENIS = {
    hipertrofi: { s: "Beban (hipertrofi)", khSaat: false, n: "Weight training — hipertrofi", met: 5, pre: "Makan biasa; KH ±1 g/kg + protein 0,3 g/kg", saat: "Air; KH tidak perlu bila < 75 menit", pasca: "Protein 0,3–0,4 g/kg (±2–3 g leusin) + KH 0,5–1 g/kg", pre_g: 1, post_c: 0.75, post_p: 0.35 },
    kekuatan: { s: "Beban (kekuatan)", khSaat: false, n: "Weight training — kekuatan/power", met: 4.5, pre: "Makan biasa; kafein 3 mg/kg opsional", saat: "Air", pasca: "Protein 0,3–0,4 g/kg", pre_g: 1, post_c: 0.5, post_p: 0.35 },
    plyo: { s: "Plyo/speed", khSaat: false, n: "Plyometrik / speed / agility", met: 7, pre: "Makan biasa 2–3 jam sebelum", saat: "Air", pasca: "Protein 0,3 g/kg + KH 0,5 g/kg", pre_g: 1, post_c: 0.5, post_p: 0.3 },
    lit: { s: "LIT zona 2", khSaat: false, n: "Low-intensity training (zona 2)", met: 6.5, pre: "Boleh KH rendah atau puasa semalam bila direncanakan train low (< 60–90 menit)", saat: "Air; KH tidak perlu", pasca: "Protein 0,3 g/kg; KH sesuai sesi berikutnya", pre_g: 0.5, post_c: 0.5, post_p: 0.3, trainLow: true },
    interval: { s: "Interval aerobik", khSaat: true, n: "Interval training aerobik", met: 10, pre: "KH 1–2 g/kg, 2–3 jam sebelumnya", saat: "Air atau minuman KH bila > 60 menit", pasca: "KH 1,0–1,2 g/kg/jam bila sesi berikutnya < 8 jam", pre_g: 1.5, post_c: 1, post_p: 0.3 },
    hiit: { s: "HIIT/SIT", khSaat: true, n: "HIIT / sprint interval", met: 9, pre: "KH 1–2 g/kg; rendah serat dan lemak", saat: "Air", pasca: "KH + protein", pre_g: 1.5, post_c: 1, post_p: 0.3 },
    circuit: { s: "Circuit", khSaat: false, n: "Circuit training", met: 7, pre: "KH ±1 g/kg", saat: "Air; minuman elektrolit bila panas", pasca: "Protein 0,3 g/kg + KH 0,5–1 g/kg", pre_g: 1, post_c: 0.75, post_p: 0.3 },
    teknik: { s: "Teknik/taktik", khSaat: true, n: "Latihan teknik / taktik", met: 4.5, pre: "Makan biasa", saat: "Minuman KH 30–60 g/jam bila > 90 menit atau butuh konsentrasi", pasca: "Makan biasa", pre_g: 1, post_c: 0.5, post_p: 0.25 },
    conditioning: { s: "Conditioning", khSaat: true, n: "Conditioning spesifik (game, randori, sparring)", met: null, pre: "KH 1–3 g/kg", saat: "30–60 g/jam bila > 60–75 menit", pasca: "KH 1 g/kg + protein 0,3 g/kg", pre_g: 2, post_c: 1, post_p: 0.3 },
    endurance: { n: "Endurance panjang (> 90 menit)", met: 8.5, pre: "KH 1–4 g/kg", saat: "60–90 g/jam (glukosa + fruktosa) bila > 2,5 jam", pasca: "KH 1,0–1,2 g/kg/jam × 4 jam + protein", pre_g: 2, post_c: 1.1, post_p: 0.3 },
    recovery: { s: "Recovery", khSaat: false, n: "Recovery session", met: 3, pre: "—", saat: "Air", pasca: "Makan biasa", pre_g: 0, post_c: 0, post_p: 0.25 },
    pertandingan: { s: "Pertandingan", khSaat: true, n: "Pertandingan / uji coba", met: null, pre: "KH 1–3 g/kg, 2–4 jam sebelum; rendah serat", saat: "30–60 g/jam bila > 60 menit; hidrasi sesuai laju keringat", pasca: "KH 1–1,2 g/kg + protein 0,3 g/kg; rehidrasi 125–150%", pre_g: 2, post_c: 1.1, post_p: 0.3 }
  };

  const FASE = {
    umum: { n: "Persiapan umum", fokus: "Energi tinggi; waktu yang tepat mengubah komposisi tubuh; sebagian sesi LIT boleh train low." },
    khusus: { n: "Persiapan khusus", fokus: "Karbohidrat tertinggi; pemulihan antar-sesi; hindari defisit besar." },
    prakompetisi: { n: "Pra-kompetisi", fokus: "Uji coba strategi gizi lomba, gut training, dan suplemen." },
    taper: { n: "Tapering", fokus: "Energi turun mengikuti volume (−41–60%); protein tetap; KH dinaikkan lagi 1–2 hari sebelum lomba." },
    kompetisi: { n: "Kompetisi", fokus: "KH tinggi di hari tanding, hidrasi, pemulihan cepat antar-pertandingan." },
    transisi: { n: "Transisi", fokus: "Energi turun; jaga protein; hindari kenaikan lemak berlebihan." }
  };

  const TUJUAN = {
    performa: "Performa",
    hipertrofi: "Hipertrofi (menambah massa otot)",
    turun_lemak: "Penurunan lemak tubuh",
    kelas_berat: "Membuat berat badan kelas tanding",
    rekomposisi: "Rekomposisi (turun lemak, naik otot)"
  };

  // Koefisien Durnin–Womersley (1974): [c, m] per kelompok usia.
  const DW = {
    L: [[19, 1.1620, 0.0630], [29, 1.1631, 0.0632], [39, 1.1422, 0.0544], [49, 1.1620, 0.0700], [200, 1.1715, 0.0779]],
    P: [[19, 1.1549, 0.0678], [29, 1.1599, 0.0717], [39, 1.1423, 0.0632], [49, 1.1333, 0.0612], [200, 1.1339, 0.0645]]
  };

  /* ---------- Utilitas ---------- */
  function usiaDari(tglLahir, ref) {
    if (!tglLahir) return null;
    const b = new Date(tglLahir), t = ref ? new Date(ref) : new Date();
    if (isNaN(b)) return null;
    let u = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) u--;
    return u;
  }
  const sum = (a) => a.reduce((s, x) => s + (Number(x) || 0), 0);
  const num = (v) => { const x = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(x) ? x : null; };

  /* ---------- 1. Komposisi tubuh (Bagian 3) ---------- */
  function komposisi(inp, usia) {
    const bb = num(inp.bb), tb = num(inp.tb), jk = inp.jk === "P" ? "P" : "L";
    const H = tb / 100;
    const out = { imt: bb / (H * H), metode: null, db: null, siri: null, brozek: null, pct: null, label: null, langkah: [] };
    const sk = inp.skinfold || {};
    const S3 = jk === "L" ? [sk.dada, sk.perut, sk.paha] : [sk.trisep, sk.suprailiaka, sk.paha];
    const S7 = [sk.dada, sk.midaksila, sk.trisep, sk.subskapula, sk.perut, sk.suprailiaka, sk.paha];
    const S4 = [sk.bisep, sk.trisep, sk.subskapula, sk.suprailiaka];
    const ok = (arr) => arr.every((x) => num(x) > 0);
    const m = inp.metodeKomposisi;
    if (m === "jp3" && ok(S3)) {
      const S = sum(S3);
      out.db = jk === "L"
        ? 1.10938 - 0.0008267 * S + 0.0000016 * S * S - 0.0002574 * usia
        : 1.0994921 - 0.0009929 * S + 0.0000023 * S * S - 0.0001392 * usia;
      out.metode = `Skinfold Jackson–Pollock 3 titik (Σ ${r1(S)} mm)`;
      out.langkah.push(`D<sub>b</sub> = ${jk === "L" ? "1,10938 − 0,0008267·S + 0,0000016·S² − 0,0002574·U" : "1,0994921 − 0,0009929·S + 0,0000023·S² − 0,0001392·U"} = ${out.db.toFixed(4)} g/cm³ (S = ${r1(S)} mm, U = ${usia} th)`);
      out.sumS = S;
    } else if (m === "jp7" && ok(S7)) {
      const S = sum(S7);
      out.db = jk === "L"
        ? 1.112 - 0.00043499 * S + 0.00000055 * S * S - 0.00028826 * usia
        : 1.097 - 0.00046971 * S + 0.00000056 * S * S - 0.00012828 * usia;
      out.metode = `Skinfold Jackson–Pollock 7 titik (Σ ${r1(S)} mm)`;
      out.langkah.push(`D<sub>b</sub> = ${out.db.toFixed(4)} g/cm³ (S = ${r1(S)} mm)`);
      out.sumS = S;
    } else if (m === "dw" && ok(S4)) {
      const S = sum(S4);
      const row = DW[jk].find((r) => usia <= r[0]);
      out.db = row[1] - row[2] * Math.log10(S);
      out.metode = `Skinfold Durnin–Womersley 4 titik (Σ ${r1(S)} mm)`;
      out.langkah.push(`D<sub>b</sub> = ${row[1]} − ${row[2]} × log₁₀(${r1(S)}) = ${out.db.toFixed(4)} g/cm³`);
      out.sumS = S;
    } else if (m === "persen" && num(inp.persenLemak) > 0) {
      out.pct = num(inp.persenLemak);
      out.metode = `Persen lemak terukur (${inp.alatLemak || "BIA/DXA"})`;
    }
    if (out.db) {
      out.siri = 495 / out.db - 450;
      out.brozek = 457 / out.db - 414.2;
      out.pct = out.siri;
      out.langkah.push(`%lemak Siri = 495/D<sub>b</sub> − 450 = ${r1(out.siri)}% (Brožek 457/D<sub>b</sub> − 414,2 = ${r1(out.brozek)}%)`);
    }
    if (out.pct == null) {
      // Estimasi Deurenberg (1991) bila tidak ada data komposisi: label C, hanya untuk perhitungan EA.
      out.pct = 1.2 * out.imt + 0.23 * usia - 10.8 * (jk === "L" ? 1 : 0) - 5.4;
      out.metode = "Estimasi dari IMT (Deurenberg 1991) — kasar, ukur skinfold/BIA untuk akurasi";
      out.estimasi = true;
    }
    out.pct = clamp(out.pct, 3, 60);
    out.fm = bb * out.pct / 100;
    out.ffm = bb - out.fm;
    out.ffmi = out.ffm / (H * H);
    out.ffmiN = out.ffmi + 6.1 * (1.8 - H);
    const t = num(inp.targetLemak);
    if (t && t > 2 && t < 50) {
      out.bbTarget = out.ffm / (1 - t / 100);
      out.target = t;
    }
    out.kat = kategoriLemak(jk, out.pct);
    return out;
  }
  function kategoriLemak(jk, p) {
    const cut = jk === "L" ? [[6, "Lemak esensial"], [14, "Atletis"], [18, "Bugar"], [25, "Rata-rata"], [99, "Berlebih"]] : [[14, "Lemak esensial"], [21, "Atletis"], [25, "Bugar"], [32, "Rata-rata"], [99, "Berlebih"]];
    return cut.find((c) => p < c[0])[1];
  }

  /* ---------- 2. REE (Bagian 4.1) ---------- */
  function ree(inp, usia, kom) {
    const bb = num(inp.bb), tb = num(inp.tb), L = inp.jk !== "P", ffm = kom.estimasi ? null : kom.ffm;
    const rows = [
      ["Harris–Benedict (1918)", L ? 66.47 + 13.75 * bb + 5.003 * tb - 6.755 * usia : 655.1 + 9.563 * bb + 1.85 * tb - 4.676 * usia, "Tanpa data komposisi tubuh"],
      ["Harris–Benedict revisi (1984)", L ? 88.362 + 13.397 * bb + 4.799 * tb - 5.677 * usia : 447.593 + 9.247 * bb + 3.098 * tb - 4.33 * usia, "Tanpa data komposisi tubuh"],
      ["Mifflin–St Jeor (1990)", 10 * bb + 6.25 * tb - 5 * usia + (L ? 5 : -161), "Populasi umum; cenderung meleset pada atlet"],
      ["ten Haaf & Weijs (2014), BB", 11.936 * bb + 587.728 * tb / 100 - 8.129 * usia + 191.027 * (L ? 1 : 0) + 29.279, "Atlet tanpa data FFM"],
      ["Tinsley (2019), BB", 24.8 * bb + 10, "Atlet physique/berotot"]
    ];
    if (ffm) {
      rows.push(["Cunningham (1980)", 500 + 22 * ffm, "Atlet dengan data FFM"]);
      rows.push(["Cunningham (1991)", 370 + 21.6 * ffm, "Atlet dengan data FFM"]);
      rows.push(["ten Haaf & Weijs (2014), FFM", 22.771 * ffm + 484.264, "Atlet dengan data FFM"]);
      rows.push(["Tinsley (2019), FFM", 25.9 * ffm + 284, "Atlet physique/berotot"]);
    }
    const grup = (CABOR_MAP[inp.cabor] || {}).grup;
    let pilih;
    if (ffm && grup === "physique") pilih = "Tinsley (2019), FFM";
    else if (ffm) pilih = "Cunningham (1980)";
    else if (grup === "physique") pilih = "Tinsley (2019), BB";
    else pilih = "ten Haaf & Weijs (2014), BB";
    const val = rows.find((r) => r[0] === pilih)[1];
    const alasan = ffm
      ? (grup === "physique" ? "Atlet physique dengan data FFM: persamaan Tinsley (2019)." : "Ada data FFM: Cunningham (1980) termasuk yang tidak berbeda bermakna dari kalorimetri pada atlet (O'Neill et al., 2023).")
      : "Belum ada data FFM terukur: ten Haaf & Weijs (2014) berbasis BB, dikembangkan pada atlet rekreasional.";
    return { rows: rows.map(([n, v, k]) => ({ n, v, k, pilih: n === pilih })), nilai: val, pilih, alasan };
  }

  /* ---------- 3. Sesi latihan, beban sRPE, EEE (Bagian 4.3, 13.2) ---------- */
  function hitungSesi(s, bb, cabor) {
    const j = JENIS[s.jenis] || JENIS.teknik;
    const dur = clamp(num(s.durasi) || 0, 0, 600);
    const rpe = clamp(num(s.rpe) || 0, 0, 10);
    const met = j.met == null ? (cabor ? cabor.met : 8) : j.met;
    const h = dur / 60;
    return { jenis: s.jenis, nama: j.n, singkat: j.s, dur, rpe, met, au: dur * rpe, eeeBruto: met * bb * h, eeeNeto: Math.max(0, met - 1) * bb * h };
  }
  // Kategori beban harian (Tinjauan 13.2; label C). Nilai dalam kategori mengikuti contoh mikrosiklus Bagian 14.2:
  // ringan ±4, sedang ±5, tinggi ±7, sangat tinggi ±8 g/kg, bergeser sedikit menurut posisi AU di dalam kategori.
  function kategoriBeban(au) {
    if (au <= 0) return { i: 0, n: "Istirahat", rng: [3, 5], g: 3.5 };
    if (au < 300) return { i: 0, n: "Ringan", rng: [3, 5], g: 3 + 1.5 * au / 300 };
    if (au < 600) return { i: 1, n: "Sedang", rng: [5, 7], g: 5 + (au - 300) / 300 };
    if (au <= 1000) return { i: 2, n: "Tinggi", rng: [6, 10], g: 6.5 + (au - 600) / 400 };
    return { i: 3, n: "Sangat tinggi", rng: [8, 12], g: 8 + 2 * Math.min(1, (au - 1000) / 1000) };
  }

  /* ---------- 4. Program harian ---------- */
  function hitung(inp, opsi) {
    opsi = opsi || {};
    const usia = num(inp.usia) || usiaDari(inp.tglLahir, inp.tanggal) || 25;
    const bb = num(inp.bb), tb = num(inp.tb);
    if (!bb || !tb) throw new Error("BB dan TB wajib diisi");
    const jk = inp.jk === "P" ? "P" : "L";
    const cabor = CABOR_MAP[inp.cabor] || CABOR_MAP.kebugaran;
    const grup = GRUP[cabor.grup];
    const tujuan = TUJUAN[inp.tujuan] ? inp.tujuan : "performa";
    const remaja = usia < 18;
    const kom = komposisi(inp, usia);
    const R = ree(inp, usia, kom);
    const faktorNon = num(inp.aktivitasNon) || 1.4;
    const peringatan = [];

    // Penyesuaian energi menurut tujuan (Bagian 6).
    let adj = { jenis: "seimbang", kkal: 0, teks: "Keseimbangan energi (BB stabil)." };
    const laju = num(inp.lajuTarget);
    let target = null;
    if (tujuan === "hipertrofi") {
      const pct = laju && laju >= 0.4 ? 0.15 : 0.10;
      adj = { jenis: "surplus", pct, teks: `Surplus ${pct * 100}% dari kebutuhan harian untuk kenaikan ±${laju || 0.25}–0,5% BB/minggu (Iraki et al., 2019).` };
    } else if (tujuan === "turun_lemak" || tujuan === "kelas_berat") {
      const l = clamp(laju || 0.7, 0.25, 1.0);
      if (remaja) {
        adj = { jenis: "defisit", kkal: Math.min(250, l / 100 * bb * 7700 / 7), teks: "Atlet remaja: defisit dibatasi ±250 kkal/hari agar pertumbuhan tidak terganggu." };
        peringatan.push("Usia di bawah 18 tahun: defisit energi besar dan dehidrasi akut tidak dianjurkan (Tinjauan Bagian 15).");
      } else {
        adj = { jenis: "defisit", kkal: l / 100 * bb * 7700 / 7, laju: l, teks: `Defisit awal ${r0(l / 100 * bb * 7700 / 7)} kkal/hari untuk laju ${String(l).replace(".", ",")}% BB/minggu (±7.700 kkal/kg jaringan; Garthe et al., 2011). Sesuaikan tiap 2–3 minggu dari tren BB.` };
      }
    } else if (tujuan === "rekomposisi") {
      adj = { jenis: "defisit", kkal: 0.05, relatif: true, teks: "Defisit kecil ±5% untuk rekomposisi, protein ≥ 1,6 g/kg (Aragon et al., 2017)." };
    }

    // Target berat badan.
    if (kom.bbTarget) target = { bb: kom.bbTarget, alasan: `BB pada ${r1(kom.target)}% lemak dengan FFM tetap ${r1(kom.ffm)} kg` };
    if (tujuan === "kelas_berat" && num(inp.kelasBerat)) {
      const batas = num(inp.kelasBerat);
      const jedaJam = num(inp.jedaTimbang) || 24;
      const akut = remaja ? 0 : jedaJam >= 24 ? 0.03 : 0.015;
      const kronis = batas * (1 + akut);
      target = { bb: kronis, alasan: `Batas kelas ${batas} kg + ruang penurunan akut ${r1(akut * 100)}% (jeda timbang–tanding ${jedaJam} jam; Reale et al., 2017)`, batas, akut };
    }
    if (target) {
      const delta = bb - target.bb;
      target.delta = delta;
      if (delta > 0.05 && adj.jenis === "defisit" && !adj.relatif) {
        const l = adj.laju || 0.7;
        target.minggu = Math.ceil(delta / (bb * l / 100));
      }
      if (inp.tglTimbang && target.minggu) {
        const sisa = (new Date(inp.tglTimbang) - new Date(inp.tanggal || Date.now())) / (7 * 864e5);
        target.sisaMinggu = sisa;
        if (sisa > 0 && target.minggu > sisa) peringatan.push(`Waktu ke timbang badan (${r1(sisa)} minggu) lebih pendek dari waktu yang aman (${target.minggu} minggu pada ${String(adj.laju || 0.7).replace(".", ",")}%/minggu). Pertimbangkan kelas di atasnya atau mulai lebih awal.`);
      }
    }

    // Jadwal mingguan.
    const sesi = (inp.jadwal || []).map((s) => ({ ...s, hari: clamp(Number(s.hari) || 0, 0, 6) }));
    const hari = HARI.map((nama, i) => {
      const ss = sesi.filter((s) => s.hari === i && num(s.durasi) > 0).map((s) => hitungSesi(s, bb, cabor));
      const au = sum(ss.map((s) => s.au));
      const neto = sum(ss.map((s) => s.eeeNeto));
      const bruto = sum(ss.map((s) => s.eeeBruto));
      const kat = kategoriBeban(au);
      return { i, nama, sesi: ss, au, neto, bruto, kat };
    });

    const pro_g = (() => {
      if (tujuan === "hipertrofi") return { gkg: 2.0, teks: "1,6–2,2 g/kg untuk hipertrofi (Morton et al., 2018; Jäger et al., 2017)" };
      if (tujuan === "turun_lemak" || tujuan === "kelas_berat") {
        const ramping = !kom.estimasi && ((jk === "L" && kom.pct < 12) || (jk === "P" && kom.pct < 20));
        if (ramping) return { gkg: 2.6 * kom.ffm / bb, teks: `Atlet ramping saat defisit: 2,3–3,1 g/kg FFM; dipakai 2,6 g/kg FFM (Helms et al., 2014)` };
        return { gkg: 2.0, teks: "1,6–2,4 g/kg saat defisit energi (Hector & Phillips, 2018)" };
      }
      if (tujuan === "rekomposisi") return { gkg: 1.8, teks: "≥ 1,6 g/kg untuk rekomposisi (Aragon et al., 2017)" };
      return { gkg: grup.proPerforma, teks: `${String(grup.pro[0]).replace(".", ",")}–${String(grup.pro[1]).replace(".", ",")} g/kg untuk kelompok ${grup.n.toLowerCase()} (Tinjauan Bagian 11)` };
    })();

    const physiqueDiet = cabor.grup === "physique" && tujuan === "turun_lemak";
    const lemakMin = physiqueDiet ? 0.15 : 0.20;

    hari.forEach((d) => {
      let E = R.nilai * faktorNon + d.neto;
      const dasar = E;
      if (adj.jenis === "surplus") E *= 1 + adj.pct;
      else if (adj.jenis === "defisit") E -= adj.relatif ? E * adj.kkal : adj.kkal;
      // Lantai EA 30 kkal/kg FFM (Loucks et al., 2011) kecuali fase defisit terencana yang diawasi.
      const lantai = 30 * kom.ffm + d.neto;
      if (adj.jenis === "defisit" && E < lantai) { E = lantai; d.lantaiEA = true; }
      // Karbohidrat menurut beban (Bagian 5.1, 13.2) dan kelompok cabang (Bagian 11).
      let cg = d.kat.g;
      cg = Math.min(cg, grup.cho[1]);
      if (d.au > 0) cg = Math.max(cg, Math.max(3, grup.cho[0] - 1));
      if (tujuan === "hipertrofi") cg = clamp(cg, 4, 7);
      if ((tujuan === "turun_lemak" || tujuan === "kelas_berat") && d.au < 300) cg = Math.max(3, cg - 1);
      cg = clamp(cg, 3, 12);
      let C = cg * bb;
      const P = pro_g.gkg * bb;
      let F = (E - 4 * C - 4 * P) / 9;
      d.catatan = [];
      if (F * 9 < lemakMin * E) {
        const Cmin = Math.max(3, d.kat.rng[0] - (d.au < 300 ? 1 : 0)) * bb;
        const Cbaru = Math.max(Cmin, (E - 4 * P - 9 * lemakMin * E / 9) / 4);
        if (Cbaru < C) { C = Cbaru; d.catatan.push("KH dikurangi agar lemak tetap ≥ " + lemakMin * 100 + "% energi"); }
        F = (E - 4 * C - 4 * P) / 9;
        if (F * 9 < lemakMin * E) { F = lemakMin * E / 9; E = 4 * C + 4 * P + 9 * F; d.catatan.push("Energi dinaikkan agar KH dan lemak minimal terpenuhi"); }
      } else if (F * 9 > 0.35 * E) {
        F = 0.35 * E / 9; C = (E - 4 * P - 9 * F) / 4; d.catatan.push("Sisa energi dialihkan ke KH agar lemak ≤ 35%");
      }
      d.E = E; d.dasar = dasar; d.C = C; d.P = P; d.F = F;
      d.cgkg = C / bb; d.fatPct = 9 * F / E;
      d.ea = (E - d.neto) / kom.ffm;
    });
    if (hari.some((d) => d.lantaiEA)) peringatan.push("Pada beberapa hari, defisit dibatasi agar ketersediaan energi tidak turun di bawah 30 kkal/kg FFM (risiko REDs; Mountjoy et al., 2023). Laju penurunan berat akan lebih lambat dari target.");

    const avg = (k) => sum(hari.map((d) => d[k])) / 7;
    const rata = { E: avg("E"), C: avg("C"), P: avg("P"), F: avg("F"), neto: avg("neto"), au: avg("au"), ea: avg("ea") };
    const hariLatih = hari.filter((d) => d.au > 0);
    const hariBerat = hari.reduce((a, d) => (d.au > a.au ? d : a), hari[0]);
    const hariRingan = hari.reduce((a, d) => (d.au < a.au ? d : a), hari[0]);

    // Pembanding Kemenkes 2021 (IOM 2005) untuk hari rata-rata.
    const pal = faktorNon + rata.neto / R.nilai; // PAL ≈ TEE / REE
    const H = tb / 100;
    const palKat = pal < 1.4 ? 0 : pal < 1.6 ? 1 : pal < 1.9 ? 2 : 3;
    const pa = (jk === "L" ? [1, 1.11, 1.25, 1.48] : [1, 1.12, 1.27, 1.45])[palKat];
    const eerKemenkes = usia >= 19 ? (jk === "L" ? 662 - 9.53 * usia + pa * (15.91 * bb + 539.6 * H) : 354 - 6.91 * usia + pa * (9.36 * bb + 726 * H)) : null;

    // Hidrasi (Bagian 9).
    const k = inp.keringat || {};
    let hidrasi = null;
    if (num(k.pre) && num(k.post) && num(k.durasi)) {
      const loss = num(k.pre) - num(k.post);
      const sweat = loss + (num(k.minum) || 0) / 1000 - (num(k.urin) || 0) / 1000;
      const sr = sweat / (num(k.durasi) / 60);
      const pct = loss / num(k.pre) * 100;
      const durP = Math.max(...hari.flatMap((d) => d.sesi.map((s) => s.dur)), 60) / 60;
      const minPH = Math.max(0, (sr * durP - 0.02 * bb) / durP);
      let tgt = (minPH + sr) / 2;
      if (tgt > 1.2) tgt = Math.max(1.2, minPH);
      hidrasi = { loss, sweat, sr, pct, tgt, minPH, maxPH: sr, durP, rehid: [loss * 1.25, loss * 1.5] };
      if (pct > 2) peringatan.push(`Kehilangan BB saat tes keringat ${r1(pct)}% (> 2%): performa aerobik dan kognitif dapat turun (Sawka et al., 2007).`);
      if (pct < 0) peringatan.push("BB naik selama latihan: minum melebihi keringat, risiko hiponatremia.");
    }

    // REDs skrining sederhana.
    const reds = (inp.reds || []).filter(Boolean);
    if (reds.length >= 2 || (reds.length && rata.ea < 30)) peringatan.push("Ada tanda yang perlu dievaluasi untuk REDs (low energy availability). Konsultasikan langsung dengan dokter olahraga/ahli gizi; REDs CAT2 dipakai untuk diagnosis (Mountjoy et al., 2023).");

    // Suplemen (Bagian 10), hanya ≥ 18 tahun.
    const SUP = {
      kafein: { n: "Kafein", dosis: `${r0(3 * bb)}–${r0(6 * bb)} mg (3–6 mg/kg)`, waktu: "±60 menit sebelum sesi kunci/lomba", ref: "Guest et al., 2021" },
      kreatin: { n: "Kreatin monohidrat", dosis: `3–5 g/hari, atau loading ${r0(0.3 * bb)} g/hari (0,3 g/kg) 5–7 hari`, waktu: "Kapan saja, setiap hari", ref: "Kreider et al., 2017" },
      betaalanin: { n: "Beta-alanin", dosis: "4–6 g/hari dibagi (≤ 1,6 g/dosis), ≥ 2–4 minggu", waktu: "Kronis", ref: "Trexler et al., 2015" },
      bikarbonat: { n: "Natrium bikarbonat", dosis: `${r0(0.2 * bb)}–${r0(0.3 * bb)} g (0,2–0,3 g/kg)`, waktu: "60–180 menit sebelum; uji coba saat latihan", ref: "Grgic et al., 2021" },
      nitrat: { n: "Nitrat (jus bit)", dosis: "±5–9 mmol (310–560 mg nitrat)", waktu: "2–3 jam sebelum; efek lebih kuat bila beberapa hari", ref: "Maughan et al., 2018" }
    };
    const suplemen = remaja ? [] : grup.sup.map((s) => SUP[s]);

    // Kompetisi dekat: carbo loading.
    let lomba = null;
    if (inp.tglKompetisi) {
      const hariKe = (new Date(inp.tglKompetisi) - new Date(inp.tanggal || Date.now())) / 864e5;
      lomba = { hariKe: Math.round(hariKe) };
      if (cabor.grup === "endurance") lomba.loading = [10 * bb, 12 * bb];
      lomba.pre = [1 * bb, 3 * bb];
    }

    return {
      usia, jk, bb, tb, remaja, cabor, grup, tujuan, kom, ree: R, faktorNon, adj, target, hari, rata, hariBerat, hariRingan, hariLatih,
      pro: pro_g, lemakMin, eerKemenkes, palKasar: pal, hidrasi, suplemen, lomba, peringatan, fase: FASE[inp.fase] || FASE.umum, reds
    };
  }

  /* ---------- 5. Progres antar-asesmen ---------- */
  function progres(riwayat) {
    // riwayat: [{tanggal, bb, pct, ffm}] urut lama → baru
    if (!riwayat || riwayat.length < 2) return null;
    const a = riwayat[riwayat.length - 2], b = riwayat[riwayat.length - 1];
    const minggu = Math.max(0.1, (new Date(b.tanggal) - new Date(a.tanggal)) / (7 * 864e5));
    const dBB = b.bb - a.bb, dLemak = b.pct != null && a.pct != null ? b.pct - a.pct : null, dFFM = b.ffm != null && a.ffm != null ? b.ffm - a.ffm : null;
    const laju = dBB / a.bb * 100 / minggu;
    return { a, b, minggu, dBB, dLemak, dFFM, laju };
  }

  /* ---------- 6. Pembahasan naratif ---------- */
  function pembahasan(H, prog) {
    const p = [];
    const f = (x, d = 0) => Number(x).toLocaleString("id-ID", { maximumFractionDigits: d, minimumFractionDigits: d });
    const k = H.kom;
    p.push({ judul: "Komposisi tubuh", isi: `Persen lemak ${f(k.pct, 1)}% (${k.kat.toLowerCase()}) dengan massa bebas lemak ${f(k.ffm, 1)} kg dan FFMI ternormalisasi ${f(k.ffmiN, 1)} kg/m². ${k.estimasi ? "Angka ini masih estimasi dari IMT sehingga semua perhitungan berbasis FFM perlu dikonfirmasi dengan skinfold atau BIA. " : ""}${H.target ? `Target berat ${f(H.target.bb, 1)} kg (${H.target.alasan}); selisih ${H.target.delta > 0 ? "−" : "+"}${f(Math.abs(H.target.delta), 1)} kg${H.target.minggu ? `, ±${H.target.minggu} minggu pada laju aman` : ""}.` : ""}${k.ffmiN > 24 && H.jk === "L" ? " FFMI sudah mendekati batas alami (±25), sehingga ruang hipertrofi tersisa kecil." : ""}` });
    p.push({ judul: "Kebutuhan energi", isi: `REE ${f(H.ree.nilai)} kkal/hari dengan ${H.ree.pilih}. ${H.ree.alasan} Kebutuhan harian dihitung secara faktorial: REE × ${f(H.faktorNon, 1)} (aktivitas di luar latihan + efek termik makanan) + energi latihan neto per hari. Rata-rata minggu ini ${f(H.rata.E)} kkal/hari, berkisar ${f(H.hariRingan.E)} kkal pada hari teringan sampai ${f(H.hariBerat.E)} kkal pada hari terberat (${H.hariBerat.nama}). ${H.adj.teks}` });
    p.push({ judul: "Ketersediaan energi", isi: `EA rata-rata ${f(H.rata.ea, 1)} kkal/kg FFM/hari. ${H.rata.ea >= 45 ? "Optimal untuk kesehatan dan adaptasi latihan." : H.rata.ea >= 30 ? "Masih dalam rentang yang dapat diterima, tetapi pantau kelelahan, kualitas tidur, dan siklus haid bila perempuan." : "Di bawah 30: zona berisiko REDs. Jangan memperbesar defisit."} Low energy availability adalah spektrum; angka 30 bukan batas diagnostik tunggal (Mountjoy et al., 2023).` });
    p.push({ judul: "Karbohidrat: periodisasi harian", isi: `Karbohidrat mengikuti beban latihan harian (session-RPE = durasi × RPE), bukan angka tetap: ${f(H.hariRingan.cgkg, 1)} g/kg pada hari ringan sampai ${f(H.hariBerat.cgkg, 1)} g/kg pada hari berat (${f(H.hariBerat.C)} g). Prinsipnya "fuel for the work required" (Impey et al., 2018): sesi kunci seperti HIIT, conditioning, dan pertandingan selalu didukung KH cukup. Rentang kelompok ${H.grup.n.toLowerCase()}: ${H.grup.cho[0]}–${H.grup.cho[1]} g/kg.` });
    p.push({ judul: "Protein", isi: `${f(H.pro.gkg, 1)} g/kg (${f(H.rata.P)} g/hari): ${H.pro.teks}. Bagi ke 4 waktu makan × ${f(0.3 * H.bb)}–${f(0.4 * H.bb)} g (0,3–0,4 g/kg, ±2–3 g leusin) dengan jarak 3–4 jam; tambahkan 30–40 g protein kasein/susu sebelum tidur bila hipertrofi atau penurunan lemak.` });
    p.push({ judul: "Lemak", isi: `Lemak dihitung sebagai sisa energi, dijaga ${f(H.lemakMin * 100)}–35% energi (rata-rata ${f(H.rata.F)} g/hari). Asupan di bawah 20% berisiko kekurangan vitamin larut lemak dan asam lemak esensial (Thomas et al., 2016).` });
    if (H.hidrasi) p.push({ judul: "Hidrasi", isi: `Laju keringat ${f(H.hidrasi.sr, 2)} L/jam. Untuk sesi ±${f(H.hidrasi.durP * 60)} menit, minum ±${f(Math.round(H.hidrasi.tgt * 250 / 10) * 10)} mL setiap 15 menit (${f(Math.round(H.hidrasi.tgt * 1000 / 50) * 50)} mL/jam) agar kehilangan BB < 2% tanpa minum melebihi keringat. Setelah latihan ganti 125–150% BB yang hilang bersama natrium (Shirreffs et al., 1996).` });
    else p.push({ judul: "Hidrasi", isi: "Lakukan tes laju keringat (timbang sebelum–sesudah latihan) agar anjuran minum dihitung dari keringat Anda sendiri. Sementara itu: 5–7 mL/kg 4 jam sebelum latihan dan 125–150% BB yang hilang setelahnya (Sawka et al., 2007)." });
    if (H.suplemen.length) p.push({ judul: "Suplemen yang relevan", isi: `Untuk kelompok ${H.grup.n.toLowerCase()}, suplemen berbukti kuat (IOC, Maughan et al., 2018): ${H.suplemen.map((s) => s.n).join(", ")}. Gunakan produk bersertifikat uji pihak ketiga (antidoping) dan uji coba dahulu saat latihan, bukan saat lomba.` });
    else if (H.remaja) p.push({ judul: "Suplemen", isi: "Atlet di bawah 18 tahun: utamakan makanan; suplemen performa tidak direkomendasikan tanpa pengawasan tenaga kesehatan." });
    if (prog) {
      const t = `Sejak asesmen ${prog.a.tanggal} (${f(prog.minggu, 1)} minggu): BB ${prog.dBB >= 0 ? "+" : "−"}${f(Math.abs(prog.dBB), 1)} kg (${prog.laju >= 0 ? "+" : "−"}${f(Math.abs(prog.laju), 2)}% BB/minggu)` +
        (prog.dLemak != null ? `, lemak ${prog.dLemak >= 0 ? "+" : "−"}${f(Math.abs(prog.dLemak), 1)} poin` : "") +
        (prog.dFFM != null ? `, FFM ${prog.dFFM >= 0 ? "+" : "−"}${f(Math.abs(prog.dFFM), 1)} kg` : "") + ". ";
      let s = "";
      if ((H.tujuan === "turun_lemak" || H.tujuan === "kelas_berat") && prog.laju < -1.0) s = "Laju penurunan lebih cepat dari 1%/minggu: kurangi defisit agar massa otot dan performa terjaga (Garthe et al., 2011).";
      else if ((H.tujuan === "turun_lemak" || H.tujuan === "kelas_berat") && prog.laju > -0.3) s = "Penurunan lebih lambat dari target: perbesar defisit ±100–200 kkal/hari atau periksa kepatuhan dan pencatatan asupan.";
      else if (H.tujuan === "hipertrofi" && prog.laju > 0.5) s = "Kenaikan > 0,5%/minggu: surplus kemungkinan terlalu besar sehingga lemak ikut naik; kurangi surplus.";
      else if (H.tujuan === "hipertrofi" && prog.laju < 0.2) s = "Kenaikan masih lambat: tambah ±100–150 kkal/hari dari karbohidrat.";
      if (prog.dFFM != null && prog.dFFM < -0.5) s += " FFM turun: pastikan protein dan latihan beban terpenuhi.";
      p.push({ judul: "Perkembangan", isi: t + (s || "Perubahan sesuai arah tujuan; lanjutkan program dan evaluasi lagi 2–4 minggu.") });
    }
    p.push({ judul: "Pemantauan", isi: "Hitung ulang setiap 2–4 minggu dari tren BB rata-rata mingguan, komposisi tubuh (jumlah skinfold), beban sRPE, performa, dan tanda klinis. Hasil kalkulator adalah titik awal; pemantauan yang menentukan penyesuaian (Tinjauan Bagian 15)." });
    return p;
  }

  const API = { HARI, GRUP, CABOR, CABOR_MAP, JENIS, FASE, TUJUAN, usiaDari, komposisi, ree, hitungSesi, kategoriBeban, hitung, progres, pembahasan };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.PG = API;
})(typeof window !== "undefined" ? window : this);
