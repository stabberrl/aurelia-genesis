import assert from "node:assert/strict";
import test from "node:test";
import { GenesisWorld } from "../src/world/genesis-world.mjs";

test("la misma semilla produce la misma habitación y estado inicial", () => {
  const first = new GenesisWorld({ seed: "same" });
  const second = new GenesisWorld({ seed: "same" });
  assert.deepEqual(first.serialize(), second.serialize());
});

test("el cuerpo sólo percibe objetos dentro de alcance y frente a él", () => {
  const world = new GenesisWorld({ seed: "perception" });
  const body = world.body("soul-001-alba-0001");
  body.x = 1;
  body.y = 1;
  body.direction = 3;
  assert.equal(world.visibleObjects(body.id).length, 0);
  body.direction = 1;
  world.state.objects[0].x = 3;
  world.state.objects[0].y = 1;
  assert.ok(world.visibleObjects(body.id).some(({ id }) => id === "object-a"));
});

test("moverse respeta obstáculos y consume energía", () => {
  const world = new GenesisWorld();
  const body = world.body("soul-001-alba-0001");
  body.x = 3;
  body.y = 3;
  body.direction = 1;
  const before = body.energy;
  const result = world.act(body.id, "moveForward");
  assert.equal(result.event.outcome, "blocked");
  assert.equal(body.x, 3);
  assert.ok(body.energy < before);
});

test("la energía sólo aumenta al consumir cerca de la fuente", () => {
  const world = new GenesisWorld();
  const body = world.body("soul-001-alba-0001");
  const source = world.state.objects.find(({ role }) => role === "energy-source");
  body.x = source.x - 1;
  body.y = source.y;
  const before = body.energy;
  const result = world.act(body.id, "consume");
  assert.equal(result.event.outcome, "accepted");
  assert.ok(body.energy > before);
  assert.ok(result.event.reward > 0);
});

test("serializar y restaurar conserva el futuro observable", () => {
  const original = new GenesisWorld();
  original.act("soul-001-alba-0001", "turnRight");
  const restored = GenesisWorld.fromSerialized(original.serialize());
  assert.deepEqual(restored.summary(), original.summary());
  assert.deepEqual(restored.act("soul-001-alba-0001", "wait"), original.act("soul-001-alba-0001", "wait"));
});

test("la expansión v2 conserva el mundo y habilita un cuerpo descubierto", () => {
  const world = new GenesisWorld({ seed: "v2" });
  assert.equal(world.expandToV2(), true);
  assert.equal(world.expandToV2(), false);
  assert.equal(world.width, 17);
  assert.equal(world.height, 13);
  const body = world.body("soul-001-alba-0001");
  const shell = world.state.objects.find(({ role }) => role === "body-shell");
  body.x = shell.x;
  body.y = shell.y;
  const result = world.act(body.id, "touch");
  assert.equal(result.event.details.bodyUpgrade.form, "explorer-v2");
  assert.ok(body.capabilities.includes("signal"));
});

test("un cuerpo heredado sin capacidades puede activar body-shell-v2", () => {
  const original = new GenesisWorld({ seed: "legacy-body-shell" });
  original.expandToV2();

  const legacy = original.serialize();
  const legacyBody = legacy.state.bodies["soul-001-alba-0001"];
  delete legacyBody.capabilities;
  delete legacyBody.form;
  delete legacyBody.panelSignals;

  const restored = GenesisWorld.fromSerialized(legacy);
  const body = restored.body("soul-001-alba-0001");
  const shell = restored.state.objects.find(({ role }) => role === "body-shell");
  body.x = shell.x;
  body.y = shell.y;

  assert.doesNotThrow(() => restored.act(body.id, "touch"));
  assert.equal(body.form, "explorer-v2");
  assert.ok(body.capabilities.includes("grip"));
  assert.ok(body.capabilities.includes("signal"));
});

test("el panel sólo responde a una señal después de descubrir el cuerpo v2", () => {
  const world = new GenesisWorld({ seed: "panel" });
  world.expandToV2();
  const body = world.body("soul-001-alba-0001");
  const panel = world.state.objects.find(({ role }) => role === "communication-panel");
  body.x = panel.x;
  body.y = panel.y;
  assert.equal(world.act(body.id, "signal").event.outcome, "unavailable");
  const shell = world.state.objects.find(({ role }) => role === "body-shell");
  body.x = shell.x;
  body.y = shell.y;
  world.act(body.id, "touch");
  body.x = panel.x;
  body.y = panel.y;
  assert.equal(world.act(body.id, "signal").event.details.panelSignal.symbol, "pulse");
});
