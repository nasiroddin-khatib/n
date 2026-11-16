# Database

- SQLite database files are created automatically by the backend in this folder's `data/` directory.
- `schema.sql` is the reference schema; normal setup does not require manually running it.
- Keep database files and backups private. They are ignored by Git.
- Back up the database while the backend is stopped, or use SQLite's backup API for live backups.
