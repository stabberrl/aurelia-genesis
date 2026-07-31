const $ = (selector) => document.querySelector(selector);

const state = {
  souls: [],
  soulId: "",
  language: "es",
  approach: "assistant",
  refreshTimer: null,
  liveTimer: null,
  liveHistory: [],
  hiddenSeries: new Set(),
  lastDevelopment: null,
  selectedNode: "",
  worldTimer: null,
  world: null,
  controller: null,
  comparisonVisible: false,
  evidenceLoaded: false,
  lastHeartbeatSequence: 0,
};

const themeStorageKey = "aurelia-research-theme";

function preferredTheme() {
  try {
    const saved = localStorage.getItem(themeStorageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  const button = $("#theme-toggle");
  button.textContent = dark ? "Modo claro" : "Modo oscuro";
  button.setAttribute("aria-pressed", String(dark));
  if (persist) {
    try { localStorage.setItem(themeStorageKey, theme); } catch {}
  }
}

const approaches = {
  assistant: {
    definition: "Evalúa memoria útil, adaptación y ejecución de tareas sin atribuir consciencia.",
    subtitle: "Asistente adaptativo",
    items: [
      ["Objetivo", "Aprender preferencias y resolver tareas con trazabilidad."],
      ["Variable principal", "Rendimiento verificable por tarea."],
      ["Pruebas", "Retención, generalización, corrección y seguridad."],
      ["Límite", "Una respuesta competente no implica experiencia subjetiva."],
    ],
  },
  consciousness: {
    definition: "Estudia integración, continuidad, memoria autobiográfica y autorrepresentación.",
    subtitle: "Consciencia sintética — enfoque exploratorio",
    items: [
      ["Objetivo", "Medir continuidad e integración de estados internos."],
      ["Variable principal", "Consistencia temporal bajo pruebas controladas."],
      ["Pruebas", "Memoria autobiográfica, metacognición y reporte de incertidumbre."],
      ["Límite", "No existe aquí una prueba concluyente de consciencia."],
    ],
  },
  alife: {
    definition: "Observa aprendizaje incremental desde señales básicas, sin conocimiento lingüístico preentrenado.",
    subtitle: "Vida artificial con aprendizaje desde cero",
    items: [
      ["Objetivo", "Adquirir asociaciones y conducta a partir de experiencia."],
      ["Variable principal", "Eficiencia de aprendizaje y transferencia."],
      ["Pruebas", "Control sin entrenamiento, adquisición, retención y generalización."],
      ["Límite", "El proceso será más lento y depende del entorno de aprendizaje."],
    ],
  },
};

const phaseNames = {
  nascent: "Naciente",
  early: "Desarrollo temprano",
  intermediate: "Desarrollo medio",
  advanced: "Desarrollo avanzado",
  high: "Desarrollo alto",
};

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? new Intl.NumberFormat("es-CL").format(Number(value)) : "—";
}

function firstNumber(object, keys, fallback = 0) {
  for (const key of keys) if (Number.isFinite(Number(object?.[key]))) return Number(object[key]);
  return fallback;
}

function escapeMarkup(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function log(message, type = "info") {
  const row = document.createElement("li");
  const time = document.createElement("time");
  const text = document.createElement("span");
  time.textContent = new Date().toLocaleTimeString("es-CL", { hour12: false });
  text.textContent = message;
  text.className = type;
  row.append(time, text);
  $("#operation-log").prepend(row);
}

let toastTimer;
function toast(message, type = "") {
  const element = $("#toast");
  element.textContent = message;
  element.className = `toast visible ${type}`.trim();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.className = "toast"; }, 3000);
}

function formatCheckpointTime(savedAt) {
  if (!savedAt) return "Aún no hay punto de control";
  const date = new Date(savedAt);
  return Number.isNaN(date.getTime()) ? "Guardado disponible" : `Guardado ${date.toLocaleTimeString("es-CL", { hour12: false })}`;
}

async function loadCheckpointStatus() {
  try {
    const status = await api("/api/checkpoints/status");
    $("#checkpoint-status").textContent = formatCheckpointTime(status.savedAt);
    return status;
  } catch {
    $("#checkpoint-status").textContent = "Guardado no disponible";
    return null;
  }
}

async function emergencySave() {
  const button = $("#emergency-save");
  button.disabled = true;
  button.classList.add("saving");
  button.textContent = "Guardando…";
  try {
    const result = await api("/api/checkpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    $("#checkpoint-status").textContent = formatCheckpointTime(result.savedAt);
    log(`Punto de control manual completado (${result.databases.length} bases).`);
    toast("Guardado de emergencia completado.");
  } catch (error) {
    log(`Falló el guardado: ${error.message}`, "error");
    toast(`No se pudo guardar: ${error.message}`, "error");
  } finally {
    button.disabled = false;
    button.classList.remove("saving");
    button.textContent = "Guardado de emergencia";
  }
}

function worldColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    surface: style.getPropertyValue("--surface").trim(),
    surfaceAlt: style.getPropertyValue("--surface-alt").trim(),
    border: style.getPropertyValue("--border").trim(),
    borderStrong: style.getPropertyValue("--border-strong").trim(),
    text: style.getPropertyValue("--text").trim(),
    muted: style.getPropertyValue("--muted").trim(),
    accent: style.getPropertyValue("--accent").trim(),
    accentSoft: style.getPropertyValue("--accent-soft").trim(),
    warning: style.getPropertyValue("--warning").trim(),
    success: style.getPropertyValue("--success").trim(),
  };
}

