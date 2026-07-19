export class CognitiveHeartbeat {
  constructor(lexicon, { intervalMs = 60_000 } = {}) {
    this.lexicon = lexicon;
    this.intervalMs = Math.max(5_000, Number(intervalMs) || 60_000);
    this.timer = null;
  }

  tick(soulId, timestamp = Date.now() * 1000) {
    const before = this.lexicon.development(soulId);
    const strongest = before.strongestAssociations[0];
    const operations = [];
    for (const association of before.strongestAssociations.filter(({ evidenceCount }) => evidenceCount >= 3)) {
      this.lexicon.db.prepare(`INSERT INTO consolidated_patterns
        (soul_id, cue, predicate, strength, evidence_count, consolidated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (soul_id, cue, predicate) DO UPDATE SET
          strength = excluded.strength, evidence_count = excluded.evidence_count,
          consolidated_at = excluded.consolidated_at`)
        .run(soulId, association.cue, association.predicate, association.weight, association.evidenceCount, timestamp);
      operations.push({ type: "consolidate", cue: association.cue, predicate: association.predicate, evidenceCount: association.evidenceCount });
    }
    let proposal;
    if (before.sensoryChannels < 4) proposal = { type: "requestObservation", reason: "sensoryDiversity" };
    else if (!strongest) proposal = { type: "requestExperience", reason: "noGroundedAssociations" };
    else if (strongest.evidenceCount < 3) proposal = { type: "seekRepetition", cue: strongest.cue, predicate: strongest.predicate };
    else proposal = { type: "internalRest", reason: "consolidationComplete" };
    const { type: proposedAction, ...proposalDetails } = proposal;
    operations.push({ type: "proposal", action: proposedAction, ...proposalDetails, execution: "proposal-only" });
    const sequence = Number(this.lexicon.db.prepare("SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM cognitive_heartbeats WHERE soul_id = ?").get(soulId).next);
    this.lexicon.db.prepare(`INSERT INTO cognitive_heartbeats
      (soul_id, sequence, occurred_at, phase_id, operations_json)
      VALUES (?, ?, ?, ?, ?)`)
      .run(soulId, sequence, timestamp, before.developmentAssessment.phase.id, JSON.stringify(operations));
    return { soulId, sequence, occurredAt: timestamp, phase: before.developmentAssessment.phase, operations };
  }

  status(soulId, limit = 12) {
    const rows = this.lexicon.db.prepare(`SELECT sequence, occurred_at AS occurredAt,
      phase_id AS phaseId, operations_json AS operationsJson
      FROM cognitive_heartbeats WHERE soul_id = ? ORDER BY sequence DESC LIMIT ?`)
      .all(soulId, Math.max(1, Math.min(Number(limit) || 12, 100)));
    return rows.map(({ operationsJson, ...row }) => ({ ...row, operations: JSON.parse(operationsJson) }));
  }

  start(soulIds) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      for (const soulId of soulIds) {
        try { this.tick(soulId); } catch (error) { console.error(`[heartbeat] ${soulId}:`, error); }
      }
    }, this.intervalMs);
    this.timer.unref?.();
  }

  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
}
