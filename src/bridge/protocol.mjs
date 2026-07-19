import crypto from "node:crypto";

export const PROTOCOL = "genesis-cognitive/1";
export const EVENT_TYPES = new Set(["perception", "drive", "action", "outcome", "control"]);
export const VALUE_TYPES = new Set(["number", "integer", "boolean", "string", "reference"]);

function requiredText(value, name, max = 128) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new TypeError(`${name} debe ser texto no vacío de hasta ${max} caracteres.`);
  }
  return value;
}

export function validateEvent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("El evento debe ser un objeto.");
  if (input.protocol !== PROTOCOL) throw new TypeError(`Protocolo incompatible: se esperaba ${PROTOCOL}.`);
  requiredText(input.id, "id");
  requiredText(input.soulId, "soulId");
  if (!EVENT_TYPES.has(input.type)) throw new TypeError(`Tipo de evento no permitido: ${input.type}.`);
  requiredText(input.subject, "subject");
  requiredText(input.predicate, "predicate");
  if (!input.value || !VALUE_TYPES.has(input.value.type)) throw new TypeError("value.type no es compatible.");
  if (input.value.type === "number" && !Number.isFinite(input.value.data)) throw new TypeError("El valor numérico no es finito.");
  if (input.value.type === "integer" && !Number.isSafeInteger(input.value.data)) throw new TypeError("El entero no es seguro.");
  if (input.value.type === "boolean" && typeof input.value.data !== "boolean") throw new TypeError("El valor no es booleano.");
  if ((input.value.type === "string" || input.value.type === "reference") && typeof input.value.data !== "string") {
    throw new TypeError("El valor debe ser texto.");
  }
  if (!Number.isSafeInteger(input.timestamp) || input.timestamp < 0) throw new TypeError("timestamp debe expresarse en microsegundos.");
  return structuredClone(input);
}

export function createEvent({ soulId, type, subject, predicate, value, timestamp = Date.now() * 1000, id = crypto.randomUUID() }) {
  return validateEvent({ protocol: PROTOCOL, id, soulId, type, subject, predicate, value, timestamp });
}

export function resultFor(event, status, details = {}) {
  return { protocol: PROTOCOL, correlationId: event.id, soulId: event.soulId, status, ...details };
}
