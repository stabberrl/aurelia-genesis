import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { FoundationalLanguage } from "../learning/foundational-language.mjs";
import { normalizeForLanguage, tokenizeForLanguage, validateLanguage } from "./languages.mjs";

export const DEFAULT_LEXICON_PATH = path.resolve("var", "lexicon", "es.sqlite");

export function normalizeWord(value, languageCode = "es") {
  return normalizeForLanguage(value, languageCode);
}

export function wordsIn(text, languageCode = "es") {
  return [...new Set(tokenizeForLanguage(text, languageCode))];
}

export class Lexicon {
  constructor(databasePath = DEFAULT_LEXICON_PATH, { readonly = false, languageCode = "es" } = {}) {
    this.databasePath = path.resolve(databasePath);
    this.languageCode = validateLanguage(languageCode);
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
      CREATE TABLE IF NOT EXISTS episodic_memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        soul_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        cue TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL DEFAULT '',
        predicate TEXT NOT NULL DEFAULT '',
        value REAL,
        source_event_id TEXT,
        occurred_at INTEGER NOT NULL,
        UNIQUE (soul_id, kind, source_event_id)
      );
      CREATE INDEX IF NOT EXISTS episodic_memories_soul_time_idx
        ON episodic_memories(soul_id, occurred_at DESC);
      CREATE TABLE IF NOT EXISTS learned_associations (
        soul_id TEXT NOT NULL,
        cue TEXT NOT NULL,
        subject TEXT NOT NULL,
        predicate TEXT NOT NULL,
        weight REAL NOT NULL,
        evidence_count INTEGER NOT NULL,
        value_sum REAL NOT NULL,
        last_reinforced_at INTEGER NOT NULL,
        PRIMARY KEY (soul_id, cue, subject, predicate)
      );
      CREATE TABLE IF NOT EXISTS learned_evidence (
        soul_id TEXT NOT NULL,
        cue TEXT NOT NULL,
        perception_event_id TEXT NOT NULL,
        PRIMARY KEY (soul_id, cue, perception_event_id)
      );
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    this.findStatement = this.db.prepare(`
      SELECT word, pos, language_code AS languageCode, etymology,
             senses_json AS sensesJson, forms_json AS formsJson, source_url AS sourceUrl
      FROM entries WHERE normalized = ? AND language_code = ? ORDER BY pos, id LIMIT ?
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
    this.foundational = new FoundationalLanguage(this.db);
  }

  normalize(word) { return normalizeWord(word, this.languageCode); }

  find(word, limit = 12) {
    const normalized = this.normalize(word);
    return this.findStatement.all(normalized, this.languageCode, Math.max(1, Math.min(Number(limit) || 12, 50))).map((row) => ({
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
    this.db.prepare(`INSERT OR IGNORE INTO episodic_memories
      (soul_id, kind, subject, predicate, value, source_event_id, occurred_at)
      VALUES (?, 'perception', ?, ?, ?, ?, ?)`)
      .run(event.soulId, event.subject, event.predicate, event.value.data, event.id, event.timestamp);
    return true;
  }

  encounter(soulId, text, { timestamp = Date.now() * 1000, groundingWindowMs = 30_000 } = {}) {
    const encounteredAt = new Date().toISOString();
    const results = [];
    const recent = this.db.prepare(`
      SELECT event_id AS eventId, subject, predicate, value, perceived_at AS perceivedAt
      FROM perceptions WHERE soul_id = ? AND perceived_at BETWEEN ? AND ?
      ORDER BY perceived_at DESC LIMIT 8
    `).all(soulId, timestamp - groundingWindowMs * 1000, timestamp);
    this.db.exec("BEGIN");
    try {
      for (const word of wordsIn(text, this.languageCode).slice(0, 64)) {
        const entries = this.find(word);
        if (!entries.length) continue;
        this.exposeStatement.run(soulId, word, encounteredAt);
        for (const perception of recent) {
          const evidence = this.db.prepare(`INSERT OR IGNORE INTO learned_evidence
            (soul_id, cue, perception_event_id) VALUES (?, ?, ?)`)
            .run(soulId, word, perception.eventId);
          if (!evidence.changes) continue;
          this.groundStatement.run(soulId, word, perception.subject, perception.predicate, perception.value, perception.value, perception.value, encounteredAt);
          this.reinforceAssociation(soulId, word, perception, timestamp);
        }
        this.db.prepare(`INSERT INTO episodic_memories
          (soul_id, kind, cue, occurred_at) VALUES (?, 'lexical', ?, ?)`)
          .run(soulId, word, timestamp);
        results.push({ word, entries, groundedIn: recent });
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return results;
  }

  associationWeight(row, asOf = Date.now() * 1000, halfLifeDays = 14) {
    const elapsedDays = Math.max(0, asOf - row.lastReinforcedAt) / 86_400_000_000;
    return Math.max(0, Math.min(1, row.weight * (0.5 ** (elapsedDays / halfLifeDays))));
  }

  reinforceAssociation(soulId, cue, perception, timestamp, learningRate = 0.28) {
    const current = this.db.prepare(`SELECT weight, evidence_count AS evidenceCount,
      value_sum AS valueSum, last_reinforced_at AS lastReinforcedAt
      FROM learned_associations WHERE soul_id = ? AND cue = ? AND subject = ? AND predicate = ?`)
      .get(soulId, cue, perception.subject, perception.predicate);
    const decayed = current ? this.associationWeight(current, timestamp) : 0;
    const salience = 0.25 + 0.75 * Math.min(1, Math.abs(perception.value));
    const weight = decayed + learningRate * salience * (1 - decayed);
    this.db.prepare(`INSERT INTO learned_associations
      (soul_id, cue, subject, predicate, weight, evidence_count, value_sum, last_reinforced_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT (soul_id, cue, subject, predicate) DO UPDATE SET
        weight = excluded.weight,
        evidence_count = evidence_count + 1,
        value_sum = value_sum + excluded.value_sum,
        last_reinforced_at = excluded.last_reinforced_at`)
      .run(soulId, cue, perception.subject, perception.predicate, weight, perception.value, timestamp);
    return weight;
  }

  learnedAssociations(soulId, { cue, limit = 50, asOf = Date.now() * 1000 } = {}) {
    const rows = cue
      ? this.db.prepare(`SELECT cue, subject, predicate, weight, evidence_count AS evidenceCount,
          value_sum AS valueSum, last_reinforced_at AS lastReinforcedAt
          FROM learned_associations WHERE soul_id = ? AND cue = ?`).all(soulId, normalizeWord(cue))
      : this.db.prepare(`SELECT cue, subject, predicate, weight, evidence_count AS evidenceCount,
          value_sum AS valueSum, last_reinforced_at AS lastReinforcedAt
          FROM learned_associations WHERE soul_id = ?`).all(soulId);
    return rows.map((row) => ({
      cue: row.cue,
      subject: row.subject,
      predicate: row.predicate,
      weight: this.associationWeight(row, asOf),
      evidenceCount: Number(row.evidenceCount),
      meanValue: row.valueSum / row.evidenceCount,
      lastReinforcedAt: Number(row.lastReinforcedAt),
    })).sort((a, b) => b.weight - a.weight || b.evidenceCount - a.evidenceCount).slice(0, Math.max(1, Math.min(Number(limit) || 50, 200)));
  }

  episodes(soulId, limit = 50) {
    return this.db.prepare(`SELECT id, kind, cue, subject, predicate, value,
      source_event_id AS sourceEventId, occurred_at AS occurredAt
      FROM episodic_memories WHERE soul_id = ? ORDER BY occurred_at DESC, id DESC LIMIT ?`)
      .all(soulId, Math.max(1, Math.min(Number(limit) || 50, 200)));
  }

  recognize(soulId, cue, perception, { asOf = Date.now() * 1000, threshold = 0.45 } = {}) {
    const association = this.learnedAssociations(soulId, { cue, asOf, limit: 200 })
      .find((item) => item.subject === perception.subject && item.predicate === perception.predicate);
    if (!association) return { recognized: false, confidence: 0, evidenceCount: 0, association: null };
    const similarity = Math.max(0, 1 - Math.abs(association.meanValue - Number(perception.value)));
    const confidence = association.weight * similarity;
    return {
      recognized: association.evidenceCount >= 2 && confidence >= threshold,
      confidence,
      evidenceCount: association.evidenceCount,
      association,
    };
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
    const episodes = this.db.prepare("SELECT COUNT(*) AS count FROM episodic_memories WHERE soul_id = ?").get(soulId);
    const plastic = this.db.prepare("SELECT COUNT(*) AS count FROM learned_associations WHERE soul_id = ?").get(soulId);
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
      episodicMemories: Number(episodes.count),
      plasticAssociations: Number(plastic.count),
      strongestAssociations: this.learnedAssociations(soulId, { limit: 12 }),
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
