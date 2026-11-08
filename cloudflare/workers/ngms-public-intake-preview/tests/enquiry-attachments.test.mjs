import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workerSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

test("public intake accepts JSON and bounded multipart submissions", () => {
  assert.match(workerSource, /multipart\/form-data/);
  assert.match(workerSource, /21 \* 1024 \* 1024/);
  assert.match(workerSource, /uploadedFiles\.length > 4/);
  assert.match(workerSource, /file\.size > 5 \* 1024 \* 1024/);
});

test("public intake verifies image signatures and requires privacy consent", () => {
  assert.match(workerSource, /fileSignatureMatches/);
  assert.match(workerSource, /body\.consent !== true/);
});

test("public enquiry photos are written to private R2 storage and linked in D1", () => {
  assert.match(workerSource, /private\/enquiries\//);
  assert.match(workerSource, /INSERT INTO enquiry_attachments/);
  assert.match(workerSource, /attachmentsWarning/);
});

test("Resend notification remains optional when a preview secret is not configured", () => {
  assert.match(workerSource, /!env\.RESEND_API_KEY/);
  assert.match(workerSource, /notificationSent/);
});
