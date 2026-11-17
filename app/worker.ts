// Background worker. Runs from the same Docker image as the web app:
//   npm run worker   (node app/worker.ts, using Node 22's built-in type stripping)
// Connects to Render Key Value via REDIS_URL and processes jobs that the web
// app enqueues with enqueueJob() from app/queue.server.ts.
import { Worker } from "bullmq";
import type { Job } from "bullmq";
import { Redis } from "ioredis";

// Must match QUEUE_NAME in app/queue.server.ts.
const QUEUE_NAME = "shopify-jobs";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("REDIS_URL is not set");
  process.exit(1);
}

// BullMQ workers require maxRetriesPerRequest: null.
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const worker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    switch (job.name) {
      case "app-uninstalled":
        // Example job: replace with real cleanup (billing, data retention, etc).
        console.log(`[worker] app uninstalled from ${job.data.shop}`, job.data);
        return;
      default:
        console.log(`[worker] no handler for job "${job.name}"`, job.data);
    }
  },
  { connection },
);

worker.on("ready", () => console.log(`[worker] listening on "${QUEUE_NAME}"`));
worker.on("failed", (job, err) =>
  console.error(`[worker] job ${job?.id} failed:`, err),
);

const shutdown = async () => {
  await worker.close();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
