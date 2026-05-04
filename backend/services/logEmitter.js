const { EventEmitter } = require("events");

const emitter = new EventEmitter();
emitter.setMaxListeners(50);

function log(message, level = "info") {
  emitter.emit("log", { message, level, ts: new Date().toISOString() });
}

module.exports = { emitter, log };
