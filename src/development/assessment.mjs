export const DEVELOPMENT_PHASES = Object.freeze([
  { id: "nascent", label: "Naciente", minimum: 0, limit: "Sólo observación y registro sensorial." },
  { id: "early", label: "Desarrollo temprano", minimum: 0.15, limit: "Asociación sensorial y vocabulario supervisado." },
  { id: "middle", label: "Desarrollo medio", minimum: 0.35, limit: "Discriminación contextual y consolidación interna." },
  { id: "advanced", label: "Desarrollo avanzado", minimum: 0.60, limit: "Puede proponer acciones internas; las externas requieren autorización." },
  { id: "high", label: "Desarrollo alto", minimum: 0.82, limit: "Autonomía interna ampliada; nunca elimina controles de seguridad." },
]);

const clamp = (value) => Math.max(0, Math.min(1, Number(value) || 0));

export function assessDevelopment(metrics) {
  const dimensions = {
    experience: clamp(metrics.episodicMemories / 120),
    grounding: clamp(((metrics.plasticAssociations / 24) + (metrics.groundingSamples / 120)) / 2),
    language: clamp(metrics.foundationalConcepts / 4),
    diversity: clamp(metrics.sensoryChannels / 4),
    autonomy: clamp(metrics.heartbeatCount / 80),
  };
  const score = dimensions.experience * 0.25 + dimensions.grounding * 0.25
    + dimensions.language * 0.20 + dimensions.diversity * 0.15 + dimensions.autonomy * 0.15;
  const phaseIndex = DEVELOPMENT_PHASES.reduce((selected, phase, index) => score >= phase.minimum ? index : selected, 0);
  const phase = DEVELOPMENT_PHASES[phaseIndex];
  const next = DEVELOPMENT_PHASES[phaseIndex + 1] || null;
  const capabilities = ["perceive", "remember"];
  if (phaseIndex >= 1) capabilities.push("associate", "supervisedVocabulary");
  if (phaseIndex >= 2) capabilities.push("contextDiscrimination", "memoryConsolidation");
  if (phaseIndex >= 3) capabilities.push("proposeInternalActions");
  if (phaseIndex >= 4) capabilities.push("extendedInternalAutonomy");
  const all = ["perceive", "remember", "associate", "supervisedVocabulary", "contextDiscrimination", "memoryConsolidation", "proposeInternalActions", "extendedInternalAutonomy"];
  return {
    schemaVersion: 1,
    score,
    phase: { ...phase, index: phaseIndex },
    nextPhase: next ? { id: next.id, label: next.label, minimum: next.minimum, remaining: Math.max(0, next.minimum - score) } : null,
    dimensions,
    capabilities,
    lockedCapabilities: all.filter((capability) => !capabilities.includes(capability)),
    disclaimer: "Estimación experimental basada en métricas observables; no mide consciencia, inteligencia general ni valor moral y será revisada conforme avance la investigación.",
  };
}
