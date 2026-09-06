import { socket } from "./socket";

let subscriberCount = 0;

export function connectOperatorSocket(handlers = {}, room = "operators", user = null) {
  subscriberCount += 1;
  socket.connect();
  socket.emit("join", { room: "operators" });
  socket.emit("join", { room: "supervisors" });
  if (user?.id) {
    socket.emit("joinUser", user.id);
  }
  if (user?.role) {
    socket.emit("joinRole", user.role);
  }
  if (room && room !== "operators" && room !== "supervisors") {
    socket.emit("join", { room });
  }
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


export function getServiceRequestSocket() {
  socket.connect();
  return socket;
}

export function setTechnicianReservation({
  technicianId,
  requestId,
  reserved,
}) {
  socket.emit("technician:reservation", { technicianId, requestId, reserved });
}
