import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { birthPopulation } from "../src/genesis/birth.mjs";
import { createPopulation, createSoulBlueprint, validatePopulation } from "../src/genesis/genesis.mjs";

const world = {
  name: "Aurelia",
  originPlace: "el Jardín del Alba",
  firstPrinciple: "La vida comienza.",
};

const config = {
  genesisVersion: "test",
  world,
  births: [
    { seed: "test-alpha", slot: 1 },
    { seed: "test-beta", slot: 2 },
    { seed: "test-gamma", slot: 3 },
  ],
};

test("la misma semilla genera el mismo plano", () => {
  const first = createSoulBlueprint({ seed: "constant", slot: 1, world });
  const second = createSoulBlueprint({ seed: "constant", slot: 1, world });
  assert.deepEqual(first, second);
});

test("tres semillas producen identidades distintas", () => {
  const souls = createPopulation(config.births, world);
  assert.equal(validatePopulation(souls), true);
  assert.equal(new Set(souls.map((soul) => soul.name)).size, 3);
  assert.equal(new Set(souls.map((soul) => JSON.stringify(soul.hexaco))).size, 3);
});

test("Genesis resuelve colisiones de nombres de forma reproducible", () => {
  const colliding = [
    { seed: "FL-ALBA-0001", slot: 1 },
    { seed: "FL-BRUMA-0002", slot: 2 },
    { seed: "FL-AURORA-0003", slot: 3 },
  ];
  const first = createPopulation(colliding, world);
  const second = createPopulation(colliding, world);
  assert.equal(new Set(first.map(({ name }) => name)).size, 3);
  assert.deepEqual(first, second);
});

test("cada alma nace en un espacio de memoria aislado", async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-genesis-"));
  try {
    const souls = await birthPopulation({ config, outputDir: temporaryRoot, bornAt: "2026-07-19T00:00:00.000Z" });
    for (const soul of souls) {
      const ownSoul = await fs.readFile(path.join(temporaryRoot, soul.id, "SOUL.md"), "utf8");
      assert.match(ownSoul, new RegExp(`name: ${soul.name}`));
      for (const other of souls.filter(({ id }) => id !== soul.id)) {
        assert.doesNotMatch(ownSoul, new RegExp(`agentId: ${other.id}`));
      }
      await fs.access(path.join(temporaryRoot, soul.id, "memory", "index.md"));
      await fs.access(path.join(temporaryRoot, soul.id, "GENESIS.json"));
    }
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("Genesis nunca sobrescribe un alma existente", async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-genesis-"));
  try {
    await birthPopulation({ config, outputDir: temporaryRoot, bornAt: "2026-07-19T00:00:00.000Z" });
    await assert.rejects(() => birthPopulation({ config, outputDir: temporaryRoot, bornAt: "2026-07-19T00:00:00.000Z" }), { code: "EEXIST" });
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("los archivos visibles no revelan la infraestructura", async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-genesis-"));
  try {
    const souls = await birthPopulation({ config, outputDir: temporaryRoot, bornAt: "2026-07-19T00:00:00.000Z" });
    const visibleFiles = ["SOUL.md", "STYLE.md", "IDENTITY.md", "AGENTS.md", path.join("memory", "index.md")];
    for (const soul of souls) {
      for (const relativePath of visibleFiles) {
        const content = await fs.readFile(path.join(temporaryRoot, soul.id, relativePath), "utf8");
        assert.doesNotMatch(content, /AgentOS|Genesis|inteligencia artificial|simulaci[oó]n|modelo de lenguaje/i);
      }
    }
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});
