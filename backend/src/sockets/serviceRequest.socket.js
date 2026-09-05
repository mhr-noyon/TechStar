const reservations = new Map();

export function registerServiceRequestSocket(io) {
  io.on("connection", (socket) => {
    // Replace client-supplied room joins with authenticated identity later.
    socket.on("join", ({ room }) => {
      if (typeof room === "string" && room.length > 0) socket.join(room);
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

export function emitServiceRequestCreated(request) {
  const io = globalThis.serviceRequestSocketServer;
  if (!io) return;

  const payload = { serviceRequest: request };
  io.to("operators").to("supervisors").emit("serviceRequest:created", payload);
  io.to(`serviceRequest:${request.id}`).emit("serviceRequest:created", payload);
}

export function emitServiceRequestAssigned(request, technicianId, assignedBy) {
  const io = globalThis.serviceRequestSocketServer;
  if (!io) return;

  const payload = {
    serviceRequestId: request.id,
    technicianId,
    assignedBy,
    serviceRequest: request,
  };
  io.to(`technician:${technicianId}`)
    .to("operators")
    .to("supervisors")
    .to(`serviceRequest:${request.id}`)
    .emit("serviceRequest:assigned", payload);
}

export function emitServiceRequestStatusUpdated(request, updatedBy) {
  const io = globalThis.serviceRequestSocketServer;
  if (!io) return;

  const payload = {
    serviceRequestId: request.id,
    status: request.status,
    updatedBy,
    serviceRequest: request,
  };
  io.to(`customer:${request.customer_id}`)
    .to(`technician:${request.technician_id}`)
    .to("operators")
    .to("supervisors")
    .to(`serviceRequest:${request.id}`)
    .emit("serviceRequest:statusUpdated", payload);
}