import { inngest } from "../client";

export const exampleCron = inngest.createFunction({ id: "example-cron" }, { cron: "0 0 1 * *" }, async ({ step }) => {
  await step.run("log-hello-world", async () => {
    console.log("Hello World");
  });
});
