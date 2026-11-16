const crypto = require("node:crypto");

function requestMiddleware(logger) {
  return (req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader("X-Request-ID", req.requestId);
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info("http_request", {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2))
      });
    });
    next();
  };
}

module.exports = { requestMiddleware };
