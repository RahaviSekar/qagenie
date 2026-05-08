const { EventEmitter } = require("events");

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

function log(message, level = "info", extra = null) {
  const payload = { message, level, ts: new Date().toISOString() };
  if (extra && typeof extra === "object") {
    Object.assign(payload, extra);
  }
  emitter.emit("log", payload);
}

module.exports = { emitter, log };
