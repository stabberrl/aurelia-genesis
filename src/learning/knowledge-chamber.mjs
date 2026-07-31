import { createHash } from "node:crypto";

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const MAX_DOCUMENT_CHARS = 48_000;

function clean(value, maximum = 12_000) {
  return String(value || "").replace(CONTROL, "").replace(/\s+/g, " ").trim().slice(0, maximum);
}

function sourceName(url) { return new URL(url).hostname.replace(/^www\./, ""); }

function publicHttpsUrl(value) {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:") throw new TypeError("La fuente debe usar HTTPS.");
  if (host === "localhost" || host.endsWith(".localhost") || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host === "[::1]") {
    throw new TypeError("No se permiten direcciones locales o privadas.");
  }
  return url;
}

function extractHtml(html) {
  const title = clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.replace(/<[^>]+>/g, " "), 180) || "Fuente sin título";
  const text = clean(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|section|article|h[1-6]|li|br)>/gi, ". ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&"), MAX_DOCUMENT_CHARS);
  return { title, text };
}

function fragment(text, maximum = 260, limit = 12) {
  const sentences = clean(text, MAX_DOCUMENT_CHARS).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const output = [];
  let current = "";
  for (const sentence of sentences) {
    const next = clean(`${current} ${sentence}`, maximum + 1);
    if (next.length > maximum && current) { output.push(current); current = clean(sentence, maximum); }
    else current = next;
    if (output.length >= limit) break;
  }
  if (current && output.length < limit) output.push(current);
  return output.filter((item) => item.length >= 24);
}

export class KnowledgeChamber {
  constructor({ worldRuntime, lexiconFor, fetchFn = globalThis.fetch, translationUrl = process.env.FLUCTLIGHT_LIBRETRANSLATE_URL || "http://127.0.0.1:5000/translate" } = {}) {
    if (!worldRuntime || typeof lexiconFor !== "function" || typeof fetchFn !== "function") throw new TypeError("La cámara requiere mundo, léxico y transporte.");
    this.worldRuntime = worldRuntime;
    this.lexiconFor = lexiconFor;
    this.fetchFn = fetchFn;
    this.translationUrl = translationUrl;
  }

  status() { return { translation: { engine: "LibreTranslate", configured: Boolean(this.translationUrl), url: this.translationUrl }, maximumDocumentChars: MAX_DOCUMENT_CHARS }; }

  async translate(text, sourceLanguage, targetLanguage) {
    if (sourceLanguage === targetLanguage) return text;
    if (!this.translationUrl) throw new Error("No hay traductor local configurado.");
    const response = await this.fetchFn(this.translationUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: text, source: sourceLanguage, target: targetLanguage, format: "text" }) });
    if (!response.ok) throw new Error(`El traductor local respondió ${response.status}.`);
    const payload = await response.json();
    const translated = clean(payload?.translatedText, MAX_DOCUMENT_CHARS);
    if (translated.length < 24) throw new Error("El traductor no devolvió contenido suficiente.");
    return translated;
  }

  async ingest({ soulId, url, sourceLanguage, targetLanguage, now = Date.now() * 1000 }) {
    const source = publicHttpsUrl(url);
    const response = await this.fetchFn(source, { redirect: "error", headers: { Accept: "text/html,text/plain;q=0.9", "User-Agent": "Aurelia-Genesis/0.1 knowledge-chamber" } });
    if (!response.ok) throw new Error(`La fuente respondió ${response.status}.`);
    const type = response.headers.get("content-type") || "";
    if (!/^text\/(html|plain)/i.test(type)) throw new Error("La fuente no entregó texto HTML o plano.");
    const raw = await response.text();
    const extracted = type.includes("html") ? extractHtml(raw) : { title: sourceName(source), text: clean(raw, MAX_DOCUMENT_CHARS) };
    if (extracted.text.length < 120) throw new Error("La fuente no contiene texto suficiente para distribuir.");
    const translated = await this.translate(extracted.text, sourceLanguage, targetLanguage);
    const fragments = fragment(translated);
    if (!fragments.length) throw new Error("No se pudieron formar fragmentos de conocimiento.");
    const contentHash = createHash("sha256").update(`${source.href}\n${translated}`).digest("hex");
    const lexicon = this.lexiconFor(targetLanguage);
    const observation = lexicon.recordExternalObservation(soulId, { term: extracted.title, sourceName: sourceName(source), sourceUrl: source.href, excerpt: fragments[0], contentHash, status: "staged", rejectionReason: "", observedAt: now });
    const staged = this.worldRuntime.world.addKnowledgeFragments({ sourceUrl: source.href, sourceName: sourceName(source), sourceTitle: extracted.title, language: targetLanguage, contentHash, fragments });
    return { status: "staged", observation, source: { title: extracted.title, url: source.href, sourceLanguage, targetLanguage, contentHash }, fragments: staged };
  }
}
