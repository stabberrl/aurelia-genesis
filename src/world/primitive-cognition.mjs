function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function mean(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function signature(perceptions) {
  const energy = Math.floor(clamp(perceptions.internal.energy) * 4);
  const fatigue = Math.floor(clamp(perceptions.internal.fatigue) * 4);
  const visible = perceptions.visibleObjects
    .map((object) => `${object.color}:${Math.abs(object.relativeX) + Math.abs(object.relativeY)}`)
    .sort()
    .join("|") || "none";
  return `e${energy}:f${fatigue}:o${visible}`;
}

function initialState() {
  return {
    schemaVersion: 1,
    episodes: [],
    transitionModel: {},
    affordances: {},
    concepts: {},
    totalPredictions: 0,
    meanPredictionError: 0,
    lastPrediction: null,
    lastSurprise: 0,
    drives: { energy: 0, rest: 0, curiosity: 1 },
  };
}

/**
 * Memoria predictiva pequeña y explícita. No produce lenguaje ni atribuye
 * experiencia subjetiva: estima qué consecuencias suelen seguir a una acción.
 */
export class PrimitiveCognition {
  constructor(state = null) {
    this.state = structuredClone(state || initialState());
    this.state.schemaVersion = 1;
    this.state.episodes ||= [];
    this.state.transitionModel ||= {};
    this.state.affordances ||= {};
    this.state.concepts ||= {};
  }

  observe(perceptions, visitedCells = []) {
    const unexplored = Math.max(0, (perceptions.space.width * perceptions.space.height) - visitedCells.length);
    this.state.drives = {
      energy: clamp((0.82 - perceptions.internal.energy) / 0.82),
      rest: clamp((perceptions.internal.fatigue - 0.6) / 0.4),
      curiosity: clamp(unexplored / Math.max(1, perceptions.space.width * perceptions.space.height)),
    };
    for (const object of perceptions.visibleObjects) {
      const id = `object:${object.color}`;
      this.state.concepts[id] ||= { observations: 0, label: object.color, kind: "visible-object" };
      this.state.concepts[id].observations += 1;
    }
    return structuredClone(this.state.drives);
  }

  predict(perceptions, action) {
    const context = signature(perceptions);
    const record = this.state.transitionModel[`${context}|${action}`];
    if (!record?.count) return { context, action, confidence: 0, expectedReward: 0, expectedOutcome: "unknown" };
    const outcomes = Object.entries(record.outcomes).sort((a, b) => b[1] - a[1]);
    return {
      context,
      action,
      confidence: clamp(record.count / 8),
      expectedReward: record.rewardSum / record.count,
      expectedOutcome: outcomes[0]?.[0] || "unknown",
    };
  }

  record({ perceptions, action, result, decision, visitedCells = [] }) {
    const prediction = this.predict(perceptions, action);
    const surprise = clamp((Math.abs(result.event.reward - prediction.expectedReward) + (prediction.expectedOutcome !== "unknown" && prediction.expectedOutcome !== result.event.outcome ? 0.4 : 0)) / 1.4);
    const modelKey = `${prediction.context}|${action}`;
    const record = this.state.transitionModel[modelKey] ||= { count: 0, rewardSum: 0, outcomes: {} };
    record.count += 1;
    record.rewardSum += result.event.reward;
    record.outcomes[result.event.outcome] = (record.outcomes[result.event.outcome] || 0) + 1;
    this.state.totalPredictions += 1;
    this.state.meanPredictionError += (surprise - this.state.meanPredictionError) / this.state.totalPredictions;
    this.state.lastPrediction = prediction;
    this.state.lastSurprise = surprise;

    if (decision.objectId && action === "consume") {
      const affordance = this.state.affordances[decision.objectId] ||= { attempts: 0, rewards: [], role: "unknown" };
      affordance.attempts += 1;
      affordance.rewards.push(result.event.reward);
      affordance.rewards = affordance.rewards.slice(-32);
      const average = mean(affordance.rewards);
      affordance.meanReward = average;
      affordance.role = average > 0.05 ? "restorative" : average < -0.05 ? "costly" : "neutral";
    }

    this.state.episodes.unshift({
      tick: result.event.tick,
      context: prediction.context,
      action,
      outcome: result.event.outcome,
      reward: result.event.reward,
      surprise,
      motive: decision.reason,
      drives: structuredClone(this.observe(result.perceptions, visitedCells)),
    });
    this.state.episodes = this.state.episodes.slice(0, 300);
    return { prediction, surprise };
  }

  priority(perceptions, visitedCells) {
    const drives = this.observe(perceptions, visitedCells);
    if (drives.rest >= 0.5) return "rest";
    if (drives.energy >= 0.25) return "restore-energy";
    return "explore";
  }

  status() {
    return structuredClone(this.state);
  }
}
