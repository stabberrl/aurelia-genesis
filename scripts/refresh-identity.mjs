import fs from "node:fs/promises";
import path from "node:path";
import { Lexicon } from "../src/lexicon/lexicon.mjs";
import { buildIdentityReport, renderIdentity, renderSoul } from "../src/identity/identity-report.mjs";

const soulId = process.argv.find((arg) => arg.startsWith("--soul="))?.slice(7);
const soulsRoot = path.resolve("souls");
const manifest = JSON.parse(await fs.readFile(path.join(soulsRoot, "manifest.json"), "utf8"));
const lexicon = new Lexicon();
const selected = manifest.population.filter((item) => !soulId || item.id === soulId);
for (const item of selected) {
  const dir = path.join(soulsRoot, item.id);
  const [genesis, state] = await Promise.all(["GENESIS.json", "STATE.json"].map(async (name) => JSON.parse(await fs.readFile(path.join(dir, name), "utf8"))));
  const report = buildIdentityReport({ genesis, state, development: lexicon.development(item.id) });
  const version = (await fs.readdir(dir)).filter((name) => /^IDENTITY\.v\d+\.md$/.test(name)).length + 1;
  const soul = renderSoul(report); const identity = renderIdentity(report);
  await Promise.all([
    fs.writeFile(path.join(dir, "SOUL.md"), soul), fs.writeFile(path.join(dir, "IDENTITY.md"), identity),
    fs.writeFile(path.join(dir, `SOUL.v${version}.md`), soul), fs.writeFile(path.join(dir, `IDENTITY.v${version}.md`), identity),
  ]);
  console.log(JSON.stringify({ soulId: item.id, version, driftMagnitude: report.driftMagnitude }));
}
lexicon.close();
