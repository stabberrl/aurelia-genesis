import fs from "node:fs/promises";
import path from "node:path";
import { DIRECTIONS } from "./genesis-world.mjs";
import { PrimitiveCognition } from "./primitive-cognition.mjs";
import { GlobalWorkspace } from "./global-workspace.mjs";

function key(x, y) {
  return `${x},${y}`;
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function boundedNumber(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

export class EmbodiedInfancyController {
  constructor({
    worldRuntime,
    soulId = "soul-001-alba-0001",
    statePath = path.resolve("var", "worlds", "infancy-controller-v1.json"),
    intervalMs = 350,
  }) {
    if (!worldRuntime) throw new TypeError("El controlador requiere un mundo.");
    this.worldRuntime = worldRuntime;
    this.soulId = soulId;
    this.statePath = path.resolve(statePath);
    this.intervalMs = Math.max(100, Number(intervalMs) || 350);
    this.running = false;
    this.stepsPerCycle = 1;
    this.timer = null;
    this.pending = false;
    this.lastSavedAt = null;
    this.state = this.initialState();
  }

  initialState() {
    return {
      schemaVersion: 1,
      soulId: this.soulId,
      decisionCount: 0,
      successfulEnergyDiscoveries: 0,
      learnedObjects: {},
      knownObjects: {},
      visitedCells: [],
      blockedCells: [],
      currentGoal: null,
      knownWorldRevision: 0,
      bodyCapabilitiesTested: [],
      panelSignalsSent: 0,
      discovery: { experimentCount: 0, questions: [], objectExperiments: {} },
      lastDecision: null,
      decisions: [],
      cognition: new PrimitiveCognition().status(),
      workspace: new GlobalWorkspace().status(),
    };
  }

  async initialize() {
    try {
      const saved = JSON.parse(await fs.readFile(this.statePath, "utf8"));
      if (saved?.schemaVersion !== 1 || saved.soulId !== this.soulId) throw new Error("Estado incompatible.");
      this.state = saved.state;
      this.state.cognition ||= new PrimitiveCognition().status();
      this.state.workspace ||= new GlobalWorkspace().status();
      this.state.knownWorldRevision ||= 0;
      this.state.bodyCapabilitiesTested ||= [];
      this.state.panelSignalsSent ||= 0;
      this.state.discovery ||= { experimentCount: 0, questions: [], objectExperiments: {} };
      this.state.discovery.questions ||= [];
      this.state.discovery.objectExperiments ||= {};
      this.state.successfulEnergyDiscoveries = Object.values(this.state.learnedObjects || {})
        .filter(({ classification }) => classification === "energy-source").length;
      this.stepsPerCycle = boundedNumber(saved.runtime?.stepsPerCycle, 1, 100, 1);
      this.lastSavedAt = saved.savedAt || null;
    } catch {}
    this.startTimer();
    return this.status();
  }

  startTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (!this.running || this.pending) return;
      this.pending = true;
      this.runSteps(this.stepsPerCycle).catch((error) => {
        this.running = false;
        this.state.lastDecision = { action: "error", reason: error.message, at: new Date().toISOString() };
      }).finally(() => { this.pending = false; });
    }, this.intervalMs);
    this.timer.unref?.();
  }

  stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async pauseForCheckpoint() {
    const wasRunning = this.running;
    this.running = false;
    while (this.pending) await new Promise((resolve) => setTimeout(resolve, 5));
    return () => { this.running = wasRunning; };
  }

  status() {
    return {
      ...structuredClone(this.state),
      runtime: {
        running: this.running,
        stepsPerCycle: this.stepsPerCycle,
        intervalMs: this.intervalMs,
        lastSavedAt: this.lastSavedAt,
      },
    };
  }

  control(command, value) {
    if (command === "start") {
      this.worldRuntime.control("pause");
      this.running = true;
    } else if (command === "pause") this.running = false;
    else if (command === "speed") this.stepsPerCycle = Math.trunc(boundedNumber(value, 1, 100, 1));
    else throw new TypeError(`Control autónomo no compatible: ${command}.`);
    return this.status();
  }

  async runSteps(count = 1) {
    const steps = Math.max(1, Math.min(500, Math.trunc(Number(count) || 1)));
    const results = [];
    for (let index = 0; index < steps; index += 1) results.push(await this.step());
    return results;
  }

  observe(perceptions) {
    const pose = perceptions.proprioception;
    const visited = new Set(this.state.visitedCells);
    visited.add(key(pose.x, pose.y));
    this.state.visitedCells = [...visited];
    for (const object of perceptions.visibleObjects) {
      this.state.knownObjects[object.id] = {
        id: object.id,
        color: object.color,
        x: pose.x + object.relativeX,
        y: pose.y + object.relativeY,
        lastSeenTick: perceptions.tick,
      };
      this.state.learnedObjects[object.id] ||= { attempts: 0, touched: false, meanEnergyDelta: 0, classification: "unknown" };
    }
  }

  chooseDecision(perceptions) {
    if (Number(perceptions.worldRevision || 0) > Number(this.state.knownWorldRevision || 0)) {
      this.state.knownWorldRevision = perceptions.worldRevision;
      this.state.visitedCells = [];
      this.state.currentGoal = "environment-change";
    }
    const pose = perceptions.proprioception;
    const body = perceptions.internal;
    const objects = Object.values(this.state.knownObjects);
    const knowledge = this.state.learnedObjects;
    const cognition = new PrimitiveCognition(this.state.cognition);
    cognition.observe(perceptions, this.state.visitedCells);
    this.state.cognition = cognition.status();
    const workspace = new GlobalWorkspace(this.state.workspace);
    const focus = workspace.cycle({ perceptions, cognition: this.state.cognition, knownObjects: this.state.knownObjects, learnedObjects: this.state.learnedObjects });
    this.state.workspace = workspace.status();
    const priority = focus?.kind || cognition.priority(perceptions, this.state.visitedCells);
    if (priority === "rest" && body.fatigue >= 0.8) return { action: "rest", reason: "workspace:rest" };

    const panel = objects.find((object) => knowledge[object.id]?.classification === "communication-panel");
    if (panel && body.capabilities?.includes("signal") && !this.state.panelSignalsSent) {
      if (manhattan(pose, panel) <= 1) return { action: "signal", reason: "probe:communication-panel", objectId: panel.id };
      return this.navigateDecision(pose, (cell) => manhattan(cell, panel) <= 1, `approach-panel:${panel.id}`, panel.id);
    }
    const untestedCapability = (body.capabilities || []).find((action) => ["grip", "push"].includes(action) && !this.state.bodyCapabilitiesTested.includes(action));
    if (untestedCapability) return { action: untestedCapability, reason: "probe:body-capability" };

    const adjacentUntried = objects.find((object) => manhattan(pose, object) <= 1 && !knowledge[object.id]?.touched);
    if (adjacentUntried) return { action: "touch", reason: "inspect-unknown-object", objectId: adjacentUntried.id };
    const adjacentUntested = objects.find((object) => manhattan(pose, object) <= 1 && !knowledge[object.id]?.attempts);
    if (adjacentUntested) return { action: "consume", reason: "test-unknown-object", objectId: adjacentUntested.id };

    const positive = objects
      .filter((object) => knowledge[object.id]?.classification === "energy-source")
      .sort((a, b) => knowledge[b.id].meanEnergyDelta - knowledge[a.id].meanEnergyDelta)[0];
    if (positive && priority === "restore-energy") {
      if (manhattan(pose, positive) <= 1) return { action: "consume", reason: "workspace:restore-energy", objectId: positive.id };
      return this.navigateDecision(pose, (cell) => manhattan(cell, positive) <= 1, `workspace:approach:${positive.id}`, positive.id);
    }

    const untried = objects.find((object) => !knowledge[object.id]?.attempts);
    if (untried) return this.navigateDecision(pose, (cell) => manhattan(cell, untried) <= 1, `investigate:${untried.id}`, untried.id);

    const exploration = this.explorationTarget(pose, perceptions.space);
    if (exploration) return this.navigateDecision(pose, (cell) => cell.x === exploration.x && cell.y === exploration.y, `explore:${key(exploration.x, exploration.y)}`);
    return this.discoveryDecision(pose, objects, knowledge, body);
  }

  discoveryDecision(pose, objects, knowledge, body) {
    const experiments = this.state.discovery.objectExperiments;
    const candidate = objects.map((object) => {
      const learning = knowledge[object.id] || {};
      const available = [
        !learning.touched && "touch",
        !learning.attempts && "consume",
        object.id === "communication-panel-v1" && body.capabilities?.includes("signal") && !this.state.panelSignalsSent && "signal",
      ].filter(Boolean);
      if (!available.length) return null;
      const record = experiments[object.id] || { actions: {} };
      const action = available.sort((a, b) => (record.actions?.[a]?.count || 0) - (record.actions?.[b]?.count || 0) || a.localeCompare(b))[0];
      return { object, action, count: record.actions?.[action]?.count || 0, total: Object.values(record.actions || {}).reduce((sum, item) => sum + item.count, 0) };
    }).filter(Boolean).sort((a, b) => a.count - b.count || a.total - b.total || a.object.id.localeCompare(b.object.id))[0];
    if (!candidate) return { action: "observe", reason: "no-discovery-target" };
    const question = `¿Qué consecuencia sigue si ${candidate.action} se prueba cerca de ${candidate.object.color}?`;
    this.state.discovery.questions = [{ id: `q:${candidate.object.id}:${candidate.action}`, objectId: candidate.object.id, action: candidate.action, text: question, status: "active" }, ...this.state.discovery.questions.filter((item) => item.objectId !== candidate.object.id || item.action !== candidate.action)].slice(0, 24);
    if (manhattan(pose, candidate.object) <= 1) return { action: candidate.action, reason: `curiosity:question:${candidate.object.id}:${candidate.action}`, objectId: candidate.object.id, question };
    return this.navigateDecision(pose, (cell) => manhattan(cell, candidate.object) <= 1, `curiosity:approach:${candidate.object.id}:${candidate.action}`, candidate.object.id);
  }

  explorationTarget(pose, space) {
    const visited = new Set(this.state.visitedCells);
    const blocked = new Set(this.state.blockedCells);
    const candidates = [];
    for (let y = 0; y < space.height; y += 1) {
      for (let x = 0; x < space.width; x += 1) {
        if (!visited.has(key(x, y)) && !blocked.has(key(x, y))) candidates.push({ x, y });
      }
    }
    return candidates.sort((a, b) => manhattan(pose, a) - manhattan(pose, b)
      || a.y - b.y || a.x - b.x)[0] || null;
  }

  navigateDecision(pose, isGoal, reason, objectId = null) {
    const path = this.shortestPath(pose, isGoal);
    if (!path || path.length < 2) return { action: "observe", reason: `path-unavailable:${reason}`, objectId };
    const next = path[1];
    const direction = DIRECTIONS.findIndex(({ dx, dy }) => pose.x + dx === next.x && pose.y + dy === next.y);
    if (direction === pose.direction) return { action: "moveForward", reason, objectId, targetCell: next };
    const difference = (direction - pose.direction + 4) % 4;
    return { action: difference === 3 ? "turnLeft" : "turnRight", reason, objectId, targetCell: next };
  }

  shortestPath(start, isGoal) {
    const blocked = new Set(this.state.blockedCells);
    const width = this.worldRuntime.world.width;
    const height = this.worldRuntime.world.height;
    const queue = [{ x: start.x, y: start.y }];
    const previous = new Map([[key(start.x, start.y), null]]);
    let destination = null;
    while (queue.length) {
      const current = queue.shift();
      if (isGoal(current)) { destination = current; break; }
      for (const { dx, dy } of DIRECTIONS) {
        const next = { x: current.x + dx, y: current.y + dy };
        const nextKey = key(next.x, next.y);
        if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height || blocked.has(nextKey) || previous.has(nextKey)) continue;
        previous.set(nextKey, current);
        queue.push(next);
      }
    }
    if (!destination) return null;
    const path = [];
    for (let cursor = destination; cursor; cursor = previous.get(key(cursor.x, cursor.y))) path.unshift(cursor);
    return path;
  }

  updateLearning(decision, result, beforePose, perceptionsBeforeAction) {
    if (decision.reason?.startsWith("curiosity:") && decision.objectId) {
      const experiment = this.state.discovery.objectExperiments[decision.objectId] ||= { actions: {} };
      const action = experiment.actions[decision.action] ||= { count: 0, outcomes: {} };
      action.count += 1;
      action.outcomes[result.event.outcome] = (action.outcomes[result.event.outcome] || 0) + 1;
      experiment.lastTick = result.event.tick;
      this.state.discovery.experimentCount += 1;
      this.state.discovery.questions = this.state.discovery.questions.map((question) => question.objectId === decision.objectId && question.action === decision.action ? { ...question, status: "tested", outcome: result.event.outcome, tick: result.event.tick } : question);
    }
    if (decision.action === "touch" && decision.objectId) {
      const record = this.state.learnedObjects[decision.objectId] ||= { attempts: 0, touched: false, meanEnergyDelta: 0, classification: "unknown" };
      record.touched = true;
      if (result.event.details?.knowledgeFragment) record.classification = "informational";
      if (result.event.details?.bodyUpgrade) record.classification = "body-shell";
      if (result.event.details?.communicationPanel) record.classification = "communication-panel";
    }
    if (["grip", "push"].includes(decision.action) && result.event.outcome !== "unavailable") {
      this.state.bodyCapabilitiesTested = [...new Set([...this.state.bodyCapabilitiesTested, decision.action])];
    }
    if (decision.action === "signal" && result.event.details?.panelSignal) this.state.panelSignalsSent += 1;
    if (decision.action === "moveForward" && result.event.outcome === "blocked" && decision.targetCell) {
      const blocked = new Set(this.state.blockedCells);
      blocked.add(key(decision.targetCell.x, decision.targetCell.y));
      this.state.blockedCells = [...blocked];
    }
    if (decision.action === "consume" && decision.objectId) {
      const record = this.state.learnedObjects[decision.objectId] ||= { attempts: 0, meanEnergyDelta: 0, classification: "unknown" };
      const previousClassification = record.classification;
      record.attempts += 1;
      record.meanEnergyDelta += (result.event.reward - record.meanEnergyDelta) / record.attempts;
      if (record.classification !== "informational") record.classification = record.meanEnergyDelta > 0.05 ? "energy-source" : "non-restorative";
      record.lastTestTick = result.event.tick;
      if (previousClassification !== "energy-source" && result.event.reward > 0.05) this.state.successfulEnergyDiscoveries += 1;
    }
    this.state.currentGoal = decision.reason;
    const cognition = new PrimitiveCognition(this.state.cognition);
    const learning = cognition.record({
      perceptions: perceptionsBeforeAction,
      action: decision.action,
      result,
      decision,
      visitedCells: this.state.visitedCells,
    });
    this.state.cognition = cognition.status();
    const workspace = new GlobalWorkspace(this.state.workspace);
    workspace.recordOutcome({ event: result.event, surprise: learning.surprise });
    this.state.workspace = workspace.status();
    this.state.decisionCount += 1;
    const entry = {
      sequence: this.state.decisionCount,
      tick: result.event.tick,
      action: decision.action,
      reason: decision.reason,
      objectId: decision.objectId || null,
      outcome: result.event.outcome,
      reward: result.event.reward,
      positionBefore: { x: beforePose.x, y: beforePose.y, direction: beforePose.directionName },
      positionAfter: {
        x: result.perceptions.proprioception.x,
        y: result.perceptions.proprioception.y,
        direction: result.perceptions.proprioception.directionName,
      },
    };
    this.state.lastDecision = entry;
    this.state.decisions.unshift(entry);
    this.state.decisions = this.state.decisions.slice(0, 200);
  }

  async step() {
    const perceptions = this.worldRuntime.world.perceptions(this.soulId);
    this.observe(perceptions);
    const decision = this.chooseDecision(perceptions);
    const beforePose = perceptions.proprioception;
    const result = await this.worldRuntime.act(this.soulId, decision.action);
    this.observe(result.perceptions);
    this.updateLearning(decision, result, beforePose, perceptions);
    return { decision: this.state.lastDecision, knowledge: structuredClone(this.state.learnedObjects), perceptions: result.perceptions };
  }

  async checkpoint(reason = "checkpoint") {
    await fs.mkdir(path.dirname(this.statePath), { recursive: true });
    const temporary = `${this.statePath}.${process.pid}.tmp`;
    const savedAt = new Date().toISOString();
    const payload = {
      schemaVersion: 1,
      savedAt,
      reason,
      soulId: this.soulId,
      state: this.state,
      runtime: { stepsPerCycle: this.stepsPerCycle },
    };
    await fs.writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    await fs.rename(temporary, this.statePath);
    this.lastSavedAt = savedAt;
    return {
      provider: "embodied-infancy-controller",
      savedAt,
      path: this.statePath,
      decisionCount: this.state.decisionCount,
      learnedObjects: Object.keys(this.state.learnedObjects).length,
    };
  }
}
