const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

function createDatabase(config, logger) {
  fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
  const db = new Database(config.databaseFile);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, service TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new'
        CHECK(status IN ('new', 'contacted', 'converted', 'closed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, description TEXT NOT NULL, icon TEXT DEFAULT '✦',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL, category TEXT, description TEXT, image_url TEXT,
      project_url TEXT, active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referral_code TEXT NOT NULL UNIQUE,
      referrer_name TEXT NOT NULL,
      referrer_phone TEXT NOT NULL,
      referred_name TEXT NOT NULL,
      referred_phone TEXT NOT NULL,
      service TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'new'
        CHECK(status IN ('new', 'contacted', 'converted', 'rewarded', 'closed')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminCount = db.prepare("SELECT COUNT(*) AS count FROM admins").get().count;
  if (adminCount === 0 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
    db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").run(process.env.ADMIN_USERNAME, hash);
    logger.info("Initial admin account created from environment configuration.");
  } else if (adminCount === 0) {
    logger.warn("No admin account exists. Create one through the protected signup endpoint.");
  }

  const serviceCount = db.prepare("SELECT COUNT(*) AS count FROM services").get().count;
  if (serviceCount === 0) {
    const insert = db.prepare("INSERT INTO services (title, description, icon) VALUES (?, ?, ?)");
    const seed = db.transaction(() => {
      [
        ["Website Development", "Modern, responsive business websites.", "⌘"],
        ["Web Applications", "Custom dashboards and business tools.", "▣"],
        ["E-Commerce Solutions", "Online stores and product catalogues.", "🛒"],
        ["SEO Optimization", "Technical and on-page SEO foundations.", "↗"],
        ["Digital Marketing", "Campaign landing pages and lead funnels.", "◎"],
        ["Website Maintenance", "Updates, backups and ongoing support.", "⚙"]
      ].forEach(row => insert.run(...row));
    });
    seed();
  }
  return db;
}

module.exports = { createDatabase };
