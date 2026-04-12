import { publishScheduledPosts } from "./blogDb";

const ONE_MINUTE_MS = 60_000;
const jobHandles: ReturnType<typeof setInterval>[] = [];

async function runPublishScheduled() {
  try {
    const count = await publishScheduledPosts();
    if (count > 0) console.log(`[Blog] Published ${count} scheduled post(s)`);
  } catch (err) {
    console.error("[Blog] publishScheduledPosts failed:", err);
  }
}

export function startScheduledJobs() {
  jobHandles.push(setInterval(runPublishScheduled, ONE_MINUTE_MS));
  console.log("[Blog] Scheduled publishing job started (every 60s)");
}

export function stopScheduledJobs() {
  for (const handle of jobHandles) {
    clearInterval(handle);
  }
  jobHandles.length = 0;
}
