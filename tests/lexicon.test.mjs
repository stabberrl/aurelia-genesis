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
  } finally {
    lexicon.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
