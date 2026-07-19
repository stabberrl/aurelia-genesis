import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import { DEFAULT_LEXICON_PATH, Lexicon, normalizeWord } from "../src/lexicon/lexicon.mjs";

const SOURCE_URL = "https://kaikki.org/eswiktionary/raw-wiktextract-data.jsonl.gz";
const inputPath = path.resolve(process.argv.find((arg) => arg.startsWith("--input="))?.slice(8) || "var/lexicon/eswiktionary.jsonl.gz");
const databasePath = path.resolve(process.argv.find((arg) => arg.startsWith("--database="))?.slice(11) || DEFAULT_LEXICON_PATH);
const shouldDownload = process.argv.includes("--download");

async function download() {
  await fsp.mkdir(path.dirname(inputPath), { recursive: true });
  console.log(`Descargando Wikcionario estructurado en ${inputPath}...`);
  const response = await fetch(SOURCE_URL, { headers: { "User-Agent": "Fluctlight-Genesis/0.1 (local research project)" } });
  if (!response.ok || !response.body) throw new Error(`Descarga fallida: HTTP ${response.status}`);
  const temporary = `${inputPath}.part`;
  await fsp.writeFile(temporary, Readable.fromWeb(response.body));
  await fsp.rename(temporary, inputPath);
}

if (!fs.existsSync(inputPath)) {
  if (!shouldDownload) throw new Error(`No existe ${inputPath}. Ejecuta el script con --download.`);
  await download();
}

await fsp.rm(databasePath, { force: true });
await fsp.rm(`${databasePath}-wal`, { force: true });
await fsp.rm(`${databasePath}-shm`, { force: true });
const lexicon = new Lexicon(databasePath);
const insert = lexicon.db.prepare(`
  INSERT INTO entries (word, normalized, pos, language_code, etymology, senses_json, forms_json, source_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const setMetadata = lexicon.db.prepare("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)");
const source = fs.createReadStream(inputPath).pipe(createGunzip());
const lines = readline.createInterface({ input: source, crlfDelay: Infinity });
let imported = 0;
let parsed = 0;

lexicon.db.exec("BEGIN");
try {
  for await (const line of lines) {
    if (!line.trim()) continue;
    parsed += 1;
    const entry = JSON.parse(line);
    if (entry.lang_code !== "es" || !entry.word) continue;
    const senses = (entry.senses || []).map((sense) => ({
      glosses: sense.glosses || [],
      examples: (sense.examples || []).map(({ text, ref }) => ({ text, ref })).filter(({ text }) => text),
      tags: sense.tags || [],
      synonyms: (sense.synonyms || []).map(({ word }) => word).filter(Boolean),
      antonyms: (sense.antonyms || []).map(({ word }) => word).filter(Boolean),
    })).filter(({ glosses }) => glosses.length);
    if (!senses.length) continue;
    const forms = (entry.forms || []).map(({ form, tags }) => ({ form, tags: tags || [] })).filter(({ form }) => form);
    insert.run(entry.word, normalizeWord(entry.word), entry.pos || "", "es", entry.etymology_text || "", JSON.stringify(senses), JSON.stringify(forms), SOURCE_URL);
    imported += 1;
    if (imported % 5000 === 0) console.log(`${imported.toLocaleString("es-ES")} entradas españolas importadas...`);
  }
  setMetadata.run("source", "Wikcionario en español vía Wiktextract/Kaikki");
  setMetadata.run("source_url", SOURCE_URL);
  setMetadata.run("license", "CC BY-SA 4.0 / GFDL según Wikimedia");
  setMetadata.run("imported_at", new Date().toISOString());
  setMetadata.run("parsed_records", String(parsed));
  lexicon.db.exec("COMMIT");
} catch (error) {
  lexicon.db.exec("ROLLBACK");
  throw error;
}
lexicon.db.exec("PRAGMA optimize;");
console.log(JSON.stringify(lexicon.status(), null, 2));
lexicon.close();
