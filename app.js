// Clave publishable: segura para el navegador (la seguridad la da RLS en Supabase).
const SUPABASE_URL = "https://ivpvprmuilqlzsjgezub.supabase.co";
const SUPABASE_KEY = "sb_publishable_J8ggGbK1Kvfo4mMMxdYR7Q_0rcTK67X";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);
const CATEGORIES = ["Transporte", "Salud", "Educación", "Comercio", "Turismo", "Alimentación", "Finanzas", "Otro"];
let all = [];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function showMsg(text, type) {
  const m = $("msg");
  m.textContent = text;
  m.className = "msg " + (type || "");
}

async function load() {
  const { data, error } = await db.from("opportunities").select("*").order("created_at", { ascending: false });
  if (error) {
    $("list").innerHTML = `<p class="empty">Error al cargar: ${esc(error.message)}</p>`;
    return;
  }
  all = data;
  render();
}

function render() {
  const city = $("f-city").value.trim().toLowerCase();
  const country = $("f-country").value.trim().toLowerCase();
  const cat = $("f-category").value;
  const items = all.filter((o) =>
    o.city.toLowerCase().includes(city) &&
    o.country.toLowerCase().includes(country) &&
    (!cat || o.category === cat));
  $("count").textContent = items.length;
  $("list").innerHTML = items.length ? items.map((o) => `
    <article class="opp">
      <h3>${esc(o.name)}</h3>
      <div class="place">📍 ${esc(o.city)}, ${esc(o.country)}</div>
      <div class="tags"><span class="tag">${esc(o.category)}</span><span class="tag ${esc(o.potential)}">Potencial ${esc(o.potential)}</span></div>
      <p><strong>Problema:</strong> ${esc(o.problem)}</p>
      <p><strong>Solución con IA:</strong> ${esc(o.ai_solution)}</p>
      <button class="like" data-id="${o.id}">❤️ ${o.likes}</button>
    </article>`).join("") : `<p class="empty">No hay oportunidades que coincidan.</p>`;
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("submit");
  btn.disabled = true;
  const row = Object.fromEntries(new FormData(e.target));
  const { error } = await db.from("opportunities").insert(row);
  btn.disabled = false;
  if (error) return showMsg("Error: " + error.message, "error");
  e.target.reset();
  showMsg("¡Oportunidad publicada!", "ok");
  load();
});

$("list").addEventListener("click", async (e) => {
  const btn = e.target.closest(".like");
  if (!btn) return;
  btn.disabled = true;
  const { error } = await db.rpc("like_opportunity", { opportunity_id: btn.dataset.id });
  if (error) alert("Error al dar like: " + error.message);
  load();
});

["f-city", "f-country", "f-category"].forEach((id) => $(id).addEventListener("input", render));
$("reload").addEventListener("click", load);
CATEGORIES.forEach((c) => $("f-category").insertAdjacentHTML("beforeend", `<option>${c}</option>`));
load();

