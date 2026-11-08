-- NGMS D1 migration 0013: public enquiry photograph metadata.
-- Apply to ngms-admin-preview first. Do not apply to production without a separate
-- review and deployment approval.
CREATE TABLE IF NOT EXISTS enquiry_attachments (
  id TEXT PRIMARY KEY,
  enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL UNIQUE REFERENCES media(id) ON DELETE RESTRICT,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp','image/avif')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_enquiry_attachments_enquiry
  ON enquiry_attachments(enquiry_id, created_at DESC);

INSERT OR IGNORE INTO ngms_schema_migrations (name)
VALUES ('0013_enquiry_attachments.sql');
