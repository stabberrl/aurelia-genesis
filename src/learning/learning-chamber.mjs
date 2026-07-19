import { createHash } from "node:crypto";

const DEFAULT_TERMS = ["yo", "tú", "sí", "no", "ser", "existir", "hablar", "escuchar", "tiempo", "espacio"];
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function clean(value, maximum = 900) {
  return String(value || "").replace(CONTROL_CHARACTERS, "").replace(/\s+/g, " ").trim().slice(0, maximum);
}

function plainTextFromWikitext(value, maximum) {
  let text = String(value || "").replace(/<!--[\s\S]*?-->/g, " ").replace(/<ref\b[^>]*>[\s\S]*?<\/ref>|<ref\b[^/>]*\/>/gi, " ");
  for (let pass = 0; pass < 6; pass += 1) text = text.replace(/\{\{[^{}]*\}\}/g, " ");
  text = text
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*[|!].*$/gm, " ")
    .replace(/={2,}|'{2,}|[#*:;]+/g, " ");
  return clean(text, maximum);
}

export class LearningChamber {
  constructor(lexicon, {
    fetchFn = globalThis.fetch,
    terms = DEFAULT_TERMS,
    minimumIntervalMs = 180_000,
    maximumExcerptLength = 900,
  } = {}) {
    if (typeof fetchFn !== "function") throw new Error("La cámara necesita un transporte de lectura.");
    this.lexicon = lexicon;
    this.fetchFn = fetchFn;
    this.terms = [...new Set(terms.map((term) => clean(term, 64)).filter(Boolean))];
    this.minimumIntervalMs = Math.max(10_000, Number(minimumIntervalMs) || 180_000);
    this.maximumExcerptLength = Math.max(120, Math.min(Number(maximumExcerptLength) || 900, 2_000));
    this.sequence = new Map();
    this.lastRun = new Map();
    this.timers = new Map();
  }

  sourceUrl(term) {
    const host = this.lexicon.languageCode === "es" ? "es.wiktionary.org" : `${this.lexicon.languageCode}.wiktionary.org`;
    const query = new URLSearchParams({ action: "parse", page: term, prop: "wikitext", redirects: "1", format: "json", origin: "*" });
    return `https://${host}/w/api.php?${query}`;
  }

  async observe(soulId, term, { now = Date.now() * 1000 } = {}) {
    const safeTerm = clean(term, 64);
    if (!safeTerm || /[<>\r\n]/.test(safeTerm)) throw new Error("Término externo no válido.");
    const requestUrl = this.sourceUrl(safeTerm);
    const response = await this.fetchFn(requestUrl, { headers: { Accept: "application/json", "User-Agent": "Aurelia-Genesis/0.1 learning-chamber" } });
    if (!response.ok) throw new Error(`La fuente respondió con estado ${response.status}.`);
    const payload = await response.json();
    const page = payload?.parse;
    const excerpt = plainTextFromWikitext(page?.wikitext?.["*"], this.maximumExcerptLength);
    const canonicalTitle = clean(page?.title || safeTerm, 64);
    const sourceUrl = `https://${new URL(requestUrl).host}/wiki/${encodeURIComponent(canonicalTitle.replace(/ /g, "_"))}`;
    const rejectionReason = payload?.error || !page ? "missing-entry" : excerpt.length < 24 ? "insufficient-content" : "";
    const status = rejectionReason ? "rejected" : "accepted";
    const contentHash = createHash("sha256").update(`${canonicalTitle}\n${excerpt}`).digest("hex");
    const observation = this.lexicon.recordExternalObservation(soulId, {
      term: canonicalTitle, sourceName: "Wiktionary", sourceUrl, excerpt, contentHash,
      status, rejectionReason, observedAt: now,
    });
    const exposure = status === "accepted" && observation.recorded
      ? this.lexicon.exposeExternalTerm(soulId, canonicalTitle, new Date(Math.floor(now / 1000)).toISOString())
      : { exposed: false, reason: status !== "accepted" ? "observation-rejected" : "duplicate-observation" };
    return { ...observation, exposure };
  }

  async tick(soulId, { now = Date.now() * 1000 } = {}) {
    const last = this.lastRun.get(soulId) || 0;
    if (now - last < this.minimumIntervalMs * 1000) return { status: "rate-limited", soulId, nextAt: last + this.minimumIntervalMs * 1000 };
    const index = this.sequence.get(soulId) || 0;
    const term = this.terms[index % this.terms.length];
    const result = await this.observe(soulId, term, { now });
    this.sequence.set(soulId, index + 1);
    this.lastRun.set(soulId, now);
    return { status: result.status, soulId, term, observation: result };
  }

  start(soulIds) {
    for (const soulId of soulIds) {
      if (this.timers.has(soulId)) continue;
      const run = () => this.tick(soulId).catch((error) => console.error(`[learning-chamber] ${soulId}: ${error.message}`));
      run();
      this.timers.set(soulId, setInterval(run, this.minimumIntervalMs));
    }
  }

  stop() {
    for (const timer of this.timers.values()) clearInterval(timer);
    this.timers.clear();
  }
}

export { DEFAULT_TERMS };
