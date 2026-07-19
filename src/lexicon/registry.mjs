import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Lexicon } from "./lexicon.mjs";
import { LANGUAGE_MANIFEST, SUPPORTED_LANGUAGES, lexiconPath, validateLanguage } from "./languages.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const foundations = JSON.parse(fs.readFileSync(path.join(root, "data", "lexicon", "foundations.json"), "utf8"));

export class LexiconRegistry {
  constructor({ directory = path.resolve("var", "lexicon"), spanishPath } = {}) {
    this.directory = directory;
    this.spanishPath = spanishPath;
    this.lexicons = new Map();
  }

  get(languageCode = "es") {
    validateLanguage(languageCode);
    if (this.lexicons.has(languageCode)) return this.lexicons.get(languageCode);
    const databasePath = languageCode === "es" && this.spanishPath ? this.spanishPath : lexiconPath(languageCode, this.directory);
    const lexicon = new Lexicon(databasePath, { languageCode });
    this.seedFoundations(lexicon, languageCode);
    this.lexicons.set(languageCode, lexicon);
    return lexicon;
  }

  seedFoundations(lexicon, languageCode) {
    const insert = lexicon.db.prepare(`INSERT INTO entries
      (word, normalized, pos, language_code, senses_json, forms_json, source_url)
      SELECT ?, ?, 'foundation', ?, ?, '[]', 'project://foundational-lexicon'
      WHERE NOT EXISTS (SELECT 1 FROM entries WHERE normalized = ? AND language_code = ?)`);
    const labels = foundations[languageCode];
    for (const [concept, word] of Object.entries(labels)) {
      const normalized = lexicon.normalize(word);
      insert.run(word, normalized, languageCode, JSON.stringify([{ glosses: [`Token inicial sin semántica inyectada (${concept}).`] }]), normalized, languageCode);
    }
    lexicon.db.prepare("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)").run("language_code", languageCode);
    lexicon.db.prepare("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)").run("foundation_scope", "yo/tú/sí/no; las traducciones no cuentan como experiencia");
  }

  status() {
    return Object.fromEntries(SUPPORTED_LANGUAGES.map((language) => [language, this.get(language).status()]));
  }

  close() {
    for (const lexicon of this.lexicons.values()) lexicon.close();
    this.lexicons.clear();
  }
}
