import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { LearningChamber } from "../src/learning/learning-chamber.mjs";
import { Lexicon } from "../src/lexicon/lexicon.mjs";

function fixtureResponse({ title = "existir", extract = "Tener realidad o presencia; encontrarse algo en el mundo." } = {}) {
  return { ok: true, status: 200, json: async () => ({ parse: { pageid: 1, title, wikitext: { "*": `== {{lengua|es}} ==\n;1: ${extract}` } } }) };
}

test("la cámara registra procedencia y mantiene observación separada de comprensión", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aurelia-chamber-"));
  const lexicon = new Lexicon(path.join(directory, "lexicon.sqlite"));
  lexicon.db.prepare(`INSERT INTO entries
    (word, normalized, pos, language_code, senses_json, source_url)
    VALUES ('existir', 'existir', 'verb', 'es', '[]', 'test://lexicon')`).run();
  const chamber = new LearningChamber(lexicon, { fetchFn: async () => fixtureResponse(), minimumIntervalMs: 10_000, terms: ["existir"] });
  const phaseBefore = lexicon.development("soul-test").developmentAssessment.score;
  const result = await chamber.tick("soul-test", { now: 1_000_000_000 });
  assert.equal(result.status, "accepted");
  const observations = lexicon.externalObservations("soul-test");
  assert.equal(observations.length, 1);
  assert.equal(observations[0].sourceName, "Wiktionary");
  assert.match(observations[0].sourceUrl, /^https:\/\/es\.wiktionary\.org\/wiki\//);
  assert.equal(lexicon.development("soul-test").externalObservations, 1);
  assert.equal(lexicon.concepts("soul-test").length, 0);
  assert.equal(lexicon.episodes("soul-test").length, 0);
  assert.equal(lexicon.development("soul-test").developmentAssessment.score, phaseBefore);
  lexicon.close();
  fs.rmSync(directory, { recursive: true, force: true });
});

test("la cámara limita el ritmo, deduplica y rechaza contenido insuficiente", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aurelia-chamber-"));
  const lexicon = new Lexicon(path.join(directory, "lexicon.sqlite"));
  let response = fixtureResponse();
  const chamber = new LearningChamber(lexicon, { fetchFn: async () => response, minimumIntervalMs: 10_000, terms: ["existir"] });
  await chamber.tick("soul-test", { now: 1_000_000_000 });
  assert.equal((await chamber.tick("soul-test", { now: 1_000_000_001 })).status, "rate-limited");
  const duplicate = await chamber.observe("soul-test", "existir", { now: 2_000_000_000 });
  assert.equal(duplicate.recorded, false);
  response = fixtureResponse({ title: "vacío", extract: "Breve" });
  const rejected = await chamber.observe("soul-test", "vacío", { now: 3_000_000_000 });
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.rejectionReason, "insufficient-content");
  lexicon.close();
  fs.rmSync(directory, { recursive: true, force: true });
});
