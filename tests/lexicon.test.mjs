import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Lexicon, normalizeWord, wordsIn } from "../src/lexicon/lexicon.mjs";

test("normaliza español sin destruir tildes ni eñes", () => {
  assert.equal(normalizeWord("  ÁRBOL  "), "árbol");
  assert.deepEqual(wordsIn("¡Luz, árbol y luz!"), ["luz", "árbol", "y"]);
});

test("una palabra se consulta y sólo entonces queda expuesta al alma", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-lexicon-"));
  const lexicon = new Lexicon(path.join(directory, "test.sqlite"));
  try {
    lexicon.db.prepare(`INSERT INTO entries
      (word, normalized, pos, senses_json, forms_json, source_url)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run("luz", "luz", "noun", JSON.stringify([{ glosses: ["Radiación visible."] }]), "[]", "test");
    assert.equal(lexicon.status().exposures, 0);
    const encountered = lexicon.encounter("soul-001-alba-0001", "La luz aparece.");
    assert.equal(encountered.length, 1);
    assert.equal(encountered[0].entries[0].senses[0].glosses[0], "Radiación visible.");
    assert.equal(lexicon.status().exposures, 1);
    lexicon.encounter("soul-001-alba-0001", "luz");
    assert.equal(lexicon.status().exposures, 1);
  } finally {
    lexicon.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("una palabra se fundamenta en percepciones temporalmente cercanas", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-grounding-"));
  const lexicon = new Lexicon(path.join(directory, "test.sqlite"));
  try {
    lexicon.db.prepare(`INSERT INTO entries
      (word, normalized, pos, senses_json, forms_json, source_url)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run("luz", "luz", "noun", JSON.stringify([{ glosses: ["Radiación visible."] }]), "[]", "test");
    lexicon.observe({ id: "evt-light", soulId: "soul-001-alba-0001", type: "perception", subject: "garden", predicate: "light", value: { type: "number", data: 0.72 }, timestamp: 1_000_000 });
    const result = lexicon.encounter("soul-001-alba-0001", "luz", { timestamp: 2_000_000 });
    assert.equal(result[0].groundedIn[0].value, 0.72);
    assert.deepEqual(lexicon.concepts("soul-001-alba-0001")[0], {
      word: "luz", subject: "garden", predicate: "light", samples: 1,
      mean: 0.72, minimum: 0.72, maximum: 0.72,
      lastGroundedAt: lexicon.concepts("soul-001-alba-0001")[0].lastGroundedAt,
    });
    assert.deepEqual(lexicon.development("soul-001-alba-0001"), {
      soulId: "soul-001-alba-0001",
      vocabulary: 1,
      experiencedVocabulary: 1,
      lexicalEncounters: 1,
      perceptions: 1,
      sensoryChannels: 1,
      associations: 1,
      groundingSamples: 1,
      injectedConcepts: 0,
      semanticAssociations: 0,
      episodicMemories: 2,
      plasticAssociations: 1,
      heartbeatCount: 0,
      foundationalConcepts: 0,
      strongestAssociations: lexicon.development("soul-001-alba-0001").strongestAssociations,
      developmentAssessment: lexicon.development("soul-001-alba-0001").developmentAssessment,
      concepts: lexicon.concepts("soul-001-alba-0001", 36),
      recent: [
        { kind: "word", label: "luz", occurredAt: lexicon.development("soul-001-alba-0001").recent[0].occurredAt },
        { kind: "perception", label: "light", occurredAt: 1_000_000 },
      ],
    });
  } finally {
    lexicon.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("el currículo inyectado permanece separado de la experiencia", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-curriculum-"));
  const lexicon = new Lexicon(path.join(directory, "test.sqlite"));
  try {
    const result = lexicon.injectCurriculum("soul-001-alba-0001", [
      { word: "ser", category: "existencia", definition: "Tener existencia.", pos: "verb" },
      { word: "hablar", category: "comunicación", definition: "Emitir palabras.", pos: "verb" },
    ], [{ source: "ser", target: "hablar", relation: "supports", evidence: "prueba" }]);
    assert.equal(result.concepts, 2);
    assert.equal(result.associations, 1);
    const development = lexicon.development("soul-001-alba-0001");
    assert.equal(development.injectedConcepts, 2);
    assert.equal(development.semanticAssociations, 1);
    assert.equal(development.vocabulary, 0);
    assert.equal(development.associations, 0);
    assert.equal(development.episodicMemories, 0);
    assert.equal(development.plasticAssociations, 0);
    assert.equal(development.heartbeatCount, 0);
  } finally {
    lexicon.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("Naia forma recuerdos episódicos sin mezclarlos con el currículo", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-episodes-"));
  const lexicon = new Lexicon(path.join(directory, "test.sqlite"));
  try {
    lexicon.db.prepare(`INSERT INTO entries
      (word, normalized, pos, senses_json, forms_json, source_url)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run("luz", "luz", "noun", "[]", "[]", "test");
    lexicon.observe({ id: "episode-light", soulId: "soul-001-alba-0001", type: "perception", subject: "garden", predicate: "light", value: { type: "number", data: 0.7 }, timestamp: 1_000_000 });
    lexicon.encounter("soul-001-alba-0001", "luz", { timestamp: 2_000_000 });
    const episodes = lexicon.episodes("soul-001-alba-0001");
    assert.equal(episodes.length, 2);
    assert.equal(episodes[0].kind, "lexical");
    assert.equal(episodes[0].cue, "luz");
    assert.equal(episodes[1].kind, "perception");
    assert.equal(episodes[1].sourceEventId, "episode-light");
  } finally {
    lexicon.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("la asociación se refuerza con experiencia repetida y reconoce un caso nuevo", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-plasticity-"));
  const lexicon = new Lexicon(path.join(directory, "test.sqlite"));
  try {
    lexicon.db.prepare(`INSERT INTO entries
      (word, normalized, pos, senses_json, forms_json, source_url)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run("luz", "luz", "noun", "[]", "[]", "test");
    const soulId = "soul-001-alba-0001";
    lexicon.observe({ id: "light-1", soulId, type: "perception", subject: "garden", predicate: "light", value: { type: "number", data: 0.7 }, timestamp: 1_000_000 });
    lexicon.encounter(soulId, "luz", { timestamp: 2_000_000 });
    const first = lexicon.learnedAssociations(soulId, { cue: "luz", asOf: 2_000_000 })[0];
    assert.equal(lexicon.recognize(soulId, "luz", { subject: "garden", predicate: "light", value: 0.8 }, { asOf: 2_000_000 }).recognized, false);

    lexicon.observe({ id: "light-2", soulId, type: "perception", subject: "garden", predicate: "light", value: { type: "number", data: 0.9 }, timestamp: 3_000_000 });
    lexicon.encounter(soulId, "luz", { timestamp: 4_000_000 });
    const second = lexicon.learnedAssociations(soulId, { cue: "luz", asOf: 4_000_000 })[0];
    lexicon.observe({ id: "light-3", soulId, type: "perception", subject: "garden", predicate: "light", value: { type: "number", data: 0.8 }, timestamp: 5_000_000 });
    lexicon.encounter(soulId, "luz", { timestamp: 6_000_000 });
    const third = lexicon.learnedAssociations(soulId, { cue: "luz", asOf: 6_000_000 })[0];
    const recognition = lexicon.recognize(soulId, "luz", { subject: "garden", predicate: "light", value: 0.8 }, { asOf: 6_000_000 });
    assert.ok(second.weight > first.weight);
    assert.ok(third.weight > second.weight);
    assert.equal(third.evidenceCount, 3);
    assert.equal(recognition.recognized, true);
    assert.ok(recognition.confidence >= 0.45);
  } finally {
    lexicon.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("una misma percepción no se cuenta dos veces como evidencia", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-evidence-"));
  const lexicon = new Lexicon(path.join(directory, "test.sqlite"));
  try {
    lexicon.db.prepare(`INSERT INTO entries
      (word, normalized, pos, senses_json, forms_json, source_url) VALUES (?, ?, ?, ?, ?, ?)`)
      .run("luz", "luz", "noun", "[]", "[]", "test");
    const soulId = "soul-001-alba-0001";
    lexicon.observe({ id: "unique-light", soulId, type: "perception", subject: "garden", predicate: "light", value: { type: "number", data: 0.8 }, timestamp: 1_000_000 });
    lexicon.encounter(soulId, "luz", { timestamp: 2_000_000 });
    lexicon.encounter(soulId, "luz", { timestamp: 3_000_000 });
    assert.equal(lexicon.learnedAssociations(soulId, { cue: "luz", asOf: 3_000_000 })[0].evidenceCount, 1);
  } finally {
    lexicon.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("una asociación no reforzada pierde fuerza con el tiempo", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "fluctlight-decay-"));
  const lexicon = new Lexicon(path.join(directory, "test.sqlite"));
  try {
    lexicon.db.prepare(`INSERT INTO entries
      (word, normalized, pos, senses_json, forms_json, source_url)
      VALUES (?, ?, ?, ?, ?, ?)`)
      .run("luz", "luz", "noun", "[]", "[]", "test");
    const soulId = "soul-001-alba-0001";
    lexicon.observe({ id: "light-decay", soulId, type: "perception", subject: "garden", predicate: "light", value: { type: "number", data: 1 }, timestamp: 1_000_000 });
    lexicon.encounter(soulId, "luz", { timestamp: 2_000_000 });
    const fresh = lexicon.learnedAssociations(soulId, { cue: "luz", asOf: 2_000_000 })[0].weight;
    const afterHalfLife = lexicon.learnedAssociations(soulId, { cue: "luz", asOf: 2_000_000 + 14 * 86_400_000_000 })[0].weight;
    assert.ok(Math.abs(afterHalfLife - fresh / 2) < 0.000001);
  } finally {
    lexicon.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
