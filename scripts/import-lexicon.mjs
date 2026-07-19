import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import { Lexicon } from "../src/lexicon/lexicon.mjs";
import { LANGUAGE_MANIFEST, lexiconPath, validateLanguage } from "../src/lexicon/languages.mjs";

const languageCode = validateLanguage(process.argv.find((arg) => arg.startsWith("--language="))?.slice(11) || "es");
const manifest = LANGUAGE_MANIFEST[languageCode];
const inputPath = path.resolve(process.argv.find((arg) => arg.startsWith("--input="))?.slice(8) || `var/lexicon/${manifest.edition}.jsonl.gz`);
const databasePath = path.resolve(process.argv.find((arg) => arg.startsWith("--database="))?.slice(11) || lexiconPath(languageCode));
const shouldDownload = process.argv.includes("--download");

if (!fs.existsSync(inputPath)) {
  if (!shouldDownload) throw new Error(`No existe ${inputPath}. Añade --download para obtenerlo.`);
  await fsp.mkdir(path.dirname(inputPath), { recursive: true });
  const response = await fetch(manifest.sourceUrl, { headers: { "User-Agent": "Aurelia-Genesis/0.2 (local research project)" } });
  if (!response.ok || !response.body) throw new Error(`Descarga fallida: HTTP ${response.status}`);
  const temporary = `${inputPath}.part`;
  await fsp.writeFile(temporary, Readable.fromWeb(response.body));
  await fsp.rename(temporary, inputPath);
}

await fsp.rm(databasePath, { force: true });
await fsp.rm(`${databasePath}-wal`, { force: true });
await fsp.rm(`${databasePath}-shm`, { force: true });
const lexicon = new Lexicon(databasePath, { languageCode });
const insert = lexicon.db.prepare(`INSERT INTO entries
  (word, normalized, pos, language_code, etymology, senses_json, forms_json, source_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
const source = fs.createReadStream(inputPath).pipe(createGunzip());
const lines = readline.createInterface({ input: source, crlfDelay: Infinity });
let imported = 0;

lexicon.db.exec("BEGIN");
try {
  for await (const line of lines) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line);
    if (entry.lang_code !== languageCode || !entry.word) continue;
    const senses = (entry.senses || []).map((sense) => ({
      glosses: sense.glosses || [], examples: sense.examples || [], tags: sense.tags || [],
      synonyms: (sense.synonyms || []).map(({ word }) => word).filter(Boolean),
      antonyms: (sense.antonyms || []).map(({ word }) => word).filter(Boolean),
    })).filter(({ glosses }) => glosses.length);
    if (!senses.length) continue;
    insert.run(entry.word, lexicon.normalize(entry.word), entry.pos || "", languageCode,
      entry.etymology_text || "", JSON.stringify(senses), JSON.stringify(entry.forms || []), manifest.sourceUrl);
    imported += 1;
  }
  const metadata = lexicon.db.prepare("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)");
  metadata.run("language_code", languageCode);
  metadata.run("wiktionary_edition", manifest.edition);
  metadata.run("source_url", manifest.sourceUrl);
  metadata.run("license", "CC BY-SA / GFDL; consultar THIRD_PARTY_NOTICES.md");
  metadata.run("imported_at", new Date().toISOString());
  lexicon.db.exec("COMMIT");
} catch (error) {
  lexicon.db.exec("ROLLBACK");
  throw error;
}
console.log(JSON.stringify({ languageCode, imported, databasePath }, null, 2));
lexicon.close();
