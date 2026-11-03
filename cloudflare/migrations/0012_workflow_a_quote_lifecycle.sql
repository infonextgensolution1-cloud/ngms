-- NGMS D1 migration 0012: one-use public quote decisions and quote lifecycle.
-- Reconstructed from the deployed isolated preview D1 schema on 3 November 2026.
-- Public tokens are stored as SHA-256 hashes; the raw token is returned only once at link creation.
CREATE TABLE IF NOT EXISTS quote_public_links (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  enquiry_id TEXT REFERENCES enquiries(id),
  customer_id TEXT REFERENCES customers(id),
  decision TEXT CHECK (decision IS NULL OR decision IN ('Accepted','Declined')),
  job_id TEXT REFERENCES jobs(id),
  decision_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_quote_public_links_document
  ON quote_public_links(document_id);

-- This second named index is present in the deployed preview schema as a historical
-- alias for the quote-to-job uniqueness constraint.
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_unique_source_document
  ON jobs(source_document_id)
  WHERE source_document_id IS NOT NULL;

INSERT OR IGNORE INTO ngms_schema_migrations (name)
VALUES ('0012_workflow_a_quote_lifecycle.sql');
