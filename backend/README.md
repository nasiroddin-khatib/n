# Backend API

Node.js 20+ / Express / SQLite. Run commands from this directory.

1. `npm install`
2. Copy `.env.example` to `.env` and set a unique `JWT_SECRET` (32+ characters), `ADMIN_USERNAME`, and a strong `ADMIN_PASSWORD`.
3. `npm run dev`
4. Health check: `http://localhost:4000/api/health`

The SQLite file is stored at `../database/data/rk-website.sqlite`; logs are in `backend/logs/`. Never commit `.env`, credentials, logs, or database files.

Admin account is created from `ADMIN_USERNAME` and `ADMIN_PASSWORD` on first startup when the admins table is empty. The optional invite-key signup route is also available if `ADMIN_SIGNUP_KEY` is configured.
