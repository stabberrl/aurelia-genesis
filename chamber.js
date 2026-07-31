const catalog = document.querySelector("#seed-catalog");
const status = document.querySelector("#translation-status");
const result = document.querySelector("#ingest-result");

async function api(path, options) {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "La operación no pudo completarse.");
  return body;
}

api("/api/knowledge-chamber/status").then((value) => {
  status.textContent = value.translation.configured
    ? `Traductor local configurado: ${value.translation.engine}. Para idiomas distintos debe estar disponible en este equipo.`
    : "No hay traductor local configurado.";
}).catch(() => { status.textContent = "No fue posible consultar el traductor local."; });

document.querySelector("#ingest-source").addEventListener("click", async () => {
  const button = document.querySelector("#ingest-source");
  const url = document.querySelector("#source-url").value.trim();
  if (!url) { result.textContent = "Introduce una URL HTTPS."; return; }
  button.disabled = true;
  result.textContent = "Analizando fuente, traduciendo y distribuyendo fragmentos…";
  try {
    const value = await api("/api/knowledge-chamber/ingest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ soulId: "soul-001-alba-0001", url, sourceLanguage: document.querySelector("#source-language").value, targetLanguage: document.querySelector("#target-language").value }) });
    result.textContent = `Fuente preparada: ${value.source.title}. Fragmentos distribuidos: ${value.fragments.length}.`;
  } catch (error) { result.textContent = error.message; }
  finally { button.disabled = false; }
});

fetch("data/chamber/biological-social-seeds.es.json")
  .then((response) => { if (!response.ok) throw new Error("No fue posible cargar el catálogo."); return response.json(); })
  .then((data) => {
    catalog.innerHTML = data.domains.map((domain) => `<article class="seed"><h3>${domain.label}</h3>${domain.terms.map((term) => `<span>${term}</span>`).join("")}</article>`).join("");
  })
  .catch((error) => { catalog.textContent = error.message; });
