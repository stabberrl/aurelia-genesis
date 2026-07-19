import fs from "node:fs/promises";
import path from "node:path";
import { createPopulation } from "./genesis.mjs";
import { makeGenesisRecord, renderAgents, renderIdentity, renderMemoryIndex, renderSoul, renderStyle } from "./render.mjs";

async function writeExclusive(filePath, content) {
  await fs.writeFile(filePath, content, { flag: "wx" });
}

export async function birthPopulation({ config, outputDir, bornAt = new Date().toISOString(), dryRun = false }) {
  const blueprints = createPopulation(config.births, config.world);
  if (dryRun) return blueprints;

  await fs.mkdir(outputDir, { recursive: true });
  const manifest = {
    schemaVersion: 1,
    genesisVersion: config.genesisVersion,
    bornAt,
    population: blueprints.map(({ id, name, seed, slot }) => ({ id, name, seed, slot })),
  };

  for (const blueprint of blueprints) {
    const soulDir = path.join(outputDir, blueprint.id);
    const memoryDir = path.join(soulDir, "memory");
    await fs.mkdir(path.join(memoryDir, "entities"), { recursive: true });
    await fs.mkdir(path.join(memoryDir, "concepts"), { recursive: true });
    await fs.mkdir(path.join(memoryDir, "log"), { recursive: true });

    await writeExclusive(path.join(soulDir, "SOUL.md"), renderSoul(blueprint));
    await writeExclusive(path.join(soulDir, "STYLE.md"), renderStyle(blueprint));
    await writeExclusive(path.join(soulDir, "IDENTITY.md"), renderIdentity(blueprint));
    await writeExclusive(path.join(soulDir, "AGENTS.md"), renderAgents(blueprint));
    await writeExclusive(path.join(soulDir, "GENESIS.json"), `${JSON.stringify(makeGenesisRecord(blueprint, config.genesisVersion, bornAt), null, 2)}\n`);
    await writeExclusive(path.join(soulDir, "STATE.json"), `${JSON.stringify({ schemaVersion: 1, soulId: blueprint.id, updatedAt: bornAt, ...blueprint.initialState, needs: blueprint.needs }, null, 2)}\n`);
    await writeExclusive(path.join(memoryDir, "index.md"), renderMemoryIndex(blueprint));
    await writeExclusive(path.join(memoryDir, "entities", "index.md"), "# Personas y lugares\n\nTodavía no hay entidades recordadas.\n");
    await writeExclusive(path.join(memoryDir, "concepts", "index.md"), "# Ideas aprendidas\n\nTodavía no hay conceptos consolidados.\n");
    await writeExclusive(path.join(memoryDir, "log", "index.md"), "# Experiencias\n\nLa vida acaba de comenzar.\n");
  }

  await writeExclusive(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return blueprints;
}
