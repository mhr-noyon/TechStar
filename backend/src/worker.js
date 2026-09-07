import { startWorker } from "./workers/index.js";

startWorker().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});