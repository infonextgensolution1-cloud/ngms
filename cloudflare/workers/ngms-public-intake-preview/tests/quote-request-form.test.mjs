import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const formSource = readFileSync(new URL("../../../../ngms-rebuild/components/QuoteRequestForm.tsx", import.meta.url), "utf8");

test("quote request form includes optional image attachments and required privacy consent", () => {
  assert.match(formSource, /name="attachments" type="file"/);
  assert.match(formSource, /name="consent" type="checkbox" value="true" required/);
});

test("quote request form submits multipart FormData without overriding the browser boundary", () => {
  assert.match(formSource, /const body = new FormData\(\)/);
  assert.match(formSource, /body\.append\("attachments"/);
  assert.doesNotMatch(formSource, /"Content-Type": "application\/json"/);
});
