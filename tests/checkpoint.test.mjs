import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { CheckpointManager } from "../src/runtime/checkpoint-manager.mjs";

test("crea un punto de control atómico con datos de recuperación", async (context) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "aurelia-checkpoint-"));
  context.after(() => fs.rm(root, { recursive: true, force: true }));
  const soulsDir = path.join(root, "souls");
  const soulDir = path.join(soulsDir, "soul-001-test-0001");
  const databasePath = path.join(root, "es.sqlite");
  await fs.mkdir(soulDir, { recursive: true });
  await fs.writeFile(path.join(soulDir, "STATE.json"), "{}");
  await fs.writeFile(path.join(soulDir, "GENESIS.json"), "{}");
  await fs.writeFile(databasePath, "database");
  const calls = [];
  const lexicon = {
    databasePath,
    db: { exec: (sql) => calls.push(sql) },
    development: (soulId) => ({ soulId, vocabulary: 3 }),
  };
  const manager = new CheckpointManager({
    lexicons: { lexicons: new Map([["es", lexicon]]) },
    soulsDir,
    checkpointDir: path.join(root, "checkpoints"),
    stateProviders: [{
      pauseForCheckpoint: async () => () => calls.push("resumed"),
      checkpoint: async (reason) => ({ provider: "test", reason }),
    }],
    now: () => new Date("2026-07-25T21:30:00.000Z"),
  });
  const result = await manager.save({ reason: "manual" });
  assert.equal(result.reason, "manual");
  assert.equal(result.databases[0].development["soul-001-test-0001"].vocabulary, 3);
  assert.equal(result.soulFiles.length, 2);
  assert.equal(result.providers[0].provider, "test");
  assert.match(calls[0], /wal_checkpoint\(FULL\)/);
  assert.equal(calls.at(-1), "resumed");
  const latest = JSON.parse(await fs.readFile(path.join(root, "checkpoints", "latest.json"), "utf8"));
  assert.equal(latest.savedAt, "2026-07-25T21:30:00.000Z");
});
