import assert from "node:assert/strict";
import test from "node:test";
import { GlobalWorkspace } from "../src/world/global-workspace.mjs";

test("el espacio de trabajo prioriza energía y conserva el resultado difundido", () => {
  const workspace = new GlobalWorkspace();
  const focus = workspace.cycle({ perceptions: { tick: 9 }, cognition: { drives: { energy: .9, rest: .1, curiosity: .3 }, lastSurprise: .2 } });
  assert.equal(focus.kind, "restore-energy");
  workspace.recordOutcome({ event: { tick: 10, outcome: "accepted", reward: .3 }, surprise: .1 });
  assert.equal(workspace.status().lastOutcome.focusId, "body:energy");
});
