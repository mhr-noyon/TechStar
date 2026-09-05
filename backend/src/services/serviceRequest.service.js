import {
  createServiceRequest,
  findServiceRequestById,
  findServiceRequests,
  updateServiceRequest,
} from "../repositories/serviceRequest.repository.js";
import {
  changeActiveJobs,
  findAvailableTechnician,
} from "../repositories/technician.repository.js";
import {
  createHistory,
  findHistoryByRequestId,
} from "../repositories/history.repository.js";
import {
  emitServiceRequestAssigned,
  emitServiceRequestCreated,
  emitServiceRequestStatusUpdated,
} from "../sockets/serviceRequest.socket.js";

const statuses = [
  "RECEIVED",
  "ASSIGNED",
  "REPAIRING",
  "WAITING_FOR_PARTS",
  "READY_FOR_DELIVERY",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];
const priorities = ["NORMAL", "HIGH", "URGENT"];

function serviceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function requiredActor(actorId) {
  if (!actorId) throw serviceError("changedBy is required until authentication is connected");
  return actorId;
}

async function saveHistory(request, changes, changedBy, note) {
  await createHistory({
    service_request_id: request.id,
    changed_by: requiredActor(changedBy),
    old_status: request.status,
    new_status: changes.status ?? request.status,
    old_progress: request.progress,
    new_progress: changes.progress ?? request.progress,
    note: note || null,
  });
}

export async function createRequest({ customerId, createdBy, deviceInfo, problemDescription, priority, expectedDeliveryAt }) {
  if (!customerId || !createdBy || !deviceInfo || !problemDescription) {
    throw serviceError("customerId, createdBy, deviceInfo and problemDescription are required");
  }
  if (priority && !priorities.includes(priority)) throw serviceError("Invalid priority");

  const request = await createServiceRequest({
    customer_id: customerId,
    created_by: createdBy,
    device_info: deviceInfo,
    problem_description: problemDescription,
    priority: priority || "NORMAL",
    expected_delivery_at: expectedDeliveryAt || null,
  });

  await createHistory({
    service_request_id: request.id,
    changed_by: createdBy,
    new_status: request.status,
    new_progress: request.progress,
    note: "Service request created",
  });
  emitServiceRequestCreated(request);
  return request;
}

export function listRequests() {
  return findServiceRequests();
}

export async function getRequest(id) {
  const request = await findServiceRequestById(id);
  if (!request) throw serviceError("Service request not found", 404);
  return request;
}

export async function getRequestHistory(id) {
  const request = await findServiceRequestById(id);
  if (!request) throw serviceError("Service request not found", 404);
  return findHistoryByRequestId(id);
}

export async function assignRequest(id, { technicianId, changedBy }) {
  if (!technicianId) throw serviceError("technicianId is required");
  requiredActor(changedBy);
  const request = await getRequest(id);
  if (request.technician_id) throw serviceError("Request is already assigned");

  const technician = await findAvailableTechnician(technicianId);
  if (!technician) throw serviceError("Technician is unavailable");

  const updated = await updateServiceRequest(id, {
    technician_id: technicianId,
    status: "ASSIGNED",
  });
  await changeActiveJobs(technicianId, 1);
  await saveHistory(request, updated, changedBy, `Assigned to technician ${technicianId}`);
  emitServiceRequestAssigned(updated, technicianId, changedBy);
  return updated;
}

export async function updateRequest(id, changes) {
  const request = await getRequest(id);
  const changedBy = requiredActor(changes.changedBy);
  const allowed = ["problem_description", "priority", "expected_delivery_at"];
  const update = {};
  for (const field of allowed) {
    if (changes[field] !== undefined) update[field] = changes[field];
  }
  if (update.priority && !priorities.includes(update.priority)) throw serviceError("Invalid priority");
  if (Object.keys(update).length === 0) throw serviceError("No editable fields supplied");

  const updated = await updateServiceRequest(id, update);
  await saveHistory(request, updated, changedBy, changes.note || "Request details updated");
  if (updated.status !== request.status) {
    emitServiceRequestStatusUpdated(updated, changedBy);
  }
  return updated;
}

export async function updateStatusRequest(id, { status, changedBy, note }) {
  if (!statuses.includes(status)) throw serviceError("Invalid status");
  return updateWithHistory(id, { status }, changedBy, note || `Status changed to ${status}`);
}

export async function updateProgressRequest(id, { progress, changedBy, note }) {
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    throw serviceError("Progress must be an integer between 0 and 100");
  }
  return updateWithHistory(id, { progress }, changedBy, note || `Progress changed to ${progress}`);
}

export async function completeRequest(id, { changedBy, note }) {
  const request = await getRequest(id);
  requiredActor(changedBy);
  const updated = await updateServiceRequest(id, {
    status: "COMPLETED",
    progress: 100,
    completed_at: new Date().toISOString(),
  });
  await saveHistory(request, updated, changedBy, note || "Repair completed");
  if (request.technician_id) await changeActiveJobs(request.technician_id, -1);
  emitServiceRequestStatusUpdated(updated, changedBy);
  return updated;
}

export function cancelRequest(id, { changedBy, note }) {
  return updateWithHistory(id, { status: "CANCELLED" }, changedBy, note || "Request cancelled");
}

async function updateWithHistory(id, changes, changedBy, note) {
  requiredActor(changedBy);
  const request = await getRequest(id);
  const updated = await updateServiceRequest(id, changes);
  await saveHistory(request, updated, changedBy, note);
  if (changes.status !== undefined) {
    emitServiceRequestStatusUpdated(updated, changedBy);
  }
  return updated;
}
