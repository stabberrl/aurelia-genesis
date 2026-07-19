import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export const DEFAULT_LEXICON_PATH = path.resolve("var", "lexicon", "es.sqlite");

export function normalizeWord(value) {
  return String(value || "").normalize("NFC").trim().toLocaleLowerCase("es");
}

export function wordsIn(text) {
  return [...new Set((String(text || "").normalize("NFC").match(/[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu) || [])
    .map(normalizeWord))];
}

export class Lexicon {
  constructor(databasePath = DEFAULT_LEXICON_PATH, { readonly = false } = {}) {
    this.databasePath = path.resolve(databasePath);
    if (!readonly) fs.mkdirSync(path.dirname(this.databasePath), { recursive: true });
    this.db = new DatabaseSync(this.databasePath, { readOnly: readonly, allowExtension: false });
    this.db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY,
        word TEXT NOT NULL,
        normalized TEXT NOT NULL,
        pos TEXT NOT NULL DEFAULT '',
        language_code TEXT NOT NULL DEFAULT 'es',
        etymology TEXT NOT NULL DEFAULT '',
        senses_json TEXT NOT NULL,
        forms_json TEXT NOT NULL DEFAULT '[]',
        source_url TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS entries_normalized_idx ON entries(normalized);
      CREATE TABLE IF NOT EXISTS exposures (
        soul_id TEXT NOT NULL,
        normalized TEXT NOT NULL,
        first_seen_at TEXT NOT NULL,
        seen_count INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (soul_id, normalized)
      );
      CREATE TABLE IF NOT EXISTS perceptions (
        event_id TEXT PRIMARY KEY,
        soul_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        predicate TEXT NOT NULL,
        value REAL NOT NULL,
        perceived_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS perceptions_soul_time_idx ON perceptions(soul_id, perceived_at DESC);
      CREATE TABLE IF NOT EXISTS groundings (
        soul_id TEXT NOT NULL,
        normalized TEXT NOT NULL,
        subject TEXT NOT NULL,
        predicate TEXT NOT NULL,
        samples INTEGER NOT NULL,
        value_sum REAL NOT NULL,
        value_min REAL NOT NULL,
        value_max REAL NOT NULL,
        last_grounded_at TEXT NOT NULL,
        PRIMARY KEY (soul_id, normalized, subject, predicate)
      );
      CREATE TABLE IF NOT EXISTS curriculum_concepts (
        soul_id TEXT NOT NULL,
        normalized TEXT NOT NULL,
        category TEXT NOT NULL,
        definition TEXT NOT NULL,
        pos TEXT NOT NULL DEFAULT '',
        injected_at TEXT NOT NULL,
        PRIMARY KEY (soul_id, normalized)
      );
      CREATE TABLE IF NOT EXISTS semantic_associations (
        soul_id TEXT NOT NULL,
        source_word TEXT NOT NULL,
        target_word TEXT NOT NULL,
        relation TEXT NOT NULL,
        evidence TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (soul_id, source_word, target_word, relation)
      );
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    this.findStatement = this.db.prepare(`
      SELECT word, pos, language_code AS languageCode, etymology,
             senses_json AS sensesJson, forms_json AS formsJson, source_url AS sourceUrl
      FROM entries WHERE normalized = ? ORDER BY pos, id LIMIT ?
    `);
    this.exposeStatement = this.db.prepare(`
      INSERT INTO exposures (soul_id, normalized, first_seen_at, seen_count) VALUES (?, ?, ?, 1)
      ON CONFLICT (soul_id, normalized) DO UPDATE SET seen_count = seen_count + 1
    `);
    this.observeStatement = this.db.prepare(`
      INSERT OR IGNORE INTO perceptions (event_id, soul_id, subject, predicate, value, perceived_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    this.groundStatement = this.db.prepare(`
      INSERT INTO groundings
        (soul_id, normalized, subject, predicate, samples, value_sum, value_min, value_max, last_grounded_at)
      VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
      ON CONFLICT (soul_id, normalized, subject, predicate) DO UPDATE SET
        samples = samples + 1,
        value_sum = value_sum + excluded.value_sum,
        value_min = min(value_min, excluded.value_min),
        value_max = max(value_max, excluded.value_max),
        last_grounded_at = excluded.last_grounded_at
    `);
  }

  find(word, limit = 12) {
    const normalized = normalizeWord(word);
    return this.findStatement.all(normalized, Math.max(1, Math.min(Number(limit) || 12, 50))).map((row) => ({
      ...row,
      senses: JSON.parse(row.sensesJson),
      forms: JSON.parse(row.formsJson),
      sensesJson: undefined,
      formsJson: undefined,
    }));
  }

  observe(event) {
    if (event.type !== "perception" || event.value?.type !== "number") return false;
    this.observeStatement.run(event.id, event.soulId, event.subject, event.predicate, event.value.data, event.timestamp);
    return true;
  }

  encounter(soulId, text, { timestamp = Date.now() * 1000, groundingWindowMs = 30_000 } = {}) {
    const encounteredAt = new Date().toISOString();
    const results = [];
    const recent = this.db.prepare(`
      SELECT subject, predicate, value, perceived_at AS perceivedAt
      FROM perceptions WHERE soul_id = ? AND perceived_at BETWEEN ? AND ?
      ORDER BY perceived_at DESC LIMIT 8
    `).all(soulId, timestamp - groundingWindowMs * 1000, timestamp);
    this.db.exec("BEGIN");
    try {
      for (const word of wordsIn(text).slice(0, 64)) {
        const entries = this.find(word);
        if (!entries.length) continue;
        this.exposeStatement.run(soulId, word, encounteredAt);
        for (const perception of recent) {
          this.groundStatement.run(soulId, word, perception.subject, perception.predicate, perception.value, perception.value, perception.value, encounteredAt);
        }
        results.push({ word, entries, groundedIn: recent });
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return results;
  }

  status() {
    const entries = this.db.prepare("SELECT COUNT(*) AS count FROM entries").get().count;
    const words = this.db.prepare("SELECT COUNT(DISTINCT normalized) AS count FROM entries").get().count;
    const exposures = this.db.prepare("SELECT COUNT(*) AS count FROM exposures").get().count;
    const groundings = this.db.prepare("SELECT COUNT(*) AS count FROM groundings").get().count;
    const metadata = Object.fromEntries(this.db.prepare("SELECT key, value FROM metadata").all().map(({ key, value }) => [key, value]));
    return { ready: entries > 0, entries, words, exposures, groundings, ...metadata };
  }

  concepts(soulId, limit = 50) {
    return this.db.prepare(`
      SELECT normalized AS word, subject, predicate, samples,
             value_sum / samples AS mean, value_min AS minimum, value_max AS maximum,
             last_grounded_at AS lastGroundedAt
      FROM groundings WHERE soul_id = ? ORDER BY samples DESC, last_grounded_at DESC LIMIT ?
    `).all(soulId, Math.max(1, Math.min(Number(limit) || 50, 200))).map((row) => ({ ...row }));
  }

  development(soulId) {
    const vocabulary = this.db.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(seen_count), 0) AS encounters FROM exposures WHERE soul_id = ?").get(soulId);
    const perception = this.db.prepare("SELECT COUNT(*) AS count, COUNT(DISTINCT predicate) AS channels FROM perceptions WHERE soul_id = ?").get(soulId);
    const grounding = this.db.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(samples), 0) AS samples FROM groundings WHERE soul_id = ?").get(soulId);
    const curriculum = this.db.prepare("SELECT COUNT(*) AS concepts FROM curriculum_concepts WHERE soul_id = ?").get(soulId);
    const semantics = this.db.prepare("SELECT COUNT(*) AS associations FROM semantic_associations WHERE soul_id = ?").get(soulId);
    const recent = this.db.prepare(`
      SELECT kind, label, occurred_at AS occurredAt FROM (
        SELECT 'word' AS kind, normalized AS label, CAST(strftime('%s', first_seen_at) AS INTEGER) * 1000000 AS occurred_at
        FROM exposures WHERE soul_id = ?
        UNION ALL
        SELECT 'perception' AS kind, predicate AS label, perceived_at AS occurred_at
        FROM perceptions WHERE soul_id = ?
      ) ORDER BY occurred_at DESC LIMIT 24
    `).all(soulId, soulId).map((row) => ({ ...row }));
    return {
      soulId,
      vocabulary: Number(vocabulary.count),
      experiencedVocabulary: Number(vocabulary.count),
      lexicalEncounters: Number(vocabulary.encounters),
      perceptions: Number(perception.count),
      sensoryChannels: Number(perception.channels),
      associations: Number(grounding.count),
      groundingSamples: Number(grounding.samples),
      injectedConcepts: Number(curriculum.concepts),
      semanticAssociations: Number(semantics.associations),
      concepts: this.concepts(soulId, 36),
      recent,
    };
  }

  injectCurriculum(soulId, concepts, associations) {
    const injectedAt = new Date().toISOString();
    const conceptStatement = this.db.prepare(`INSERT OR REPLACE INTO curriculum_concepts
      (soul_id, normalized, category, definition, pos, injected_at) VALUES (?, ?, ?, ?, ?, ?)`);
    const associationStatement = this.db.prepare(`INSERT OR REPLACE INTO semantic_associations
      (soul_id, source_word, target_word, relation, evidence, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
    this.db.exec("BEGIN");
    try {
      this.db.prepare("DELETE FROM semantic_associations WHERE soul_id = ?").run(soulId);
      this.db.prepare("DELETE FROM curriculum_concepts WHERE soul_id = ?").run(soulId);
      for (const concept of concepts) conceptStatement.run(soulId, concept.word, concept.category, concept.definition, concept.pos || "", injectedAt);
      for (const association of associations) associationStatement.run(soulId, association.source, association.target, association.relation, association.evidence, injectedAt);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return { soulId, concepts: concepts.length, associations: associations.length, injectedAt };
  }

  close() { this.db.close(); }
}
