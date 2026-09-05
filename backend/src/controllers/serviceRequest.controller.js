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
} from "../services/serviceRequest.service.js";

export async function create(req, res, next) {
  try {
    const data = await createRequest(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function list(req, res, next) {
  try {
    const data = await listRequests();
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const data = await getRequest(req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function assign(req, res, next) {
  try {
    const data = await assignRequest(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    const data = await updateRequest(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const data = await updateStatusRequest(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function updateProgress(req, res, next) {
  try {
    const data = await updateProgressRequest(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function complete(req, res, next) {
  try {
    const data = await completeRequest(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function cancel(req, res, next) {
  try {
    const data = await cancelRequest(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function getHistory(req, res, next) {
  try {
    const data = await getRequestHistory(req.params.id);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}