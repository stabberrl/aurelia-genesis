import { spawn } from "node:child_process";
import path from "node:path";

export function aeraScript(command, platform = process.platform) {
  if (!new Set(["build", "start"]).has(command)) throw new Error(`Comando AERA no reconocido: ${command}`);
  if (platform === "win32") return { executable: "powershell", args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", `scripts/${command}-aera.ps1`] };
  return { executable: "bash", args: [`scripts/${command}-aera.sh`] };
}

export function runAeraCommand(command, { platform = process.platform, cwd = process.cwd(), stdio = "inherit" } = {}) {
  const selected = aeraScript(command, platform);
  return new Promise((resolve, reject) => {
    const child = spawn(selected.executable, selected.args, { cwd: path.resolve(cwd), stdio });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`AERA ${command} terminó con código ${code}.`)));
  });
}

if (import.meta.main) {
  const command = process.argv[2];
  await runAeraCommand(command);
}
