import { createRandom, pick, trait, uniquePicks } from "./random.mjs";
import { aptitudes, aversions, conflicts, limitations, moods, names, tastes } from "./catalog.mjs";

const TRAITS = ["honestyHumility", "emotionality", "extraversion", "agreeableness", "conscientiousness", "openness"];

function makeId(seed, slot) {
  const compact = seed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `soul-${String(slot).padStart(3, "0")}-${compact.slice(-9)}`;
}

function makeHexaco(random) {
  const profile = Object.fromEntries(TRAITS.map((name) => [name, trait(random)]));
  const highest = TRAITS.reduce((best, current) => profile[current] > profile[best] ? current : best);
  const lowest = TRAITS.reduce((worst, current) => profile[current] < profile[worst] ? current : worst);
  if (profile[highest] - profile[lowest] < 0.22) {
    profile[highest] = Number(Math.min(0.88, profile[highest] + 0.12).toFixed(2));
    profile[lowest] = Number(Math.max(0.12, profile[lowest] - 0.12).toFixed(2));
  }
  return profile;
}

export function createSoulBlueprint({ seed, slot, world }) {
  if (!seed || !Number.isInteger(slot) || slot < 1) throw new Error("Cada nacimiento requiere seed y slot válido.");
  const random = createRandom(seed);
  const conflict = pick(random, conflicts);
  const nameOffset = Math.floor(random() * names.length);
  const name = names[(nameOffset + slot - 1) % names.length];
  const hexaco = makeHexaco(random);
  const selectedTastes = uniquePicks(random, tastes, 3);
  const selectedAversions = uniquePicks(random, aversions, 2);

  return {
    id: makeId(seed, slot),
    name,
    seed,
    slot,
    world,
    hexaco,
    temperament: {
      defaultMood: pick(random, moods),
      allowedMoods: uniquePicks(random, moods, 4),
    },
    inclinations: {
      tastes: selectedTastes,
      aversions: selectedAversions,
      aptitude: pick(random, aptitudes),
      limitation: pick(random, limitations),
    },
    innerConflict: conflict,
    needs: Object.fromEntries(conflict.needs.map((need) => [need, Number((0.42 + random() * 0.28).toFixed(2))])),
    initialState: {
      mood: "despertando",
      energy: Number((0.58 + random() * 0.22).toFixed(2)),
      coherence: Number((0.64 + random() * 0.2).toFixed(2)),
      curiosity: Number((0.38 + hexaco.openness * 0.45).toFixed(2)),
      trust: Number((0.08 + hexaco.agreeableness * 0.12).toFixed(2)),
    },
  };
}

export function createPopulation(births, world) {
  const blueprints = births.map((birth) => createSoulBlueprint({ ...birth, world }));
  const assignedNames = new Set();

  for (const blueprint of blueprints) {
    let candidateIndex = names.indexOf(blueprint.name);
    while (assignedNames.has(names[candidateIndex])) {
      candidateIndex = (candidateIndex + 1) % names.length;
      if (names.every((name) => assignedNames.has(name))) {
        throw new Error("El catálogo de nombres no tiene capacidad para esta población.");
      }
    }
    blueprint.name = names[candidateIndex];
    assignedNames.add(blueprint.name);
  }

  validatePopulation(blueprints);
  return blueprints;
}

export function validatePopulation(blueprints) {
  const ids = new Set(blueprints.map(({ id }) => id));
  const namesFound = new Set(blueprints.map(({ name }) => name));
  const signatures = new Set(blueprints.map(({ hexaco }) => JSON.stringify(hexaco)));
  if (ids.size !== blueprints.length) throw new Error("Genesis produjo identificadores duplicados.");
  if (namesFound.size !== blueprints.length) throw new Error("Genesis produjo nombres duplicados.");
  if (signatures.size !== blueprints.length) throw new Error("Genesis produjo personalidades duplicadas.");
  return true;
}
