import { Queue } from "bullmq";
import { Redis } from "ioredis";

// Must match QUEUE_NAME in app/worker.ts.
export const QUEUE_NAME = "shopify-jobs";

let queue: Queue | undefined;

// Lazily create the queue so the app still boots (e.g. `shopify app dev`)
// when REDIS_URL is not set. On Render, REDIS_URL comes from Key Value.
function getQueue(): Queue | undefined {
  if (!process.env.REDIS_URL) return undefined;
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: new Redis(process.env.REDIS_URL),
    });
  }
  return queue;
}

export async function enqueueJob(name: string, data: Record<string, unknown>) {
  const q = getQueue();
  if (!q) {
    console.warn(`REDIS_URL not set; skipping job "${name}"`);
    return;
  }
  await q.add(name, data, { removeOnComplete: 100, removeOnFail: 500 });
}
