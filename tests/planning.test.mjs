import assert from "node:assert/strict";
import test from "node:test";
import { GenesisWorld } from "../src/world/genesis-world.mjs";
import { GlobalWorkspace } from "../src/world/global-workspace.mjs";
import { ExplorationBudget } from "../src/learning/exploration-budget.mjs";
import { translateWorldToPddl } from "../src/planning/pddl-translator.mjs";
import { parsePddlPlan, toEmbodiedActions } from "../src/planning/planner-bridge.mjs";
import { PlanningCoordinator } from "../src/planning/planning-coordinator.mjs";

test("el traductor PDDL representa el estado explícito, obstáculos y objetivo activo", () => {
  const world = new GenesisWorld();
  const source = world.state.objects.find(({ role }) => role === "energy-source");
  const translation = translateWorldToPddl(world, { targetObjectId: source.id, completion: "consume" });
  assert.match(translation.problem, /\(at c2-4\)/);
  assert.match(translation.problem, /\(consume-target c8-4\)/);
  assert.match(translation.problem, /\(blocked c5-4\)/);
  assert.match(translation.problem, /\(adjacent c2-4 c2-3\)/);
  assert.equal(translation.metadata.targetObjectId, source.id);
});

test("el puente sólo acepta pasos PDDL permitidos y los traduce al cuerpo", () => {
  const steps = parsePddlPlan("(move c2-4 c2-3)\n(move c2-3 c3-3)\n(consume c3-3)\n");
  assert.deepEqual(toEmbodiedActions(steps, { x: 1, y: 3, direction: 1 }), ["turnLeft", "moveForward", "turnRight", "moveForward", "consume"]);
  assert.throws(() => parsePddlPlan("(erase c2-4)"), /no autorizada/i);
});

test("una propuesta de plan sin presupuesto nunca se ejecuta", async () => {
  const world = new GenesisWorld();
  const source = world.state.objects.find(({ role }) => role === "energy-source");
  const workspace = new GlobalWorkspace();
  let invoked = 0;
  const planner = { async plan() { invoked += 1; return { pddlSteps: [], embodiedActions: ["moveForward", "consume"] }; } };
  const budget = new ExplorationBudget({ schemaVersion: 1, remaining: 0, spent: 1, decisions: [] });
  const coordinator = new PlanningCoordinator({ planner, workspace, budget });
  const result = await coordinator.propose({ world, targetObjectId: source.id, curiosity: 1, unresolvedNeed: 1 });
  assert.equal(invoked, 1);
  assert.equal(result.status, "proposal-blocked");
  assert.equal(result.proposal.execution, "proposal-only");
  assert.equal(workspace.status().proposals[0].action, "followPlan");
  assert.equal(world.state.events.length, 0);
});
