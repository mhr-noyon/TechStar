import {
  findAvailableTechnicians,
  findTechnicianById,
  findTechnicians,
  updateTechnicianProfile,
} from "../repositories/technician.repository.js";

import { updateUserDetails } from "./user.service.js";

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

export async function updateTechnician(id, data) {
  const technician = await findTechnicianById(id);
  if (!technician) {
    const error = new Error("Technician not found");
    error.statusCode = 404;
    throw error;
  }

  const changes = {};
  if (data.specialization !== undefined)
    changes.specialization = data.specialization;
  if (data.maxCapacity !== undefined) {
    const maxCapacity = Number(data.maxCapacity);
    if (!Number.isInteger(maxCapacity) || maxCapacity < 1)
      throw new Error("maxCapacity must be a positive integer");
    changes.max_capacity = maxCapacity;
  }
  if (data.isAvailable !== undefined)
    changes.is_available = Boolean(data.isAvailable);

  if (data.name !== undefined || data.email !== undefined || data.phone !== undefined || (data.password && data.password.trim().length > 0)) {
    await updateUserDetails(technician.user_id, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
    });
  }

  if (Object.keys(changes).length > 0) {
    await updateTechnicianProfile(id, changes);
  }

  return findTechnicianById(id);
}

