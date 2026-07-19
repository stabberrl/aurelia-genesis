import { DEFAULT_LEXICON_PATH, Lexicon } from "../src/lexicon/lexicon.mjs";

const soulId = "soul-001-alba-0001";
const lexicon = new Lexicon(process.env.FLUCTLIGHT_LEXICON_PATH || DEFAULT_LEXICON_PATH, { languageCode: "es" });
const learner = lexicon.foundational;
const trials = [];
for (let i = 0; i < 8; i += 1) {
  trials.push({ id: `genesis-foundation-self-${i}`, task: "agency", cue: "yo", stimulus: { motorCommand: 1, proprioceptiveChange: 0.78 + i * 0.01, causalDelayMs: 60 + i, polarity: i % 2 ? "affirmed" : "denied" } });
  trials.push({ id: `genesis-foundation-other-${i}`, task: "agency", cue: "tú", stimulus: { motorCommand: 0, proprioceptiveChange: 0.02, causalDelayMs: 470 - i, polarity: i % 2 ? "denied" : "affirmed" } });
  trials.push({ id: `genesis-foundation-yes-${i}`, task: "polarity", cue: "sí", stimulus: { expected: 0.2 + i * 0.07, observed: 0.22 + i * 0.07, actor: i % 2 ? "self" : "other" } });
  trials.push({ id: `genesis-foundation-no-${i}`, task: "polarity", cue: "no", stimulus: { expected: 0.88 + i * 0.01, observed: 0.03 + i * 0.004, actor: i % 2 ? "other" : "self" } });
}
trials.forEach((trial, index) => learner.recordTrial({ ...trial, soulId, languageCode: "es", occurredAt: 1_784_486_000_000_000 + index }));
const proof = {
  self: learner.inferTrial(soulId, "es", "agency", { motorCommand: 1, proprioceptiveChange: 0.84, causalDelayMs: 75 }),
  other: learner.inferTrial(soulId, "es", "agency", { motorCommand: 0, proprioceptiveChange: 0.03, causalDelayMs: 465 }),
  affirmed: learner.inferTrial(soulId, "es", "polarity", { expected: 0.62, observed: 0.65 }),
  denied: learner.inferTrial(soulId, "es", "polarity", { expected: 0.9, observed: 0.05 }),
};
lexicon.close();
console.log(JSON.stringify(Object.fromEntries(Object.entries(proof).map(([name, result]) => [name, { cue: result.best?.cue, confidence: result.best?.confidence, recognized: result.recognized }])), null, 2));
