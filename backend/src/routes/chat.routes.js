import { Router } from "express";
import {
  fetchMessages,
  sendMessage,
} from "../controllers/chat.controller.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// Staff group chat is only accessible to authenticated Operators and Supervisors
router.use(authenticateToken, authorizeRoles("OPERATOR", "SUPERVISOR"));

router.get("/messages", fetchMessages);
router.post("/messages", sendMessage);

export default router;
