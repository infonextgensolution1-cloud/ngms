import "server-only";
import mysql, { type Pool, type PoolConnection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

let pool: Pool | null = null;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

export function getDb(): Pool {
  if (pool) return pool;
  const port = Number(process.env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT must be a valid TCP port.");
  }
  pool = mysql.createPool({
    host: required("DB_HOST"),
    port,
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    database: required("DB_NAME"),
    waitForConnections: true,
    connectionLimit: Math.max(2, Math.min(10, Number(process.env.DB_POOL_SIZE || 5))),
    queueLimit: 0,
    enableKeepAlive: true,
    timezone: "Z",
    charset: "utf8mb4",
    decimalNumbers: true,
    dateStrings: true,
  });
  return pool;
}

export async function rows<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  const [result] = await getDb().execute<T[]>(sql, values as never[]);
  return result;
}

export async function row<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  values: unknown[] = [],
): Promise<T | null> {
  const result = await rows<T>(sql, values);
  return result[0] ?? null;
}

export async function execute(
  sql: string,
  values: unknown[] = [],
): Promise<ResultSetHeader> {
  const [result] = await getDb().execute<ResultSetHeader>(sql, values as never[]);
  return result;
}

export async function executeOn(connection: PoolConnection, sql: string, values: unknown[] = []): Promise<any> {
  // mysql2's ExecuteValues union is narrower than validated JSON/DB values.
  // Keep this cast at the database boundary rather than scattering it through routes.
  return connection.execute(sql, values as never[]);
}

export async function transaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected database error.";
}
