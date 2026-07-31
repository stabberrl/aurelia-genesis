import assert from "node:assert/strict";
import test from "node:test";
import { KnowledgeChamber } from "../src/learning/knowledge-chamber.mjs";
import { GenesisWorld } from "../src/world/genesis-world.mjs";

test("la cámara fragmenta una fuente y la distribuye sin exponerla al léxico", async () => {
  const world = new GenesisWorld({ seed: "knowledge-chamber" });
  const observations = [];
  const chamber = new KnowledgeChamber({
    worldRuntime: { world },
    lexiconFor: () => ({ recordExternalObservation: (_soul, observation) => { observations.push(observation); return { recorded: true }; } }),
    fetchFn: async () => new Response("<html><title>Prueba</title><p>La primera observación describe un mundo pequeño. La segunda observación mantiene suficiente contenido para formar fragmentos verificables.</p></html>", { headers: { "content-type": "text/html" } }),
    translationUrl: null,
  });
  const staged = await chamber.ingest({ soulId: "soul-001-alba-0001", url: "https://example.org/test", sourceLanguage: "es", targetLanguage: "es" });
  assert.equal(staged.status, "staged");
  assert.ok(staged.fragments.length > 0);
  assert.equal(observations.length, 1);
  assert.equal(world.state.objects.some((object) => object.role === "knowledge-fragment"), true);
});

test("un fragmento sólo revela texto después de tocarlo", () => {
  const world = new GenesisWorld({ seed: "knowledge-touch" });
  const [artifact] = world.addKnowledgeFragments({ sourceUrl: "https://example.org", sourceName: "example.org", sourceTitle: "Prueba", language: "es", contentHash: "1234567890abcdef", fragments: ["Una pieza de conocimiento suficientemente larga para ser descubierta."] });
  const body = world.body("soul-001-alba-0001");
  body.x = artifact.x;
  body.y = artifact.y;
  assert.equal(world.perceptions(body.id).visibleObjects.some((object) => Object.hasOwn(object, "text")), false);
  const result = world.act(body.id, "touch");
  assert.match(result.event.details.knowledgeFragment.text, /conocimiento/);
});
