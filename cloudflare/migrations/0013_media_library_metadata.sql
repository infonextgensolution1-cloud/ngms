-- Add searchable editorial metadata to the isolated NGMS media library.
-- Existing object keys and file contents are not modified.
ALTER TABLE media ADD COLUMN category TEXT NOT NULL DEFAULT 'Uncategorised';
ALTER TABLE media ADD COLUMN alt_text TEXT NOT NULL DEFAULT '';
ALTER TABLE media ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE media ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_media_category_created_at
  ON media(category, created_at DESC);

INSERT OR IGNORE INTO ngms_schema_migrations (name)
VALUES ('0013_media_library_metadata.sql');
