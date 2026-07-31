import { ExplorationBudget } from "../learning/exploration-budget.mjs";

/** Conecta una propuesta interna con una observación externa sólo tras aprobar presupuesto. */
export class AutonomousExploration {
  constructor({ heartbeat, chamber, budgetFor = () => new ExplorationBudget() }) {
    this.heartbeat = heartbeat;
    this.chamber = chamber;
    this.budgetFor = budgetFor;
    this.budgets = new Map();
    this.timer = null;
  }

  budget(soulId) {
    if (!this.budgets.has(soulId)) this.budgets.set(soulId, this.budgetFor(soulId));
    return this.budgets.get(soulId);
  }

  budgetStatus(soulId) { return this.budget(soulId).snapshot(); }

  async tick(soulId, { now = Date.now() * 1000 } = {}) {
    const heartbeat = this.heartbeat.tick(soulId, now);
    const proposal = heartbeat.operations.find(({ type, action }) => type === "proposal" && action === "exploreConcept");
    if (!proposal) return { status: "no-exploration-proposal", soulId, heartbeat };
    const availability = this.chamber.availability(soulId, { now });
    if (!availability.ready) return { status: availability.status, soulId, heartbeat, proposal, availability };
    const motivation = this.chamber.motivation(soulId);
    const permission = this.budget(soulId).request({ ...motivation, source: "heartbeat:exploreConcept" });
    if (!permission.allowed) return { status: "proposal-blocked", soulId, heartbeat, proposal, motivation, permission };
    const exploration = await this.chamber.exploreApproved(soulId, { now });
    return { status: "proposal-executed", soulId, heartbeat, proposal, motivation, permission, exploration };
  }

  start(soulIds) {
    if (this.timer) return;
    const run = (soulId) => this.tick(soulId).catch((error) => console.error(`[autonomous-exploration] ${soulId}: ${error.message}`));
    if (this.heartbeat.fastForward) queueMicrotask(() => {
      for (let cycle = 0; cycle < this.heartbeat.fastForward; cycle += 1) for (const soulId of soulIds) run(soulId);
    });
    this.timer = setInterval(() => { for (const soulId of soulIds) run(soulId); }, this.heartbeat.intervalMs);
    this.timer.unref?.();
  }

  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; }
}
