import { Router } from "express";
import {
  createOperatorUser,
  createCustomerUser,
  createTechnicianUser,
  getCustomerByPhone,
  list,
  update,
} from "../controllers/user.controller.js";

const router = Router();

// Have to connect authentication and role authorization here later.
router.get("/customers", getCustomerByPhone);
router.get("/", list);
router.post("/customers", createCustomerUser);
router.post("/operators", createOperatorUser);
router.post("/technicians", createTechnicianUser);
router.patch("/:id", update);

export default router;
