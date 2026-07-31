import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { LearningChamber } from "../src/learning/learning-chamber.mjs";
import { ExplorationBudget } from "../src/learning/exploration-budget.mjs";
import { Lexicon } from "../src/lexicon/lexicon.mjs";
import { CognitiveHeartbeat } from "../src/runtime/cognitive-heartbeat.mjs";
import { AutonomousExploration } from "../src/runtime/autonomous-exploration.mjs";

function response() {
  return { ok: true, json: async () => ({ parse: { title: "existir", wikitext: { "*": "== {{lengua|es}} ==\\n;1: Tener realidad o presencia en el mundo." } } }) };
}

async function setup() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "aurelia-autonomous-exploration-"));
  const lexicon = new Lexicon(path.join(directory, "memory.sqlite"));
  lexicon.db.prepare(`INSERT INTO entries (word, normalized, pos, language_code, senses_json, source_url)
    VALUES ('existir', 'existir', 'verb', 'es', '[]', 'test://lexicon')`).run();
  const chamber = new LearningChamber(lexicon, { fetchFn: async () => response(), terms: ["existir"], minimumIntervalMs: 10_000 });
  return { directory, lexicon, chamber, heartbeat: new CognitiveHeartbeat(lexicon) };
}

test("una propuesta aprobada genera una observación registrada", async () => {
  const fixture = await setup();
  try {
    const coordinator = new AutonomousExploration({ ...fixture });
    const result = await coordinator.tick("soul-test", { now: 1_000_000_000 });
    assert.equal(result.status, "proposal-executed");
    assert.equal(result.proposal.action, "exploreConcept");
    assert.equal(result.permission.allowed, true);
    assert.equal(fixture.lexicon.externalObservations("soul-test").length, 1);
  } finally {
    fixture.lexicon.close(); await fs.rm(fixture.directory, { recursive: true, force: true });
  }
});

test("una propuesta sin presupuesto no genera observación", async () => {
  const fixture = await setup();
  try {
    const coordinator = new AutonomousExploration({ ...fixture,
      budgetFor: () => new ExplorationBudget({ remaining: 0, spent: 1, decisions: [] }) });
    const result = await coordinator.tick("soul-test", { now: 1_000_000_000 });
    assert.equal(result.status, "proposal-blocked");
    assert.equal(result.permission.reason, "budget-exhausted");
    assert.equal(fixture.lexicon.externalObservations("soul-test").length, 0);
  } finally {
    fixture.lexicon.close(); await fs.rm(fixture.directory, { recursive: true, force: true });
  }
});
