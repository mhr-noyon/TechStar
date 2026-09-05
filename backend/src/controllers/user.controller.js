import {
  createOperator,
  createCustomer,
  createTechnician,
  findCustomerByPhone,
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

export async function update(req, res, next) {
  try {
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