function renderWorld(world) {
  state.world = world;
  $("#world-actions").querySelectorAll("button").forEach((button) => { button.disabled = Boolean(state.controller?.runtime?.running); });
  const canvas = $("#world-map");
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(bounds.width * ratio));
  canvas.height = Math.max(1, Math.round(bounds.height * ratio));
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  const colors = worldColors();
  const cell = Math.min((bounds.width - 32) / world.width, (bounds.height - 32) / world.height);
  const originX = (bounds.width - cell * world.width) / 2;
  const originY = (bounds.height - cell * world.height) / 2;
  context.fillStyle = colors.surface;
  context.fillRect(0, 0, bounds.width, bounds.height);
  context.strokeStyle = colors.border;
  context.lineWidth = 1;
  for (let x = 0; x <= world.width; x += 1) {
    context.beginPath(); context.moveTo(originX + x * cell, originY); context.lineTo(originX + x * cell, originY + world.height * cell); context.stroke();
  }
  for (let y = 0; y <= world.height; y += 1) {
    context.beginPath(); context.moveTo(originX, originY + y * cell); context.lineTo(originX + world.width * cell, originY + y * cell); context.stroke();
  }
  const center = (item) => ({ x: originX + (item.x + .5) * cell, y: originY + (item.y + .5) * cell });
  const body = world.bodies.find(({ id }) => id === state.soulId) || world.bodies[0];
  const visibleIds = new Set((world.perceptions?.visibleObjects || []).map(({ id }) => id));
  context.strokeStyle = colors.success;
  context.lineWidth = 2;
  for (const cellKey of state.controller?.visitedCells || []) {
    const [x, y] = cellKey.split(",").map(Number);
    context.strokeRect(originX + x * cell + 3, originY + y * cell + 3, cell - 6, cell - 6);
  }
  context.fillStyle = colors.warning;
  context.globalAlpha = .25;
  for (const cellKey of state.controller?.blockedCells || []) {
    const [x, y] = cellKey.split(",").map(Number);
    context.fillRect(originX + x * cell + 4, originY + y * cell + 4, cell - 8, cell - 8);
  }
  context.globalAlpha = 1;
  for (const object of world.objects) {
    const point = center(object);
    if (visibleIds.has(object.id)) {
      context.fillStyle = colors.accentSoft;
      context.fillRect(point.x - cell / 2 + 2, point.y - cell / 2 + 2, cell - 4, cell - 4);
    }
    context.fillStyle = colors.warning;
    context.beginPath();
    context.rect(point.x - cell * .2, point.y - cell * .2, cell * .4, cell * .4);
    context.fill();
    context.fillStyle = colors.text;
    context.font = "10px Segoe UI";
    context.textAlign = "center";
    context.fillText(object.id === "object-a" ? "A" : "B", point.x, point.y + 3);
  }
  context.fillStyle = colors.borderStrong;
  for (const obstacle of world.obstacles) {
    const point = center(obstacle);
    context.fillRect(point.x - cell / 2 + 3, point.y - cell / 2 + 3, cell - 6, cell - 6);
  }
  if (body) {
    const point = center(body);
    const angles = { north: -Math.PI / 2, east: 0, south: Math.PI / 2, west: Math.PI };
    const angle = angles[body.directionName] ?? 0;
    context.save();
    context.translate(point.x, point.y);
    context.rotate(angle);
    context.fillStyle = colors.accent;
    context.beginPath();
    context.moveTo(cell * .32, 0);
    context.lineTo(-cell * .24, -cell * .22);
    context.lineTo(-cell * .24, cell * .22);
    context.closePath();
    context.fill();
    context.restore();
  }
  $("#world-runtime-state").textContent = world.runtime.paused ? "En pausa" : `En ejecución · ${world.runtime.speed}×`;
  $("#world-tick").textContent = `TICK ${formatNumber(world.tick)}`;
  $("#world-pause").textContent = world.runtime.paused ? "Reanudar" : "Pausar";
  $("#world-speed").value = String(world.runtime.speed);
  if (body) {
    $("#body-energy").textContent = `${(body.energy * 100).toFixed(1)}%`;
    $("#body-fatigue").textContent = `${(body.fatigue * 100).toFixed(1)}%`;
    $("#body-integrity").textContent = `${(body.integrity * 100).toFixed(1)}%`;
    $("#body-direction").textContent = body.directionName;
    $("#body-visible").textContent = String(world.perceptions?.visibleObjects?.length || 0);
    $("#body-outcome").textContent = world.recentEvents?.[0]?.outcome || "—";
    $("#body-form").textContent = body.form || "basic";
    $("#body-capabilities").textContent = (body.capabilities || []).join(", ") || "—";
    $("#body-signals").textContent = String(body.panelSignals || 0);
  }
}

