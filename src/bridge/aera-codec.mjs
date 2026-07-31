import { validateEvent } from "./protocol.mjs";

const protobufTypes = {
  number: "DOUBLE",
  integer: "INT64",
  boolean: "BOOL",
  string: "STRING",
  reference: "COMMUNICATION_ID",
};

export class AeraCodec {
  constructor() {
    this.entities = new Map();
    this.objects = new Map();
    this.commands = new Map();
    this.references = new Map();
    this.nextCommunicationId = 1;
  }

  #idFor(map, name) {
    if (!map.has(name)) map.set(name, this.nextCommunicationId++);
    return map.get(name);
  }

  register({ entities = [], objects = [], commands = [] }) {
    for (const entity of entities) this.#idFor(this.entities, entity);
    for (const object of objects) this.#idFor(this.objects, object);
    for (const command of commands) this.#idFor(this.commands, command);
  }

  lockSchema() { this.schemaLocked = true; }

  encode(eventInput) {
    const event = validateEvent(eventInput);
    if (this.schemaLocked && (!this.entities.has(event.subject) || !this.objects.has(event.predicate))) {
      throw new TypeError("La percepción no pertenece al vocabulario sensorial de esta semilla.");
    }
    const entityID = this.#idFor(this.entities, event.subject);
    const objectID = this.#idFor(this.objects, event.predicate);
    return {
      messageType: "DATA",
      timestamp: event.timestamp,
      dataMessage: {
        timeSpan: 0,
        variables: [{
          metaData: {
            entityID,
            ID: objectID,
            dataType: protobufTypes[event.value.type],
            dimensions: [],
            opcode_string_handle: "",
          },
          data: event.value.type === "reference" ? this.#idFor(this.references, event.value.data) : event.value.data,
        }],
      },
      genesis: { eventId: event.id, soulId: event.soulId, type: event.type },
    };
  }

  setup() {
    const commands = Object.fromEntries(this.commands);
    return {
      messageType: "SETUP",
      setupMessage: {
        entities: Object.fromEntries(this.entities),
        objects: Object.fromEntries(this.objects),
        commands,
        // AERA necesita describir el mensaje de vuelta incluso para acciones
        // sin argumento; Genesis valida el nombre, no el valor recibido.
        commandDescriptions: [...this.commands.entries()].map(([name, id]) => ({
          name,
          description: { entityID: 0, ID: id, dataType: "BOOL", dimensions: [], opcode_string_handle: "" },
        })),
      },
    };
  }

  commandFor(id) {
    return [...this.commands.entries()].find(([, commandId]) => commandId === Number(id))?.[0] || null;
  }
}
