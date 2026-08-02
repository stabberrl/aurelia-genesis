import { ACTIONS } from "../world/genesis-world.mjs";

const PLANNED_ACTIONS = new Set(["turnLeft", "turnRight", "moveForward", "touch", "consume"]);

function samePose(actual, expected) {
  return actual?.x === expected?.x && actual?.y === expected?.y && actual?.direction === expected?.direction;
}

function actionAvailable(world, soulId, action, targetObjectId) {
  const body = world.body(soulId);
  if (["turnLeft", "turnRight"].includes(action)) return true;
  if (action === "moveForward") {
    const direction = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }][body.direction];
    return !world.occupied(body.x + direction.dx, body.y + direction.dy);
  }
  const target = world.state.objects.find(({ id }) => id === targetObjectId);
  const nearTarget = target && Math.abs(body.x - target.x) + Math.abs(body.y - target.y) <= 1;
  return action === "consume" ? Boolean(nearTarget && target.energyYield > 0) : Boolean(nearTarget);
}

/** Ejecuta sólo una propuesta aprobada, con mundo pausado y validación por paso. */
export class PlanExecutor {
  constructor({ worldRuntime, checkpoint = null } = {}) {
    if (!worldRuntime?.world || typeof worldRuntime.act !== "function") throw new TypeError("El ejecutor requiere WorldRuntime.");
    this.worldRuntime = worldRuntime;
    this.checkpoint = checkpoint;
  }

  async execute({ soulId, proposal, plan }) {
    if (!proposal?.permitted || proposal.execution !== "proposal-only") throw new TypeError("Sólo puede ejecutarse una propuesta aprobada y explícita.");
    if (!Array.isArray(plan?.embodiedActions) || !plan.embodiedActions.length || plan.embodiedActions.length > 100) throw new TypeError("El plan corporal no es ejecutable.");
    if (!this.worldRuntime.paused) return { status: "plan-blocked", reason: "world-must-be-paused", executed: [] };
    if (!samePose(this.worldRuntime.world.body(soulId), proposal.pose)) return { status: "plan-cancelled", reason: "body-state-changed", executed: [] };
    if (this.worldRuntime.world.state.worldRevision !== proposal.worldRevision) return { status: "plan-cancelled", reason: "world-revision-changed", executed: [] };
    await this.checkpoint?.save?.({ reason: "before-planning-execution", mode: "FULL" });
    const executed = [];
    for (const action of plan.embodiedActions) {
      if (!ACTIONS.includes(action) || !PLANNED_ACTIONS.has(action)) return { status: "plan-cancelled", reason: "unsupported-planned-action", executed };
      if (this.worldRuntime.world.state.worldRevision !== proposal.worldRevision) return { status: "plan-cancelled", reason: "world-revision-changed", executed };
      if (!actionAvailable(this.worldRuntime.world, soulId, action, proposal.targetObjectId)) return { status: "plan-cancelled", reason: "action-no-longer-valid", action, executed };
      const result = await this.worldRuntime.act(soulId, action);
      executed.push({ action, outcome: result.event.outcome, tick: result.event.tick });
      if (result.event.outcome !== "accepted") return { status: "plan-cancelled", reason: "action-rejected", action, executed };
    }
    return { status: "plan-executed", executed, completedAtTick: this.worldRuntime.world.state.tick };
  }
}
