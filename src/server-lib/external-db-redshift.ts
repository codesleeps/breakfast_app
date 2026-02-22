import { externalDbClient } from "./external-db";

/**
 * Query an external Redshift database
 * @param name - The name of the external database
 * @param sql - The SQL query to execute, the query should be a valid Redshift SQL query and use templated parameters
 * @param params - The parameters to pass to the query, a record of named parameters. The values should be strings and
 * will be implicitly converted to the proper data type at query time.
 * @param timeout - Optional timeout in milliseconds (default: 10000). Maximum timeout is 720000 (12 minutes).
 * @returns The result of the query, the result is an object returned by the database client. Max records returned is 5000.
 * @example
 * const result = await queryExternalDatabaseRedshift(
 *   "My Redshift Database",
 *   "SELECT * FROM items WHERE name = :name",
 *   { name: "example" }
 * );
 * // result = {
 * //   status: "FINISHED",
 * //   records: [ { id: "1", name: "example", createdAt: "2021-01-01T00:00:00.000Z" }, ... ],
 * //   columnMetadata: [ { schemaName: "public", tableName: "items", ... } ... ]
 * // }
 * // Note: if the query has not completed successfully, the result will have a different status than "FINISHED".
 * // It will also have an `error` field with the error message. If the query timed out, the status will be "TIMED_OUT".
 */
export async function queryExternalDatabaseRedshift(
  name: string,
  sql: string,
  params: Record<string, string> = {},
  timeout?: number,
) {
  const response = await externalDbClient.post("/query", { name, sql, params, timeout });
  return response.data;
}
