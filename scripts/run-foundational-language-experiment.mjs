import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { FoundationalLanguage } from "../src/learning/foundational-language.mjs";

const soulId = "soul-001-alba-0001";
const languageCode = "es";
const labels = { self: "yo", other: "tú", affirmed: "sí", denied: "no" };
const training = [];
for (let i = 0; i < 8; i += 1) {
  training.push({ id: `agency-self-${i}`, task: "agency", cue: labels.self, stimulus: { motorCommand: 1, proprioceptiveChange: 0.76 + i * 0.01, externalMotion: 0.7, causalDelayMs: 55 + i, polarity: i % 2 ? "affirmed" : "denied" } });
  training.push({ id: `agency-other-${i}`, task: "agency", cue: labels.other, stimulus: { motorCommand: 0, proprioceptiveChange: 0.02 + i * 0.002, externalMotion: 0.7, causalDelayMs: 470 - i, polarity: i % 2 ? "denied" : "affirmed" } });
  training.push({ id: `polarity-yes-${i}`, task: "polarity", cue: labels.affirmed, stimulus: { expected: 0.15 + i * 0.08, observed: 0.17 + i * 0.08, actor: i % 2 ? "self" : "other" } });
  training.push({ id: `polarity-no-${i}`, task: "polarity", cue: labels.denied, stimulus: { expected: 0.88 + i * 0.01, observed: 0.03 + i * 0.004, actor: i % 2 ? "other" : "self" } });
}
const holdout = [];
for (let i = 0; i < 6; i += 1) {
  holdout.push({ task: "agency", expectedCue: labels.self, stimulus: { motorCommand: 1, proprioceptiveChange: 0.7 + i * 0.02, externalMotion: 0.7, causalDelayMs: 70 + i * 3 } });
  holdout.push({ task: "agency", expectedCue: labels.other, stimulus: { motorCommand: 0, proprioceptiveChange: 0.01 + i * 0.004, externalMotion: 0.7, causalDelayMs: 460 + i * 3 } });
  holdout.push({ task: "polarity", expectedCue: labels.affirmed, stimulus: { expected: 0.31 + i * 0.06, observed: 0.34 + i * 0.06 } });
  holdout.push({ task: "polarity", expectedCue: labels.denied, stimulus: { expected: 0.86 + i * 0.01, observed: 0.04 + i * 0.005 } });
}
const ambiguous = [
  { task: "agency", stimulus: { motorCommand: 0, proprioceptiveChange: 0.72, causalDelayMs: 240 } },
  { task: "polarity", stimulus: { expected: 0.8, observed: 0.3 } },
];

function execute(train = training) {
  const db = new DatabaseSync(":memory:");
  const learner = new FoundationalLanguage(db);
  const pretest = holdout.every(({ task, stimulus }) => !learner.inferTrial(soulId, languageCode, task, stimulus).recognized);
  train.forEach((trial, index) => learner.recordTrial({ ...trial, soulId, languageCode, occurredAt: index + 1 }));
  const trials = holdout.map((trial) => {
    const result = learner.inferTrial(soulId, languageCode, trial.task, trial.stimulus);
    return { ...trial, predictedCue: result.best?.cue || null, confidence: result.best?.confidence || 0, passed: result.recognized && result.best?.cue === trial.expectedCue };
  });
  const ambiguousResults = ambiguous.map(({ task, stimulus }) => learner.inferTrial(soulId, languageCode, task, stimulus));
  const isolation = holdout.every(({ task, stimulus }) => !learner.inferTrial("soul-002-ruma-0002", languageCode, task, stimulus).recognized);
  const profiles = Object.values(labels).map((cue) => ({ cue, associations: learner.profile(soulId, languageCode, cue) }));
  db.close();
  return { pretest, trials, ambiguousResults, isolation, profiles, accuracy: trials.filter(({ passed }) => passed).length / trials.length };
}

const result = execute();
const shuffledRuns = [];
for (let seed = 0; seed < 10; seed += 1) {
  const shuffled = training.map((trial, index) => ({ ...trial, cue: trial.task === "agency"
    ? ((index + seed) % 3 ? labels.self : labels.other)
    : ((index + seed) % 3 ? labels.affirmed : labels.denied) }));
  shuffledRuns.push(execute(shuffled).accuracy);
}
const shuffledMean = shuffledRuns.reduce((sum, value) => sum + value, 0) / shuffledRuns.length;
const datasetHash = crypto.createHash("sha256").update(JSON.stringify({ training, holdout, ambiguous })).digest("hex");
const report = {
  schemaVersion: 1,
  experiment: "foundational-deixis-polarity-v1",
  generatedAt: new Date().toISOString(),
  datasetHash,
  claim: "Discriminación asociativa de agencia propia/externa y confirmación/rechazo en un entorno controlado.",
  criteria: { accuracy: 0.9, ambiguousAbstention: 1, pretestAbstention: true, isolation: true, shuffledControlMax: 0.6 },
  metrics: { accuracy: result.accuracy, ambiguousAbstention: result.ambiguousResults.filter(({ abstained }) => abstained).length / ambiguous.length, pretestAbstention: result.pretest, isolation: result.isolation, shuffledControlMean: shuffledMean },
  passed: result.accuracy >= 0.9 && result.pretest && result.isolation && shuffledMean <= 0.6 && result.ambiguousResults.every(({ abstained }) => abstained),
  holdout: result.trials,
  profiles: result.profiles,
  limitations: ["Datos sintéticos y supervisados.", "Los clasificadores de agencia y acuerdo son sesgos inductivos diseñados.", "No demuestra consciencia, autoconciencia ni comprensión lingüística general."],
};
const outputDirectory = path.resolve("evidence");
await fs.mkdir(outputDirectory, { recursive: true });
await fs.writeFile(path.join(outputDirectory, "foundational-language-v1.json"), `${JSON.stringify(report, null, 2)}\n`);
const markdown = `# Evidencia: deixis y polaridad fundacional v1\n\n- Resultado: **${report.passed ? "PASS" : "FAIL"}**\n- Exactitud holdout: **${(report.metrics.accuracy * 100).toFixed(1)}%** (${result.trials.length} casos)\n- Abstención preentrenamiento: **${report.metrics.pretestAbstention ? "PASS" : "FAIL"}**\n- Abstención ambigua: **${(report.metrics.ambiguousAbstention * 100).toFixed(1)}%**\n- Aislamiento de Orin: **${report.metrics.isolation ? "PASS" : "FAIL"}**\n- Control con etiquetas alteradas: **${(report.metrics.shuffledControlMean * 100).toFixed(1)}%**\n- SHA-256 del conjunto: \`${datasetHash}\`\n\n${report.claim}\n\n## Límites\n\n${report.limitations.map((item) => `- ${item}`).join("\n")}\n`;
await fs.writeFile(path.join(outputDirectory, "foundational-language-v1.md"), markdown);
console.log(JSON.stringify({ passed: report.passed, metrics: report.metrics, datasetHash }, null, 2));
if (!report.passed) process.exitCode = 1;
