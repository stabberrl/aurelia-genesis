import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { Lexicon } from "../src/lexicon/lexicon.mjs";

const root = path.resolve(import.meta.dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (script) => new Promise((resolve, reject) => {
  const child = spawn(npm, ["run", script], { cwd: root, stdio: "inherit" });
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} terminó con código ${code}.`)));
});

const aera = path.join(root, "vendor", "aera", "Release", process.platform === "win32" ? "AERA.exe" : "AERA");
if (fs.existsSync(aera)) console.log("[bootstrap] AERA ya está compilado; se omite la compilación.");
else await run("aera:build");

const db = path.join(root, "var", "lexicon", "es.sqlite");
if (fs.existsSync(db)) console.log("[bootstrap] Léxico español existente; se omite la importación.");
else await run("lexicon:import");

const lexicon = new Lexicon(db);
const development = lexicon.development("soul-001-alba-0001");
lexicon.close();
if (development.injectedConcepts >= 400) console.log("[bootstrap] Currículo básico existente; se omite la inyección.");
else await run("curriculum:basic");
await run("test");
