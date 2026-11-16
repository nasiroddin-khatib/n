const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function authRoutes({ db, config, loginLimiter, signupLimiter, requireAdmin }) {
  const router = express.Router();

  router.post("/signup", signupLimiter, (req, res) => {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const inviteKey = typeof req.body.inviteKey === "string" ? req.body.inviteKey : "";

    if (!config.adminSignupKey || inviteKey !== config.adminSignupKey) {
      return res.status(403).json({ error: "A valid administrator invite key is required." });
    }
    if (!/^[a-zA-Z0-9_.-]{3,80}$/.test(username) || password.length < 12) {
      return res.status(400).json({ error: "Username must be 3-80 valid characters and password at least 12 characters." });
    }
    if (db.prepare("SELECT id FROM admins WHERE username = ?").get(username)) {
      return res.status(409).json({ error: "Username already exists." });
    }
    const hash = bcrypt.hashSync(password, 12);
    const result = db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(username, hash);
    res.status(201).json({ id: result.lastInsertRowid, username, message: "Admin account created." });
  });

  router.post("/login", loginLimiter, (req, res) => {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username);
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }
    const token = jwt.sign({ id: admin.id, username: admin.username }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
      issuer: "rk-web-developer-api",
      audience: "rk-web-developer-admin"
    });
    res.json({ token, username: admin.username, expiresIn: config.jwtExpiresIn });
  });

  router.get("/me", requireAdmin, (req, res) => {
    res.json({ id: req.admin.id, username: req.admin.username });
  });
  return router;
}

module.exports = { authRoutes };
