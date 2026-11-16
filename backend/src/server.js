require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const client = require("prom-client");
const logger = require("./logger");
const { loadSecrets } = require("./services/secrets");
const { getConfig } = require("./config");
const { createDatabase } = require("./db");
const { createAuth } = require("./middleware/auth");
const { requestMiddleware } = require("./middleware/request");
const { authRoutes } = require("./routes/auth");
const { apiRoutes } = require("./routes/api");

async function start() {
  await loadSecrets();
  const config = getConfig();
  logger.initLogger(config);
  const db = createDatabase(config, logger);
  const app = express();

  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry, prefix: "rk_backend_" });
  const httpRequests = new client.Counter({
    name: "rk_http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status_code"],
    registers: [registry]
  });
  const httpDuration = new client.Histogram({
    name: "rk_http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry]
  });

  app.disable("x-powered-by");
  app.use(helmet({
    contentSecurityPolicy: config.nodeEnv === "production" ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.frontendOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.use(express.json({ limit: "20kb" }));
  app.use(requestMiddleware(logger));
  app.use((req, res, next) => {
    const end = httpDuration.startTimer();
    res.on("finish", () => {
      const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
      const labels = { method: req.method, route, status_code: String(res.statusCode) };
      httpRequests.inc(labels);
      end(labels);
    });
    next();
  });

  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });
  const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false });
  const enquiryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false });
  const requireAdmin = createAuth(config);

  app.get("/api/health", (req, res) => res.json({ status: "ok", app: "RK Web Developer API" }));
  if (config.metricsEnabled) {
    app.get("/metrics", async (req, res) => {
      res.set("Content-Type", registry.contentType);
      res.end(await registry.metrics());
    });
  }
  app.use("/api/auth", authRoutes({ db, config, loginLimiter, signupLimiter, requireAdmin }));
  app.use("/api", apiRoutes({ db, requireAdmin, enquiryLimiter }));

  app.use((err, req, res, next) => {
    logger.error("request_error", { requestId: req.requestId, message: err.message, stack: config.nodeEnv === "development" ? err.stack : undefined });
    res.status(500).json({ error: "Internal server error.", requestId: req.requestId });
  });
  app.use((req, res) => res.status(404).json({ error: "API route not found." }));

  const server = app.listen(config.port, () => logger.info("server_started", { port: config.port, environment: config.nodeEnv }));
  const shutdown = signal => {
    logger.info("shutdown_started", { signal });
    server.close(() => {
      db.close();
      logger.info("shutdown_complete");
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch(error => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
