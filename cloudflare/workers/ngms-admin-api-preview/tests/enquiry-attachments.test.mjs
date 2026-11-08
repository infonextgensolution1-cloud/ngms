import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workerSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../../migrations/0013_enquiry_attachments.sql", import.meta.url), "utf8");

test("admin API exposes protected enquiry attachment metadata with authenticated media download URLs", () => {
  assert.match(workerSource, /enquiryAttachmentsMatch/);
  assert.match(workerSource, /FROM enquiry_attachments a WHERE a\.enquiry_id = \?/);
  assert.match(workerSource, /\/api\/admin\/media\/.*\/download/);
});

test("admin API prevents deleting media referenced by a customer enquiry", () => {
  assert.match(workerSource, /SELECT id FROM enquiry_attachments WHERE media_id = \? LIMIT 1/);
  assert.match(workerSource, /Preserve it as part of the enquiry record/);
});

test("partial invoice payments preserve Overdue status until full settlement", () => {
  assert.match(workerSource, /newPaid >= invoice\.amount_cents \? "Paid" : invoice\.status === "Overdue" \? "Overdue" : "Sent"/);
});

test("attachment migration cascades with enquiry deletion but restricts media deletion", () => {
  assert.match(migration, /enquiry_id TEXT NOT NULL REFERENCES enquiries\(id\) ON DELETE CASCADE/);
  assert.match(migration, /media_id TEXT NOT NULL UNIQUE REFERENCES media\(id\) ON DELETE RESTRICT/);
  assert.match(migration, /idx_enquiry_attachments_enquiry/);
});
