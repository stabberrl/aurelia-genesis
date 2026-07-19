const ACTORS = new Set(["self", "other"]);
const POLARITIES = new Set(["affirmed", "denied"]);
const DIMENSIONS = { agency: ACTORS, polarity: POLARITIES };

function required(value, allowed, name) {
  if (!allowed.has(value)) throw new TypeError(`${name} no es válido: ${value}.`);
  return value;
}

export class FoundationalLanguage {
  constructor(db) {
    this.db = db;
    db.exec(`
      CREATE TABLE IF NOT EXISTS contextual_episodes (
        id TEXT PRIMARY KEY,
        soul_id TEXT NOT NULL,
        language_code TEXT NOT NULL,
        actor TEXT NOT NULL,
        polarity TEXT NOT NULL,
        occurred_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS contextual_associations (
        soul_id TEXT NOT NULL,
        language_code TEXT NOT NULL,
        cue TEXT NOT NULL,
        dimension TEXT NOT NULL,
        feature TEXT NOT NULL,
        weight REAL NOT NULL,
        evidence_count INTEGER NOT NULL,
        contradiction_count INTEGER NOT NULL DEFAULT 0,
        last_reinforced_at INTEGER NOT NULL,
        PRIMARY KEY (soul_id, language_code, cue, dimension, feature)
      );
      CREATE TABLE IF NOT EXISTS contextual_evidence (
        soul_id TEXT NOT NULL,
        language_code TEXT NOT NULL,
        cue TEXT NOT NULL,
        episode_id TEXT NOT NULL,
        dimension TEXT NOT NULL,
        PRIMARY KEY (soul_id, language_code, cue, episode_id, dimension)
      );
    `);
  }

  classifyAgency({ motorCommand, proprioceptiveChange, causalDelayMs }) {
    const temporalFit = Math.max(0, Math.min(1, 1 - Number(causalDelayMs) / 500));
    const score = Number(motorCommand) * 0.45 + Number(proprioceptiveChange) * 0.35 + temporalFit * 0.20;
    return { score, feature: score >= 0.65 ? "self" : score <= 0.35 ? "other" : null };
  }

  classifyAgreement({ expected, observed }) {
    const similarity = Math.max(0, 1 - Math.abs(Number(expected) - Number(observed)));
    return { score: similarity, feature: similarity >= 0.75 ? "affirmed" : similarity <= 0.25 ? "denied" : null };
  }

  recordTrial({ id, soulId, languageCode, cue, task, stimulus, occurredAt }) {
    const agency = task === "agency" ? this.classifyAgency(stimulus) : { feature: stimulus.actor };
    const agreement = task === "polarity" ? this.classifyAgreement(stimulus) : { feature: stimulus.polarity };
    const actor = agency.feature;
    const polarity = agreement.feature;
    if (!actor || !polarity) return { learned: false, abstained: true, agency, agreement };
    this.experience({ id, soulId, languageCode, actor, polarity, occurredAt });
    return { learned: true, abstained: false, agency, agreement, profile: this.associate(soulId, languageCode, cue, id) };
  }

  inferTrial(soulId, languageCode, task, stimulus) {
    const classification = task === "agency" ? this.classifyAgency(stimulus) : this.classifyAgreement(stimulus);
    if (!classification.feature) return { task, abstained: true, recognized: false, classification, best: null, ranked: [] };
    const dimension = task === "agency" ? "agency" : "polarity";
    return { task, abstained: false, classification, ...this.infer(soulId, languageCode, dimension, classification.feature) };
  }

