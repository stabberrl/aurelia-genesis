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

test("la consola de investigación permanece separada y usa datos del runtime", async () => {
  const html = await fs.readFile(new URL("../research.html", import.meta.url), "utf8");
  const js = await fs.readFile(new URL("../research.js", import.meta.url), "utf8");
  const css = await fs.readFile(new URL("../research.css", import.meta.url), "utf8");
  assert.match(html, /Consola de investigación/);
  assert.match(html, /Asistente adaptativo/);
  assert.match(html, /Consciencia sintética/);
  assert.match(html, /Vida artificial desde cero/);
  assert.match(html, /no demuestran consciencia/i);
  assert.match(js, /\/api\/development/);
  assert.match(js, /\/api\/concepts/);
  assert.match(js, /\/api\/heartbeat/);
  assert.match(css, /\.workspace\s*\{/);
  assert.match(html, /id="brain-network"/);
  assert.match(html, /id="activity-chart"/);
  assert.match(html, /no es un escaneo neuronal/i);
  assert.match(js, /function sampleLive/);
  assert.match(html, /id="emergency-save"/);
  assert.match(js, /\/api\/checkpoints/);
  assert.match(html, /id="world-map"/);
  assert.match(html, /id="world-actions"/);
  assert.match(js, /\/api\/world\/action/);
  assert.match(html, /id="infancy-toggle"/);
  assert.match(html, /id="object-knowledge"/);
  assert.match(html, /id="workspace-focus"/);
  assert.match(html, /id="body-form"/);
  assert.match(js, /body-capabilities/);
  assert.match(js, /workspace\.focus/);
  assert.match(js, /\/api\/world\/controller/);
  assert.match(html, /chamber\.html/);
  assert.match(html, /identity-magnitude/);
  assert.match(html, /comparison-panel/);
  assert.match(js, /\/api\/identity\/drift/);
  assert.match(js, /\/api\/learning\/budget/);
  assert.match(js, /decayedAssociations/);
  assert.match(js, /foundational-language-v1\.json/);
});

test("la interfaz experiencial ofrece acceso a la observación 3D", async () => {
  const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /chamber-3d\.html/);
});

test("la cámara de conocimiento se mantiene en una ventana y catálogo separados", async () => {
  const html = await fs.readFile(new URL("../chamber.html", import.meta.url), "utf8");
  const js = await fs.readFile(new URL("../chamber.js", import.meta.url), "utf8");
  assert.match(html, /Cámara de conocimiento/);
  assert.match(html, /sexo biológico/i);
  assert.match(html, /identidad de género/i);
  assert.match(html, /consentimiento/i);
  assert.match(js, /biological-social-seeds\.es\.json/);
  assert.match(html, /ningún texto se envía a un alma/i);
});

test("la cámara 3D representa el runtime sin convertirse en un controlador", async () => {
  const html = await fs.readFile(new URL("../chamber-3d.html", import.meta.url), "utf8");
  const js = await fs.readFile(new URL("../chamber-3d.js", import.meta.url), "utf8");
  const telemetry = await fs.readFile(new URL("../chamber-3d-data.js", import.meta.url), "utf8");
  assert.match(html, /Cámara 3D/);
  assert.match(html, /id="world-3d"/);
  assert.match(html, /No es un motor de decisión/i);
  assert.match(js, /assets\/three\.module\.js/);
  assert.match(js, /\/api\/world/);
  assert.match(html, /chamber-3d-data\.js/);
  assert.match(telemetry, /\/api\/world/);
  assert.match(telemetry, /genesis-world-update/);
  assert.doesNotMatch(js, /\/api\/world\/action/);
  assert.match(html, /data-view="subject"/);
});
