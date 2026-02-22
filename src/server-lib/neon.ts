import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | null = null;

if (process.env.DATABASE_URL) {
  sql = neon(process.env.DATABASE_URL);
}

export { sql };

// Example usage (server side only):
// const [post] = await sql`SELECT * FROM posts WHERE id = ${postId}`;