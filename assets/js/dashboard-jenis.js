/*
 * Dashboard pengelola: pemisahan tampilan Konsultasi Atlet dan Wellness Korporat.
 * - Tampilan Atlet: isi dashboard.js (program gizi, permintaan, pembayaran) + daftar pendaftar formulir atlet.
 * - Tampilan Wellness Korporat: angka, grafik, dan daftar pendaftar karyawan/perusahaan sendiri.
 * Data pendaftar diambil dari Apps Script (aksi kons-daftar-admin, tab "Konsultasi Atlet" dan
 * "Konsultasi Wellness Korporat"). Buka dashboard.html?demo untuk melihat contoh dengan data rekaan.
 */
document.addEventListener("DOMContentLoaded", () => {
  const MK = window.MK, S = window.SITE || {}, Chart = window.Chart;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => MK.esc(String(s == null ? "" : s));
  const ENDPOINT = S.programEndpoint || S.otpEndpoint || "";
  const JENIS_KEY = "mk-dash-jenis";
  const HIJAU = ["#0f7b5f", "#06d6a0", "#2a9d8f", "#118ab2", "#ffd166", "#f05828", "#8338ec", "#ef476f", "#3a86ff", "#e76f51"];
  const STATUS = ["Baru", "Dijawab", "Lanjut konsultasi", "Selesai", "Ditolak"];
  const st = { token: "", demo: false, data: { atlet: [], korporat: [] }, peserta: 0, jenis: "atlet", charts: {}, dimuat: false };

  async function api(payload) {
    const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), redirect: "follow" });
    if (!r.ok) throw new Error("http");
    return r.json();
  }

  /* ---------- Pilih tampilan ---------- */
  function pilih(jenis, simpan) {
    st.jenis = jenis === "korporat" ? "korporat" : "atlet";
    document.querySelectorAll(".dj-tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.jenis === st.jenis)));
    $("dv-atlet").hidden = st.jenis !== "atlet";
    $("dv-korporat").hidden = st.jenis !== "korporat";
    document.body.classList.toggle("dj-mode-korporat", st.jenis === "korporat");
    $("d-csv").hidden = st.jenis !== "atlet"; // CSV peserta program gizi hanya untuk tampilan atlet
    if (simpan) { try { localStorage.setItem(JENIS_KEY, st.jenis); } catch (e) { /* abaikan */ } }
    if (st.jenis === "korporat" && st.dimuat) renderKorporat(); // grafik dibuat saat terlihat agar ukurannya benar
  }
  document.querySelectorAll(".dj-tab").forEach((t) => t.addEventListener("click", () => pilih(t.dataset.jenis, true)));
  let awal = /wellness|korporat/i.test(location.hash) ? "korporat" : "";
  if (!awal) { try { awal = localStorage.getItem(JENIS_KEY) || "atlet"; } catch (e) { awal = "atlet"; } }
  pilih(awal);

  /* ---------- Muat data pendaftar ---------- */
  window.addEventListener("mk-dash-muat", (e) => {
    st.token = e.detail.token; st.peserta = e.detail.peserta || 0;
    muat();
  });
  async function muat(ubah) {
    if (st.demo) { renderSemua(); return true; }
    if (!st.token || !ENDPOINT) return false;
    try {
      const j = await api({ aksi: "kons-daftar-admin", token: st.token, ubah });
      if (!j.ok) { MK.toast(j.pesan === "Permintaan tidak dikenali." ? "Data pendaftar belum tersedia: layanan Apps Script perlu diperbarui." : (j.pesan || "Gagal memuat data pendaftar")); renderSemua(); return false; }
      st.data = { atlet: j.atlet || [], korporat: j.korporat || [] };
      renderSemua();
      return true;
    } catch (er) { MK.toast("Data pendaftar tidak bisa dimuat"); return false; }
  }
  function renderSemua() {
    st.dimuat = true;
    const A = st.data.atlet, K = st.data.korporat;
    $("dj-n-atlet").innerHTML = `<b>${st.peserta + A.length}</b><small>${st.peserta} peserta · ${A.length} pendaftar</small>`;
    const perus = new Set(K.map((r) => r["Perusahaan/instansi"]).filter(Boolean)).size;
    $("dj-n-korporat").innerHTML = `<b>${K.length}</b><small>${K.length} pendaftar · ${perus} perusahaan</small>`;
    isiPerusahaan();
    renderDaftar("atlet");
    if (st.jenis === "korporat") renderKorporat(); else renderDaftar("korporat");
  }

  /* ---------- Bantu hitung ---------- */
  const angka = (v) => { const x = Number(v); return v === "" || v == null || !isFinite(x) ? null : x; };
  const persen = (rows, fn) => rows.length ? Math.round(rows.filter(fn).length / rows.length * 100) : 0;
  const hitung = (arr) => arr.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});
  const baru = (rows) => rows.filter((r) => (r.Status || "Baru") === "Baru").length;
  const tglPendek = (w) => String(w || "").slice(0, 10);
  function chart(id, cfg) {
    if (!Chart || !$(id)) return;
    if (st.charts[id]) st.charts[id].destroy();
    st.charts[id] = new Chart($(id), cfg);
  }
  const opsi = { responsive: true, maintainAspectRatio: false, animation: { duration: 700 }, plugins: { legend: { labels: { font: { family: "Outfit" }, boxWidth: 12 } } } };
  const donat = (id, obj, urut) => {
    const ent = urut ? urut.filter((k) => obj[k]).map((k) => [k, obj[k]]) : Object.entries(obj).sort((a, b) => b[1] - a[1]);
    chart(id, { type: "doughnut", data: { labels: ent.map((e) => e[0]), datasets: [{ data: ent.map((e) => e[1]), backgroundColor: ent.map((_, i) => HIJAU[i % HIJAU.length]), borderWidth: 2, borderColor: "#fff" }] }, options: { ...opsi, cutout: "58%", plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { family: "Outfit", size: 11 } } } } } });
  };
  const batang = (id, obj, maks, label) => {
    const ent = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, maks || 8);
    chart(id, { type: "bar", data: { labels: ent.map((e) => String(e[0]).length > 26 ? String(e[0]).slice(0, 25) + "…" : e[0]), datasets: [{ label: label || "Pendaftar", data: ent.map((e) => e[1]), backgroundColor: ent.map((_, i) => HIJAU[i % HIJAU.length]), borderRadius: 8 }] }, options: { ...opsi, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } } });
  };

  /* ---------- Tampilan Wellness Korporat ---------- */
  function renderKorporat() {
    const K = st.data.korporat;
    const kpi = [
      ["Pendaftar", K.length, `${baru(K)} berstatus baru`, "k1"],
      ["Perusahaan", new Set(K.map((r) => r["Perusahaan/instansi"]).filter(Boolean)).size, `${new Set(K.map((r) => r["Kode program"]).filter(Boolean)).size} kode program`, "k6"],
      ["Perlu cek manual", K.filter((r) => r["Perlu cek manual"] === "Ya").length, "Kondisi medis, obat, hamil", "k5"],
      ["Pinggang berisiko", persen(K, (r) => r["Pinggang berisiko"] === "Ya") + "%", "≥ 90 cm (L) / ≥ 80 cm (P)", "k4"],
      ["IMT ≥ 25", persen(K, (r) => angka(r.IMT) > 25) + "%", "Gemuk atau obesitas", "k2"],
      ["Aktif ≥ 150 mnt", persen(K, (r) => r["Aktivitas cukup (≥150)"] === "Ya") + "%", "Aktivitas fisik per minggu", "k3"]
    ];
    $("jk-kpi").innerHTML = kpi.map(([l, v, s, c]) => `<div class="db-k ${c}"><span>${l}</span><b>${esc(v)}</b><small>${esc(s)}</small></div>`).join("");

    const bulan = []; const d = new Date(); d.setDate(1);
    for (let i = 11; i >= 0; i--) { const t = new Date(d.getFullYear(), d.getMonth() - i, 1); bulan.push(t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0")); }
    const perB = bulan.map((b) => K.filter((r) => String(r.Waktu).slice(0, 7) === b).length);
    chart("jk-bulan", { type: "bar", data: { labels: bulan.map((b) => new Date(b + "-01").toLocaleDateString("id-ID", { month: "short", year: "2-digit" })), datasets: [{ label: "Pendaftar", data: perB, backgroundColor: "#0f7b5f", borderRadius: 8 }] }, options: { ...opsi, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
    batang("jk-perusahaan", hitung(K.map((r) => r["Perusahaan/instansi"] || "(kosong)")), 8);

    const risiko = [
      ["Lingkar pinggang berisiko", (r) => r["Pinggang berisiko"] === "Ya"],
      ["IMT ≥ 25", (r) => angka(r.IMT) > 25],
      ["Aktivitas < 150 mnt/minggu", (r) => r["Aktivitas cukup (≥150)"] === "Tidak"],
      ["Duduk ≥ 8 jam/hari", (r) => angka(r["Jam duduk/hari"]) >= 8],
      ["Tidur < 6 jam", (r) => angka(r["Tidur (jam)"]) != null && angka(r["Tidur (jam)"]) < 6],
      ["Tidak rutin sarapan", (r) => r.Sarapan && r.Sarapan !== "rutin"],
      ["Minuman manis ≥ 2/hari", (r) => r["Minuman manis/hari"] === "2+"],
      ["Stres kerja tinggi", (r) => r["Stres kerja"] === "Tinggi"],
      ["Merokok", (r) => r.Merokok === "ya"],
      ["Belum MCU 12 bulan", (r) => r["MCU 12 bulan"] === "tidak"]
    ].map(([l, fn]) => [l, persen(K, fn)]);
    chart("jk-risiko", { type: "bar", data: { labels: risiko.map((r) => r[0]), datasets: [{ label: "% karyawan", data: risiko.map((r) => r[1]), backgroundColor: risiko.map((r) => r[1] >= 50 ? "#ef476f" : r[1] >= 25 ? "#ffd166" : "#06d6a0"), borderRadius: 8 }] }, options: { ...opsi, indexAxis: "y", plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.raw + "% karyawan" } } }, scales: { x: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + "%" } } } } });
    donat("jk-imt", hitung(K.map((r) => r["Kategori IMT"] || "–")), ["Sangat kurus", "Kurus", "Normal", "Gemuk", "Obesitas", "–"]);
    batang("jk-tujuan", hitung(K.map((r) => r.Tujuan || "–")), 6);
    donat("jk-pola", hitung(K.map((r) => r["Pola kerja"] || "–")));
    donat("jk-stres", hitung(K.map((r) => r["Stres kerja"] || "–")), ["Rendah", "Sedang", "Tinggi", "–"]);
    renderDaftar("korporat");
  }
  function isiPerusahaan() {
    const sel = $("jk-perus"), v = sel.value;
    const P = [...new Set(st.data.korporat.map((r) => r["Perusahaan/instansi"]).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">Semua perusahaan</option>' + P.map((p) => `<option ${p === v ? "selected" : ""}>${esc(p)}</option>`).join("");
  }

  /* ---------- Daftar pendaftar (atlet & korporat) ---------- */
  const CFG = {
    atlet: {
      pre: "ja", cari: ["Nama", "Email", "Cabang olahraga", "Klub/instansi", "Pelatih", "Kota", "ID"],
      sub: (r) => [r["Cabang olahraga"], r["Nomor/posisi/kelas"], r.Level].filter(Boolean).join(" · "),
      info: (r) => [r["Klub/instansi"], r["Jam latihan/minggu"] ? r["Jam latihan/minggu"] + " jam latihan/minggu" : "", r["Kompetisi terdekat"] && r["Kompetisi terdekat"] !== "Belum ada" ? "kompetisi " + r["Kompetisi terdekat"] : ""].filter(Boolean).join(" · "),
      bagian: [["Olahraga", ["Cabang olahraga", "Nomor/posisi/kelas", "Level", "Klub/instansi", "Pelatih", "Sesi/minggu", "Durasi/sesi (menit)", "Jam latihan/minggu", "Fase", "Kompetisi terdekat", "Tujuan", "Cedera 3 bulan"]]],
      label: "Atlet", file: "pendaftar-atlet"
    },
    korporat: {
      pre: "jk", cari: ["Nama", "Email", "Perusahaan/instansi", "Kode program", "Jabatan/divisi", "Sektor", "Kota", "ID"],
      sub: (r) => [r["Jabatan/divisi"], r["Perusahaan/instansi"]].filter(Boolean).join(" · "),
      info: (r) => [r.Sektor, r["Pola kerja"], r["Pinggang berisiko"] === "Ya" ? "pinggang berisiko" : "", r["Stres kerja"] === "Tinggi" ? "stres tinggi" : ""].filter(Boolean).join(" · "),
      bagian: [["Pekerjaan", ["Perusahaan/instansi", "Kode program", "Sektor", "Jabatan/divisi", "Pola kerja", "Jam kerja/hari", "Jam duduk/hari"]],
        ["Gaya hidup", ["Aktivitas (menit/minggu)", "Aktivitas cukup (≥150)", "Jenis olahraga", "Sarapan", "Makan utama/hari", "Sumber makan siang", "Minuman manis/hari", "Tidur (jam)", "Stres kerja", "Merokok", "MCU 12 bulan", "Tujuan"]]],
      label: "Wellness Korporat", file: "pendaftar-wellness-korporat"
    }
  };
  function tersaring(jenis) {
    const c = CFG[jenis], q = $(c.pre + "-cari").value.trim().toLowerCase(), s = $(c.pre + "-status").value;
    const p = jenis === "korporat" ? $("jk-perus").value : "";
    return st.data[jenis].filter((r) =>
      (!q || c.cari.some((k) => String(r[k] || "").toLowerCase().includes(q))) &&
      (!s || (r.Status || "Baru") === s) && (!p || r["Perusahaan/instansi"] === p)
    ).sort((a, b) => String(b.Waktu).localeCompare(String(a.Waktu)));
  }
  function renderDaftar(jenis) {
    const c = CFG[jenis], L = tersaring(jenis), semua = st.data[jenis];
    $(c.pre + "-ringkas").textContent = `${L.length} dari ${semua.length} pendaftar · ${baru(semua)} baru · ${semua.filter((r) => r["Perlu cek manual"] === "Ya").length} perlu cek manual`;
    $(c.pre + "-list").innerHTML = L.length ? L.map((r) => `
      <button type="button" class="dj-row" data-jenis="${jenis}" data-id="${esc(r.ID)}">
        <span class="dj-row-tgl">${esc(tglPendek(r.Waktu))}</span>
        <span class="dj-row-nm"><strong>${esc(r.Nama)}</strong><small>${esc(c.sub(r))}</small></span>
        <span class="dj-row-info">${esc(c.info(r))}</span>
        <span class="dj-row-imt">IMT ${esc(r.IMT)}<small>${esc(r["Kategori IMT"])}</small></span>
        <span class="dj-row-tag"><span class="dj-tag dj-s-${esc(String(r.Status || "Baru").split(" ")[0].toLowerCase())}">${esc(r.Status || "Baru")}</span>${r["Perlu cek manual"] === "Ya" ? '<span class="dj-tag dj-cek">Cek manual</span>' : ""}</span>
      </button>`).join("") : `<p class="note">${semua.length ? "Tidak ada pendaftar yang cocok dengan filter." : "Belum ada pendaftar " + c.label + "."}</p>`;
  }
  ["ja-cari", "ja-status"].forEach((id) => $(id).addEventListener("input", () => renderDaftar("atlet")));
  ["jk-cari", "jk-status", "jk-perus"].forEach((id) => $(id).addEventListener("input", () => renderDaftar("korporat")));
  document.addEventListener("click", (e) => { const b = e.target.closest(".dj-row"); if (b) buka(b.dataset.jenis, b.dataset.id); });

  /* ---------- Detail pendaftar ---------- */
  function buka(jenis, id) {
    const r = st.data[jenis].find((x) => String(x.ID) === String(id));
    if (!r) return;
    const c = CFG[jenis];
    const dl = (keys) => `<dl class="dj-dl">${keys.filter((k) => r[k] !== undefined && r[k] !== "").map((k) => `<div><dt>${esc(k)}</dt><dd>${esc(r[k])}</dd></div>`).join("")}</dl>`;
    const wa = String(r.WhatsApp || "").replace(/\D/g, "");
    const subjek = encodeURIComponent(`Konsultasi ${c.label} – ${r.Nama} (${r.ID})`);
    $("d-detail").innerHTML = `
      <button type="button" class="db-x" id="dj-tutup" aria-label="Tutup">×</button>
      <div class="dj-dhead dj-dh-${jenis}">
        <span class="eyebrow">${esc(c.label)} · ${esc(r.ID)}</span>
        <h2 id="dm-nama">${esc(r.Nama)}</h2>
        <p>${esc(c.sub(r))}${r.Usia ? " · " + esc(r.Usia) + " tahun" : ""} · daftar ${esc(r.Waktu)}</p>
      </div>
      <div class="db-dbody">
        ${r["Perlu cek manual"] === "Ya" ? `<div class="callout bad">Perlu cek manual: ${esc(r["Alasan cek"])}. Jangan dijawab otomatis.</div>` : ""}
        <h3>Pertanyaan</h3><p style="white-space:pre-wrap">${esc(r.Pertanyaan)}</p>
        <h3>Data diri &amp; tubuh</h3>${dl(["Panggilan", "Jenis kelamin", "Tanggal lahir", "Usia", "Email", "WhatsApp", "Kota", "BB (kg)", "TB (cm)", "IMT", "Kategori IMT", "Lingkar pinggang (cm)", "Pinggang berisiko", "% lemak", "Estimasi energi (kkal)"])}
        ${c.bagian.map(([t, ks]) => `<h3>${esc(t)}</h3>${dl(ks)}`).join("")}
        <h3>Kesehatan</h3>${dl(["Kondisi medis", "Obat/suplemen", "Hamil/menyusui"])}
        <h3>Tindak lanjut</h3>
        <div class="dj-aksi">
          <select id="dj-st" aria-label="Status">${STATUS.map((s) => `<option ${s === (r.Status || "Baru") ? "selected" : ""}>${s}</option>`).join("")}</select>
          <textarea id="dj-cat" rows="3" placeholder="Catatan pengelola (tidak terlihat peserta)">${esc(r["Catatan pengelola"] || "")}</textarea>
          <div class="db-info">
            <button type="button" class="btn btn-primary pg-sm" id="dj-simpan">Simpan status</button>
            ${r.Email ? `<a class="btn btn-ghost pg-sm" href="mailto:${esc(r.Email)}?subject=${subjek}">Email</a>` : ""}
            ${wa ? `<a class="btn btn-ghost pg-sm" href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
          </div>
        </div>
      </div>`;
    $("d-modal").hidden = false; document.body.style.overflow = "hidden";
    $("dj-tutup").onclick = () => { $("d-modal").hidden = true; document.body.style.overflow = ""; };
    $("dj-simpan").onclick = async () => {
      const b = $("dj-simpan"); b.disabled = true; b.textContent = "Menyimpan…";
      const ubah = { jenis, id: r.ID, status: $("dj-st").value, catatan: $("dj-cat").value };
      if (st.demo) { r.Status = ubah.status; r["Catatan pengelola"] = ubah.catatan; }
      const ok = await muat(st.demo ? undefined : ubah);
      if (ok) { MK.toast("Status disimpan"); $("d-modal").hidden = true; document.body.style.overflow = ""; }
      else { b.disabled = false; b.textContent = "Simpan status"; }
    };
  }

  /* ---------- CSV per jenis ---------- */
  function unduhCsv(jenis) {
    const rows = tersaring(jenis);
    if (!rows.length) { MK.toast("Tidak ada data untuk diunduh"); return; }
    const keys = Object.keys(rows[0]).filter((k) => k !== "baris");
    const q = (v) => { const s = String(v == null ? "" : v); return '"' + (/^[=+\-@]/.test(s) ? "'" + s : s).replace(/"/g, '""') + '"'; };
    const csv = [keys.map(q).join(",")].concat(rows.map((r) => keys.map((k) => q(r[k])).join(","))).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${CFG[jenis].file}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }
  $("ja-csv").addEventListener("click", () => unduhCsv("atlet"));
  $("jk-csv").addEventListener("click", () => unduhCsv("korporat"));

  /* ---------- Mode contoh (dashboard.html?demo): data rekaan, tanpa login ---------- */
  if (new URLSearchParams(location.search).has("demo")) {
    st.demo = true;
    const pick = (a, i) => a[i % a.length];
    const tgl = (i) => { const t = new Date(Date.now() - i * 6.5 * 864e5); return t.toISOString().slice(0, 10) + " 09:1" + (i % 6) + ":00"; };
    const imtK = (x) => x < 17 ? "Sangat kurus" : x < 18.5 ? "Kurus" : x <= 25 ? "Normal" : x <= 27 ? "Gemuk" : "Obesitas";
    const atlet = ["Rizky Pratama", "Nadia Putri", "Bagas Saputra", "Siti Rahma", "Dimas Aditya", "Ayu Lestari", "Fajar Nugroho"].map((n, i) => {
      const imt = Math.round((19 + (i * 1.3) % 6) * 10) / 10;
      return { ID: "A2611" + i, Waktu: tgl(i), Status: pick(STATUS, i), "Perlu cek manual": i === 3 ? "Ya" : "Tidak", "Alasan cek": i === 3 ? "cedera berat" : "", Email: "contoh" + i + "@contoh.id", Nama: n, Panggilan: n.split(" ")[0], "Jenis kelamin": i % 2 ? "P" : "L", Usia: 17 + i, WhatsApp: "", Kota: pick(["Jakarta", "Bandung", "Surabaya"], i), "BB (kg)": 55 + i * 3, "TB (cm)": 165 + i, IMT: imt, "Kategori IMT": imtK(imt), "Cabang olahraga": pick(["Bulu tangkis", "Sepak bola", "Taekwondo", "Atletik"], i), "Nomor/posisi/kelas": pick(["Tunggal", "Gelandang", "-58 kg", "400 m"], i), Level: pick(["Klub / sekolah", "Daerah (Porprov/PON)", "Nasional (Pelatnas)"], i), "Klub/instansi": "Klub " + (i + 1), Pelatih: "Coach " + (i + 1), "Jam latihan/minggu": 6 + i, Fase: pick(["Persiapan umum", "Kompetisi", "Transisi"], i), "Kompetisi terdekat": i % 2 ? "2026-12-1" + i : "Belum ada", Tujuan: pick(["Performa", "Turun lemak", "Kelas tanding"], i), "Cedera 3 bulan": i === 3 ? "berat" : "tidak", Pertanyaan: "Contoh pertanyaan atlet tentang pola makan menjelang kompetisi.", "Kondisi medis": "Tidak ada", "Obat/suplemen": "Tidak", "Hamil/menyusui": "-" };
    });
    const korporat = ["Andi Kurniawan", "Rina Marlina", "Budi Santoso", "Dewi Anggraini", "Agus Setiawan", "Fitri Handayani", "Joko Susilo", "Wulan Sari", "Teguh Prasetyo", "Ratna Dewi"].map((n, i) => {
      const imt = Math.round((22 + (i * 1.7) % 10) * 10) / 10, ping = (i % 2 ? 76 : 86) + i % 9, akt = (i * 47) % 260;
      return { ID: "W2611" + i, Waktu: tgl(i + 1), Status: pick(["Baru", "Baru", "Dijawab", "Selesai", "Lanjut konsultasi"], i), "Perlu cek manual": i === 4 ? "Ya" : "Tidak", "Alasan cek": i === 4 ? "kondisi medis" : "", Email: "karyawan" + i + "@contoh.id", Nama: n, Panggilan: n.split(" ")[0], "Jenis kelamin": i % 2 ? "P" : "L", Usia: 28 + i * 2, WhatsApp: "", Kota: "Jakarta", "BB (kg)": 60 + i * 3, "TB (cm)": 160 + i, IMT: imt, "Kategori IMT": imtK(imt), "Lingkar pinggang (cm)": ping, "Pinggang berisiko": ping >= (i % 2 ? 80 : 90) ? "Ya" : "Tidak", "Perusahaan/instansi": pick(["PT Contoh Sejahtera", "PT Maju Bersama", "Universitas Contoh"], i), "Kode program": pick(["WELL-01", "WELL-02"], i), Sektor: pick(["Perbankan", "Manufaktur", "Pendidikan"], i), "Jabatan/divisi": pick(["Staf keuangan", "Supervisor produksi", "Dosen", "HRD"], i), "Pola kerja": pick(["Kantor (WFO)", "Hybrid", "Shift"], i), "Jam kerja/hari": 8 + i % 3, "Jam duduk/hari": 5 + i % 6, "Aktivitas (menit/minggu)": akt, "Aktivitas cukup (≥150)": akt >= 150 ? "Ya" : "Tidak", "Jenis olahraga": pick(["Jalan kaki", "Lari", "Tidak rutin"], i), Sarapan: pick(["rutin", "kadang", "tidak"], i), "Makan utama/hari": "3", "Sumber makan siang": pick(["Kantin", "Bawa bekal", "Pesan online"], i), "Minuman manis/hari": pick(["0", "1", "2+"], i), "Tidur (jam)": 5 + i % 4, "Stres kerja": pick(["Rendah", "Sedang", "Tinggi"], i), Merokok: i % 4 === 0 ? "ya" : "tidak", "MCU 12 bulan": i % 3 ? "ya" : "tidak", Tujuan: pick(["Turun berat badan", "Lebih bugar", "Kontrol gula darah", "Kurangi stres"], i), Pertanyaan: "Contoh pertanyaan karyawan tentang pola makan saat jam kerja panjang.", "Kondisi medis": i === 4 ? "Ada: hipertensi" : "Tidak ada", "Obat/suplemen": "Tidak", "Hamil/menyusui": "-" };
    });
    st.data = { atlet, korporat }; st.peserta = 0;
    $("d-masuk").hidden = true; $("d-app").hidden = false;
    $("d-who").textContent = "Mode contoh"; $("d-upd").textContent = "· data rekaan, bukan data peserta";
    renderSemua();
  }
});
