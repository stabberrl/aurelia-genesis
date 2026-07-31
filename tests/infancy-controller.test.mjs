import assert from "node:assert/strict";
import test from "node:test";
import { GenesisWorld } from "../src/world/genesis-world.mjs";
import { EmbodiedInfancyController } from "../src/world/infancy-controller.mjs";

function fixture(seed = "infancy-test") {
  const world = new GenesisWorld({ seed });
  const runtime = {
    world,
    control() {},
    async act(soulId, action) { return world.act(soulId, action); },
  };
  return { world, controller: new EmbodiedInfancyController({ worldRuntime: runtime }) };
}

test("el controlador comienza sin conocer la función de los objetos", () => {
  const { controller } = fixture();
  assert.deepEqual(controller.state.learnedObjects, {});
  assert.equal(controller.state.successfulEnergyDiscoveries, 0);
});

test("explora, aprende obstáculos y clasifica la fuente por consecuencia", async () => {
  const { controller } = fixture();
  for (let index = 0; index < 500; index += 1) await controller.step();
  const records = Object.values(controller.state.learnedObjects);
  assert.ok(controller.state.blockedCells.length >= 1);
  assert.ok(records.some(({ classification }) => classification === "energy-source"));
  assert.equal(controller.state.successfulEnergyDiscoveries, 1);
});

test("reutiliza el recurso aprendido cuando disminuye su energía", async () => {
  const { world, controller } = fixture("retention");
  for (let index = 0; index < 500 && controller.state.successfulEnergyDiscoveries === 0; index += 1) await controller.step();
  const body = world.body(controller.soulId);
  body.energy = 0.2;
  let reused = false;
  for (let index = 0; index < 120; index += 1) {
    const result = await controller.step();
    if (result.decision.reason === "workspace:restore-energy" && result.decision.reward > 0.05) { reused = true; break; }
  }
  assert.equal(reused, true);
  assert.ok(body.energy > 0.2);
});

test("una copia restaurada conserva mapa, conocimiento y próxima decisión", async () => {
  const { world, controller } = fixture("restore-controller");
  for (let index = 0; index < 40; index += 1) await controller.step();
  const clonedWorld = GenesisWorld.fromSerialized(world.serialize());
  const cloneRuntime = { world: clonedWorld, control() {}, async act(soulId, action) { return clonedWorld.act(soulId, action); } };
  const clone = new EmbodiedInfancyController({ worldRuntime: cloneRuntime });
  clone.state = structuredClone(controller.state);
  assert.deepEqual(await clone.step(), await controller.step());
});

test("el núcleo primitivo conserva episodios y aprende predicciones de acción", async () => {
  const { controller } = fixture("primitive-cognition");
  for (let index = 0; index < 60; index += 1) await controller.step();
  const cognition = controller.state.cognition;
  assert.ok(cognition.episodes.length > 0);
  assert.ok(cognition.totalPredictions >= 60);
  assert.ok(Object.keys(cognition.transitionModel).length > 0);
  assert.ok(Number.isFinite(cognition.meanPredictionError));
  assert.ok(cognition.episodes.every((episode) => Number.isFinite(episode.surprise)
    && episode.surprise >= 0 && episode.surprise <= 1));
  assert.ok(Object.values(cognition.drives).every((drive) => drive >= 0 && drive <= 1));
});

test("el espacio de trabajo selecciona y difunde un foco antes de actuar", async () => {
  const { controller } = fixture("global-workspace");
  await controller.step();
  const workspace = controller.state.workspace;
  assert.equal(workspace.cycleCount, 1);
  assert.ok(workspace.focus);
  assert.ok(workspace.candidates.length >= 3);
  assert.deepEqual(workspace.broadcasts[0].channels, ["memory", "prediction", "action-selection"]);
  assert.equal(workspace.lastOutcome.tick, 1);
});

test("un cambio de mundo reactiva exploración sin revelar la ubicación del nuevo objeto", async () => {
  const { world, controller } = fixture("environment-change");
  controller.state.visitedCells = Array.from({ length: world.width * world.height }, (_, index) => `${index % world.width},${Math.floor(index / world.width)}`);
  world.addKnowledgeFragments({ sourceUrl: "https://example.org", sourceName: "example.org", sourceTitle: "Prueba", language: "es", contentHash: "abcdefghijklmnop", fragments: ["Fragmento de prueba suficientemente largo para el entorno."] });
  const result = await controller.step();
  assert.notEqual(result.decision.reason, "environment-mapped");
  assert.equal(controller.state.knownWorldRevision, world.state.worldRevision);
});

test("un fragmento tocado conserva su clasificación informacional tras una prueba física", async () => {
  const { world, controller } = fixture("informational-fragment");
  const [artifact] = world.addKnowledgeFragments({ sourceUrl: "https://example.org", sourceName: "example.org", sourceTitle: "Prueba", language: "es", contentHash: "qrstuvwxyzabcdef", fragments: ["Fragmento informacional suficientemente largo para ser descubierto."] });
  const body = world.body(controller.soulId);
  body.x = artifact.x;
  body.y = artifact.y;
  await controller.step();
  await controller.step();
  assert.equal(controller.state.learnedObjects[artifact.id].classification, "informational");
});
