# Project structure guide

| Folder | Purpose | Main files |
|---|---|---|
| `frontend/` | Public site and admin interface | `index.html`, `admin.html` |
| `backend/src/routes/` | HTTP API endpoints | `api.js`, `auth.js` |
| `backend/src/middleware/` | Authentication and request handling | `auth.js`, `request.js` |
| `backend/src/` | Server, config, database connection, logging | `server.js`, `config.js`, `db.js`, `logger.js` |
| `database/` | SQLite storage and schema reference | `data/`, `schema.sql` |
| `infra/` | Monitoring stack configuration | `docker-compose.monitoring.yml`, `monitoring/` |
