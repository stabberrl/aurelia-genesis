import assert from "node:assert/strict";
import test from "node:test";
import { aeraScript } from "../scripts/aera-command.mjs";

test("el selector de AERA conserva PowerShell en Windows", () => {
  assert.deepEqual(aeraScript("build", "win32"), {
    executable: "powershell",
    args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "scripts/build-aera.ps1"],
  });
});

test("el selector de AERA usa scripts shell fuera de Windows", () => {
  assert.deepEqual(aeraScript("start", "linux"), {
    executable: "bash", args: ["scripts/start-aera.sh"],
  });
  assert.deepEqual(aeraScript("build", "darwin"), {
    executable: "bash", args: ["scripts/build-aera.sh"],
  });
});

test("el selector rechaza comandos de AERA no definidos", () => {
  assert.throws(() => aeraScript("remove", "linux"), /no reconocido/i);
});
