import fs from "node:fs/promises";
import path from "node:path";
import { GenesisWorld } from "./genesis-world.mjs";

export class WorldRuntime {
  constructor({
    statePath = path.resolve("var", "worlds", "genesis-room-v1.json"),
    intervalMs = 250,
    onPerceptions = () => {},
  } = {}) {
    this.statePath = path.resolve(statePath);
    this.intervalMs = Math.max(50, Number(intervalMs) || 250);
    this.onPerceptions = onPerceptions;
    this.world = null;
    this.paused = true;
    this.speed = 1;
    this.timer = null;
    this.lastSavedAt = null;
  }

  async initialize() {
    try {
      const saved = JSON.parse(await fs.readFile(this.statePath, "utf8"));
      this.world = GenesisWorld.fromSerialized(saved.world || saved);
      this.world.expandToV2();
      this.paused = saved.runtime?.paused ?? true;
      this.speed = saved.runtime?.speed ?? 1;
      this.lastSavedAt = (await fs.stat(this.statePath)).mtime.toISOString();
    } catch {
      this.world = new GenesisWorld();
      this.world.expandToV2();
    }
    this.start();
    return this.status();
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (!this.paused) this.world.advance(this.speed);
    }, this.intervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async pauseForCheckpoint() {
    const wasPaused = this.paused;
    this.paused = true;
    return () => { this.paused = wasPaused; };
  }

  status() {
    return {
      ...this.world.summary(),
      runtime: {
        paused: this.paused,
        speed: this.speed,
        intervalMs: this.intervalMs,
        lastSavedAt: this.lastSavedAt,
      },
    };
  }

  control(command, value) {
    if (command === "pause") this.paused = true;
    else if (command === "resume") this.paused = false;
    else if (command === "step") {
      if (!this.paused) throw new Error("El paso individual requiere que el mundo esté en pausa.");
      this.world.advance(Math.max(1, Math.min(10_000, Number(value) || 1)));
    } else if (command === "speed") {
      const speed = Number(value);
      if (!Number.isInteger(speed) || speed < 1 || speed > 1_000) throw new TypeError("La velocidad debe ser un entero entre 1 y 1000.");
      this.speed = speed;
    } else throw new TypeError(`Control de mundo no compatible: ${command}.`);
    return this.status();
  }

  async act(soulId, action) {
    const result = this.world.act(soulId, action);
    await this.onPerceptions(soulId, result.perceptions, result.event);
    return result;
  }

  async checkpoint(reason = "checkpoint") {
    await fs.mkdir(path.dirname(this.statePath), { recursive: true });
    const temporary = `${this.statePath}.${process.pid}.tmp`;
    const payload = {
      savedAt: new Date().toISOString(),
      reason,
      world: this.world.serialize(),
      runtime: { paused: this.paused, speed: this.speed },
    };
    await fs.writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    await fs.rename(temporary, this.statePath);
    this.lastSavedAt = payload.savedAt;
    return {
      provider: "genesis-world",
      savedAt: payload.savedAt,
      path: this.statePath,
      tick: this.world.state.tick,
      seed: this.world.seed,
    };
  }
}
