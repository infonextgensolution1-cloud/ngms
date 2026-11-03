-- NGMS D1 migration 0013: idempotent enquiry-to-CRM conversion.
-- Run in preview first. No customer is created by applying this migration.
CREATE TABLE IF NOT EXISTS enquiry_customer_links (
  enquiry_id TEXT PRIMARY KEY REFERENCES enquiries(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  linked_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_enquiry_customer_links_customer
  ON enquiry_customer_links(customer_id);

INSERT OR IGNORE INTO ngms_schema_migrations (name)
VALUES ('0013_enquiry_customer_conversion.sql');
