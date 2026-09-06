import { createServer } from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { initializeSockets } from "./sockets/index.js";
import { startWorker } from "./workers/index.js";

const httpServer = createServer(app);
initializeSockets(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
  startWorker();
});