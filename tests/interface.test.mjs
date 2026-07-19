import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("la entrada léxica permanece visible y accesible", async () => {
  const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await fs.readFile(new URL("../styles.css", import.meta.url), "utf8");
  const composer = html.match(/<form[^>]+id="composer"[^>]*>/)?.[0] || "";
  assert.ok(composer, "Falta el formulario de entrada.");
  assert.doesNotMatch(composer, /aria-hidden="true"/);
  assert.doesNotMatch(composer, /legacy-composer/);
  assert.doesNotMatch(css, /\.legacy-composer\s*\{[^}]*display:\s*none/i);
  assert.match(html, /id="brain-button"/);
  assert.match(html, /id="brain-map"/);
  assert.match(html, /id="neural-organism"/);
  assert.match(css, /\.neural-organism\s*\{/);
  assert.match(html, /id="language-select"/);
  assert.match(html, /<script src="i18n\.js"><\/script>/);
});
