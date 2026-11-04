import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workerSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

function splitTopLevelList(value) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (quote) {
      if (char === "\\\\") {
        index += 1;
      } else if (char === quote) {
        if (char === "'" && value[index + 1] === "'") {
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    } else if (char === "," && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

function getDocumentInsert() {
  const match = workerSource.match(
    /env\\.DB\\.prepare\\("(INSERT INTO documents \\(id, customer_name, customer_id,[\\s\\S]*?FROM document_sequences WHERE sequence_key = \\? AND sequence_year = \\?)"\\)\\s*\\.bind\\(([\\s\\S]*?)\\),/m
  );

  assert.ok(match, "Expected the commercial document INSERT and its .bind() call to exist.");

  const shape = match[1].match(
    /^INSERT INTO documents \\(([\\s\\S]*?)\\)\\s*SELECT\\s+([\\s\\S]*?)\\s+FROM document_sequences/
  );

  assert.ok(shape, "Expected an INSERT column list followed by a SELECT projection.");

  return {
    sql: match[1],
    columns: splitTopLevelList(shape[1]),
    values: splitTopLevelList(shape[2]),
    bindings: splitTopLevelList(match[2]),
  };
}

test("commercial document INSERT projects one value for every column", () => {
  const { columns, values } = getDocumentInsert();

  assert.equal(columns.length, 17, "The INSERT contract must contain 17 columns.");
  assert.equal(values.length, columns.length, "Each INSERT column must have a matching SELECT expression.");
  assert.equal(columns.at(-1), "source_document_id");
  assert.equal(values.at(-1), "?");
});

test("all commercial document SQL placeholders are bound", () => {
  const { sql, bindings } = getDocumentInsert();
  const placeholderCount = (sql.match(/\\?/g) ?? []).length;

  assert.equal(placeholderCount, 19, "The SQL must expose 19 positional placeholders.");
  assert.equal(bindings.length, placeholderCount, "Every SQL placeholder must have a corresponding .bind() argument.");
  assert.equal(bindings[16], "sourceDocumentId", "source_document_id must bind to the source quotation ID.");
  assert.deepEqual(bindings.slice(17), ["sequenceKey", "year"], "The final WHERE placeholders must bind to the document sequence.");
});
