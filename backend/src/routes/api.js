const express = require("express");

function clean(value, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function apiRoutes({ db, requireAdmin, enquiryLimiter }) {
  const router = express.Router();

  router.post("/enquiries", enquiryLimiter, (req, res) => {
    const name = clean(req.body.name, 100);
    const phone = clean(req.body.phone, 30);
    const email = clean(req.body.email, 150);
    const service = clean(req.body.service, 120);
    const message = clean(req.body.message, 3000);
    if (!name || !phone || !message) return res.status(400).json({ error: "Name, phone and project details are required." });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Please enter a valid email address." });
    const result = db.prepare("INSERT INTO enquiries (name, phone, email, service, message) VALUES (?, ?, ?, ?, ?)").run(name, phone, email || null, service || null, message);
    res.status(201).json({ message: "Enquiry received successfully.", id: result.lastInsertRowid });
  });

  // Public referral submission. The referral code is generated server-side.
  router.post("/referrals", enquiryLimiter, (req, res) => {
    const referrerName = clean(req.body.referrer_name, 100);
    const referrerPhone = clean(req.body.referrer_phone, 30);
    const referredName = clean(req.body.referred_name, 100);
    const referredPhone = clean(req.body.referred_phone, 30);
    const service = clean(req.body.service, 120);
    const message = clean(req.body.message, 1500);
    if (!referrerName || !referrerPhone || !referredName || !referredPhone) {
      return res.status(400).json({ error: "Referrer and referred person's name and phone are required." });
    }
    if (referrerPhone.replace(/\\D/g, "").length < 7 || referredPhone.replace(/\\D/g, "").length < 7) {
      return res.status(400).json({ error: "Please enter valid phone numbers." });
    }
    const referralCode = "RK" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const result = db.prepare(`INSERT INTO referrals
      (referral_code, referrer_name, referrer_phone, referred_name, referred_phone, service, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(referralCode, referrerName, referrerPhone, referredName, referredPhone, service || null, message || null);
    res.status(201).json({ message: "Referral submitted successfully.", referral_code: referralCode, id: result.lastInsertRowid });
  });

  router.get("/services", (req, res) => res.json(db.prepare("SELECT id, title, description, icon FROM services WHERE active = 1 ORDER BY id").all()));
  router.get("/projects", (req, res) => res.json(db.prepare("SELECT id, title, category, description, image_url, project_url FROM projects WHERE active = 1 ORDER BY id DESC").all()));

  router.get("/admin/referrals", requireAdmin, (req, res) => {
    res.json(db.prepare("SELECT * FROM referrals ORDER BY created_at DESC, id DESC").all());
  });
  router.patch("/admin/referrals/:id/status", requireAdmin, (req, res) => {
    const id = Number(req.params.id), status = clean(req.body.status, 20);
    if (!Number.isInteger(id) || !["new", "contacted", "converted", "rewarded", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid referral ID or status." });
    }
    const result = db.prepare("UPDATE referrals SET status = ? WHERE id = ?").run(status, id);
    if (!result.changes) return res.status(404).json({ error: "Referral not found." });
    res.json({ message: "Referral status updated." });
  });
  router.delete("/admin/referrals/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid referral ID." });
    const result = db.prepare("DELETE FROM referrals WHERE id = ?").run(id);
    if (!result.changes) return res.status(404).json({ error: "Referral not found." });
    res.json({ message: "Referral deleted." });
  });

  router.get("/admin/enquiries", requireAdmin, (req, res) => {
    res.json(db.prepare("SELECT * FROM enquiries ORDER BY created_at DESC, id DESC").all());
  });
  router.patch("/admin/enquiries/:id/status", requireAdmin, (req, res) => {
    const id = Number(req.params.id), status = clean(req.body.status, 20);
    if (!Number.isInteger(id) || !["new", "contacted", "converted", "closed"].includes(status)) return res.status(400).json({ error: "Invalid enquiry ID or status." });
    const result = db.prepare("UPDATE enquiries SET status = ? WHERE id = ?").run(status, id);
    if (!result.changes) return res.status(404).json({ error: "Enquiry not found." });
    res.json({ message: "Enquiry status updated." });
  });
  router.delete("/admin/enquiries/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid enquiry ID." });
    const result = db.prepare("DELETE FROM enquiries WHERE id = ?").run(id);
    if (!result.changes) return res.status(404).json({ error: "Enquiry not found." });
    res.json({ message: "Enquiry deleted." });
  });

  router.post("/admin/services", requireAdmin, (req, res) => {
    const title = clean(req.body.title, 120), description = clean(req.body.description, 1000), icon = clean(req.body.icon, 20) || "✦";
    if (!title || !description) return res.status(400).json({ error: "Title and description are required." });
    const result = db.prepare("INSERT INTO services (title, description, icon) VALUES (?, ?, ?)").run(title, description, icon);
    res.status(201).json({ id: result.lastInsertRowid, message: "Service created." });
  });
  router.patch("/admin/services/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id), title = clean(req.body.title, 120), description = clean(req.body.description, 1000);
    const icon = clean(req.body.icon, 20) || "✦", active = req.body.active === false ? 0 : 1;
    if (!Number.isInteger(id) || !title || !description) return res.status(400).json({ error: "Valid ID, title and description are required." });
    const result = db.prepare("UPDATE services SET title=?, description=?, icon=?, active=? WHERE id=?").run(title, description, icon, active, id);
    if (!result.changes) return res.status(404).json({ error: "Service not found." });
    res.json({ message: "Service updated." });
  });
  router.delete("/admin/services/:id", requireAdmin, (req, res) => {
    const result = db.prepare("DELETE FROM services WHERE id = ?").run(Number(req.params.id));
    if (!result.changes) return res.status(404).json({ error: "Service not found." });
    res.json({ message: "Service deleted." });
  });

  router.post("/admin/projects", requireAdmin, (req, res) => {
    const title = clean(req.body.title, 120), category = clean(req.body.category, 80);
    const description = clean(req.body.description, 1000), imageUrl = clean(req.body.image_url, 1000), projectUrl = clean(req.body.project_url, 1000);
    if (!title) return res.status(400).json({ error: "Project title is required." });
    const result = db.prepare("INSERT INTO projects (title, category, description, image_url, project_url) VALUES (?, ?, ?, ?, ?)").run(title, category, description, imageUrl, projectUrl);
    res.status(201).json({ id: result.lastInsertRowid, message: "Project created." });
  });
  router.delete("/admin/projects/:id", requireAdmin, (req, res) => {
    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(Number(req.params.id));
    if (!result.changes) return res.status(404).json({ error: "Project not found." });
    res.json({ message: "Project deleted." });
  });

  return router;
}

module.exports = { apiRoutes };
