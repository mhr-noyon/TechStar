import {
  findAvailableTechnicians,
  findTechnicianById,
  findTechnicians,
} from "../repositories/technician.repository.js";

export function listTechnicians() {
  return findTechnicians();
}

export function listAvailableTechnicians() {
  return findAvailableTechnicians();
}

export async function getTechnician(id) {
  const technician = await findTechnicianById(id);
  if (!technician) {
    const error = new Error("Technician not found");
    error.statusCode = 404;
    throw error;
  }
  return technician;
}