  experience({ id, soulId, languageCode, actor, polarity, occurredAt }) {
    if (typeof id !== "string" || !id || typeof soulId !== "string" || !soulId) throw new TypeError("El episodio necesita identidad.");
    required(actor, ACTORS, "actor");
    required(polarity, POLARITIES, "polarity");
    this.db.prepare(`INSERT OR IGNORE INTO contextual_episodes
      (id, soul_id, language_code, actor, polarity, occurred_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, soulId, languageCode, actor, polarity, occurredAt);
    return { id, soulId, languageCode, actor, polarity, occurredAt };
  }

  associate(soulId, languageCode, cue, episodeId, { learningRate = 0.32 } = {}) {
    const episode = this.db.prepare(`SELECT actor, polarity, occurred_at AS occurredAt
      FROM contextual_episodes WHERE id = ? AND soul_id = ? AND language_code = ?`)
      .get(episodeId, soulId, languageCode);
    if (!episode) throw new Error("El episodio contextual no existe.");
    const normalizedCue = String(cue || "").normalize("NFC").trim().toLocaleLowerCase(languageCode);
    if (!normalizedCue) throw new TypeError("La palabra contextual está vacía.");
    const features = { agency: episode.actor, polarity: episode.polarity };
    this.db.exec("BEGIN");
    try {
      for (const [dimension, feature] of Object.entries(features)) {
        const evidence = this.db.prepare(`INSERT OR IGNORE INTO contextual_evidence
          (soul_id, language_code, cue, episode_id, dimension) VALUES (?, ?, ?, ?, ?)`)
          .run(soulId, languageCode, normalizedCue, episodeId, dimension);
        if (!evidence.changes) continue;
        const current = this.db.prepare(`SELECT weight FROM contextual_associations
          WHERE soul_id = ? AND language_code = ? AND cue = ? AND dimension = ? AND feature = ?`)
          .get(soulId, languageCode, normalizedCue, dimension, feature);
        const weight = (current?.weight || 0) + learningRate * (1 - (current?.weight || 0));
        this.db.prepare(`INSERT INTO contextual_associations
          (soul_id, language_code, cue, dimension, feature, weight, evidence_count, last_reinforced_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?)
          ON CONFLICT (soul_id, language_code, cue, dimension, feature) DO UPDATE SET
            weight = excluded.weight, evidence_count = evidence_count + 1,
            last_reinforced_at = excluded.last_reinforced_at`)
          .run(soulId, languageCode, normalizedCue, dimension, feature, weight, episode.occurredAt);
        this.db.prepare(`UPDATE contextual_associations SET
          weight = weight * 0.82, contradiction_count = contradiction_count + 1
          WHERE soul_id = ? AND language_code = ? AND cue = ? AND dimension = ? AND feature <> ?`)
          .run(soulId, languageCode, normalizedCue, dimension, feature);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return this.profile(soulId, languageCode, normalizedCue);
  }

  profile(soulId, languageCode, cue) {
    return this.db.prepare(`SELECT dimension, feature, weight,
      evidence_count AS evidenceCount, contradiction_count AS contradictionCount
      FROM contextual_associations WHERE soul_id = ? AND language_code = ? AND cue = ?
      ORDER BY dimension, weight DESC`).all(soulId, languageCode, cue);
  }

  infer(soulId, languageCode, dimension, feature) {
    required(feature, DIMENSIONS[dimension] || new Set(), "feature");
    const rows = this.db.prepare(`SELECT cue, feature, weight, evidence_count AS evidenceCount
      FROM contextual_associations WHERE soul_id = ? AND language_code = ? AND dimension = ?`)
      .all(soulId, languageCode, dimension);
    const grouped = new Map();
    for (const row of rows) {
      const item = grouped.get(row.cue) || { cue: row.cue, matching: 0, competing: 0, evidenceCount: 0 };
      if (row.feature === feature) {
        item.matching = row.weight;
        item.evidenceCount = row.evidenceCount;
      } else item.competing = Math.max(item.competing, row.weight);
      grouped.set(row.cue, item);
    }
    const ranked = [...grouped.values()].map((item) => ({
      cue: item.cue,
      confidence: Math.max(0, item.matching - item.competing * 0.5),
      evidenceCount: item.evidenceCount,
    })).sort((a, b) => b.confidence - a.confidence || b.evidenceCount - a.evidenceCount);
    const best = ranked[0] || null;
    return { dimension, feature, recognized: Boolean(best && best.evidenceCount >= 2 && best.confidence >= 0.45), best, ranked };
  }
}
