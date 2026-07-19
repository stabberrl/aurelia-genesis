import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { FoundationalLanguage } from "../src/learning/foundational-language.mjs";

function learner() {
  const db = new DatabaseSync(":memory:");
  return { db, language: new FoundationalLanguage(db) };
}

test("se abstiene antes de recibir experiencias", () => {
  const { db, language } = learner();
  try {
    const result = language.inferTrial("naia", "es", "agency", { motorCommand: 1, proprioceptiveChange: 0.9, causalDelayMs: 40 });
    assert.equal(result.recognized, false);
    assert.equal(result.best, null);
  } finally { db.close(); }
});

test("aprende yo y tú usando agencia causal, no el efecto externo", () => {
  const { db, language } = learner();
  try {
    for (let index = 0; index < 6; index += 1) {
      language.recordTrial({ id: `self-${index}`, soulId: "naia", languageCode: "es", cue: "yo", task: "agency", occurredAt: index,
        stimulus: { motorCommand: 1, proprioceptiveChange: 0.8, externalMotion: 0.76, causalDelayMs: 60, polarity: index % 2 ? "affirmed" : "denied" } });
      language.recordTrial({ id: `other-${index}`, soulId: "naia", languageCode: "es", cue: "tú", task: "agency", occurredAt: 100 + index,
        stimulus: { motorCommand: 0, proprioceptiveChange: 0.02, externalMotion: 0.76, causalDelayMs: 480, polarity: index % 2 ? "denied" : "affirmed" } });
    }
    const own = language.inferTrial("naia", "es", "agency", { motorCommand: 1, proprioceptiveChange: 0.76, externalMotion: 0.76, causalDelayMs: 80 });
    const external = language.inferTrial("naia", "es", "agency", { motorCommand: 0, proprioceptiveChange: 0.04, externalMotion: 0.76, causalDelayMs: 470 });
    assert.equal(own.best.cue, "yo");
    assert.equal(external.best.cue, "tú");
    assert.equal(own.recognized && external.recognized, true);
  } finally { db.close(); }
});

test("aprende sí y no en proposiciones nuevas y se abstiene ante ambigüedad", () => {
  const { db, language } = learner();
  try {
    for (let index = 0; index < 6; index += 1) {
      language.recordTrial({ id: `yes-${index}`, soulId: "naia", languageCode: "es", cue: "sí", task: "polarity", occurredAt: index,
        stimulus: { expected: 0.2 + index * 0.1, observed: 0.22 + index * 0.1, actor: index % 2 ? "self" : "other" } });
      language.recordTrial({ id: `no-${index}`, soulId: "naia", languageCode: "es", cue: "no", task: "polarity", occurredAt: 100 + index,
        stimulus: { expected: 0.9, observed: 0.05 + index * 0.01, actor: index % 2 ? "other" : "self" } });
    }
    assert.equal(language.inferTrial("naia", "es", "polarity", { expected: 0.61, observed: 0.64 }).best.cue, "sí");
    assert.equal(language.inferTrial("naia", "es", "polarity", { expected: 0.92, observed: 0.08 }).best.cue, "no");
    assert.equal(language.inferTrial("naia", "es", "polarity", { expected: 0.8, observed: 0.3 }).abstained, true);
  } finally { db.close(); }
});

test("el aprendizaje de Naia no aparece en Orin", () => {
  const { db, language } = learner();
  try {
    language.recordTrial({ id: "isolated", soulId: "naia", languageCode: "es", cue: "yo", task: "agency", occurredAt: 1,
      stimulus: { motorCommand: 1, proprioceptiveChange: 1, causalDelayMs: 0, polarity: "affirmed" } });
    assert.equal(language.inferTrial("orin", "es", "agency", { motorCommand: 1, proprioceptiveChange: 1, causalDelayMs: 0 }).best, null);
  } finally { db.close(); }
});

test("las asociaciones sobreviven al reinicio de la base", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "aurelia-foundations-"));
  const databasePath = path.join(directory, "memory.sqlite");
  try {
    let db = new DatabaseSync(databasePath);
    let language = new FoundationalLanguage(db);
    for (let index = 0; index < 4; index += 1) language.recordTrial({ id: `persist-${index}`, soulId: "naia", languageCode: "es", cue: "yo", task: "agency", occurredAt: index,
      stimulus: { motorCommand: 1, proprioceptiveChange: 0.9, causalDelayMs: 40, polarity: index % 2 ? "affirmed" : "denied" } });
    const before = language.inferTrial("naia", "es", "agency", { motorCommand: 1, proprioceptiveChange: 0.8, causalDelayMs: 60 });
    db.close();
    db = new DatabaseSync(databasePath);
    language = new FoundationalLanguage(db);
    const after = language.inferTrial("naia", "es", "agency", { motorCommand: 1, proprioceptiveChange: 0.8, causalDelayMs: 60 });
    assert.deepEqual(after, before);
    db.close();
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
