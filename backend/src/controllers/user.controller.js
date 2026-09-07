import {
  createOperator,
  createCustomer,
  createTechnician,
  findCustomerByPhone,
  listUsers,
  updateUserDetails,
} from "../services/user.service.js";

export async function createOperatorUser(req, res, next) {
  try {
    const data = await createOperator(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function createTechnicianUser(req, res, next) {
  try {
    const data = await createTechnician(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

import { findUserById } from "../repositories/user.repository.js";

async function checkUserUpdateAccess(caller, targetUserId) {
  if (caller.role === "SUPERVISOR") return true;
  if (caller.id === targetUserId) return true;
  
  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  
  if (caller.role === "OPERATOR" && targetUser.role === "CUSTOMER") {
    return true;
  }
  
  const error = new Error("Access denied. You are not authorized to update this user.");
  error.statusCode = 403;
  throw error;
}

export async function update(req, res, next) {
  try {
    await checkUserUpdateAccess(req.user, req.params.id);
    const data = await updateUserDetails(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function getCustomerByPhone(req, res, next) {
  try {
    const data = await findCustomerByPhone(req.query.phone);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function createCustomerUser(req, res, next) {
  try {
    const data = await createCustomer(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

export async function list(req, res, next) {
  try {
    const { role, ...options } = req.query;
    return res.json({ success: true, data: await listUsers(role, options) });
  } catch (error) {
    return next(error);
  }
}
