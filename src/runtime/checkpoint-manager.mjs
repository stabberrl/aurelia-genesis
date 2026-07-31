import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_INTERVAL_MS = 5 * 60_000;
const DEFAULT_RETENTION = 24;

export class CheckpointManager {
  constructor({
    lexicons,
    soulsDir,
    checkpointDir = path.resolve("var", "checkpoints"),
    intervalMs = DEFAULT_INTERVAL_MS,
    retention = DEFAULT_RETENTION,
    stateProviders = [],
    now = () => new Date(),
  }) {
    if (!lexicons?.lexicons) throw new TypeError("Se requiere un registro de léxicos.");
    this.lexicons = lexicons;
    this.soulsDir = path.resolve(soulsDir);
    this.checkpointDir = path.resolve(checkpointDir);
    this.intervalMs = Math.max(30_000, Number(intervalMs) || DEFAULT_INTERVAL_MS);
    this.retention = Math.max(2, Math.min(100, Number(retention) || DEFAULT_RETENTION));
    this.stateProviders = [...stateProviders];
    this.now = now;
    this.timer = null;
    this.pending = null;
    this.lastResult = null;
  }

  async soulStateFiles() {
    const entries = await fs.readdir(this.soulsDir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("soul-")) continue;
      for (const name of ["GENESIS.json", "STATE.json"]) {
        const file = path.join(this.soulsDir, entry.name, name);
        try {
          const stat = await fs.stat(file);
          files.push({ soulId: entry.name, name, size: stat.size, modifiedAt: stat.mtime.toISOString() });
        } catch {}
      }
    }
    return files;
  }

  async status() {
    if (this.lastResult) return { ...this.lastResult, automaticIntervalMs: this.intervalMs, active: Boolean(this.timer) };
    try {
      const saved = JSON.parse(await fs.readFile(path.join(this.checkpointDir, "latest.json"), "utf8"));
      this.lastResult = saved;
      return { ...saved, automaticIntervalMs: this.intervalMs, active: Boolean(this.timer) };
    } catch {
      return { savedAt: null, reason: null, databases: [], soulFiles: [], automaticIntervalMs: this.intervalMs, active: Boolean(this.timer) };
    }
  }

  save(options = {}) {
    if (this.pending) return this.pending;
    this.pending = this.performSave(options).finally(() => { this.pending = null; });
    return this.pending;
  }

  async performSave({ reason = "manual", mode = "FULL" } = {}) {
    const safeMode = mode === "PASSIVE" ? "PASSIVE" : "FULL";
    await fs.mkdir(this.checkpointDir, { recursive: true });
    const savedAt = this.now().toISOString();
    const resumptions = [];
    try {
      for (const provider of this.stateProviders) {
        if (typeof provider.pauseForCheckpoint === "function") resumptions.push(await provider.pauseForCheckpoint());
      }
      const databases = [];
      for (const [language, lexicon] of this.lexicons.lexicons) {
        lexicon.db.exec(`PRAGMA wal_checkpoint(${safeMode});`);
        const development = {};
        for (const soulId of await this.soulIds()) development[soulId] = lexicon.development(soulId);
        const stat = await fs.stat(lexicon.databasePath);
        databases.push({
          language,
          path: path.relative(path.resolve("."), lexicon.databasePath),
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          development,
        });
      }
      const checkpoint = {
        schemaVersion: 1,
        savedAt,
        reason,
        databaseMode: "sqlite-wal-checkpoint",
        databases,
        soulFiles: await this.soulStateFiles(),
        providers: [],
      };
      for (const provider of this.stateProviders) checkpoint.providers.push(await provider.checkpoint(reason));
      const stamp = savedAt.replace(/[:.]/g, "-");
      const historyName = `checkpoint-${stamp}.json`;
      const temporary = path.join(this.checkpointDir, `.latest-${process.pid}.tmp`);
      await fs.writeFile(temporary, `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
      await fs.rename(temporary, path.join(this.checkpointDir, "latest.json"));
      await fs.writeFile(path.join(this.checkpointDir, historyName), `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
      await this.prune();
      this.lastResult = checkpoint;
      return { ...checkpoint, automaticIntervalMs: this.intervalMs, active: Boolean(this.timer) };
    } finally {
      for (const resume of resumptions.reverse()) resume();
    }
  }

  async soulIds() {
    const entries = await fs.readdir(this.soulsDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("soul-")).map((entry) => entry.name);
  }

  async prune() {
    const names = (await fs.readdir(this.checkpointDir))
      .filter((name) => /^checkpoint-[\dTZ-]+\.json$/.test(name))
      .sort()
      .reverse();
    for (const name of names.slice(this.retention)) await fs.unlink(path.join(this.checkpointDir, name));
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.save({ reason: "automatic", mode: "PASSIVE" })
        .catch((error) => console.error(`[checkpoint] ${error.message}`));
    }, this.intervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

export { DEFAULT_INTERVAL_MS, DEFAULT_RETENTION };
