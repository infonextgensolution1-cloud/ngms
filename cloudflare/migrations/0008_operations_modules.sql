-- NGMS D1 migration 0008: operations, suppliers, inventory and financial records.
-- Amounts are stored in cents; API payloads use ZAR and convert before persistence.
CREATE TABLE IF NOT EXISTS operation_records (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('maintenance','suppliers','inventory','financials')),
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents >= 0),
  quantity REAL NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  contact TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_operation_records_category_created ON operation_records(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operation_records_category_status ON operation_records(category, status);
INSERT OR IGNORE INTO ngms_schema_migrations (name) VALUES ('0008_operations_modules.sql');
