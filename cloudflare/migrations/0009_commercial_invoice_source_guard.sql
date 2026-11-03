-- NGMS D1 migration 0009: one active invoice per accepted quotation.
-- Precondition before applying to any environment:
-- SELECT source_document_id, COUNT(*) AS invoice_count
-- FROM documents
-- WHERE kind = 'Invoice' AND source_document_id IS NOT NULL AND status <> 'Cancelled'
-- GROUP BY source_document_id HAVING COUNT(*) > 1;
-- The precondition must return no rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_one_active_invoice_per_quote
  ON documents(source_document_id)
  WHERE kind = 'Invoice'
    AND source_document_id IS NOT NULL
    AND status <> 'Cancelled';
INSERT OR IGNORE INTO ngms_schema_migrations (name) VALUES ('0009_commercial_invoice_source_guard.sql');
