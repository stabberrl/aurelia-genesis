import { createHash } from "node:crypto";

const DIRECTIONS = Object.freeze([
  { name: "north", dx: 0, dy: -1 },
  { name: "east", dx: 1, dy: 0 },
  { name: "south", dx: 0, dy: 1 },
  { name: "west", dx: -1, dy: 0 },
]);

const ACTIONS = Object.freeze(["observe", "turnLeft", "turnRight", "moveForward", "touch", "consume", "rest", "wait", "grip", "push", "signal"]);

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, Number(value) || 0));
}

function integerFromSeed(seed, namespace) {
  const hash = createHash("sha256").update(`${seed}:${namespace}`).digest();
  return hash.readUInt32BE(0);
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export class GenesisWorld {
  constructor({
    id = "genesis-room-v1",
    seed = "AURELIA-WORLD-0001",
    width = 9,
    height = 7,
    state,
  } = {}) {
    this.id = id;
    this.seed = seed;
    this.width = width;
    this.height = height;
    this.sequence = 0;
    this.state = state ? structuredClone(state) : this.initialState();
    this.state.knowledgeFragments ||= [];
    this.state.worldRevision ||= this.state.knowledgeFragments.length ? 1 : 0;
    this.state.worldVersion ||= 1;

    // Los mundos creados antes de la versión 2 no tenían estos campos. Los
    // normalizamos al cargarlos para que un cuerpo heredado pueda descubrir
    // su nueva carcasa sin interrumpir la simulación.
    for (const body of Object.values(this.state.bodies || {})) {
      body.form ||= "basic";
      body.capabilities = Array.isArray(body.capabilities)
        ? [...new Set(body.capabilities)]
        : ["moveForward", "touch", "consume", "rest"];
      body.panelSignals = Number.isFinite(Number(body.panelSignals))
        ? Math.max(0, Math.trunc(Number(body.panelSignals)))
        : 0;
    }
  }

  initialState() {
    const sourceY = 1 + (integerFromSeed(this.seed, "source-y") % (this.height - 2));
    const inertY = 1 + (integerFromSeed(this.seed, "inert-y") % (this.height - 2));
    return {
      schemaVersion: 1,
      worldId: this.id,
      seed: this.seed,
      tick: 0,
      elapsedMs: 0,
      worldRevision: 0,
      dayLengthTicks: 240,
      bodies: {
        "soul-001-alba-0001": {
          id: "soul-001-alba-0001",
          name: "Naia",
          x: 1,
          y: Math.floor(this.height / 2),
          direction: 1,
          energy: 0.55,
          fatigue: 0.05,
          integrity: 1,
          visionRange: 3,
          hearingRange: 4,
          form: "basic",
          capabilities: ["moveForward", "touch", "consume", "rest"],
          panelSignals: 0,
          lastAction: "none",
          lastReward: 0,
        },
      },
      objects: [
        { id: "object-a", kind: "unknown", role: "energy-source", x: this.width - 2, y: sourceY, energyYield: 0.38, color: "blue" },
        { id: "object-b", kind: "unknown", role: "inert", x: this.width - 3, y: inertY, energyYield: 0, color: "ochre" },
      ],
      obstacles: [
        { x: 4, y: 2 },
        { x: 4, y: 3 },
        { x: 4, y: 4 },
      ],
      knowledgeFragments: [],
      events: [],
    };
  }

  body(soulId) {
    const body = this.state.bodies[soulId];
    if (!body) throw new TypeError(`El alma ${soulId} no posee un cuerpo en este mundo.`);
    return body;
  }

  expandToV2() {
    if (this.state.worldVersion >= 2) return false;
    this.width = Math.max(this.width, 17);
    this.height = Math.max(this.height, 13);
    this.state.obstacles.push({ x: 9, y: 4 }, { x: 9, y: 5 }, { x: 9, y: 6 }, { x: 12, y: 8 });
    this.state.objects.push(
      { id: "body-shell-v2", kind: "unknown", role: "body-shell", color: "silver", x: 14, y: 10, energyYield: 0 },
      { id: "communication-panel-v1", kind: "unknown", role: "communication-panel", color: "amber", x: 15, y: 2, energyYield: 0 },
      { id: "kinetic-block-v1", kind: "unknown", role: "movable", color: "red", x: 12, y: 10, energyYield: 0 },
    );
    this.state.worldVersion = 2;
    this.state.worldRevision += 1;
    return true;
  }

  ambientLight() {
    const phase = (this.state.tick % this.state.dayLengthTicks) / this.state.dayLengthTicks;
    return clamp(0.15 + Math.max(0, Math.sin(phase * Math.PI * 2)) * 0.85);
  }

  occupied(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return true;
    return this.state.obstacles.some((item) => item.x === x && item.y === y);
  }

  visibleObjects(soulId) {
    const body = this.body(soulId);
    const facing = DIRECTIONS[body.direction];
    return this.state.objects.filter((object) => {
      const range = distance(body, object);
      if (range > body.visionRange) return false;
      if (range <= 1) return true;
      const projection = (object.x - body.x) * facing.dx + (object.y - body.y) * facing.dy;
      return projection > 0;
    }).map((object) => ({
      id: object.id,
      kind: object.kind,
      color: object.color,
      distance: distance(body, object),
      relativeX: object.x - body.x,
      relativeY: object.y - body.y,
    }));
  }

  addKnowledgeFragments({ sourceUrl, sourceName, sourceTitle, language, contentHash, fragments }) {
    const occupied = new Set([...this.state.objects, ...this.state.obstacles].map((item) => `${item.x},${item.y}`));
    const staged = [];
    for (const [index, text] of fragments.entries()) {
      let placed = null;
      for (let attempt = 0; attempt < this.width * this.height; attempt += 1) {
        const x = integerFromSeed(this.seed, `${contentHash}:${index}:x:${attempt}`) % this.width;
        const y = integerFromSeed(this.seed, `${contentHash}:${index}:y:${attempt}`) % this.height;
        if (!occupied.has(`${x},${y}`)) { placed = { x, y }; break; }
      }
      if (!placed) break;
      const id = `fragment-${contentHash.slice(0, 10)}-${index + 1}`;
      if (this.state.objects.some((object) => object.id === id)) continue;
      occupied.add(`${placed.x},${placed.y}`);
      const artifact = { id, kind: "unknown", role: "knowledge-fragment", color: "teal", x: placed.x, y: placed.y, energyYield: 0, knowledge: { sourceUrl, sourceName, sourceTitle, language, contentHash, text, discoveries: [] } };
      this.state.objects.push(artifact);
      this.state.knowledgeFragments.push({ id, sourceUrl, sourceTitle, language, contentHash, stagedAtTick: this.state.tick });
      staged.push({ id, x: placed.x, y: placed.y });
    }
    if (staged.length) this.state.worldRevision += 1;
    return staged;
  }

  perceptions(soulId) {
    const body = this.body(soulId);
    const contact = this.state.objects.find((object) => distance(body, object) <= 1);
    return {
      tick: this.state.tick,
      worldRevision: this.state.worldRevision,
      proprioception: {
        x: body.x,
        y: body.y,
        direction: body.direction,
        directionName: DIRECTIONS[body.direction].name,
      },
      space: { width: this.width, height: this.height },
      internal: {
        energy: body.energy,
        fatigue: body.fatigue,
        integrity: body.integrity,
      },
      ambient: {
        light: this.ambientLight(),
        contact: contact ? 1 : 0,
        sound: 0,
      },
      visibleObjects: this.visibleObjects(soulId),
    };
  }

  advance(count = 1) {
    const steps = Math.max(1, Math.min(10_000, Math.trunc(Number(count) || 1)));
    for (let index = 0; index < steps; index += 1) {
      this.state.tick += 1;
      this.state.elapsedMs += 1_000;
      for (const body of Object.values(this.state.bodies)) {
        body.energy = clamp(body.energy - 0.00045);
        body.fatigue = clamp(body.fatigue + 0.0003);
        if (body.energy <= 0.03) body.integrity = clamp(body.integrity - 0.0002);
      }
    }
    return this.summary();
  }

  act(soulId, action) {
    if (!ACTIONS.includes(action)) throw new TypeError(`Acción no compatible: ${action}.`);
    const body = this.body(soulId);
    const energyBefore = body.energy;
    let outcome = "accepted";
    let details = {};
    if (action === "turnLeft") body.direction = (body.direction + 3) % 4;
    if (action === "turnRight") body.direction = (body.direction + 1) % 4;
    if (action === "moveForward") {
      const facing = DIRECTIONS[body.direction];
      const target = { x: body.x + facing.dx, y: body.y + facing.dy };
      if (this.occupied(target.x, target.y)) outcome = "blocked";
      else {
        body.x = target.x;
        body.y = target.y;
        body.energy = clamp(body.energy - 0.006);
        body.fatigue = clamp(body.fatigue + 0.004);
      }
    }
    if (action === "touch") {
      const touched = this.state.objects.find((object) => distance(body, object) <= 1);
      if (touched?.role === "knowledge-fragment") {
        const discoveries = touched.knowledge.discoveries || (touched.knowledge.discoveries = []);
        const firstDiscovery = !discoveries.includes(soulId);
        if (firstDiscovery) discoveries.push(soulId);
        details = { touched: touched.id, knowledgeFragment: { id: touched.id, text: touched.knowledge.text, sourceUrl: touched.knowledge.sourceUrl, sourceTitle: touched.knowledge.sourceTitle, language: touched.knowledge.language, firstDiscovery } };
      } else if (touched?.role === "body-shell") {
        body.form = "explorer-v2";
        body.capabilities = [...new Set([...body.capabilities, "grip", "push", "signal"])];
        details = { touched: touched.id, bodyUpgrade: { form: body.form, capabilities: body.capabilities } };
      } else if (touched?.role === "communication-panel") {
        details = { touched: touched.id, communicationPanel: { state: "active", symbols: 1 } };
      } else details = touched ? { touched: touched.id, texture: touched.role === "energy-source" ? 0.75 : 0.35 } : { touched: null };
      if (!touched) outcome = "no-contact";
    }
    if (action === "consume") {
      const source = this.state.objects.find((object) => distance(body, object) <= 1 && object.energyYield > 0);
      if (!source) outcome = "no-resource";
      else {
        body.energy = clamp(body.energy + source.energyYield);
        body.fatigue = clamp(body.fatigue - 0.04);
        details = { objectId: source.id, energyDelta: body.energy - energyBefore };
      }
    }
    if (action === "rest") {
      body.energy = clamp(body.energy - 0.001);
      body.fatigue = clamp(body.fatigue - 0.06);
    }
    if (action === "grip") {
      if (!body.capabilities.includes("grip")) outcome = "unavailable";
      else {
        const target = this.state.objects.find((object) => distance(body, object) <= 1);
        details = target ? { gripped: target.id, resistance: target.role === "movable" ? 0.62 : 0.28 } : { gripped: null };
        if (!target) outcome = "no-contact";
      }
    }
    if (action === "push") {
      if (!body.capabilities.includes("push")) outcome = "unavailable";
      else {
        const target = this.state.objects.find((object) => distance(body, object) <= 1 && object.role === "movable");
        const facing = DIRECTIONS[body.direction];
        const destination = target && { x: target.x + facing.dx, y: target.y + facing.dy };
        if (!target || !destination || this.occupied(destination.x, destination.y) || this.state.objects.some((object) => object !== target && object.x === destination.x && object.y === destination.y)) outcome = "no-movable-contact";
        else { target.x = destination.x; target.y = destination.y; details = { pushed: target.id, x: target.x, y: target.y }; this.state.worldRevision += 1; }
      }
    }
    if (action === "signal") {
      if (!body.capabilities.includes("signal")) outcome = "unavailable";
      else {
        const panel = this.state.objects.find((object) => distance(body, object) <= 1 && object.role === "communication-panel");
        if (!panel) outcome = "no-panel-contact";
        else { body.panelSignals += 1; details = { panelSignal: { panel: panel.id, sequence: body.panelSignals, symbol: "pulse" } }; }
      }
    }
    this.advance(1);
    const reward = Number((body.energy - energyBefore).toFixed(6));
    body.lastAction = action;
    body.lastReward = reward;
    const event = {
      id: `${this.id}:${this.state.tick}:${++this.sequence}`,
      tick: this.state.tick,
      soulId,
      action,
      outcome,
      reward,
      details,
    };
    this.state.events.unshift(event);
    this.state.events = this.state.events.slice(0, 200);
    return { event, perceptions: this.perceptions(soulId), state: this.summary() };
  }

  summary() {
    return {
      id: this.id,
      seed: this.seed,
      width: this.width,
      height: this.height,
      worldVersion: this.state.worldVersion,
      tick: this.state.tick,
      elapsedMs: this.state.elapsedMs,
      ambientLight: this.ambientLight(),
      bodies: Object.values(this.state.bodies).map((body) => ({ ...body, directionName: DIRECTIONS[body.direction].name })),
      objects: this.state.objects.map(({ energyYield, role, knowledge, ...object }) => ({ ...object, researcherRole: role, energyYield, knowledgeStaged: Boolean(knowledge) })),
      obstacles: this.state.obstacles,
      recentEvents: this.state.events.slice(0, 30),
    };
  }

  serialize() {
    return {
      schemaVersion: 1,
      id: this.id,
      seed: this.seed,
      width: this.width,
      height: this.height,
      sequence: this.sequence,
      state: structuredClone(this.state),
    };
  }

  static fromSerialized(payload) {
    if (payload?.schemaVersion !== 1 || !payload.state || typeof payload.seed !== "string") {
      throw new TypeError("El estado del mundo no es compatible.");
    }
    const world = new GenesisWorld(payload);
    world.sequence = Number(payload.sequence) || 0;
    return world;
  }
}

export { ACTIONS, DIRECTIONS };
