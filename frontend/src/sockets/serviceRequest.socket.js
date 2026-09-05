import { socket } from "./socket";

let subscriberCount = 0;

export function connectOperatorSocket(handlers = {}) {
  subscriberCount += 1;
  socket.connect();
  socket.emit("join", { room: "operators" });
  Object.entries(handlers).forEach(([event, handler]) =>
    socket.on(event, handler),
  );
  return () => {
    Object.entries(handlers).forEach(([event, handler]) =>
      socket.off(event, handler),
    );
    subscriberCount -= 1;
    if (subscriberCount === 0) socket.disconnect();
  };
}

export function setTechnicianReservation({
  technicianId,
  requestId,
  reserved,
}) {
  socket.emit("technician:reservation", { technicianId, requestId, reserved });
}
