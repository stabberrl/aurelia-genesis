import assert from "node:assert/strict";
import test from "node:test";
import { AeraCodec } from "../src/bridge/aera-codec.mjs";
import { CognitiveGateway } from "../src/bridge/gateway.mjs";
import { createEvent } from "../src/bridge/protocol.mjs";

const perception = () => createEvent({
  id: "evt-1", soulId: "soul-001-alba-0001", type: "perception",
  subject: "garden", predicate: "light", value: { type: "number", data: 0.72 }, timestamp: 123,
});

test("un evento neutral se traduce al modelo oficial de datos de AERA", () => {
  const codec = new AeraCodec();
  const frame = codec.encode(perception());
  assert.equal(frame.messageType, "DATA");
  assert.equal(frame.dataMessage.variables[0].metaData.dataType, "DOUBLE");
  assert.equal(frame.dataMessage.variables[0].data, 0.72);
  assert.deepEqual(codec.setup().setupMessage.entities, { garden: 1 });
});

test("los identificadores AERA son estables dentro de una sesión", () => {
  const codec = new AeraCodec();
  const first = codec.encode(perception());
  const second = codec.encode({ ...perception(), id: "evt-2", value: { type: "number", data: 0.1 } });
  assert.equal(first.dataMessage.variables[0].metaData.entityID, second.dataMessage.variables[0].metaData.entityID);
});

test("el gateway separa el protocolo del transporte", async () => {
  let received;
  const gateway = new CognitiveGateway({ sink: async (frame) => { received = frame; return { accepted: true }; } });
  const result = await gateway.receive(perception());
  assert.equal(result.status, "accepted");
  assert.equal(received.genesis.soulId, "soul-001-alba-0001");
});

test("el protocolo rechaza tipos que AERA no puede interpretar", () => {
  assert.throws(() => createEvent({
    soulId: "soul", type: "thought", subject: "x", predicate: "y", value: { type: "object", data: {} },
  }), /Tipo de evento/);
});

test("el esquema bloqueado impide inyectar símbolos no nacidos", () => {
  const codec = new AeraCodec();
  codec.register({ entities: ["garden"], objects: ["light"] });
  codec.lockSchema();
  assert.throws(() => codec.encode({ ...perception(), predicate: "secret" }), /vocabulario sensorial/);
});
