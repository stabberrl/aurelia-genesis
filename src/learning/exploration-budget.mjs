function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Number(value) || 0));
}

/** Presupuesto local para priorizar exploración; no ejecuta acciones externas. */
export class ExplorationBudget {
  constructor(state = null) {
    this.state = structuredClone(state || { schemaVersion: 1, remaining: 1, spent: 0, decisions: [] });
    this.state.remaining = clamp(this.state.remaining, 0, 1);
    this.state.spent = Math.max(0, Number(this.state.spent) || 0);
    this.state.decisions ||= [];
  }

  request({ curiosity = 0, unresolvedNeed = 0, cost = .2, source = "unknown" } = {}) {
    const priority = clamp(curiosity, 0, 1) * .6 + clamp(unresolvedNeed, 0, 1) * .4;
    const allowed = priority >= .42 && this.state.remaining >= cost;
    const result = { allowed, priority, cost, source, reason: allowed ? "budget-approved" : priority < .42 ? "low-internal-drive" : "budget-exhausted" };
    if (allowed) { this.state.remaining = clamp(this.state.remaining - cost, 0, 1); this.state.spent += cost; }
    this.state.decisions.unshift(result); this.state.decisions = this.state.decisions.slice(0, 50);
    return result;
  }

  replenish(amount = .1) { this.state.remaining = clamp(this.state.remaining + amount, 0, 1); return this.status(); }
  status() { return structuredClone(this.state); }
}