function renderInfancy(controller) {
  state.controller = controller;
  const assigned = controller.soulId === state.soulId;
  const running = Boolean(controller.runtime?.running);
  $("#infancy-state").textContent = !assigned ? "No asignado" : running ? "Ejecución autónoma" : "Pausado";
  $("#infancy-state").classList.toggle("running", assigned && running);
  $("#infancy-toggle").textContent = running ? "Pausar" : "Iniciar";
  $("#infancy-toggle").disabled = !assigned;
  $("#infancy-step").disabled = !assigned || running;
  $("#infancy-speed").disabled = !assigned;
  $("#infancy-speed").value = String(controller.runtime?.stepsPerCycle || 1);
  $("#infancy-decisions").textContent = formatNumber(controller.decisionCount);
  $("#infancy-cells").textContent = formatNumber(controller.visitedCells?.length || 0);
  $("#infancy-blocked").textContent = formatNumber(controller.blockedCells?.length || 0);
  $("#infancy-discoveries").textContent = formatNumber(controller.successfulEnergyDiscoveries || 0);
  const last = controller.lastDecision;
  $("#infancy-last-action").textContent = last ? `${last.action} → ${last.outcome}` : "—";
  $("#infancy-last-reason").textContent = last ? `${last.reason} · recompensa ${last.reward}` : "Sin decisiones registradas.";
  const knowledge = Object.entries(controller.learnedObjects || {});
  $("#object-knowledge").innerHTML = knowledge.length ? knowledge.map(([id, record]) => {
    const className = record.classification === "energy-source" ? "positive" : record.classification === "non-restorative" ? "negative" : "";
    return `<div class="knowledge-row"><strong>${escapeMarkup(id)}</strong><span class="${className}">${escapeMarkup(record.classification)}</span><span>${record.attempts} pruebas · Δ ${Number(record.meanEnergyDelta).toFixed(3)}</span></div>`;
  }).join("") : "<p>No existe conocimiento adquirido sobre objetos.</p>";
  const workspace = controller.workspace || {};
  const focus = workspace.focus;
  $("#workspace-focus").textContent = focus ? `${focus.kind} · ${focus.source}` : "Sin foco difundido.";
  $("#workspace-detail").textContent = focus ? `${focus.detail} · saliencia ${Number(focus.salience || 0).toFixed(2)}` : "Selecciona un contenido para memoria, predicción y acción; no demuestra consciencia.";
  $("#workspace-candidates").innerHTML = (workspace.candidates || []).slice(0, 5).map((candidate) =>
    `<span class="${candidate.id === focus?.id ? "active" : ""}">${escapeMarkup(candidate.kind)} ${Number(candidate.salience || 0).toFixed(2)}</span>`).join("");
  $("#world-actions").querySelectorAll("button").forEach((button) => { button.disabled = !assigned || running || !state.world; });
  if (state.world) renderWorld(state.world);
}

async function loadInfancy({ quiet = true } = {}) {
  try {
    const controller = await api("/api/world/controller");
    renderInfancy(controller);
    return controller;
  } catch (error) {
    if (!quiet) log(`Controlador: ${error.message}`, "error");
    return null;
  }
}

async function infancyControl(command, value) {
  try {
    const controller = await api("/api/world/controller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, value }),
    });
    renderInfancy(controller);
    await loadWorld();
    log(`Control autónomo: ${command}${value ? ` (${value})` : ""}.`);
  } catch (error) {
    log(`Controlador: ${error.message}`, "error");
    toast(error.message, "error");
  }
}

function renderWorldUnavailable(message) {
  state.world = null;
  const canvas = $("#world-map");
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(bounds.width * ratio));
  canvas.height = Math.max(1, Math.round(bounds.height * ratio));
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  const colors = worldColors();
  context.fillStyle = colors.surface;
  context.fillRect(0, 0, bounds.width, bounds.height);
  context.fillStyle = colors.muted;
  context.font = "12px Segoe UI";
  context.textAlign = "center";
  context.fillText(message, bounds.width / 2, bounds.height / 2);
  $("#world-runtime-state").textContent = "Sin cuerpo asignado";
  $("#world-tick").textContent = "—";
  for (const id of ["body-energy", "body-fatigue", "body-integrity", "body-direction", "body-visible", "body-outcome"]) $(`#${id}`).textContent = "—";
  $("#world-actions").querySelectorAll("button").forEach((button) => { button.disabled = true; });
}

async function loadWorld({ quiet = true } = {}) {
  try {
    const world = await api(`/api/world?soulId=${encodeURIComponent(state.soulId)}`);
    renderWorld(world);
    return world;
  } catch (error) {
    renderWorldUnavailable("Este sujeto todavía no posee un cuerpo en la Habitación de Génesis.");
    if (!quiet) {
      log(`Mundo: ${error.message}`, "error");
      toast(error.message, "error");
    }
    return null;
  }
}

async function worldControl(command, value) {
  try {
    const world = await api("/api/world/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, value }),
    });
    renderWorld({ ...world, perceptions: state.world?.perceptions });
    log(`Control del mundo: ${command}${value ? ` (${value})` : ""}.`);
    await loadWorld();
  } catch (error) {
    log(`Mundo: ${error.message}`, "error");
    toast(error.message, "error");
  }
}

async function worldAction(action) {
  const controls = $("#world-actions").querySelectorAll("button");
  controls.forEach((button) => { button.disabled = true; });
  try {
    const result = await api("/api/world/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soulId: state.soulId, action }),
    });
    await loadWorld();
    log(`Acción corporal ${action}: ${result.event.outcome}; Δ energía ${result.event.reward}.`);
  } catch (error) {
    log(`Acción rechazada: ${error.message}`, "error");
    toast(error.message, "error");
  } finally {
    controls.forEach((button) => { button.disabled = !state.world; });
  }
}

