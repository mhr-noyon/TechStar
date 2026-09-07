import { Router } from "express";
import {
  createOperatorUser,
  createCustomerUser,
  createTechnicianUser,
  getCustomerByPhone,
  list,
  update,
} from "../controllers/user.controller.js";

import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/customers", authorizeRoles("OPERATOR", "SUPERVISOR"), getCustomerByPhone);
router.get("/", authorizeRoles("SUPERVISOR", "OPERATOR"), list);
router.post("/customers", authorizeRoles("OPERATOR", "SUPERVISOR"), createCustomerUser);
router.post("/operators", authorizeRoles("SUPERVISOR"), createOperatorUser);
router.post("/technicians", authorizeRoles("SUPERVISOR"), createTechnicianUser);
router.patch("/:id", authorizeRoles("SUPERVISOR", "OPERATOR"), update);

export default router;
