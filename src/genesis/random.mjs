export function hashSeed(seed) {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRandom(seed) {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(random, collection) {
  return collection[Math.floor(random() * collection.length)];
}

export function uniquePicks(random, collection, count) {
  const available = [...collection];
  const selected = [];
  while (selected.length < count && available.length) {
    selected.push(available.splice(Math.floor(random() * available.length), 1)[0]);
  }
  return selected;
}

export function trait(random, center = 0.5, spread = 0.58) {
  const value = center + (random() - 0.5) * spread;
  return Number(Math.max(0.12, Math.min(0.88, value)).toFixed(2));
}
