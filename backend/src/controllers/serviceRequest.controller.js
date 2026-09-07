import {
  assignRequest,
  cancelRequest,
  completeRequest,
  createRequest,
  getRequest,
  getRequestHistory,
  listRequests,
  updateProgressRequest,
  updateRequest,
  updateStatusRequest,
  trackRequest,
} from "../services/serviceRequest.service.js";

function checkRequestAccess(user, request) {
  if (user.role === "OPERATOR" || user.role === "SUPERVISOR") {
    return true;
  }
  if (user.role === "CUSTOMER" && request.customer_id === user.id) {
    return true;
  }
  const error = new Error("Access denied. You are not authorized to view or modify this service request.");
  error.statusCode = 403;
  throw error;
}

function checkTechnicianModificationAccess(user, request) {
  if (user.role === "OPERATOR" || user.role === "SUPERVISOR") {
    return true;
  }
  const error = new Error("Access denied. Technicians can only modify assigned requests.");
  error.statusCode = 403;
  throw error;
}

export async function create(req, res, next) {
  try {
    const payload = { ...req.body, createdBy: req.user.id };
    const data = await createRequest(payload);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function list(req, res, next) {
  try {
    const queryOptions = { ...req.query };
    if (req.user.role === "TECHNICIAN") {
      queryOptions.technicianId = req.user.id;
    } else if (req.user.role === "CUSTOMER") {
      queryOptions.customerId = req.user.id;
    }
    const data = await listRequests(queryOptions);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const request = await getRequest(req.params.id);
    checkRequestAccess(req.user, request);
    return res.json({ success: true, data: request });
  } catch (error) {
    return next(error);
  }
}

export async function assign(req, res, next) {
  try {
    const payload = { ...req.body, changedBy: req.user.id };
    const data = await assignRequest(req.params.id, payload);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const request = await getRequest(req.params.id);
    checkTechnicianModificationAccess(req.user, request);
    const payload = { ...req.body, changedBy: req.user.id };
    const data = await updateRequest(req.params.id, payload);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const request = await getRequest(req.params.id);
    checkTechnicianModificationAccess(req.user, request);
    const payload = { ...req.body, changedBy: req.user.id };
    const data = await updateStatusRequest(req.params.id, payload);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateProgress(req, res, next) {
  try {
    const request = await getRequest(req.params.id);
    checkTechnicianModificationAccess(req.user, request);
    const payload = { ...req.body, changedBy: req.user.id };
    const data = await updateProgressRequest(req.params.id, payload);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function complete(req, res, next) {
  try {
    const request = await getRequest(req.params.id);
    checkTechnicianModificationAccess(req.user, request);
    const payload = { ...req.body, changedBy: req.user.id };
    const data = await completeRequest(req.params.id, payload);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function cancel(req, res, next) {
  try {
    const payload = { ...req.body, changedBy: req.user.id };
    const data = await cancelRequest(req.params.id, payload);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function getHistory(req, res, next) {
  try {
    const request = await getRequest(req.params.id);
    checkRequestAccess(req.user, request);
    const data = await getRequestHistory(req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function track(req, res, next) {
  try {
    const data = await trackRequest(req.query.requestId, req.query.accessCode);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}