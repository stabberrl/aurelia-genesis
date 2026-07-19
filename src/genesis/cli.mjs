import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { birthPopulation } from "./birth.mjs";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(moduleDir, "../..");
const configPath = path.join(projectRoot, "genesis.config.json");
const outputDir = path.join(projectRoot, "souls");
const dryRun = process.argv.includes("--dry-run");

try {
  const config = JSON.parse(await fs.readFile(configPath, "utf8"));
  const souls = await birthPopulation({ config, outputDir, dryRun });
  console.log(dryRun ? "Vista previa de Genesis:" : "Primer Nacimiento completado:");
  for (const soul of souls) {
    console.log(`- ${soul.name} (${soul.id}) | conflicto: ${soul.innerConflict.title}`);
  }
} catch (error) {
  if (error.code === "EEXIST") {
    console.error("Genesis se detuvo: ya existe una población. No se sobrescribirá ninguna identidad.");
  } else {
    console.error(`Genesis se detuvo: ${error.message}`);
  }
  process.exitCode = 1;
}
