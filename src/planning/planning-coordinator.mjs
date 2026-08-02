import { ExplorationBudget } from "../learning/exploration-budget.mjs";
import { translateWorldToPddl } from "./pddl-translator.mjs";

/** Produce propuestas auditables; no ejecuta planes ni redefine objetivos de AERA. */
export class PlanningCoordinator {
  constructor({ planner, workspace = null, budget = new ExplorationBudget() } = {}) {
    if (!planner?.plan) throw new TypeError("El coordinador requiere un puente de planificación.");
    this.planner = planner;
    this.workspace = workspace;
    this.budget = budget;
  }

  async propose({ world, soulId, targetObjectId, completion = "consume", curiosity = 0, unresolvedNeed = 0, cost = .2 } = {}) {
    const translation = translateWorldToPddl(world, { soulId, targetObjectId, completion });
    const plan = await this.planner.plan(translation);
    const permission = this.budget.request({ curiosity, unresolvedNeed, cost, source: "planner:followPlan" });
    const proposal = {
      type: "proposal", action: "followPlan", execution: "proposal-only", source: "fast-downward",
      targetObjectId, actionCount: plan.embodiedActions.length, permitted: permission.allowed,
      worldRevision: world.state.worldRevision, pose: structuredClone(translation.metadata.pose), completion,
    };
    this.workspace?.recordProposal?.(proposal, { tick: world.state.tick });
    return permission.allowed
      ? { status: "proposal-ready", proposal, permission, plan: { embodiedActions: plan.embodiedActions, pddlSteps: plan.pddlSteps } }
      : { status: "proposal-blocked", proposal, permission };
  }
}
