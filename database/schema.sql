-- RK Web Developer SQLite schema
-- The backend creates these tables automatically on first startup.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS enquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, service TEXT, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','converted','closed')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL, icon TEXT DEFAULT '✦', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT, description TEXT, image_url TEXT, project_url TEXT, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS referrals (id INTEGER PRIMARY KEY AUTOINCREMENT, referral_code TEXT NOT NULL UNIQUE, referrer_name TEXT NOT NULL, referrer_phone TEXT NOT NULL, referred_name TEXT NOT NULL, referred_phone TEXT NOT NULL, service TEXT, message TEXT, status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','converted','rewarded','closed')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
