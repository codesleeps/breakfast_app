import { serve } from "inngest/next";
import { exampleCron } from "@/inngest";
import { inngest } from "@/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [exampleCron],
  logLevel: "debug",
});
