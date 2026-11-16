const path = require("node:path");

function required(name, minLength = 1) {
  const value = process.env[name];
  if (!value || value.length < minLength) {
    throw new Error(`Missing or invalid required configuration: ${name}`);
  }
  return value;
}

function getConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 4000),
    frontendOrigins: (process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5500")
      .split(",").map(value => value.trim()).filter(Boolean),
    databaseFile: path.resolve(process.env.DATABASE_FILE || "./data/rk-website.sqlite"),
    jwtSecret: required("JWT_SECRET", 32),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || (isProduction ? "1h" : "8h"),
    adminSignupKey: process.env.ADMIN_SIGNUP_KEY || "",
    logLevel: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    logDir: path.resolve(process.env.LOG_DIR || "./logs"),
    metricsEnabled: process.env.METRICS_ENABLED !== "false"
  };
}

module.exports = { getConfig };
