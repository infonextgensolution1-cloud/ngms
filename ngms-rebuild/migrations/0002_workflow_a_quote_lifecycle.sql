-- NGMS Workflow A: enquiry -> CRM customer -> quotation -> customer decision -> job.
-- Apply only to the isolated ngms-admin-preview D1 database.
-- Additive migration; no production database changes.

CREATE TABLE IF NOT EXISTS enquiry_customer_links (
  enquiry_id TEXT PRIMARY KEY REFERENCES enquiries(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  linked_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_enquiry_customer_links_customer
  ON enquiry_customer_links(customer_id);

ALTER TABLE quote_public_links ADD COLUMN enquiry_id TEXT REFERENCES enquiries(id);
ALTER TABLE quote_public_links ADD COLUMN customer_id TEXT REFERENCES customers(id);
ALTER TABLE quote_public_links ADD COLUMN decision TEXT CHECK (decision IS NULL OR decision IN ('Accepted','Declined'));
ALTER TABLE quote_public_links ADD COLUMN job_id TEXT REFERENCES jobs(id);
ALTER TABLE quote_public_links ADD COLUMN decision_at TEXT;

-- A quotation may create no more than one job. Existing NULL source links remain unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_unique_source_document
  ON jobs(source_document_id)
  WHERE source_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quote_public_links_document
  ON quote_public_links(document_id, created_at DESC);
