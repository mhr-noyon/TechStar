import { io } from "socket.io-client";
import { env } from "../src/config/env.js";

const socket = io(`${env.serverUrl}`);

socket.on("connect", () => {
    console.log("✅ Connected to Socket.IO");
    console.log("Socket ID:", socket.id);

    // Join testing rooms
    socket.emit("join", { room: "operators" });
    socket.emit("join", { room: "supervisors" });

    socket.emit("join", {
        room: "customer:11111111-1111-1111-1111-111111111111",
    });

    socket.emit("join", {
        room: "technician:dddddddd-dddd-dddd-dddd-dddddddddddd",
    });

    socket.emit("joinServiceRequest", 1);

    console.log("✅ Joined test rooms");
});

socket.on("serviceRequest:created", (data) => {
    console.log("📢 CREATED:", data);
});

socket.on("serviceRequest:assigned", (data) => {
    console.log("📢 ASSIGNED:", data);
});

socket.on("serviceRequest:statusUpdated", (data) => {
    console.log("📢 STATUS UPDATED:", data);
});

socket.on("connect_error", (error) => {
    console.error("❌ Connection error:", error.message);
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected");
});