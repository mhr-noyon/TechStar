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