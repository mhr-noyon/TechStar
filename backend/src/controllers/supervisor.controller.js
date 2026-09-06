import { getSupervisorOverview } from "../services/supervisor.service.js";

export async function overview(req, res, next) {
  try {
    return res.json({ success: true, data: await getSupervisorOverview() });
  } catch (error) {
    return next(error);
  }
}
