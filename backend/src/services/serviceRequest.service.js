import {
  createServiceRequest,
  findServiceRequestById,
  findServiceRequests,
  findTrackableServiceRequest,
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
import { createAndDistributeNotification } from "./notification.service.js";

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

function createAccessCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function serviceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function requiredActor(actorId) {
  if (!actorId)
    throw serviceError(
      "changedBy is required until authentication is connected",
    );
  return actorId;
}

async function saveHistory(request, changes, changedBy, note) {
  return createHistory({
    service_request_id: request.id,
    changed_by: requiredActor(changedBy),
    old_status: request.status,
    new_status: changes.status ?? request.status,
    old_progress: request.progress,
    new_progress: changes.progress ?? request.progress,
    note: note || null,
  });
}

export async function createRequest({
  customerId,
  createdBy,
  deviceInfo,
  problemDescription,
  priority,
  paymentAmount,
  payment_amount,
  expectedDeliveryAt,
}) {
  if (!customerId || !createdBy || !deviceInfo || !problemDescription) {
    throw serviceError(
      "customerId, createdBy, deviceInfo and problemDescription are required",
    );
  }
  if (priority && !priorities.includes(priority))
    throw serviceError("Invalid priority");

  const amount = paymentAmount ?? payment_amount;
  const numAmount = amount !== undefined && amount !== null && amount !== "" ? Number(amount) : null;
  if (numAmount !== null && (isNaN(numAmount) || numAmount < 0)) {
    throw serviceError("paymentAmount must be a non-negative number");
  }

  const request = await createServiceRequest({
    customer_id: customerId,
    customer_access_code: createAccessCode(),
    created_by: createdBy,
    device_info: deviceInfo,
    problem_description: problemDescription,
    priority: priority || "NORMAL",
    payment_amount: numAmount,
    expected_delivery_at: expectedDeliveryAt || null,
  });

  const history = await createHistory({
    service_request_id: request.id,
    changed_by: createdBy,
    new_status: request.status,
    new_progress: request.progress,
    note: "Service request created",
  });
  emitServiceRequestCreated(request, history);

  try {
    await createAndDistributeNotification({
      title: `New Service Request #SR-${request.id}`,
      message: `Created for device: ${deviceInfo}`,
      type: "NEW_SERVICE_REQUEST",
      link_url: `/requests/${request.id}`,
      targetRoles: ["OPERATOR", "SUPERVISOR"],
      excludeUserId: createdBy,
    });
  } catch (err) {
    console.warn("Could not send new request notification:", err.message);
  }

  return request;
}

export async function trackRequest(id, accessCode) {
  if (!id || !/^\d{6}$/.test(accessCode || "")) {
    throw serviceError("A request ID and six-digit access code are required");
  }

  const request = await findTrackableServiceRequest(id, accessCode);
  if (!request)
    throw serviceError("Request ID or access code is not valid", 404);
  return { request, history: await findHistoryByRequestId(id) };
}

export function listRequests(options) {
  return findServiceRequests(options);
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
  if (request.technician_id === technicianId) {
    throw serviceError("Request is already assigned to this technician");
  }

  const technician = await findAvailableTechnician(technicianId);
  if (!technician) throw serviceError("Technician is unavailable");

  const updated = await updateServiceRequest(id, {
    technician_id: technicianId,
    status: "ASSIGNED",
  });
  
  if (request.technician_id) {
    await changeActiveJobs(request.technician_id, -1);
  }
  await changeActiveJobs(technicianId, 1);
  const history = await saveHistory(
    request,
    updated,
    changedBy,
    `Assigned to technician ${technicianId}`,
  );
  emitServiceRequestAssigned(updated, technicianId, changedBy, history);

  try {
    await createAndDistributeNotification({
      title: `Technician Assigned to #SR-${updated.id}`,
      message: `Assigned to technician for repair work`,
      type: "TECHNICIAN_ASSIGNMENT",
      link_url: `/requests/${updated.id}`,
      targetRoles: ["OPERATOR", "SUPERVISOR"],
      targetUserIds: [technicianId],
      excludeUserId: changedBy,
    });
  } catch (err) {
    console.warn("Could not send assignment notification:", err.message);
  }

  return updated;
}

export async function updateRequest(id, changes) {
  const request = await getRequest(id);
  const changedBy = requiredActor(changes.changedBy);
  const allowed = ["problem_description", "priority", "expected_delivery_at", "payment_amount", "paymentAmount", "status"];
  const update = {};
  for (const field of allowed) {
    if (changes[field] !== undefined) {
      if (field === "paymentAmount" || field === "payment_amount") {
        const val = changes[field];
        const numVal = val !== null && val !== "" ? Number(val) : null;
        if (numVal !== null && (isNaN(numVal) || numVal < 0)) {
          throw serviceError("paymentAmount must be a non-negative number");
        }
        update.payment_amount = numVal;
      } else {
        update[field] = changes[field];
      }
    }
  }
  if (update.priority && !priorities.includes(update.priority))
    throw serviceError("Invalid priority");
  if (update.status && !statuses.includes(update.status))
    throw serviceError("Invalid status");

  const isCompleted = update.status === "COMPLETED" || request.status === "COMPLETED";
  if (update.payment_amount !== undefined && update.payment_amount !== null && !isCompleted) {
    throw serviceError("Payment amount can only be set when status is COMPLETED");
  }

  if (Object.keys(update).length === 0)
    throw serviceError("No editable fields supplied");

  const updated = await updateServiceRequest(id, update);
  const history = await saveHistory(
    request,
    updated,
    changedBy,
    changes.note || (update.status ? `Status changed to ${update.status}` : "Request details updated"),
  );
  console.log("From updateRequest", history);
  emitServiceRequestStatusUpdated(updated, changedBy, history);

  try {
    const isPaymentChange = update.payment_amount !== undefined && update.payment_amount !== request.payment_amount;
    const isStatusChange = update.status !== undefined && update.status !== request.status;

    if (isPaymentChange || isStatusChange) {
      await createAndDistributeNotification({
        title: isPaymentChange ? `Payment Updated for #SR-${updated.id}` : `Status Updated for #SR-${updated.id}`,
        message: isPaymentChange
          ? `Payment amount set to $${updated.payment_amount}`
          : `Status changed to ${updated.status.replaceAll("_", " ")}`,
        type: isPaymentChange ? "PAYMENT_UPDATE" : "STATUS_UPDATE",
        link_url: `/requests/${updated.id}`,
        targetRoles: ["OPERATOR", "SUPERVISOR"],
        excludeUserId: changedBy,
      });
    }
  } catch (err) {
    console.warn("Could not send update notification:", err.message);
  }

  return updated;
}


export async function updateStatusRequest(id, { status, changedBy, note }) {
  if (!statuses.includes(status)) throw serviceError("Invalid status");
  return updateWithHistory(
    id,
    { status },
    changedBy,
    note || `Status changed to ${status}`,
  );
}

export async function updateProgressRequest(id, { progress, changedBy, note }) {
  if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
    throw serviceError("Progress must be an integer between 0 and 100");
  }
  return updateWithHistory(
    id,
    { progress },
    changedBy,
    note || `Progress changed to ${progress}`,
  );
}

