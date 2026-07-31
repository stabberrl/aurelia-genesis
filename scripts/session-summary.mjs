import fs from "node:fs/promises";
import path from "node:path";

const baselinePath = path.resolve("var", "session-summary-baseline.json");
const souls = ["soul-001-alba-0001", "soul-002-ruma-0002", "soul-003-rora-0003"];
let previous = {};
try { previous = JSON.parse(await fs.readFile(baselinePath, "utf8")).souls || {}; } catch {}
const baseUrl = process.env.FLUCTLIGHT_SERVER_URL || "http://127.0.0.1:4747";
let responses;
try {
  responses = await Promise.all(souls.map(async (soulId) => {
    const response = await fetch(`${baseUrl}/api/development?soulId=${encodeURIComponent(soulId)}`, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new Error(`El runtime respondió HTTP ${response.status}.`);
    return [soulId, await response.json()];
  }));
} catch (error) {
  throw new Error(`No se pudo consultar el runtime en ${baseUrl}. Inícialo con npm start o indica FLUCTLIGHT_SERVER_URL. Causa: ${error.message}`);
}
const current = Object.fromEntries(responses);
const summary = Object.fromEntries(souls.map((soulId) => {
  const now = current[soulId]; const before = previous[soulId] || {};
  return [soulId, {
    associationsNew: Math.max(0, now.associations - (before.associations || 0)),
    consolidatedNew: Math.max(0, now.heartbeatCount - (before.heartbeatCount || 0)),
    vocabularyNew: Math.max(0, now.vocabulary - (before.vocabulary || 0)),
    decayMeasured: "no disponible: el modelo actual no conserva un contador agregado de decaimiento",
  }];
}));
await fs.mkdir(path.dirname(baselinePath), { recursive: true });
await fs.writeFile(baselinePath, `${JSON.stringify({ savedAt: new Date().toISOString(), souls: current }, null, 2)}\n`);
console.log(JSON.stringify({ sincePreviousSummary: summary }, null, 2));
