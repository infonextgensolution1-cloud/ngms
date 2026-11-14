import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Configure the dedicated HostAfrica database environment first.`);
    process.exit(1);
  }
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: false,
  charset: "utf8mb4",
});

try {
  const sql = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
  const statements = sql
    .split(";")
    .map(part => part.trim())
    .filter(part => part && !part.startsWith("--"));
  for (const statement of statements) {
    await connection.query(statement);
  }
  console.log("NGMS HostAfrica database schema applied.");
} finally {
  await connection.end();
}
