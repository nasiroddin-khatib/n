const fs = require("node:fs");
const path = require("node:path");

let streams;

function initLogger(config) {
  fs.mkdirSync(config.logDir, { recursive: true });
  const appStream = fs.createWriteStream(path.join(config.logDir, "app.log"), { flags: "a" });
  const errorStream = fs.createWriteStream(path.join(config.logDir, "error.log"), { flags: "a" });
  streams = { appStream, errorStream, level: config.logLevel };
}

function write(level, message, metadata = {}) {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message: String(message),
    ...metadata
  }) + "\n";

  if (streams) {
    streams.appStream.write(entry);
    if (level === "error" || level === "fatal") streams.errorStream.write(entry);
  }
  if (level === "error" || level === "fatal") console.error(entry.trim());
  else if (process.env.NODE_ENV !== "production") console.log(entry.trim());
}

module.exports = {
  initLogger,
  info: (message, metadata) => write("info", message, metadata),
  warn: (message, metadata) => write("warn", message, metadata),
  error: (message, metadata) => write("error", message, metadata),
  debug: (message, metadata) => { if (process.env.NODE_ENV !== "production") write("debug", message, metadata); }
};
