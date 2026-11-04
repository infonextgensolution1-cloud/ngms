import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workerSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

test("CMS publishing overview is read-only and returns request, current, history and audit summaries", () => {
  assert.match(workerSource, /url\.pathname === "\/api\/admin\/publishing" && request\.method === "GET"/);
  assert.match(workerSource, /SELECT id, module_key, slug, status, requested_by, reviewed_by, review_note, created_at, reviewed_at FROM cms_publication_requests/);
  assert.match(workerSource, /SELECT s\.module_key, s\.slug, s\.publication_id, s\.updated_at, p\.content_hash, p\.published_by, p\.published_at FROM cms_publication_state/);
});

test("CMS draft and publication writes are disabled unless the Worker CMS flag is enabled", () => {
  assert.match(workerSource, /key\.startsWith\("cms_draft\."\)[\s\S]{0,140}env\.CMS_WRITE_ENABLED !== "true"/);
  assert.match(workerSource, /url\.pathname === "\/api\/admin\/publishing\/request" && request\.method === "POST"[\s\S]{0,180}env\.CMS_WRITE_ENABLED !== "true"/);
  assert.match(workerSource, /url\.pathname === "\/api\/admin\/publishing\/approve" && request\.method === "POST"[\s\S]{0,180}env\.CMS_WRITE_ENABLED !== "true"/);
  assert.match(workerSource, /url\.pathname === "\/api\/admin\/publishing\/rollback" && request\.method === "POST"[\s\S]{0,180}env\.CMS_WRITE_ENABLED !== "true"/);
});

test("CMS publication decisions require a different authorised administrator", () => {
  assert.match(workerSource, /publicationRequest\.requested_by\.trim\(\)\.toLowerCase\(\) === actor\.trim\(\)\.toLowerCase\(\)/);
  assert.match(workerSource, /A second authorised administrator must approve or reject this request/);
});

test("CMS publication validates draft structure and records requests in the audit trail", () => {
  assert.match(workerSource, /page\.moduleKey !== moduleKey/);
  assert.match(workerSource, /Array\.isArray\(blocks\)/);
  assert.match(workerSource, /'publish_requested'/);
  assert.match(workerSource, /'publish_approved'/);
  assert.match(workerSource, /'publish_rejected'/);
  assert.match(workerSource, /'rollback'/);
});