export async function completeRequest(id, { changedBy, note }) {
  const request = await getRequest(id);
  requiredActor(changedBy);
  const updated = await updateServiceRequest(id, {
    status: "COMPLETED",
    progress: 100,
    completed_at: new Date().toISOString(),
  });
  const history = await saveHistory(request, updated, changedBy, note || "Repair completed");
  if (request.technician_id) await changeActiveJobs(request.technician_id, -1);

  console.log("From completeRequest", history);
  emitServiceRequestStatusUpdated(updated, changedBy, history);
  return updated;
}

export function cancelRequest(id, { changedBy, note }) {
  return updateWithHistory(
    id,
    { status: "CANCELLED" },
    changedBy,
    note || "Request cancelled",
  );
}

async function updateWithHistory(id, changes, changedBy, note) {
  requiredActor(changedBy);
  const request = await getRequest(id);
  const updated = await updateServiceRequest(id, changes);
  const history = await saveHistory(request, updated, changedBy, note);

  console.log("From updateWithHistory", history);
  emitServiceRequestStatusUpdated(updated, changedBy, history);

  try {
    if (changes.status !== undefined || changes.progress !== undefined) {
      const isStatus = changes.status !== undefined;
      await createAndDistributeNotification({
        title: isStatus ? `Status Updated for #SR-${updated.id}` : `Progress Updated for #SR-${updated.id}`,
        message: isStatus
          ? `Status changed to ${updated.status.replaceAll("_", " ")}`
          : `Progress updated to ${updated.progress}%`,
        type: isStatus ? "STATUS_UPDATE" : "PROGRESS_UPDATE",
        link_url: `/requests/${updated.id}`,
        targetRoles: ["OPERATOR", "SUPERVISOR"],
        excludeUserId: changedBy,
      });
    }
  } catch (err) {
    console.warn("Could not send update notification:", err.message);
  }

  return updated;
}