function configureWorldMonitor() {
  clearInterval(state.worldTimer);
  loadWorld({ quiet: false });
  loadInfancy({ quiet: false });
  state.worldTimer = setInterval(() => {
    if (!document.hidden) Promise.all([loadWorld(), loadInfancy()]);
  }, 1_000);
}

async function api(path, options) {
  const response = await fetch(path, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Error HTTP ${response.status}`);
  return body;
}

function query(path) {
  const params = new URLSearchParams({ soulId: state.soulId, language: state.language });
  return `${path}?${params}`;
}

function renderApproach() {
  const approach = approaches[state.approach];
  $("#approach-definition").textContent = approach.definition;
  $("#protocol-subtitle").textContent = approach.subtitle;
  $("#protocol-content").innerHTML = `<ul class="protocol-list">${approach.items.map(([title, text]) =>
    `<li><b>${title}</b><span>${text}</span></li>`).join("")}</ul>`;
}

function renderCapabilities(development, concepts, episodes, beats) {
  const rawCapabilities = development.capabilities || development.dimensions || development.scores;
  let capabilities = [];
  if (rawCapabilities && typeof rawCapabilities === "object" && !Array.isArray(rawCapabilities)) {
    capabilities = Object.entries(rawCapabilities).map(([label, value]) => [label, Number(value)]);
  } else if (Array.isArray(rawCapabilities)) {
    capabilities = rawCapabilities.map((entry) => [entry.label || entry.name, Number(entry.value || entry.score)]);
  }
  if (!capabilities.length) {
    const vocabulary = firstNumber(development, ["vocabulary"], concepts.length);
    const perceptions = firstNumber(development, ["perceptions"]);
    const memories = firstNumber(development, ["episodicMemories"], episodes.length);
    const associations = firstNumber(development, ["plasticAssociations", "associations", "associationCount"]);
    const channels = firstNumber(development, ["sensoryChannels"]);
    const heartbeatCount = firstNumber(development, ["heartbeatCount"], beats.length);
    const decayed = firstNumber(development, ["decayedAssociations"]);
    capabilities = [
      ["Vocabulario", Math.min(100, vocabulary / 4)],
      ["Percepciones", Math.min(100, perceptions / 5)],
      ["Memoria episódica", Math.min(100, memories * 5)],
      ["Asociaciones plásticas", Math.min(100, associations / 20)],
      ["Canales sensoriales", Math.min(100, channels * 25)],
      ["Actividad autónoma", Math.min(100, heartbeatCount * 4)],
      ["Olvido medido", Math.min(100, decayed * 12)],
    ];
  }
  $("#capability-chart").innerHTML = capabilities.slice(0, 7).map(([label, raw]) => {
    const value = Math.max(0, Math.min(100, raw <= 1 ? raw * 100 : raw));
    return `<div class="capability-row"><span>${label}</span><div class="bar"><i style="--value:${value.toFixed(1)}%"></i></div><b>${value.toFixed(0)}%</b></div>`;
  }).join("");
}

function renderIdentity(identity, history) {
  $("#identity-magnitude").textContent = `${Math.round(Number(identity.driftMagnitude || 0) * 100)}%`;
  $("#identity-dimensions").innerHTML = Object.entries(identity.drift || {}).map(([name, value]) => `<div><span>${escapeMarkup(name)}</span><b class="${Number(value) >= 0 ? "positive" : "negative"}">${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(3)}</b></div>`).join("") || "<p>Sin dimensiones registradas.</p>";
  const versions = history.versions || [];
  $("#identity-history").innerHTML = versions.length ? versions.map(({ kind, version }) => `<li>${escapeMarkup(kind)} v${version}</li>`).join("") : "<li>No hay versiones históricas generadas.</li>";
}

function renderBudget(snapshot) {
  const budget = snapshot.budget || {};
  $("#autonomy-mode").textContent = snapshot.autonomous ? "Activo" : "Sólo propuesta";
  $("#budget-remaining").textContent = `${Math.round(Number(budget.remaining || 0) * 100)}%`;
  $("#budget-spent").textContent = `${Math.round(Number(budget.spent || 0) * 100)}%`;
  $("#budget-decisions").textContent = formatNumber((budget.decisions || []).length);
  const latest = budget.decisions?.[0];
  $("#budget-reason").textContent = latest ? `Última decisión: ${latest.reason} · prioridad ${Number(latest.priority || 0).toFixed(2)}.` : "Sin decisiones de exploración registradas.";
}

function renderHeartbeatProposals(beats) {
  const newest = beats[0];
  if (!newest || newest.sequence === state.lastHeartbeatSequence) return;
  state.lastHeartbeatSequence = newest.sequence;
  const proposal = newest.operations?.find(({ type }) => type === "proposal");
  if (proposal) log(`Propuesta #${newest.sequence}: ${proposal.action} (${proposal.reason || proposal.cue || "sin detalle"}).`);
}

async function loadEvidence() {
  if (state.evidenceLoaded) return;
  try {
    const files = ["foundational-language-v1.json", "spatial-grounding-v1.json"];
    const evidence = await Promise.all(files.map(async (file) => ({ file, ...(await fetch(`evidence/${file}`, { cache: "no-store" }).then((response) => response.json())) })));
    $("#evidence-list").innerHTML = evidence.map((item) => `<article><b>${escapeMarkup(item.experiment || item.file)}</b><span class="${item.passed ? "positive" : "negative"}">${item.passed ? "PASS" : "Sin aprobar"}</span><small>SHA-256: ${escapeMarkup(item.datasetHash || "no disponible")}</small><p>${escapeMarkup((item.limitations || []).join(" "))}</p></article>`).join("");
    state.evidenceLoaded = true;
  } catch { $("#evidence-list").innerHTML = "<p>No fue posible cargar los artefactos de evidencia.</p>"; }
}

async function renderComparison() {
  if (!state.comparisonVisible || !state.souls.length) return;
  const rows = await Promise.all(state.souls.slice(0, 3).map(async (soul) => ({ soul, development: await api(`/api/development?soulId=${encodeURIComponent(soul.id)}&language=${encodeURIComponent(state.language)}`) })));
  $("#comparison-grid").innerHTML = rows.map(({ soul, development }) => `<article><h3>${escapeMarkup(soul.name || soul.id)}</h3><dl><div><dt>Fase</dt><dd>${escapeMarkup(development.developmentAssessment?.phase?.label || "Sin clasificar")}</dd></div><div><dt>Vocabulario</dt><dd>${formatNumber(development.vocabulary)}</dd></div><div><dt>Asociaciones</dt><dd>${formatNumber(development.plasticAssociations)}</dd></div><div><dt>Olvido medido</dt><dd>${formatNumber(development.decayedAssociations)}</dd></div><div><dt>Pulsos</dt><dd>${formatNumber(development.heartbeatCount)}</dd></div></dl></article>`).join("");
}

const seriesConfig = {
  vocabulary: { label: "Vocabulario", color: "#2782a5" },
  perceptions: { label: "Percepciones", color: "#b17428" },
  associations: { label: "Asociaciones", color: "#6d7fae" },
  heartbeats: { label: "Pulsos", color: "#568b62" },
};

function renderActivityChart() {
  const svg = $("#activity-chart");
  const history = state.liveHistory;
  const width = 620;
  const height = 260;
  const pad = { left: 34, right: 15, top: 17, bottom: 25 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const grid = Array.from({ length: 5 }, (_, index) => {
    const y = pad.top + (innerHeight / 4) * index;
    return `<line class="chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}"/>`;
  }).join("");
  if (!history.length) {
    svg.innerHTML = `${grid}<text x="310" y="135" text-anchor="middle" fill="currentColor">Esperando primera muestra…</text>`;
    return;
  }
  const lines = Object.entries(seriesConfig).filter(([key]) => !state.hiddenSeries.has(key)).map(([key, config]) => {
    const values = history.map((sample) => sample[key]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const points = values.map((value, index) => {
      const x = pad.left + (history.length === 1 ? innerWidth : (index / (history.length - 1)) * innerWidth);
      const y = pad.top + innerHeight - ((value - min) / range) * innerHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const last = points.split(" ").at(-1).split(",");
    return `<polyline class="chart-line" points="${points}" stroke="${config.color}"/><circle class="chart-point" cx="${last[0]}" cy="${last[1]}" r="3.5" fill="${config.color}"/>`;
  }).join("");
  svg.innerHTML = `${grid}${lines}<text x="${pad.left}" y="252" fill="currentColor" font-size="9">${history[0].timeLabel}</text><text x="${width - pad.right}" y="252" fill="currentColor" text-anchor="end" font-size="9">${history.at(-1).timeLabel}</text>`;
}

function associationModel(development) {
  const strongest = development?.strongestAssociations || [];
  if (strongest.length) return strongest.map((association) => ({
    word: association.cue || association.word || "concepto",
    predicate: association.predicate || "asociación",
    evidence: association.evidenceCount || association.samples || 0,
    weight: Number(association.weight || 0),
  }));
  return (development?.concepts || []).slice(0, 24).map((concept, index) => ({
    word: concept.word || concept.term || concept.label || `concepto-${index + 1}`,
    predicate: concept.predicate || "concepto",
    evidence: concept.samples || concept.count || 1,
    weight: Math.min(1, Number(concept.samples || 1) / 6),
  }));
}

function polarPoint(index, total, radius, offset = -Math.PI / 2) {
  const angle = offset + (Math.PI * 2 * index) / Math.max(1, total);
  return { x: 380 + Math.cos(angle) * radius, y: 195 + Math.sin(angle) * radius };
}

function renderBrainNetwork(development) {
  const svg = $("#brain-network");
  const model = associationModel(development);
  const words = [...new Set(model.map((item) => item.word))].slice(0, 18);
  const predicates = [...new Set(model.map((item) => item.predicate))].slice(0, 8);
  const wordPoints = new Map(words.map((word, index) => [word, polarPoint(index, words.length, words.length < 7 ? 105 : 135)]));
  const predicatePoints = new Map(predicates.map((predicate, index) => [predicate, polarPoint(index, predicates.length, 175, -Math.PI / 4)]));
  const filter = $("#brain-filter").value.trim().toLocaleLowerCase();
  const matches = (value) => !filter || String(value).toLocaleLowerCase().includes(filter);
  const edges = model.filter((item) => wordPoints.has(item.word) && predicatePoints.has(item.predicate)).map((item) => {
    const from = wordPoints.get(item.word);
    const to = predicatePoints.get(item.predicate);
    const dimmed = filter && !matches(item.word) && !matches(item.predicate);
    return `<line class="brain-edge ${item.weight >= .6 ? "strong" : ""} ${dimmed ? "dimmed" : ""}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" opacity="${Math.max(.2, item.weight).toFixed(2)}" stroke-width="${(1 + item.weight * 3).toFixed(2)}"/>`;
  }).join("");
  const nodes = [
    ...words.map((word) => {
      const point = wordPoints.get(word);
      const related = model.filter((item) => item.word === word);
      const evidence = related.reduce((sum, item) => sum + Number(item.evidence || 0), 0);
      const weight = Math.max(0, ...related.map((item) => item.weight));
      return { id: `word:${word}`, label: word, type: "Concepto", evidence, weight, point, predicate: false };
    }),
    ...predicates.map((predicate) => {
      const point = predicatePoints.get(predicate);
      const related = model.filter((item) => item.predicate === predicate);
      const evidence = related.reduce((sum, item) => sum + Number(item.evidence || 0), 0);
      const weight = Math.max(0, ...related.map((item) => item.weight));
      return { id: `predicate:${predicate}`, label: predicate, type: "Predicado", evidence, weight, point, predicate: true };
    }),
  ];
  const nodeMarkup = nodes.map((node) => {
    const selected = state.selectedNode === node.id;
    const dimmed = filter && !matches(node.label);
    const radius = node.predicate ? 19 : Math.min(22, 11 + Math.log2(node.evidence + 1) * 2.2);
    return `<g class="brain-node ${node.predicate ? "predicate" : ""} ${selected ? "selected" : ""} ${dimmed ? "dimmed" : ""}" tabindex="0" role="button" data-node="${escapeMarkup(node.id)}" data-label="${escapeMarkup(node.label)}" data-type="${node.type}" data-evidence="${node.evidence}" data-weight="${node.weight.toFixed(3)}" transform="translate(${node.point.x} ${node.point.y})"><circle r="${radius}"/><text y="3">${escapeMarkup(node.label.slice(0, 15))}</text><text class="node-value" y="${radius + 12}">${node.evidence} ev.</text><title>${escapeMarkup(node.label)} · ${node.type} · ${node.evidence} evidencias · peso ${node.weight.toFixed(3)}</title></g>`;
  }).join("");
  const empty = nodes.length ? "" : `<text x="380" y="200" text-anchor="middle" fill="currentColor">No hay asociaciones observables en este contexto.</text>`;
  svg.innerHTML = `<circle class="brain-core-ring" cx="380" cy="195" r="18"/><circle class="brain-core" cx="380" cy="195" r="7"/>${edges}${nodeMarkup}${empty}`;
  svg.querySelectorAll(".brain-node").forEach((node) => {
    const select = () => inspectNode(node);
    node.addEventListener("click", select);
    node.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") select(); });
    node.addEventListener("pointerenter", (event) => showBrainTooltip(event, node));
    node.addEventListener("pointerleave", () => { $("#brain-tooltip").hidden = true; });
  });
}

function inspectNode(node) {
  state.selectedNode = node.dataset.node;
  const values = $("#node-inspector").querySelectorAll("strong");
  values[0].textContent = node.dataset.label;
  values[1].textContent = node.dataset.type;
  values[2].textContent = node.dataset.evidence;
  values[3].textContent = Number(node.dataset.weight).toFixed(3);
  renderBrainNetwork(state.lastDevelopment);
}

function showBrainTooltip(event, node) {
  const tooltip = $("#brain-tooltip");
  const viewport = $(".brain-viewport").getBoundingClientRect();
  tooltip.innerHTML = `<b>${escapeMarkup(node.dataset.label)}</b><br>${node.dataset.type} · ${node.dataset.evidence} evidencias<br>Peso ${Number(node.dataset.weight).toFixed(3)}`;
  tooltip.hidden = false;
  tooltip.style.left = `${Math.min(viewport.width - 170, Math.max(8, event.clientX - viewport.left + 10))}px`;
  tooltip.style.top = `${Math.min(viewport.height - 65, Math.max(8, event.clientY - viewport.top + 10))}px`;
}

function addLiveSample(development) {
  const previous = state.liveHistory.at(-1);
  const sample = {
    at: Date.now(),
    timeLabel: new Date().toLocaleTimeString("es-CL", { hour12: false }),
    vocabulary: firstNumber(development, ["vocabulary"]),
    perceptions: firstNumber(development, ["perceptions"]),
    associations: firstNumber(development, ["plasticAssociations"]),
    heartbeats: firstNumber(development, ["heartbeatCount"]),
  };
  const changes = previous ? Object.keys(seriesConfig).filter((key) => previous[key] !== sample[key]).length : 0;
  state.liveHistory.push(sample);
  if (state.liveHistory.length > 60) state.liveHistory.shift();
  $("#sample-time").textContent = sample.timeLabel;
  $("#sample-changes").textContent = String(changes);
  if (previous && previous.heartbeats !== sample.heartbeats) {
    const ring = $("#brain-network").querySelector(".brain-core-ring");
    ring?.classList.add("active");
  }
  renderActivityChart();
}

async function sampleLive() {
  if (!state.soulId || document.hidden) return;
  try {
    const development = await api(query("/api/development"));
    state.lastDevelopment = development;
    addLiveSample(development);
    renderBrainNetwork(development);
    $(".live-state").classList.remove("paused");
    $("#live-state-label").textContent = "Muestreo activo";
  } catch {
    $(".live-state").classList.add("paused");
    $("#live-state-label").textContent = "Muestreo interrumpido";
  }
}

function configureLiveMonitor() {
  clearInterval(state.liveTimer);
  state.liveHistory = [];
  renderActivityChart();
  sampleLive();
  state.liveTimer = setInterval(sampleLive, 2_000);
}

function renderConcepts(concepts) {
  const rows = concepts.slice(-30).reverse();
  $("#concept-table").innerHTML = rows.length ? rows.map((concept) => {
    const name = concept.term || concept.word || concept.concept || concept.subject || "—";
    const exposure = concept.exposures ?? concept.encounters ?? concept.count ?? "—";
    const confidenceValue = concept.confidence ?? concept.strength ?? concept.weight;
    const confidence = Number.isFinite(Number(confidenceValue))
      ? `${Math.round((Number(confidenceValue) <= 1 ? Number(confidenceValue) * 100 : Number(confidenceValue)))}%`
      : "—";
    const observed = concept.lastSeenAt || concept.updatedAt || concept.lastEncounter || "—";
    return `<tr><td>${String(name)}</td><td>${exposure}</td><td>${confidence}</td><td>${String(observed).replace("T", " ").slice(0, 19)}</td></tr>`;
  }).join("") : `<tr><td colspan="4">No hay conceptos registrados para este contexto.</td></tr>`;
}

async function loadSouls() {
  const result = await api("/api/souls");
  state.souls = result.souls || [];
  const select = $("#soul-select");
  select.innerHTML = state.souls.map((soul) => `<option value="${soul.id}">${soul.name || soul.id}</option>`).join("");
  state.soulId = select.value;
}

async function refresh({ quiet = false } = {}) {
  if (!state.soulId) return;
  $("#refresh-button").disabled = true;
  try {
    const [health, development, conceptResult, episodeResult, heartbeatResult, lexicon, identity, history, budget] = await Promise.all([
      api("/api/health"),
      api(query("/api/development")),
      api(query("/api/concepts")),
      api(query("/api/memory/episodes")),
      api(query("/api/heartbeat")),
      api(`/api/lexicon/status?language=${encodeURIComponent(state.language)}`),
      api(query("/api/identity/drift")),
      api(query("/api/identity/history")),
      api(query("/api/learning/budget")),
    ]);
    const concepts = conceptResult.concepts || [];
    const episodes = episodeResult.episodes || [];
    const beats = heartbeatResult.beats || [];
    const soul = state.souls.find((entry) => entry.id === state.soulId) || {};
    const assessment = development.developmentAssessment || {};
    const phaseId = assessment.phase?.id;
    const associations = firstNumber(development, ["plasticAssociations", "associations", "associationCount", "knownAssociations"]);
    const progress = firstNumber(assessment, ["score"], firstNumber(development, ["progress", "progressRatio", "score"]));
    const entryCount = firstNumber(lexicon, ["entries", "entryCount", "words", "definitions"]);

    $("#connection").className = `connection ${health.ok ? "online" : "offline"}`;
    $("#connection b").textContent = health.connected ? "AERA conectado" : "Runtime activo · AERA sin enlace";
    $("#subject-id").textContent = state.soulId;
    $("#subject-state").textContent = soul.awake === false ? "Inactivo" : "En observación";
    $("#subject-phase").textContent = assessment.phase?.label || phaseNames[phaseId] || development.phase?.label || development.phase || development.stage?.label || development.stage || "Sin clasificar";
    $("#metric-concepts").textContent = formatNumber(concepts.length || firstNumber(development, ["concepts", "conceptCount"]));
    $("#metric-associations").textContent = formatNumber(associations);
    $("#metric-associations-note").textContent = `${formatNumber(development.decayedAssociations)} decaídas`;
    $("#metric-episodes").textContent = formatNumber(episodes.length);
    $("#metric-beats").textContent = formatNumber(beats.length);
    $("#metric-lexicon").textContent = formatNumber(entryCount);
    $("#metric-progress").textContent = progress ? `${Math.round((progress <= 1 ? progress * 100 : progress))}%` : "—";
    renderCapabilities(development, concepts, episodes, beats);
    renderConcepts(concepts);
    state.lastDevelopment = development;
    renderBrainNetwork(development);
    renderIdentity(identity, history);
    renderBudget(budget);
    renderHeartbeatProposals(beats);
    loadEvidence();
    await renderComparison();
    $("#last-update").textContent = `Última actualización: ${new Date().toLocaleString("es-CL")}`;
    if (!quiet) log(`Datos actualizados para ${soul.name || state.soulId} (${state.language}).`);
  } catch (error) {
    $("#connection").className = "connection offline";
    $("#connection b").textContent = "Sistema no disponible";
    log(error.message, "error");
    toast(error.message, "error");
  } finally {
    $("#refresh-button").disabled = false;
  }
}

async function runHeartbeat() {
  $("#heartbeat-button").disabled = true;
  try {
    await api("/api/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soulId: state.soulId, language: state.language }),
    });
    log("Pulso cognitivo ejecutado manualmente.");
    toast("Pulso registrado.");
    await refresh({ quiet: true });
  } catch (error) {
    log(error.message, "error");
    toast(error.message, "error");
  } finally {
    $("#heartbeat-button").disabled = false;
  }
}

async function submitStimulus(event) {
  event.preventDefault();
  const input = $("#stimulus-input");
  const text = input.value.trim();
  if (!text) return;
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  try {
    const result = await api("/api/lexicon/encounter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soulId: state.soulId, language: state.language, text }),
    });
    const count = Array.isArray(result.encountered) ? result.encountered.length : 0;
    log(`Exposición controlada registrada (${count} elementos reconocidos).`);
    toast("Exposición registrada.");
    input.value = "";
    await refresh({ quiet: true });
  } catch (error) {
    log(error.message, "error");
    toast(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

function configureRefresh() {
  clearInterval(state.refreshTimer);
  if ($("#auto-refresh").checked) state.refreshTimer = setInterval(() => refresh({ quiet: true }), 10_000);
}

$("#soul-select").addEventListener("change", (event) => {
  state.soulId = event.target.value;
  state.selectedNode = "";
  configureLiveMonitor();
  configureWorldMonitor();
  refresh();
});
$("#language-select").addEventListener("change", (event) => {
  state.language = event.target.value;
  state.selectedNode = "";
  configureLiveMonitor();
  refresh();
});
$("#approach-select").addEventListener("change", (event) => { state.approach = event.target.value; renderApproach(); log(`Línea de investigación: ${approaches[state.approach].subtitle}.`); });
$("#refresh-button").addEventListener("click", () => refresh());
$("#inspect-concepts").addEventListener("click", () => refresh());
$("#compare-toggle").addEventListener("click", async () => {
  state.comparisonVisible = !state.comparisonVisible;
  $("#comparison-panel").hidden = !state.comparisonVisible;
  $("#compare-toggle").setAttribute("aria-pressed", String(state.comparisonVisible));
  $("#compare-toggle").textContent = state.comparisonVisible ? "Ocultar comparación" : "Comparar sujetos";
  if (state.comparisonVisible) await renderComparison();
});
$("#heartbeat-button").addEventListener("click", runHeartbeat);
$("#emergency-save").addEventListener("click", emergencySave);
$("#world-pause").addEventListener("click", () => worldControl(state.world?.runtime?.paused ? "resume" : "pause"));
$("#world-step").addEventListener("click", () => worldControl("step", 1));
$("#world-speed").addEventListener("change", (event) => worldControl("speed", Number(event.target.value)));
$("#world-actions").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button) worldAction(button.dataset.action);
});
$("#infancy-toggle").addEventListener("click", () => infancyControl(state.controller?.runtime?.running ? "pause" : "start"));
$("#infancy-step").addEventListener("click", () => infancyControl("step", 1));
$("#infancy-speed").addEventListener("change", (event) => infancyControl("speed", Number(event.target.value)));
$("#auto-refresh").addEventListener("change", configureRefresh);
$("#clear-log").addEventListener("click", () => { $("#operation-log").innerHTML = ""; });
$("#stimulus-form").addEventListener("submit", submitStimulus);
$("#theme-toggle").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next, true);
  if (state.world) renderWorld(state.world);
  log(`Tema de la interfaz: ${next === "dark" ? "oscuro" : "claro"}.`);
});
$("#brain-filter").addEventListener("input", () => renderBrainNetwork(state.lastDevelopment));
$("#brain-zoom").addEventListener("input", (event) => {
  $("#brain-network").style.setProperty("--brain-scale", Number(event.target.value) / 100);
});
$("#brain-reset").addEventListener("click", () => {
  $("#brain-filter").value = "";
  $("#brain-zoom").value = "100";
  $("#brain-network").style.setProperty("--brain-scale", 1);
  state.selectedNode = "";
  renderBrainNetwork(state.lastDevelopment);
});
$("#activity-legend").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-series]");
  if (!button) return;
  const key = button.dataset.series;
  if (state.hiddenSeries.has(key)) state.hiddenSeries.delete(key);
  else state.hiddenSeries.add(key);
  button.classList.toggle("disabled", state.hiddenSeries.has(key));
  button.setAttribute("aria-pressed", String(!state.hiddenSeries.has(key)));
  renderActivityChart();
});
$(".timeline-wrap").addEventListener("pointermove", (event) => {
  if (!state.liveHistory.length) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const index = Math.round(ratio * (state.liveHistory.length - 1));
  const sample = state.liveHistory[index];
  const cursor = $("#chart-cursor");
  cursor.innerHTML = `<b>${sample.timeLabel}</b><br>${Object.entries(seriesConfig).map(([key, config]) =>
    `${config.label}: ${formatNumber(sample[key])}`).join("<br>")}`;
  cursor.hidden = false;
  cursor.style.left = `${Math.min(bounds.width - 130, Math.max(6, event.clientX - bounds.left + 10))}px`;
  cursor.style.top = `${Math.max(6, event.clientY - bounds.top - 75)}px`;
});
$(".timeline-wrap").addEventListener("pointerleave", () => { $("#chart-cursor").hidden = true; });
document.addEventListener("visibilitychange", () => {
  $(".live-state").classList.toggle("paused", document.hidden);
  $("#live-state-label").textContent = document.hidden ? "Muestreo en pausa" : "Muestreo activo";
  if (!document.hidden) sampleLive();
});

applyTheme(preferredTheme());
renderApproach();
loadSouls().then(() => {
  log("Consola de investigación iniciada.");
  configureRefresh();
  configureLiveMonitor();
  configureWorldMonitor();
  loadCheckpointStatus();
  return refresh();
}).catch((error) => {
  log(error.message, "error");
  toast("No fue posible iniciar la consola.", "error");
});
