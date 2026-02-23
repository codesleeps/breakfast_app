import { Inngest } from "inngest";

// Create Inngest client
export const inngest = new Inngest({
  id: process.env.INNGEST_APP_ID || "breakfast-app",
  eventKey: process.env.INNGEST_EVENT_KEY,
  // For production, signing key is required to verify webhook requests from Inngest
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
