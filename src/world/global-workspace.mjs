function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, Number(value) || 0));
}

function initialState() {
  return { schemaVersion: 1, cycleCount: 0, focus: null, candidates: [], broadcasts: [], lastOutcome: null };
}

/** Pizarra de integración funcional; no afirma experiencia subjetiva. */
export class GlobalWorkspace {
  constructor(state = null) {
    this.state = structuredClone(state || initialState());
    this.state.schemaVersion = 1;
    this.state.broadcasts ||= [];
    this.state.candidates ||= [];
  }

  cycle({ perceptions, cognition, knownObjects = {}, learnedObjects = {} }) {
    const drives = cognition.drives || {};
    const candidates = [
      { id: "body:energy", source: "interoception", kind: "restore-energy", salience: clamp(drives.energy), detail: "energía disponible por debajo del umbral" },
      { id: "body:fatigue", source: "interoception", kind: "rest", salience: clamp(drives.rest), detail: "fatiga corporal elevada" },
      { id: "world:novelty", source: "perception", kind: "explore", salience: clamp(drives.curiosity), detail: "espacio todavía no visitado" },
      { id: "model:surprise", source: "prediction", kind: "inspect-surprise", salience: clamp(cognition.lastSurprise), detail: "diferencia entre consecuencia esperada y observada" },
    ];
    for (const object of Object.values(knownObjects)) {
      const learning = learnedObjects[object.id];
      if (!learning || learning.classification === "unknown") candidates.push({ id: `object:${object.id}`, source: "perception", kind: "investigate", salience: .62, objectId: object.id, detail: `objeto ${object.color} sin consecuencia conocida` });
    }
    candidates.sort((a, b) => b.salience - a.salience || a.id.localeCompare(b.id));
    const focus = candidates[0] || null;
    this.state.cycleCount += 1;
    this.state.candidates = candidates;
    this.state.focus = focus ? { ...focus, tick: perceptions.tick, cycle: this.state.cycleCount } : null;
    this.state.broadcasts.unshift({ ...this.state.focus, channels: ["memory", "prediction", "action-selection"], atTick: perceptions.tick });
    this.state.broadcasts = this.state.broadcasts.slice(0, 100);
    return structuredClone(this.state.focus);
  }

  recordOutcome({ event, surprise }) {
    this.state.lastOutcome = { tick: event.tick, outcome: event.outcome, reward: event.reward, surprise: clamp(surprise), focusId: this.state.focus?.id || null };
    return structuredClone(this.state.lastOutcome);
  }

  status() { return structuredClone(this.state); }
}
