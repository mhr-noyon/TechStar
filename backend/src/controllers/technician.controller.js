import {
  getTechnician,
  listAvailableTechnicians,
  listTechnicians,
} from "../services/technician.service.js";

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
    return res.json({ success: true, data: await getTechnician(req.params.id) });
  } catch (error) {
    return next(error);
  }
}