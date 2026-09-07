import { Router } from "express";
import {
  available,
  getOne,
  list,
  update,
} from "../controllers/technician.controller.js";

import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/available", authorizeRoles("OPERATOR", "SUPERVISOR"), available);
router.patch("/:id", authorizeRoles("SUPERVISOR"), update);
router.get("/:id", authorizeRoles("SUPERVISOR", "OPERATOR"), getOne);
router.get("/", authorizeRoles("SUPERVISOR", "OPERATOR"), list);

export default router;
