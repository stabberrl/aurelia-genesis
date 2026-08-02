import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { DIRECTIONS } from "../world/genesis-world.mjs";

const ACTIONS = new Set(["move", "touch", "consume"]);

function fromCell(value) {
  const found = /^c(\d+)-(\d+)$/.exec(value || "");
  if (!found) throw new TypeError(`Celda PDDL inválida: ${value}.`);
  return { x: Number(found[1]) - 1, y: Number(found[2]) - 1 };
}

export function parsePddlPlan(text) {
  const steps = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const match = /^\s*\(([a-z-]+)(?:\s+([^\s)]+))?(?:\s+([^\s)]+))?\)\s*$/.exec(line);
    if (!match) continue;
    const [, action, first, second] = match;
    if (!ACTIONS.has(action)) throw new TypeError(`Acción PDDL no autorizada: ${action}.`);
    if (action === "move" && (!first || !second)) throw new TypeError("move requiere origen y destino.");
    if (action !== "move" && !first) throw new TypeError(`${action} requiere una celda.`);
    steps.push({ action, from: action === "move" ? fromCell(first) : null, to: action === "move" ? fromCell(second) : fromCell(first) });
  }
  if (!steps.length) throw new TypeError("Fast Downward no devolvió un plan compatible.");
  return steps;
}

function turns(fromDirection, targetDirection) {
  const delta = (targetDirection - fromDirection + 4) % 4;
  if (delta === 0) return [];
  if (delta === 3) return ["turnLeft"];
  return Array(delta).fill("turnRight");
}

/** Convierte pasos de celda a acciones corporales ya soportadas por GenesisWorld. */
export function toEmbodiedActions(plan, pose) {
  let position = { x: pose?.x, y: pose?.y };
  let direction = Number(pose?.direction);
  if (!Number.isInteger(position.x) || !Number.isInteger(position.y) || !Number.isInteger(direction) || direction < 0 || direction > 3) throw new TypeError("La pose inicial no es válida.");
  const actions = [];
  for (const step of plan) {
    if (step.action === "move") {
      if (step.from.x !== position.x || step.from.y !== position.y) throw new TypeError("El plan no continúa desde la posición corporal esperada.");
      const nextDirection = DIRECTIONS.findIndex(({ dx, dy }) => position.x + dx === step.to.x && position.y + dy === step.to.y);
      if (nextDirection < 0) throw new TypeError("El plan contiene un movimiento no adyacente.");
      actions.push(...turns(direction, nextDirection), "moveForward");
      direction = nextDirection;
      position = { ...step.to };
    } else actions.push(step.action);
  }
  return actions;
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`Fast Downward terminó con código ${code}: ${stderr || stdout}`)));
  });
}

export class PlannerBridge {
  constructor({ fastDownwardDir = process.env.FAST_DOWNWARD_HOME, domainPath = path.resolve("src", "planning", "domain.pddl"), search = "astar(lmcut())" } = {}) {
    this.fastDownwardDir = fastDownwardDir ? path.resolve(fastDownwardDir) : null;
    this.domainPath = path.resolve(domainPath);
    this.search = search;
  }

  async plan(translation) {
    if (!this.fastDownwardDir) throw new Error("Fast Downward no está configurado. Define FAST_DOWNWARD_HOME.");
    const temporary = await mkdtemp(path.join(os.tmpdir(), "aurelia-planner-"));
    try {
      const problemPath = path.join(temporary, "problem.pddl");
      await writeFile(problemPath, translation.problem, "utf8");
      const result = await run("py", ["fast-downward.py", this.domainPath, problemPath, "--search", this.search], { cwd: this.fastDownwardDir });
      const planText = await readFile(path.join(this.fastDownwardDir, "sas_plan"), "utf8");
      const pddlSteps = parsePddlPlan(planText);
      return { pddlSteps, embodiedActions: toEmbodiedActions(pddlSteps, translation.metadata.pose), output: result.stdout };
    } finally { await rm(temporary, { recursive: true, force: true }); }
  }
}
