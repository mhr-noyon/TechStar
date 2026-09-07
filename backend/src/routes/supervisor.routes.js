import { Router } from "express";
import { overview } from "../controllers/supervisor.controller.js";

import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateToken, authorizeRoles("SUPERVISOR"));

router.get("/overview", overview);
export default router;
