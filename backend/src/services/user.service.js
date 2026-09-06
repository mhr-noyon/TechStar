import bcrypt from "bcryptjs";
import {
  createStaffUser,
  createTechnicianProfile,
  createUser as createCustomerRecord,
  findUserByPhone,
  findUsersByRole,
  updateUser,
} from "../repositories/user.repository.js";

function userError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateUserFields({ name, email, phone, password }) {
  if (!name || !email || !phone || !password) {
    throw userError("name, email, phone and password are required");
  }
  if (password.length < 8)
    throw userError("Password must be at least 8 characters");
}

async function createUser(data, role) {
  validateUserFields(data);
  const passwordHash = await bcrypt.hash(data.password, 12);
  return createStaffUser({ ...data, passwordHash, role });
}

export function createOperator(data) {
  return createUser(data, "OPERATOR");
}

export async function createTechnician(data) {
  validateUserFields(data);
  const maxCapacity = Number(data.maxCapacity);
  if (!Number.isInteger(maxCapacity) || maxCapacity < 1) {
    throw userError("maxCapacity must be a positive integer");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await createStaffUser({
    ...data,
    passwordHash,
    role: "TECHNICIAN",
  });
  const technician = await createTechnicianProfile({
    userId: user.id,
    specialization: data.specialization,
    maxCapacity,
  });

  return { ...user, technician };
}

export async function updateUserDetails(id, data) {
  const changes = {};
  if (data.name !== undefined) changes.name = data.name;
  if (data.email !== undefined) changes.email = data.email;
  if (data.phone !== undefined) changes.phone = data.phone;
  if (data.password !== undefined) {
    if (data.password.length < 8)
      throw userError("Password must be at least 8 characters");
    changes.password_hash = await bcrypt.hash(data.password, 12);
  }

  if (Object.keys(changes).length === 0)
    throw userError("No user fields supplied");
  return updateUser(id, changes);
}

export async function findCustomerByPhone(phone) {
  if (!phone) throw userError("phone is required");
  return findUserByPhone(phone);
}

export async function createCustomer(data) {
  const { name, email, phone } = data;
  if (!name || !email || !phone) {
    throw userError("name, email and phone are required");
  }

  const passwordHash = await bcrypt.hash(`${phone}-${Date.now()}`, 12);
  return createCustomerRecord({ name, email, phone, passwordHash });
}

export function listUsers(role, options) {
  return findUsersByRole(role, options);
}
