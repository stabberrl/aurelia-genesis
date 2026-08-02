import { DIRECTIONS } from "../world/genesis-world.mjs";

function cell(x, y) { return `c${x + 1}-${y + 1}`; }

function validPoint(point, width, height) {
  return Number.isInteger(point?.x) && Number.isInteger(point?.y)
    && point.x >= 0 && point.y >= 0 && point.x < width && point.y < height;
}

/** Traduce sólo un estado explícito y conocido; no infiere mapas ni objetivos. */
export function translateWorldToPddl(world, {
  soulId = "soul-001-alba-0001",
  targetObjectId,
  completion = "consume",
} = {}) {
  if (!world?.state || !Number.isInteger(world.width) || !Number.isInteger(world.height)) throw new TypeError("Se requiere un GenesisWorld válido.");
  if (!["consume", "touch"].includes(completion)) throw new TypeError("La finalización PDDL debe ser consume o touch.");
  const body = world.body(soulId);
  const target = world.state.objects.find(({ id }) => id === targetObjectId);
  if (!target) throw new TypeError("El objetivo solicitado no existe en el estado del mundo.");
  if (!validPoint(body, world.width, world.height) || !validPoint(target, world.width, world.height)) throw new TypeError("La posición corporal u objetivo no es traducible.");

  const cells = [];
  const adjacency = [];
  for (let y = 0; y < world.height; y += 1) for (let x = 0; x < world.width; x += 1) {
    cells.push(cell(x, y));
    for (const { dx, dy } of DIRECTIONS) {
      const next = { x: x + dx, y: y + dy };
      if (validPoint(next, world.width, world.height)) adjacency.push(`(adjacent ${cell(x, y)} ${cell(next.x, next.y)})`);
    }
  }
  const blocked = world.state.obstacles
    .filter((point) => validPoint(point, world.width, world.height))
    .map((point) => `(blocked ${cell(point.x, point.y)})`);
  const targetPredicate = completion === "consume" ? "consume-target" : "touch-target";
  const problem = `(define (problem aurelia-${world.id}-${world.state.tick})\n  (:domain aurelia-genesis-world)\n  (:objects ${cells.join(" ")} - cell)\n  (:init\n    (at ${cell(body.x, body.y)})\n    (${targetPredicate} ${cell(target.x, target.y)})\n    ${[...blocked, ...adjacency].join("\n    ")}\n  )\n  (:goal (completed))\n)\n`;
  return {
    problem,
    metadata: {
      worldId: world.id,
      worldTick: world.state.tick,
      soulId,
      targetObjectId: target.id,
      targetCell: cell(target.x, target.y),
      completion,
      pose: { x: body.x, y: body.y, direction: body.direction },
    },
  };
}
