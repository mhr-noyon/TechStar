const reservations = new Map();

export function registerServiceRequestSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join", ({ room }) => {
      if (typeof room === "string" && room.length > 0) socket.join(room);
    });

    socket.on("joinUser", (userId) => {
      if (userId) {
        socket.userId = userId;
        socket.join(`user:${userId}`);
      }
    });

    socket.on("joinRole", (role) => {
      if (role === "SUPERVISOR") socket.join("supervisors");
      if (role === "OPERATOR") socket.join("operators");
    });

    socket.on("joinServiceRequest", (serviceRequestId) => {
      if (serviceRequestId !== undefined && serviceRequestId !== null) {
        socket.join(`serviceRequest:${serviceRequestId}`);
      }
    });

    socket.on("technician:reservation", ({ technicianId, requestId, reserved }) => {
      if (!technicianId || !requestId) return;

      const key = `${socket.id}:${requestId}`;
      if (reserved) {
        reservations.set(key, { technicianId, requestId, socketId: socket.id });
      } else {
        reservations.delete(key);
      }

      io.to("operators").emit("technician:reservationChanged", {
        technicianId,
        requestId,
        reserved: Boolean(reserved),
        reservationId: key,
      });
    });

    socket.on("chat:send", (msgData) => {
      io.emit("chat:message", {
        id: "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        ...msgData,
        created_at: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      for (const [key, reservation] of reservations) {
        if (reservation.socketId !== socket.id) continue;
        reservations.delete(key);
        io.to("operators").emit("technician:reservationChanged", {
          technicianId: reservation.technicianId,
          requestId: reservation.requestId,
          reserved: false,
          reservationId: key,
        });
      }
    });
  });
}

export function emitServiceRequestCreated(request, history) {
  const io = globalThis.serviceRequestSocketServer;
  if (!io) return;

  const payload = { serviceRequest: request, history };
  io.to("operators").to("supervisors").emit("serviceRequest:created", payload);
  io.to(`serviceRequest:${request.id}`).emit("serviceRequest:created", payload);
  if (history) {
    io.to("operators").to("supervisors").emit("serviceRequest:historyCreated", { history, serviceRequest: request });
  }
}

export function emitServiceRequestAssigned(request, technicianId, assignedBy, history) {
  const io = globalThis.serviceRequestSocketServer;
  if (!io) return;

  const payload = {
    serviceRequestId: request.id,
    technicianId,
    assignedBy,
    serviceRequest: request,
    history,
  };
  io.to(`technician:${technicianId}`)
    .to("operators")
    .to("supervisors")
    .to(`serviceRequest:${request.id}`)
    .emit("serviceRequest:assigned", payload);
  if (history) {
    io.to("operators").to("supervisors").emit("serviceRequest:historyCreated", { history, serviceRequest: request });
  }
}

export function emitServiceRequestStatusUpdated(request, updatedBy, history) {
  const io = globalThis.serviceRequestSocketServer;
  if (!io) return;

  const payload = {
    serviceRequestId: request.id,
    status: request.status,
    updatedBy,
    serviceRequest: request,
    history,
  };
  io.to(`customer:${request.customer_id}`)
    .to(`technician:${request.technician_id}`)
    .to("operators")
    .to("supervisors")
    .to(`serviceRequest:${request.id}`)
    .emit("serviceRequest:statusUpdated", payload);
  if (history) {
    io.to("operators").to("supervisors").emit("serviceRequest:historyCreated", { history, serviceRequest: request });
  }
}