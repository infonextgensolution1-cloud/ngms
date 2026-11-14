import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workerSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

test("commercial document list includes legacy rows and reports reference and line integrity", () => {
  assert.match(workerSource, /AS integrity_status FROM documents d LEFT JOIN customers c ON c\.id = d\.customer_id LEFT JOIN/);
  assert.match(workerSource, /WHEN d\.reference IS NULL OR TRIM\(d\.reference\) = '' THEN 'Missing reference'/);
  assert.match(workerSource, /WHEN COALESCE\(li\.line_item_count, 0\) = 0 THEN 'Missing line items'/);
  assert.match(workerSource, /AS line_item_count/);
  assert.doesNotMatch(workerSource, /WHERE d\.reference IS NOT NULL AND d\.kind = \?/);
});

test("admin document details can inspect legacy documents without references", () => {
  assert.match(workerSource, /if \(commercialDetailMatch && request\.method === "GET"\)[\s\S]{0,220}SELECT \* FROM documents WHERE id = \?/);
});

test("quotation issue flow refuses quotations without saved line items", () => {
  assert.match(workerSource, /quoteLineCount[\s\S]{0,300}no saved line items and cannot be issued to a customer/);
});

test("accepted quotation cannot become a job without saved line items", () => {
  assert.match(workerSource, /if \(!lines\.results\.length\) return json\(\{error:"This accepted quotation has no saved line items/);
});
