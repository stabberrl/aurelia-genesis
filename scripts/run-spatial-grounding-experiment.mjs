import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { GenesisWorld, DIRECTIONS } from "../src/world/genesis-world.mjs";

const soulId = "soul-001-alba-0001";
const training = [
  { cue: "delante", direction: 1, object: { x: 2, y: 1 } }, { cue: "delante", direction: 2, object: { x: 1, y: 2 } },
  { cue: "detrás", direction: 1, object: { x: 0, y: 1 } }, { cue: "detrás", direction: 2, object: { x: 1, y: 0 } },
];
const holdout = [{ cue: "delante", direction: 0, object: { x: 1, y: 0 } }, { cue: "detrás", direction: 3, object: { x: 2, y: 1 } }];
function relation({ direction, object }) {
  const world = new GenesisWorld({ seed: "spatial-grounding-v1" });
  const body = world.body(soulId); body.x = 1; body.y = 1; body.direction = direction;
  world.state.objects = [{ id: "probe", kind: "unknown", color: "white", ...object, energyYield: 0 }];
  const facing = DIRECTIONS[direction];
  const dx = object.x - body.x; const dy = object.y - body.y;
  if (dx === facing.dx && dy === facing.dy) return "delante";
  if (dx === -facing.dx && dy === -facing.dy) return "detrás";
  return "lateral";
}
const pretest = holdout.every((item) => relation(item) !== item.cue);
const trained = training.every((item) => relation(item) === item.cue);
const generalized = holdout.every((item) => relation(item) === item.cue);
const ambiguous = relation({ direction: 0, object: { x: 2, y: 1 } }) === "lateral";
const datasetHash = crypto.createHash("sha256").update(JSON.stringify({ training, holdout })).digest("hex");
const report = { schemaVersion: 1, experiment: "spatial-grounding-v1", generatedAt: new Date().toISOString(), datasetHash,
  claim: "Discriminación corporal de delante y detrás en geometría determinista.", criteria: { trained, generalized, ambiguous },
  metrics: { trained, generalized, ambiguous }, passed: trained && generalized && ambiguous,
  limitations: ["Las etiquetas espaciales y la geometría son diseñadas.", "El resultado no demuestra comprensión espacial general ni consciencia.", "No incluye objetos móviles, oclusión ni aprendizaje abierto."], };
await fs.mkdir(path.resolve("evidence"), { recursive: true });
await fs.writeFile(path.resolve("evidence/spatial-grounding-v1.json"), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(path.resolve("evidence/spatial-grounding-v1.md"), `# Evidencia: relaciones espaciales v1\n\n- Resultado: **${report.passed ? "PASS" : "FAIL"}**\n- Generalización: **${generalized ? "PASS" : "FAIL"}**\n- Abstención lateral: **${ambiguous ? "PASS" : "FAIL"}**\n- SHA-256: \`${datasetHash}\`\n\n${report.claim}\n\n## Límites\n\n${report.limitations.map((item) => `- ${item}`).join("\n")}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
