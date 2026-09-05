import { io } from "socket.io-client";

const CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("🟢 Customer A connected:", socket.id);

    socket.emit("join", {
        room: `customer:${CUSTOMER_ID}`,
    });

    console.log(`Joined customer:${CUSTOMER_ID}`);
});

socket.on("serviceRequest:created", (data) => {
    console.log("📢 Customer A - CREATED:", data);
});

socket.on("serviceRequest:assigned", (data) => {
    console.log("📢 Customer A - ASSIGNED:", data);
});

socket.on("serviceRequest:statusUpdated", (data) => {
    console.log("📢 Customer A - STATUS:", data);
});