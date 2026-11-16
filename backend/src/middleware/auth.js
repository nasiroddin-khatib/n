const jwt = require("jsonwebtoken");

function createAuth(config) {
  return function requireAdmin(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    try {
      if (!token) throw new Error("Missing token");
      req.admin = jwt.verify(token, config.jwtSecret);
      next();
    } catch {
      res.status(401).json({ error: "Please log in again." });
    }
  };
}

module.exports = { createAuth };
