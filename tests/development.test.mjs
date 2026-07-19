import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assessDevelopment } from "../src/development/assessment.mjs";
import { Lexicon } from "../src/lexicon/lexicon.mjs";
import { CognitiveHeartbeat } from "../src/runtime/cognitive-heartbeat.mjs";

const metrics = (overrides = {}) => ({ episodicMemories: 0, plasticAssociations: 0,
  groundingSamples: 0, foundationalConcepts: 0, sensoryChannels: 0, heartbeatCount: 0, ...overrides });

test("las fases crecen por evidencia multidimensional y no por currículo inyectado", () => {
  assert.equal(assessDevelopment(metrics()).phase.id, "nascent");
  assert.equal(assessDevelopment(metrics({ episodicMemories: 30, plasticAssociations: 6, groundingSamples: 30, foundationalConcepts: 4, sensoryChannels: 4, heartbeatCount: 20 })).phase.id, "middle");
  assert.equal(assessDevelopment(metrics({ episodicMemories: 120, plasticAssociations: 24, groundingSamples: 120, foundationalConcepts: 4, sensoryChannels: 4, heartbeatCount: 80 })).phase.id, "high");
  assert.match(assessDevelopment(metrics()).disclaimer, /no mide consciencia/i);
});

test("el latido consolida patrones y sólo propone acciones", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "aurelia-heartbeat-"));
  const lexicon = new Lexicon(path.join(directory, "memory.sqlite"));
  try {
    const soulId = "soul-001-alba-0001";
    lexicon.db.prepare(`INSERT INTO learned_associations
      (soul_id, cue, subject, predicate, weight, evidence_count, value_sum, last_reinforced_at)
      VALUES (?, 'luz', 'garden', 'light', .8, 4, 3.2, ?)`)
      .run(soulId, Date.now() * 1000);
    const heartbeat = new CognitiveHeartbeat(lexicon);
    const result = heartbeat.tick(soulId, 10_000_000);
    assert.equal(result.sequence, 1);
    assert.ok(result.operations.some(({ type }) => type === "consolidate"));
    const proposal = result.operations.find(({ type }) => type === "proposal");
    assert.equal(proposal.execution, "proposal-only");
    assert.equal(heartbeat.status(soulId).length, 1);
    assert.equal(lexicon.development(soulId).heartbeatCount, 1);
  } finally {
    lexicon.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
