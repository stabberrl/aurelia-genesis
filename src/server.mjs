import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { CognitiveGateway } from "./bridge/gateway.mjs";
import { AeraTcpTransport } from "./bridge/aera-tcp-transport.mjs";
import { LexiconRegistry } from "./lexicon/registry.mjs";
import { validateLanguage } from "./lexicon/languages.mjs";
import { LearningChamber } from "./learning/learning-chamber.mjs";
import { CognitiveHeartbeat } from "./runtime/cognitive-heartbeat.mjs";
import { AutonomousExploration } from "./runtime/autonomous-exploration.mjs";
import { CheckpointManager } from "./runtime/checkpoint-manager.mjs";
import { readRegistry, validateSoulId } from "./runtime/registry.mjs";
import { ACTIONS } from "./world/genesis-world.mjs";
import { WorldRuntime } from "./world/runtime.mjs";
import { EmbodiedInfancyController } from "./world/infancy-controller.mjs";
import { KnowledgeChamber } from "./learning/knowledge-chamber.mjs";
import { buildIdentityReport } from "./identity/identity-report.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const soulsDir = path.join(root, "souls");
const host = process.env.FLUCTLIGHT_HOST || "127.0.0.1";
const port = Number(process.env.FLUCTLIGHT_PORT || 4747);
const awakeIds = (process.env.FLUCTLIGHT_AWAKE_SOULS || "soul-001-alba-0001").split(",").map((id) => id.trim()).filter(Boolean);
const lexicons = new LexiconRegistry({ spanishPath: process.env.FLUCTLIGHT_LEXICON_PATH });
const world = new WorldRuntime({
  onPerceptions: async (soulId, perceptions, event) => {
    const lexicon = lexicons.get("es");
    const timestamp = Date.now() * 1000;
    const values = {
      energy: perceptions.internal.energy,
      fatigue: perceptions.internal.fatigue,
      light: perceptions.ambient.light,
      contact: perceptions.ambient.contact,
    };
    for (const [predicate, data] of Object.entries(values)) {
      await gateway.receive({
        protocol: "genesis-cognitive/1", id: `${event.id}:aera:${predicate}`, type: "perception", soulId,
        subject: soulId, predicate, value: { type: "number", data }, timestamp,
      });
      lexicon.observe({
        id: `${event.id}:${predicate}`,
        type: "perception",
        soulId,
        subject: soulId,
        predicate,
        value: { type: "number", data },
        timestamp,
      });
    }
    const fragment = event.details?.knowledgeFragment;
    if (fragment?.text) lexicon.encounter(soulId, fragment.text, { timestamp });
  },
});
await world.initialize();
const infancy = new EmbodiedInfancyController({ worldRuntime: world });
await infancy.initialize();
const knowledgeChamber = new KnowledgeChamber({ worldRuntime: world, lexiconFor: (language) => lexicons.get(language) });
const heartbeatByLanguage = new Map();
const chamberByLanguage = new Map();
const explorationByLanguage = new Map();
const checkpoints = new CheckpointManager({
  lexicons,
  soulsDir,
  intervalMs: Number(process.env.FLUCTLIGHT_CHECKPOINT_MS || 300_000),
  retention: Number(process.env.FLUCTLIGHT_CHECKPOINT_RETENTION || 24),
  stateProviders: [world, infancy],
});
async function developmentSnapshot(language, soulId) {
  const checkpoint = await checkpoints.status();
  const database = checkpoint.databases?.find((item) => item.language === language);
  return database?.development?.[soulId] || null;
}
function heartbeatFor(language = "es") {
  const languageCode = validateLanguage(language);
  if (!heartbeatByLanguage.has(languageCode)) heartbeatByLanguage.set(languageCode,
    new CognitiveHeartbeat(lexicons.get(languageCode), {
      intervalMs: Number(process.env.FLUCTLIGHT_HEARTBEAT_MS || 60_000),
      fastForward: Number(process.env.FLUCTLIGHT_HEARTBEAT_FASTFORWARD || 0),
    }));
  return heartbeatByLanguage.get(languageCode);
}
function chamberFor(language = "es") {
  const languageCode = validateLanguage(language);
  if (!chamberByLanguage.has(languageCode)) chamberByLanguage.set(languageCode,
    new LearningChamber(lexicons.get(languageCode), {
      minimumIntervalMs: Number(process.env.FLUCTLIGHT_LEARNING_INTERVAL_MS || 180_000),
    }));
  return chamberByLanguage.get(languageCode);
}
function explorationFor(language = "es") {
  const languageCode = validateLanguage(language);
  if (!explorationByLanguage.has(languageCode)) explorationByLanguage.set(languageCode,
    new AutonomousExploration({ heartbeat: heartbeatFor(languageCode), chamber: chamberFor(languageCode) }));
  return explorationByLanguage.get(languageCode);
}
if (process.env.FLUCTLIGHT_AUTONOMOUS_EXPLORATION === "1") explorationFor("es").start(awakeIds);
else {
  heartbeatFor("es").start(awakeIds);
  if (process.env.FLUCTLIGHT_LEARNING_CHAMBER === "1") chamberFor("es").start(awakeIds);
}
checkpoints.start();

