import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";

console.log("Auth module initializing...");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.log("GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

console.log("Auth initialized successfully");
