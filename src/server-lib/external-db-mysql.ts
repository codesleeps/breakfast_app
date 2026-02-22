import { externalDbClient } from "./external-db";

/**
 * Query an external MySQL database
 * @param name - The name of the external database
 * @param sql - The SQL query to execute, the query should be a valid MySQL SQL query and use templated parameters
 * @param params - The parameters to pass to the query, an array of parameters which will be passed to the query in order
 * @param timeout - Optional timeout in milliseconds (default: 10000). Maximum timeout is 720000 (12 minutes).
 * @returns The result of the query, the result is an object returned by the database client.
 * @example
 * const [result, fields] = await queryExternalDatabaseMySQL(
 *   "My MySQL Database",
 *   "SELECT * FROM items WHERE name = ?",
 *   ["example"]
 * );
 * // result = [ { id: "abc123", name: "example", createdAt: "2025-09-04T11:03:20.107Z"}, ... ]
 * // fields = [ { name: "id" }, { name: "name" }, ... ]
 */
export async function queryExternalDatabaseMySQL(
  name: string,
  sql: string,
  params: (string | number | boolean | Date | null)[] = [],
  timeout?: number,
) {
  const response = await externalDbClient.post("/query", { name, sql, params, timeout });
  return response.data;
}