const sensorySchema = {
  entities: ["naia", "human", "garden"],
  objects: ["light", "sound", "contact", "energy", ...ACTIONS],
  commands: ACTIONS,
};
const bootstrapGateway = new CognitiveGateway();
bootstrapGateway.codec.register(sensorySchema);
bootstrapGateway.codec.lockSchema();
const transport = new AeraTcpTransport({
  host: process.env.AERA_HOST || "127.0.0.1",
  port: Number(process.env.AERA_PORT || 8080),
  setup: bootstrapGateway.codec.setup(),
});
await transport.start();
const gateway = new CognitiveGateway({ sink: (frame) => transport.send(frame) });
gateway.codec = bootstrapGateway.codec;
const aeraCommandHistory = [];
const aeraActionNames = new Set(ACTIONS);
transport.onData = async (message) => {
  const action = gateway.codec.commandFor(message.id);
  if (!action || !aeraActionNames.has(action)) return;
  const soulId = awakeIds[0];
  const record = { source: "aera", action, soulId, receivedAt: new Date().toISOString(), status: "received" };
  try {
    if (infancy.running) throw new Error("El controlador local está activo; AERA conserva la autoridad de acción.");
    const result = await world.act(soulId, action);
    record.status = "executed";
    record.outcome = result.event?.details?.outcome || "accepted";
    await gateway.receive({
      protocol: "genesis-cognitive/1", id: `aera-outcome-${result.event.id}`, soulId, type: "outcome",
      subject: soulId, predicate: action, value: { type: "string", data: record.outcome }, timestamp: Date.now() * 1000,
    });
  } catch (error) {
    record.status = "rejected";
    record.reason = error.message;
  }
  aeraCommandHistory.unshift(record);
  aeraCommandHistory.splice(24);
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new Error("Solicitud demasiado grande.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("El cuerpo de la solicitud no contiene JSON válido.");
  }
}

