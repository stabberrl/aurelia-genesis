import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { normalizeForLanguage, tokenizeForLanguage } from "../src/lexicon/languages.mjs";
import { LexiconRegistry } from "../src/lexicon/registry.mjs";

test("normaliza cada escritura sin borrar distinciones relevantes", () => {
  assert.equal(normalizeForLanguage("ÉCOLE", "fr"), "école");
  assert.equal(normalizeForLanguage("ЁЛКА", "ru"), "ёлка");
  assert.notEqual(normalizeForLanguage("ЁЛКА", "ru"), normalizeForLanguage("ЕЛКА", "ru"));
  assert.deepEqual(tokenizeForLanguage("私は光を見る", "ja"), ["私", "は", "光", "を", "見る"]);
});

test("los seis léxicos fundacionales permanecen aislados", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "aurelia-languages-"));
  const registry = new LexiconRegistry({ directory });
  try {
    assert.equal(registry.get("es").find("yo")[0].languageCode, "es");
    assert.equal(registry.get("en").find("I")[0].languageCode, "en");
    assert.equal(registry.get("ja").find("私")[0].languageCode, "ja");
    assert.equal(registry.get("ru").find("я")[0].languageCode, "ru");
    assert.equal(registry.get("it").find("sì")[0].languageCode, "it");
    assert.equal(registry.get("fr").find("oui")[0].languageCode, "fr");
    registry.get("en").encounter("naia", "no");
    assert.equal(registry.get("en").development("naia").vocabulary, 1);
    assert.equal(registry.get("es").development("naia").vocabulary, 0);
    assert.equal(registry.get("it").development("naia").vocabulary, 0);
  } finally {
    registry.close();
    await fs.rm(directory, { recursive: true, force: true });
  }
});
