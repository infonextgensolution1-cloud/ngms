import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workerSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

test("reports endpoint is read-only and aggregates core operational modules", () => {
  assert.match(workerSource, /url\.pathname === "\/api\/admin\/reports" && request\.method === "GET"/);
  assert.match(workerSource, /FROM customers/);
  assert.match(workerSource, /FROM enquiries GROUP BY status/);
  assert.match(workerSource, /FROM jobs GROUP BY status/);
  assert.match(workerSource, /FROM schedules GROUP BY status/);
  assert.match(workerSource, /FROM operation_records GROUP BY category/);
});

test("commercial reporting counts only referenced documents with matching saved line totals", () => {
  assert.match(workerSource, /d\.reference IS NOT NULL AND EXISTS \(SELECT 1 FROM document_line_items li WHERE li\.document_id = d\.id GROUP BY li\.document_id HAVING COUNT\(\*\) > 0 AND SUM\(li\.line_total_cents\) = d\.subtotal_cents\)/);
  assert.match(workerSource, /Incomplete commercial documents/);
  assert.match(workerSource, /Not a bank reconciliation/);
});

test("settings endpoint exposes only the commercial VAT preference and non-secret infrastructure labels", () => {
  assert.match(workerSource, /url\.pathname === "\/api\/admin\/settings" && request\.method === "GET"/);
  assert.match(workerSource, /setting_key = 'commercial\.vat'/);
  assert.match(workerSource, /Admin authentication/);
  assert.match(workerSource, /Cloudflare Access/);
  assert.match(workerSource, /Cloudflare D1 \+ R2/);
  assert.doesNotMatch(workerSource, /SELECT \* FROM business_settings/);
});
