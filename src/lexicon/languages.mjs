import path from "node:path";

export const LANGUAGE_MANIFEST = Object.freeze({
  es: { locale: "es", edition: "eswiktionary", sourceUrl: "https://kaikki.org/eswiktionary/raw-wiktextract-data.jsonl.gz" },
  en: { locale: "en", edition: "enwiktionary", sourceUrl: "https://kaikki.org/dictionary/raw-wiktextract-data.jsonl.gz" },
  ja: { locale: "ja", edition: "jawiktionary", sourceUrl: "https://kaikki.org/jawiktionary/raw-wiktextract-data.jsonl.gz" },
  ru: { locale: "ru", edition: "ruwiktionary", sourceUrl: "https://kaikki.org/ruwiktionary/raw-wiktextract-data.jsonl.gz" },
  it: { locale: "it", edition: "itwiktionary", sourceUrl: "https://kaikki.org/itwiktionary/raw-wiktextract-data.jsonl.gz" },
  fr: { locale: "fr", edition: "frwiktionary", sourceUrl: "https://kaikki.org/frwiktionary/raw-wiktextract-data.jsonl.gz" },
});

export const SUPPORTED_LANGUAGES = Object.freeze(Object.keys(LANGUAGE_MANIFEST));

export function validateLanguage(value) {
  if (!SUPPORTED_LANGUAGES.includes(value)) throw new TypeError(`Idioma cognitivo no compatible: ${value}.`);
  return value;
}

export function lexiconPath(languageCode, root = path.resolve("var", "lexicon")) {
  return path.join(root, `${validateLanguage(languageCode)}.sqlite`);
}

export function normalizeForLanguage(value, languageCode = "es") {
  validateLanguage(languageCode);
  const text = String(value || "").normalize("NFC").trim();
  return languageCode === "ja" ? text : text.toLocaleLowerCase(LANGUAGE_MANIFEST[languageCode].locale);
}

export function tokenizeForLanguage(text, languageCode = "es") {
  validateLanguage(languageCode);
  const normalized = String(text || "").normalize("NFC");
  if (languageCode === "ja") {
    if (typeof Intl.Segmenter !== "function") throw new Error("El entorno no dispone de segmentación japonesa segura.");
    return [...new Intl.Segmenter("ja", { granularity: "word" }).segment(normalized)]
      .filter(({ isWordLike }) => isWordLike).map(({ segment }) => normalizeForLanguage(segment, languageCode));
  }
  return (normalized.match(/[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu) || [])
    .map((word) => normalizeForLanguage(word, languageCode));
}
