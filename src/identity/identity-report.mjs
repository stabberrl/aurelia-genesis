function pct(value) { return `${Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100)}%`; }

export function buildIdentityReport({ genesis, state, development }) {
  const blueprint = genesis.initialBlueprint;
  const seed = blueprint.initialState;
  const drift = Object.fromEntries(["energy", "coherence", "curiosity", "trust"].map((key) => [key, Number(((state[key] ?? seed[key]) - seed[key]).toFixed(3))]));
  const driftMagnitude = Number((Object.values(drift).reduce((sum, value) => sum + Math.abs(value), 0) / 4).toFixed(3));
  return {
    soulId: blueprint.id, name: blueprint.name, world: blueprint.world, state, drift, driftMagnitude,
    strongestAssociations: development.strongestAssociations.slice(0, 5), recentEpisodes: development.recent.slice(0, 5),
    observed: { vocabulary: development.vocabulary, episodes: development.episodicMemories, associations: development.plasticAssociations, phase: development.developmentAssessment.phase.id },
  };
}

export function renderSoul(report) {
  const associations = report.strongestAssociations.length
    ? report.strongestAssociations.map(({ cue, predicate, weight }) => `- ${cue} → ${predicate} (${pct(weight)})`).join("\n")
    : "- Aún no hay asociaciones experienciales suficientemente fuertes.";
  const recent = report.recentEpisodes.length ? report.recentEpisodes.map(({ kind, label }) => `- ${kind}: ${label}`).join("\n") : "- Aún no hay episodios registrados.";
  return `# ${report.name}\n\n## Estado actual\n\n- Ánimo: ${report.state.mood || "sin registrar"}\n- Curiosidad: ${pct(report.state.curiosity)}\n- Energía: ${pct(report.state.energy)}\n\n## Patrones que se han reforzado\n\n${associations}\n\n## Experiencias recientes\n\n${recent}\n\nEste documento resume rastros observables de experiencia. No sustituye recuerdos ni afirma experiencia subjetiva.\n`;
}

export function renderIdentity(report) {
  const driftLines = Object.entries(report.drift).map(([key, value]) => `- ${key}: ${value >= 0 ? "+" : ""}${value}`).join("\n");
  return `# Registro de identidad — ${report.name}\n\n- Alma: ${report.soulId}\n- Fase observada: ${report.observed.phase}\n- Deriva cuantificada desde el estado inicial: ${pct(report.driftMagnitude)}\n\n## Deriva de estado\n\n${driftLines}\n\n## Evidencia\n\n- Vocabulario expuesto: ${report.observed.vocabulary}\n- Episodios: ${report.observed.episodes}\n- Asociaciones plásticas: ${report.observed.associations}\n\nLimitación: esta deriva mide cambios registrados, no personalidad humana, identidad subjetiva ni consciencia.\n`;
}
