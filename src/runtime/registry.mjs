import fs from "node:fs/promises";
import path from "node:path";

const SOUL_ID_PATTERN = /^soul-[a-z0-9-]+$/;

export function validateSoulId(soulId) {
  return typeof soulId === "string" && SOUL_ID_PATTERN.test(soulId);
}

export function validateMessage(message) {
  if (typeof message !== "string") return { valid: false, reason: "El mensaje debe ser texto." };
  const normalized = message.trim();
  if (!normalized) return { valid: false, reason: "El mensaje está vacío." };
  if (normalized.length > 1200) return { valid: false, reason: "El mensaje supera 1200 caracteres." };
  return { valid: true, message: normalized };
}

export async function readRegistry(soulsDir, awakeIds = []) {
  const manifest = JSON.parse(await fs.readFile(path.join(soulsDir, "manifest.json"), "utf8"));
  const awake = new Set(awakeIds);
  return Promise.all(manifest.population.map(async (entry) => {
    if (!validateSoulId(entry.id)) throw new Error(`Identificador de alma inválido: ${entry.id}`);
    const state = JSON.parse(await fs.readFile(path.join(soulsDir, entry.id, "STATE.json"), "utf8"));
    return {
      id: entry.id,
      name: entry.name,
      status: awake.has(entry.id) ? "awake" : "dormant",
      state: {
        mood: state.mood,
        energy: state.energy,
        coherence: state.coherence,
        curiosity: state.curiosity,
        trust: state.trust,
      },
    };
  }));
}

export function resolveSoulDirectory(soulsDir, soulId) {
  if (!validateSoulId(soulId)) throw new Error("Identificador de alma inválido.");
  const root = path.resolve(soulsDir);
  const resolved = path.resolve(root, soulId);
  if (path.dirname(resolved) !== root) throw new Error("La ruta del alma sale del registro permitido.");
  return resolved;
}
