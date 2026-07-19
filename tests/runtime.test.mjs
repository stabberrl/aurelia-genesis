import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolveSoulDirectory, validateMessage, validateSoulId } from "../src/runtime/registry.mjs";

test("el registro acepta solo identificadores de alma seguros", () => {
  assert.equal(validateSoulId("soul-001-alba-0001"), true);
  assert.equal(validateSoulId("../secrets"), false);
  assert.equal(validateSoulId("soul/../../admin"), false);
});

test("la ruta resuelta permanece dentro del directorio de almas", () => {
  const root = path.resolve("souls");
  assert.equal(resolveSoulDirectory(root, "soul-001-alba-0001"), path.join(root, "soul-001-alba-0001"));
  assert.throws(() => resolveSoulDirectory(root, "../outside"));
});

test("los mensajes vacíos o excesivos son rechazados", () => {
  assert.equal(validateMessage("  ").valid, false);
  assert.equal(validateMessage("a".repeat(1201)).valid, false);
  assert.deepEqual(validateMessage(" hola "), { valid: true, message: "hola" });
});
