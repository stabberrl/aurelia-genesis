import assert from "node:assert/strict";
import test from "node:test";
import { ExplorationBudget } from "../src/learning/exploration-budget.mjs";

test("el presupuesto distingue prioridad interna y recursos restantes", () => {
  const budget = new ExplorationBudget();
  assert.equal(budget.request({ curiosity: .1, unresolvedNeed: .1 }).allowed, false);
  assert.equal(budget.request({ curiosity: .9, unresolvedNeed: .8, cost: .8 }).allowed, true);
  assert.equal(budget.request({ curiosity: .9, unresolvedNeed: .8, cost: .3 }).reason, "budget-exhausted");
});
