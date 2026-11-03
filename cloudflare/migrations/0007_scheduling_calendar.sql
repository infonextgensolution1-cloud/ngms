-- NGMS D1 migration 0007: job scheduling calendar.
-- Safe to run on a database where the tables/indexes already exist.
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  customer_name TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL DEFAULT '',
  scheduled_start TEXT NOT NULL,
  scheduled_end TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled'
    CHECK (status IN ('Scheduled','Confirmed','In progress','Completed','Cancelled')),
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (scheduled_end > scheduled_start)
);
CREATE INDEX IF NOT EXISTS idx_schedules_assigned_start ON schedules(assigned_to, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_schedules_start ON schedules(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_schedules_status_start ON schedules(status, scheduled_start);
INSERT OR IGNORE INTO ngms_schema_migrations (name) VALUES ('0007_scheduling_calendar.sql');
