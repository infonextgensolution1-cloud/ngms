import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workerSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
const migrationSource = readFileSync(new URL("../../../migrations/0013_media_library_metadata.sql", import.meta.url), "utf8");

test("media collection exposes category, alt text, tags and update timestamp", () => {
  assert.match(workerSource, /SELECT id, original_name, content_type, size_bytes, uploaded_by, category, alt_text, tags_json, created_at, updated_at FROM media ORDER BY created_at DESC LIMIT 200/);
});

test("new uploads receive safe default organisation metadata", () => {
  assert.match(workerSource, /INSERT INTO media \(id, object_key, original_name, content_type, size_bytes, uploaded_by, category, alt_text, tags_json\) VALUES \(\?, \?, \?, \?, \?, \?, 'Uncategorised', '', '\[\]'\)/);
});

test("metadata updates validate category and bounded tags before persistence", () => {
  assert.match(workerSource, /mediaMetadataMatch[\s\S]{0,1200}request\.method === "PATCH"[\s\S]{0,1800}UPDATE media SET category = \?, alt_text = \?, tags_json = \?/);
  assert.match(workerSource, /rawTags\.length > 12/);
});

test("file replacement updates the object and metadata while retaining the media record ID", () => {
  assert.match(workerSource, /UPDATE media SET object_key = \?, original_name = \?, content_type = \?, size_bytes = \?, uploaded_by = \?, updated_at/);
  assert.match(workerSource, /return json\(\{ replaced: true, item: replacedItem \}/);
});

test("project-linked media cannot be deleted through the admin API", () => {
  assert.match(workerSource, /SELECT id FROM projects WHERE before_media_id = \? OR after_media_id = \? LIMIT 1/);
  assert.match(workerSource, /if \(projectUsage\) return json\(\{ error: "This photograph is linked to a project[\s\S]{0,220}409, origin\)/);
});

test("media metadata migration is additive and versioned", () => {
  assert.match(migrationSource, /ALTER TABLE media ADD COLUMN category/);
  assert.match(migrationSource, /ALTER TABLE media ADD COLUMN alt_text/);
  assert.match(migrationSource, /ALTER TABLE media ADD COLUMN tags_json/);
  assert.match(migrationSource, /CREATE INDEX IF NOT EXISTS idx_media_category_created_at/);
  assert.match(migrationSource, /INSERT OR IGNORE INTO ngms_schema_migrations/);
});
