import readline from "node:readline";
import { AeraCodec } from "./aera-codec.mjs";
import { resultFor, validateEvent } from "./protocol.mjs";

export class CognitiveGateway {
  constructor({ sink } = {}) {
    this.codec = new AeraCodec();
    this.sink = sink || (async () => ({ accepted: false, reason: "AERA no está iniciado." }));
  }

  async receive(input) {
    const event = validateEvent(input);
    const frame = this.codec.encode(event);
    const outcome = await this.sink(frame, this.codec.setup());
    return resultFor(event, outcome.accepted ? "accepted" : "unavailable", outcome);
  }
}

export async function runJsonLines({ input = process.stdin, output = process.stdout, gateway = new CognitiveGateway() } = {}) {
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    try {
      output.write(`${JSON.stringify(await gateway.receive(JSON.parse(line)))}\n`);
    } catch (error) {
      output.write(`${JSON.stringify({ protocol: "genesis-cognitive/1", status: "rejected", error: error.message })}\n`);
    }
  }
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll("\\", "/")}`).href) {
  await runJsonLines();
}
