-- NGMS D1 migration 0011: invoice payments, enquiry/customer links and quote-to-job source.
-- Reconstructed from the deployed isolated preview D1 schema on 3 November 2026.
-- Apply only after 0009. This migration is recorded as applied in ngms-admin-preview.
-- It is intentionally not applied to production by this work.
ALTER TABLE jobs ADD COLUMN source_document_id TEXT REFERENCES documents(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_one_per_quotation
  ON jobs(source_document_id)
  WHERE source_document_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS enquiry_customer_links (
  enquiry_id TEXT PRIMARY KEY REFERENCES enquiries(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  linked_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_enquiry_customer_links_customer
  ON enquiry_customer_links(customer_id);

CREATE TABLE IF NOT EXISTS document_payments (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  paid_at TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'EFT',
  reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_document_payments_document
  ON document_payments(document_id, paid_at DESC);

-- One invoice is allowed per source quotation, including after that invoice is cancelled.
-- This matches the deployed API's duplicate-source check.
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_one_invoice_per_quote
  ON documents(source_document_id)
  WHERE kind = 'Invoice' AND source_document_id IS NOT NULL;

-- Enforce the invoice balance at the database boundary as well as in the API.
-- This prevents over-allocation even if a future caller bypasses the UI checks.
CREATE TRIGGER IF NOT EXISTS trg_document_payments_within_invoice_total
BEFORE INSERT ON document_payments
WHEN
  (SELECT COALESCE(SUM(amount_cents), 0)
   FROM document_payments
   WHERE document_id = NEW.document_id) + NEW.amount_cents
  > (SELECT amount_cents FROM documents WHERE id = NEW.document_id)
BEGIN
  SELECT RAISE(ABORT, 'Payment exceeds outstanding invoice balance');
END;

INSERT OR IGNORE INTO ngms_schema_migrations (name)
VALUES ('0011_customer_approval_payments_jobs.sql');
