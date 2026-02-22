import { sql } from "./neon";

type SqlPrimitive = string | number | boolean | Date | null;
type SqlParam = SqlPrimitive | SqlPrimitive[] | Record<string, unknown>;

/**
 * Query the app's internal Postgres database directly via Neon
 * @param sqlQuery - The SQL query to execute, using $1, $2, etc. for parameters
 * @param params - The parameters to pass to the query (primitives, arrays for ANY clauses, or objects for JSONB)
 * @returns The result rows from the query
 * @example
 * const result = await queryInternalDatabase(
 *   "SELECT * FROM items WHERE name = $1",
 *   ["example"]
 * );
 * // result = [ { id: "abc123", name: "example", createdAt: "2025-09-04T11:03:20.107Z" }, ... ]
 *
 * // Using arrays for ANY clauses:
 * const users = await queryInternalDatabase(
 *   "SELECT * FROM users WHERE id = ANY($1)",
 *   [[1, 2, 3]]
 * );
 *
 * // Using objects for JSONB columns:
 * await queryInternalDatabase(
 *   "INSERT INTO events (data) VALUES ($1)",
 *   [{ event: "click", page: "/home" }]
 * );
 */
export async function queryInternalDatabase(sqlQuery: string, params: SqlParam[] = []) {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured. Please set the DATABASE_URL environment variable.");
  }
  const result = await sql(sqlQuery, params);
  return result as Record<string, unknown>[];
}