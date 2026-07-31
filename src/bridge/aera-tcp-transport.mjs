import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import protobuf from "protobufjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const protoPath = path.resolve(here, "../../vendor/aera/AERA/IODevices/TCP/AERA_Protobuf/tcp_data_message.proto");
const messageTypes = { SETUP: 0, DATA: 1, START: 2, STOP: 3, RECONNECT: 4 };
const dataTypes = { DOUBLE: 0, INT64: 3, BOOL: 12, STRING: 13, BYTES: 14, COMMUNICATION_ID: 15 };

function bytesFor(type, value) {
  if (type === "DOUBLE") {
    const bytes = Buffer.allocUnsafe(8); bytes.writeDoubleLE(value); return bytes;
  }
  if (type === "INT64" || type === "COMMUNICATION_ID") {
    const bytes = Buffer.allocUnsafe(8); bytes.writeBigInt64LE(BigInt(value)); return bytes;
  }
  if (type === "BOOL") return Buffer.from([value ? 1 : 0]);
  if (type === "STRING") return Buffer.from(value, "utf8");
  return Buffer.from(value);
}

function valueFor(type, bytes) {
  if (type === "DOUBLE" && bytes.length >= 8) return bytes.readDoubleLE(0);
  if ((type === "INT64" || type === "COMMUNICATION_ID") && bytes.length >= 8) return Number(bytes.readBigInt64LE(0));
  if (type === "BOOL") return Boolean(bytes[0]);
  if (type === "STRING") return bytes.toString("utf8");
  return Buffer.from(bytes);
}

export class AeraTcpTransport {
  constructor({ host = "127.0.0.1", port = 8080, setup, onData = () => {} }) {
    this.host = host;
    this.port = port;
    this.setup = setup;
    this.socket = null;
    this.ready = false;
    this.server = null;
    this.buffer = Buffer.alloc(0);
    this.lastMessageType = null;
    this.onData = onData;
  }

  async start() {
    const root = await protobuf.load(protoPath);
    this.TCPMessage = root.lookupType("tcp_io_device.TCPMessage");
    this.server = net.createServer((socket) => this.#connect(socket));
    await new Promise((resolve, reject) => this.server.once("error", reject).listen(this.port, this.host, resolve));
  }

  #connect(socket) {
    if (this.socket) this.socket.destroy();
    this.socket = socket;
    this.ready = false;
    this.buffer = Buffer.alloc(0);
    socket.on("data", (chunk) => this.#receive(chunk));
    socket.on("error", () => {
      if (this.socket === socket) { this.socket = null; this.ready = false; }
    });
    socket.on("close", () => { if (this.socket === socket) { this.socket = null; this.ready = false; } });
    this.#write({ messageType: messageTypes.SETUP, setupMessage: this.setup.setupMessage, timestamp: 0 });
  }

  #receive(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 8) {
      const size = Number(this.buffer.readBigUInt64LE(0));
      if (size > 16_777_216) { this.socket.destroy(new Error("Trama AERA excesiva.")); return; }
      if (this.buffer.length < 8 + size) return;
      const message = this.TCPMessage.decode(this.buffer.subarray(8, 8 + size));
      this.lastMessageType = message.messageType;
      this.buffer = this.buffer.subarray(8 + size);
      if (message.messageType === messageTypes.START) this.ready = true;
      if (message.messageType === messageTypes.DATA) {
        for (const variable of message.dataMessage?.variables || []) {
          const type = Object.entries(dataTypes).find(([, id]) => id === variable.metaData?.dataType)?.[0] || "BYTES";
          this.onData({
            timestamp: Number(message.timestamp || 0),
            entityId: Number(variable.metaData?.entityID),
            id: Number(variable.metaData?.ID),
            dataType: type,
            value: valueFor(type, Buffer.from(variable.data || [])),
          });
        }
      }
    }
  }

  #write(value) {
    if (!this.socket) return false;
    const payload = Buffer.from(this.TCPMessage.encode(this.TCPMessage.create(value)).finish());
    const length = Buffer.allocUnsafe(8);
    length.writeBigUInt64LE(BigInt(payload.length));
    this.socket.write(Buffer.concat([length, payload]));
    return true;
  }

  async send(frame) {
    if (!this.socket || !this.ready) return { accepted: false, reason: "AERA no está enlazado." };
    const variable = frame.dataMessage.variables[0];
    const dataType = variable.metaData.dataType;
    this.#write({
      messageType: messageTypes.DATA,
      timestamp: frame.timestamp,
      dataMessage: {
        timeSpan: frame.dataMessage.timeSpan,
        variables: [{
          metaData: { ...variable.metaData, dataType: dataTypes[dataType] },
          data: bytesFor(dataType, variable.data),
        }],
      },
    });
    return { accepted: true };
  }

  async close() {
    this.socket?.destroy();
    if (this.server) await new Promise((resolve) => this.server.close(resolve));
  }
}
