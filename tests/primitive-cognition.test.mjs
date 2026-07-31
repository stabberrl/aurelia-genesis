import assert from "node:assert/strict";
import test from "node:test";
import { PrimitiveCognition } from "../src/world/primitive-cognition.mjs";

const perceptions = {
  tick: 1,
  internal: { energy: 0.4, fatigue: 0.1 },
  space: { width: 3, height: 3 },
  visibleObjects: [],
};

test("la predicción conserva el contexto anterior a la acción y aprende su consecuencia", () => {
  const cognition = new PrimitiveCognition();
  cognition.record({
    perceptions,
    action: "consume",
    decision: { reason: "test", objectId: "object-a" },
    visitedCells: [],
    result: {
      event: { tick: 2, outcome: "accepted", reward: 0.4 },
      perceptions: { ...perceptions, internal: { energy: 0.8, fatigue: 0.1 } },
    },
  });
  const prediction = cognition.predict(perceptions, "consume");
  assert.equal(prediction.expectedOutcome, "accepted");
  assert.equal(prediction.expectedReward, 0.4);
  assert.ok(prediction.confidence > 0);
  assert.equal(cognition.status().affordances["object-a"].role, "restorative");
});
