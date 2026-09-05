import { io } from "socket.io-client";

export const socket = io(
  import.meta.env.SOCKET_URL || "http://localhost:5000",
  { autoConnect: false },
);
