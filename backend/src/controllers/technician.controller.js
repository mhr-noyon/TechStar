import {
  getTechnician,
  listAvailableTechnicians,
  listTechnicians,
  updateTechnician,
} from "../services/technician.service.js";

async function checkTechnicianAccess(user, technicianId, allowSelfOnly = false) {
  if (user.role === "SUPERVISOR") return true;
  if (!allowSelfOnly && user.role === "OPERATOR") return true;
  
  const technician = await getTechnician(technicianId);
  if (user.role === "TECHNICIAN" && (technician.user_id === user.id || String(technician.id) === String(technicianId))) {
    return technician;
  }
  
  const error = new Error("Access denied. You are not authorized to access or modify this technician profile.");
  error.statusCode = 403;
  throw error;
}

export async function list(req, res, next) {
  try {
    return res.json({ success: true, data: await listTechnicians() });
  } catch (error) {
    return next(error);
  }
}

export async function available(req, res, next) {
  try {
    return res.json({ success: true, data: await listAvailableTechnicians() });
  } catch (error) {
    return next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const technician = await checkTechnicianAccess(req.user, req.params.id, false);
    const data = typeof technician === "object" && technician.id ? technician : await getTechnician(req.params.id);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
}

export async function update(req, res, next) {
  try {
    await checkTechnicianAccess(req.user, req.params.id, req.user.role !== "SUPERVISOR");
    return res.json({
      success: true,
      data: await updateTechnician(req.params.id, req.body),
    });
  } catch (error) {
    return next(error);
  }
}