async function serveStatic(requestPath, response) {
  const relative = requestPath === "/" ? "index.html" : decodeURIComponent(requestPath.slice(1));
  const resolved = path.resolve(root, relative);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) return false;
  if (resolved.includes(`${path.sep}souls${path.sep}`) || resolved.includes(`${path.sep}vendor${path.sep}`)) return false;
  try {
    const stat = await fs.stat(resolved);
    if (!stat.isFile()) return false;
    const content = await fs.readFile(resolved);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(resolved)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; connect-src 'self'",
    });
    response.end(content);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json(response, 200, { ok: true, engine: "aera", mode: transport.ready ? "aera-primary" : "aera-awaiting-link", connected: transport.ready, tcp: Boolean(transport.socket), lastMessageType: transport.lastMessageType, protocol: "genesis-cognitive/1", awakeSouls: awakeIds });
    }
    if (request.method === "GET" && url.pathname === "/api/souls") {
      return json(response, 200, { souls: await readRegistry(soulsDir, awakeIds) });
    }
    if (request.method === "GET" && url.pathname === "/api/checkpoints/status") {
      return json(response, 200, await checkpoints.status());
    }
    if (request.method === "POST" && url.pathname === "/api/checkpoints") {
      return json(response, 201, await checkpoints.save({ reason: "manual", mode: "FULL" }));
    }
    if (request.method === "GET" && url.pathname === "/api/world") {
      const soulId = url.searchParams.get("soulId") || awakeIds[0];
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      return json(response, 200, { ...world.status(), perceptions: world.world.perceptions(soulId), actions: ACTIONS });
    }
    if (request.method === "POST" && url.pathname === "/api/world/control") {
      const { command, value } = await readJsonBody(request);
      return json(response, 200, world.control(command, value));
    }
    if (request.method === "POST" && url.pathname === "/api/world/action") {
      const { soulId, action } = await readJsonBody(request);
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      if (!ACTIONS.includes(action)) return json(response, 400, { error: "Acción no válida." });
      if (infancy.running) return json(response, 409, { error: "Pausa el controlador autónomo antes de intervenir manualmente." });
      return json(response, 200, await world.act(soulId, action));
    }
    if (request.method === "GET" && url.pathname === "/api/world/controller") {
      return json(response, 200, infancy.status());
    }
    if (request.method === "POST" && url.pathname === "/api/world/controller") {
      const { command, value } = await readJsonBody(request);
      if (command === "step") {
        if (infancy.running) return json(response, 409, { error: "El paso individual requiere pausar el controlador." });
        await infancy.runSteps(Math.max(1, Math.min(100, Number(value) || 1)));
        return json(response, 200, infancy.status());
      }
      return json(response, 200, infancy.control(command, value));
    }
    if (request.method === "GET" && url.pathname === "/api/lexicon/status") {
      const language = url.searchParams.get("language");
      return json(response, 200, language ? lexicons.get(validateLanguage(language)).status() : lexicons.status());
    }
    if (request.method === "GET" && url.pathname === "/api/lexicon") {
      const word = url.searchParams.get("word") || "";
      if (!word.trim()) return json(response, 400, { error: "Falta la palabra que se desea consultar." });
      const language = validateLanguage(url.searchParams.get("language") || "es");
      return json(response, 200, { word, language, entries: lexicons.get(language).find(word) });
    }
    if (request.method === "GET" && url.pathname === "/api/concepts") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      const language = validateLanguage(url.searchParams.get("language") || "es");
      return json(response, 200, { soulId, language, concepts: lexicons.get(language).concepts(soulId) });
    }
    if (request.method === "GET" && url.pathname === "/api/development") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      const language = validateLanguage(url.searchParams.get("language") || "es");
      const snapshot = await developmentSnapshot(language, soulId);
      return json(response, 200, { language, ...(snapshot || lexicons.get(language).development(soulId)), snapshot: Boolean(snapshot) });
    }
    if (request.method === "GET" && url.pathname === "/api/identity/drift") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      const [genesis, state] = await Promise.all(["GENESIS.json", "STATE.json"].map(async (name) => JSON.parse(await fs.readFile(path.join(soulsDir, soulId, name), "utf8"))));
      const development = await developmentSnapshot("es", soulId) || lexicons.get("es").development(soulId);
      return json(response, 200, buildIdentityReport({ genesis, state, development }));
    }
    if (request.method === "GET" && url.pathname === "/api/identity/history") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      const versions = (await fs.readdir(path.join(soulsDir, soulId))).flatMap((name) => {
        const match = /^(SOUL|IDENTITY)\.v(\d+)\.md$/.exec(name);
        return match ? [{ kind: match[1], version: Number(match[2]), name }] : [];
      }).sort((a, b) => b.version - a.version || a.kind.localeCompare(b.kind));
      return json(response, 200, { soulId, versions });
    }
    if (request.method === "GET" && url.pathname === "/api/memory/episodes") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      const language = validateLanguage(url.searchParams.get("language") || "es");
      return json(response, 200, { soulId, language, episodes: lexicons.get(language).episodes(soulId) });
    }
    if (request.method === "GET" && url.pathname === "/api/heartbeat") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      const language = validateLanguage(url.searchParams.get("language") || "es");
      return json(response, 200, { soulId, language, beats: heartbeatFor(language).status(soulId) });
    }
    if (request.method === "GET" && url.pathname === "/api/aera/commands") {
      return json(response, 200, { connected: transport.ready, authority: "aera", commands: aeraCommandHistory });
    }
    if (request.method === "GET" && url.pathname === "/api/learning/chamber") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      const language = validateLanguage(url.searchParams.get("language") || "es");
      return json(response, 200, {
        soulId, language,
        enabled: process.env.FLUCTLIGHT_LEARNING_CHAMBER === "1",
        observations: lexicons.get(language).externalObservations(soulId),
      });
    }
    if (request.method === "GET" && url.pathname === "/api/learning/budget") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      const language = validateLanguage(url.searchParams.get("language") || "es");
      const autonomous = process.env.FLUCTLIGHT_AUTONOMOUS_EXPLORATION === "1";
      const budget = autonomous ? explorationFor(language).budgetStatus(soulId) : chamberFor(language).budgetStatus(soulId);
      return json(response, 200, { soulId, language, autonomous, budget });
    }
    if (request.method === "GET" && url.pathname === "/api/knowledge-chamber/status") {
      return json(response, 200, knowledgeChamber.status());
    }
    if (request.method === "POST" && url.pathname === "/api/knowledge-chamber/ingest") {
      const { soulId, url: sourceUrl, sourceLanguage = "es", targetLanguage = "es" } = await readJsonBody(request);
      if (!validateSoulId(soulId) || typeof sourceUrl !== "string") return json(response, 400, { error: "Se requieren un alma válida y una URL." });
      return json(response, 201, await knowledgeChamber.ingest({ soulId, url: sourceUrl, sourceLanguage: validateLanguage(sourceLanguage), targetLanguage: validateLanguage(targetLanguage) }));
    }
    if (request.method === "POST" && url.pathname === "/api/learning/chamber/tick") {
      const { soulId, language = "es" } = await readJsonBody(request);
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      return json(response, 200, await chamberFor(validateLanguage(language)).tick(soulId));
    }
    if (request.method === "POST" && url.pathname === "/api/autonomous-exploration/tick") {
      const { soulId, language = "es" } = await readJsonBody(request);
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      return json(response, 200, await explorationFor(validateLanguage(language)).tick(soulId));
    }
    if (request.method === "POST" && url.pathname === "/api/heartbeat") {
      const { soulId, language = "es" } = await readJsonBody(request);
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      return json(response, 200, heartbeatFor(validateLanguage(language)).tick(soulId));
    }
    if (request.method === "POST" && url.pathname === "/api/learning/recognize") {
      const { soulId, cue, subject, predicate, value, language = "es" } = await readJsonBody(request);
      if (!validateSoulId(soulId) || typeof cue !== "string" || !cue.trim()
        || typeof subject !== "string" || typeof predicate !== "string" || !Number.isFinite(value)) {
        return json(response, 400, { error: "La prueba de reconocimiento no es válida." });
      }
      return json(response, 200, { soulId, cue, language, ...lexicons.get(validateLanguage(language)).recognize(soulId, cue, { subject, predicate, value }) });
    }
    if (request.method === "POST" && url.pathname === "/api/learning/foundations/trial") {
      const trial = await readJsonBody(request);
      if (!validateSoulId(trial.soulId)) return json(response, 400, { error: "Alma no válida." });
      const language = validateLanguage(trial.languageCode || "es");
      return json(response, 200, lexicons.get(language).foundational.recordTrial({ ...trial, languageCode: language }));
    }
    if (request.method === "POST" && url.pathname === "/api/learning/foundations/infer") {
      const { soulId, languageCode = "es", task, stimulus } = await readJsonBody(request);
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      const language = validateLanguage(languageCode);
      return json(response, 200, lexicons.get(language).foundational.inferTrial(soulId, language, task, stimulus));
    }
    if (request.method === "POST" && url.pathname === "/api/lexicon/encounter") {
      const { soulId, text, language = "es" } = await readJsonBody(request);
      if (!validateSoulId(soulId) || typeof text !== "string" || !text.trim()) {
        return json(response, 400, { error: "Se requieren un alma válida y un texto no vacío." });
      }
      const languageCode = validateLanguage(language);
      return json(response, 200, { soulId, language: languageCode, encountered: lexicons.get(languageCode).encounter(soulId, text) });
    }
    if (request.method === "POST" && url.pathname === "/api/events") {
      const event = await readJsonBody(request);
      const result = await gateway.receive(event);
      if (result.status === "accepted") lexicons.get(validateLanguage(event.languageCode || "es")).observe(event);
      return json(response, result.status === "accepted" ? 202 : 503, result);
    }
    if (request.method === "POST" && url.pathname === "/api/chat") {
      await readJsonBody(request);
      return json(response, 409, { error: "Esta alma todavía no ha adquirido lenguaje. Usa percepciones elementales; no se generó una respuesta artificial." });
    }
    if (request.method === "GET" && await serveStatic(url.pathname, response)) return;
    json(response, 404, { error: "No encontrado." });
  } catch (error) {
    console.error(error);
    json(response, 400, { error: error.message || "Error inesperado." });
  }
});

server.listen(port, host, () => {
  console.log(`Cámara de Génesis disponible en http://${host}:${port}`);
  console.log(`Alma despierta: ${awakeIds.join(", ")}`);
});

async function shutdown() {
  server.close();
  checkpoints.stop();
  world.stop();
  infancy.stopTimer();
  for (const heartbeat of heartbeatByLanguage.values()) heartbeat.stop();
  for (const exploration of explorationByLanguage.values()) exploration.stop();
  for (const chamber of chamberByLanguage.values()) chamber.stop();
  try { await checkpoints.save({ reason: "shutdown", mode: "FULL" }); }
  catch (error) { console.error(`[checkpoint] cierre: ${error.message}`); }
  lexicons.close();
  await transport.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
