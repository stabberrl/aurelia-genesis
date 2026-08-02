import assert from "node:assert/strict";
import test from "node:test";
import { GenesisWorld } from "../src/world/genesis-world.mjs";
import { PlanExecutor } from "../src/planning/plan-executor.mjs";

function fixture() {
  const world = new GenesisWorld();
  const runtime = { world, paused: true, async act(soulId, action) { return world.act(soulId, action); } };
  const source = world.state.objects.find(({ role }) => role === "energy-source");
  const body = world.body("soul-001-alba-0001");
  return { world, runtime, source, body, executor: new PlanExecutor({ worldRuntime: runtime }) };
}

test("el ejecutor cancela un plan si el mundo cambió desde la propuesta", async () => {
  const { world, source, body, executor } = fixture();
  const proposal = { permitted: true, execution: "proposal-only", targetObjectId: source.id, worldRevision: world.state.worldRevision - 1, pose: { x: body.x, y: body.y, direction: body.direction } };
  const result = await executor.execute({ soulId: body.id, proposal, plan: { embodiedActions: ["moveForward"] } });
  assert.equal(result.status, "plan-cancelled");
  assert.equal(result.reason, "world-revision-changed");
  assert.equal(world.state.events.length, 0);
});

test("el ejecutor exige mundo pausado y comprueba cada acción", async () => {
  const { runtime, source, body, executor } = fixture();
  runtime.paused = false;
  const proposal = { permitted: true, execution: "proposal-only", targetObjectId: source.id, worldRevision: runtime.world.state.worldRevision, pose: { x: body.x, y: body.y, direction: body.direction } };
  const result = await executor.execute({ soulId: body.id, proposal, plan: { embodiedActions: ["moveForward"] } });
  assert.equal(result.status, "plan-blocked");
  assert.equal(result.reason, "world-must-be-paused");
});

test("el ejecutor completa una propuesta aprobada en un mundo detenido", async () => {
  const { runtime, source, body, executor } = fixture();
  source.x = body.x + 1;
  source.y = body.y;
  const proposal = { permitted: true, execution: "proposal-only", targetObjectId: source.id, worldRevision: runtime.world.state.worldRevision, pose: { x: body.x, y: body.y, direction: body.direction } };
  const result = await executor.execute({ soulId: body.id, proposal, plan: { embodiedActions: ["moveForward", "consume"] } });
  assert.equal(result.status, "plan-executed");
  assert.deepEqual(result.executed.map(({ action }) => action), ["moveForward", "consume"]);
  assert.equal(runtime.world.state.events[0].action, "consume");
});
