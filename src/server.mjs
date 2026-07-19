import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { CognitiveGateway } from "./bridge/gateway.mjs";
import { AeraTcpTransport } from "./bridge/aera-tcp-transport.mjs";
import { Lexicon } from "./lexicon/lexicon.mjs";
import { readRegistry, validateSoulId } from "./runtime/registry.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const soulsDir = path.join(root, "souls");
const host = process.env.FLUCTLIGHT_HOST || "127.0.0.1";
const port = Number(process.env.FLUCTLIGHT_PORT || 4747);
const awakeIds = (process.env.FLUCTLIGHT_AWAKE_SOULS || "soul-001-alba-0001").split(",").map((id) => id.trim()).filter(Boolean);
const lexicon = new Lexicon(process.env.FLUCTLIGHT_LEXICON_PATH);

const sensorySchema = {
  entities: ["naia", "human", "garden"],
  objects: ["light", "sound", "contact", "energy"],
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
      return json(response, 200, { ok: true, engine: "aera", connected: transport.ready, tcp: Boolean(transport.socket), lastMessageType: transport.lastMessageType, protocol: "genesis-cognitive/1", awakeSouls: awakeIds });
    }
    if (request.method === "GET" && url.pathname === "/api/souls") {
      return json(response, 200, { souls: await readRegistry(soulsDir, awakeIds) });
    }
    if (request.method === "GET" && url.pathname === "/api/lexicon/status") {
      return json(response, 200, lexicon.status());
    }
    if (request.method === "GET" && url.pathname === "/api/lexicon") {
      const word = url.searchParams.get("word") || "";
      if (!word.trim()) return json(response, 400, { error: "Falta la palabra que se desea consultar." });
      return json(response, 200, { word, entries: lexicon.find(word) });
    }
    if (request.method === "GET" && url.pathname === "/api/concepts") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      return json(response, 200, { soulId, concepts: lexicon.concepts(soulId) });
    }
    if (request.method === "GET" && url.pathname === "/api/development") {
      const soulId = url.searchParams.get("soulId") || "";
      if (!validateSoulId(soulId)) return json(response, 400, { error: "Alma no válida." });
      return json(response, 200, lexicon.development(soulId));
    }
    if (request.method === "POST" && url.pathname === "/api/lexicon/encounter") {
      const { soulId, text } = await readJsonBody(request);
      if (!validateSoulId(soulId) || typeof text !== "string" || !text.trim()) {
        return json(response, 400, { error: "Se requieren un alma válida y un texto no vacío." });
      }
      return json(response, 200, { soulId, encountered: lexicon.encounter(soulId, text) });
    }
    if (request.method === "POST" && url.pathname === "/api/events") {
      const event = await readJsonBody(request);
      const result = await gateway.receive(event);
      if (result.status === "accepted") lexicon.observe(event);
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
  lexicon.close();
  await transport.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
