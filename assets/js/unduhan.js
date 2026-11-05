/* Unduhan ber-OTP. Website statis ini hanya memanggil layanan Google Apps Script
 * (SITE.otpEndpoint). Berkas asli tetap privat dan baru dikirim setelah verifikasi. */
document.addEventListener("DOMContentLoaded", () => {
  const MK = window.MK, S = window.SITE;
  const items = window.UNDUHAN || [];
  const $ = (id) => document.getElementById(id);
  const f1 = $("f1"), f2 = $("f2"), f3 = $("f3");
  const TOKEN_KEY = "mk-unduh-token";
  let cooldown = 0, data = null;
  let pilih = new URLSearchParams(location.search).get("item");
  if (!items.some((i) => i.id === pilih)) pilih = items.length ? items[0].id : "";

  document.querySelectorAll("[data-mail]").forEach((a) => { a.href = "mailto:" + S.email; a.textContent = S.email; });

  function renderItems() {
    $("items").innerHTML = items.map((i) => `
      <button type="button" class="dl-item" data-id="${MK.esc(i.id)}" aria-pressed="${i.id === pilih}">
        <span class="chip orange">${MK.esc(i.jenis)}</span> <span class="chip">${MK.esc(i.format)}</span>
        <strong>${MK.esc(i.judul)}</strong>
        <small>${MK.esc(i.penulis)} · ${i.tahun}</small>
        <span>${MK.esc(i.ringkasan)}</span>
      </button>`).join("") || '<p class="empty">Belum ada berkas.</p>';
    const cur = items.find((i) => i.id === pilih);
    $("sel").textContent = cur ? cur.judul : "-";
  }
  $("items").addEventListener("click", (e) => {
    const b = e.target.closest("[data-id]");
    if (!b) return;
    pilih = b.dataset.id;
    renderItems();
  });

  function msg(t, ok) {
    const m = $("msg");
    m.hidden = !t;
    m.textContent = t || "";
    m.classList.toggle("ok", !!ok);
  }
  function step(n) {
    f1.hidden = n !== 1; f2.hidden = n !== 2; f3.hidden = n !== 3;
    [...$("steps").children].forEach((li, i) => li.classList.toggle("on", i < n));
    msg("");
  }
  function busy(btn, on, label) {
    btn.disabled = on;
    if (on) { btn.dataset.t = btn.textContent; btn.textContent = label; }
    else if (btn.dataset.t) btn.textContent = btn.dataset.t;
  }

  /* text/plain supaya tidak memicu preflight CORS, yang tidak didukung Apps Script. */
  async function api(payload) {
    const r = await fetch(S.otpEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });
    if (!r.ok) throw new Error("http");
    return r.json();
  }
  const GAGAL = "Layanan sedang tidak bisa dihubungi. Coba lagi beberapa saat.";

  function normWa(v) {
    let d = String(v).replace(/[^\d+]/g, "").replace(/^\+/, "");
    if (d.startsWith("0")) d = "62" + d.slice(1);
    if (d.startsWith("8")) d = "62" + d;
    return d;
  }
  const waValid = (d) => d.startsWith("62") ? /^628\d{7,12}$/.test(d) : /^[1-9]\d{7,14}$/.test(d);
  const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e);

  function getToken() {
    try {
      const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || "null");
      return t && t.sampai > Date.now() ? t.token : "";
    } catch (e) { return ""; }
  }
  function setToken(token, menit) {
    try { sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ token, sampai: Date.now() + menit * 60000 })); } catch (e) { /* tetap jalan tanpa penyimpanan */ }
  }
  let tokenNow = "";

  function tick(sec) {
    cooldown = sec;
    const b = $("again");
    b.disabled = true;
    const iv = setInterval(() => {
      cooldown -= 1;
      b.textContent = cooldown > 0 ? `Kirim ulang (${cooldown} dtk)` : "Kirim ulang kode";
      if (cooldown <= 0) { b.disabled = false; clearInterval(iv); }
    }, 1000);
  }

  async function kirim() {
    const res = await api({ aksi: "kirim", item: pilih, ...data });
    if (!res.ok) { msg(res.pesan || GAGAL); return false; }
    $("to").textContent = data.email;
    step(2);
    tick(res.jeda || 60);
    f2.otp.value = "";
    f2.otp.focus();
    return true;
  }

  f1.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = f1.nama.value.trim(), email = f1.email.value.trim().toLowerCase(), wa = normWa(f1.wa.value);
    if (nama.length < 2) return msg("Isi nama lengkap Anda.");
    if (!emailValid(email)) return msg("Format email belum benar.");
    if (!waValid(wa)) return msg("Nomor WhatsApp belum benar. Contoh: 081234567890.");
    if (!f1.setuju.checked) return msg("Centang persetujuan penggunaan data terlebih dahulu.");
    data = { nama, email, wa, instansi: f1.instansi.value.trim(), website: f1.website.value };
    busy($("b1"), true, "Mengirim…");
    try { await kirim(); } catch (err) { msg(GAGAL); }
    busy($("b1"), false);
  });

  f2.addEventListener("submit", async (e) => {
    e.preventDefault();
    const otp = f2.otp.value.trim();
    if (!/^\d{6}$/.test(otp)) return msg("Masukkan 6 digit kode OTP.");
    busy($("b2"), true, "Memeriksa…");
    try {
      const res = await api({ aksi: "verifikasi", email: data.email, otp });
      if (res.ok) { tokenNow = res.token; setToken(res.token, res.menit || 30); step(3); }
      else msg(res.pesan || GAGAL);
    } catch (err) { msg(GAGAL); }
    busy($("b2"), false);
  });

  $("again").addEventListener("click", async () => {
    busy($("again"), true, "Mengirim…");
    try { if (await kirim()) msg("Kode baru sudah dikirim.", true); else $("again").disabled = false; }
    catch (err) { msg(GAGAL); $("again").disabled = false; }
  });
  $("back").addEventListener("click", () => step(1));

  $("b3").addEventListener("click", async () => {
    const token = tokenNow || getToken();
    if (!token) { step(1); return msg("Masa verifikasi habis. Silakan ulangi."); }
    busy($("b3"), true, "Menyiapkan berkas…");
    try {
      const res = await api({ aksi: "unduh", token, item: pilih });
      if (!res.ok) { msg(res.pesan || GAGAL); if (res.ulang) step(1); }
      else {
        const bin = atob(res.base64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: res.mime || "application/pdf" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = res.nama || "unduhan.pdf";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        msg("Unduhan dimulai.", true);
      }
    } catch (err) { msg(GAGAL); }
    busy($("b3"), false);
  });

  renderItems();
  if (!S.otpEndpoint) {
    $("off").hidden = false;
    f1.querySelectorAll("input,button").forEach((x) => { x.disabled = true; });
  } else if (getToken()) {
    tokenNow = getToken();
    step(3);
  }
});
