import { Server } from "socket.io";
import { registerServiceRequestSocket } from "./serviceRequest.socket.js";

let io;

export function initializeSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  globalThis.serviceRequestSocketServer = io;
  registerServiceRequestSocket(io);
  return io;
}

export function getSocketServer() {
  return io;
}