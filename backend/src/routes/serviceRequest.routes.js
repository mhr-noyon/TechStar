import { Router } from "express";
import {
  assign,
  cancel,
  complete,
  create,
  getHistory,
  getOne,
  list,
  track,
  update,
  updateProgress,
  updateStatus,
} from "../controllers/serviceRequest.controller.js";

import { sensitiveRateLimiter } from "../middleware/rateLimit.middleware.js";

import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// Intentionally public endpoint for customers tracking requests via ID and access code
router.get("/track", sensitiveRateLimiter, track);

// Require authentication for all subsequent service request endpoints
router.use(authenticateToken);

router.post("/", authorizeRoles("OPERATOR", "SUPERVISOR"), create);
router.get("/", list);
router.get("/:id/history", getHistory);
router.patch("/:id/assign", authorizeRoles("OPERATOR", "SUPERVISOR"), assign);
router.patch("/:id/status", authorizeRoles("OPERATOR", "SUPERVISOR"), updateStatus);
router.patch("/:id/progress", authorizeRoles("OPERATOR", "SUPERVISOR"), updateProgress);
router.patch("/:id/complete", authorizeRoles("OPERATOR", "SUPERVISOR"), complete);
router.patch("/:id/cancel", authorizeRoles("OPERATOR", "SUPERVISOR"), cancel);
router.patch("/:id", authorizeRoles("OPERATOR", "SUPERVISOR"), update);
router.get("/:id", authorizeRoles("OPERATOR", "SUPERVISOR"), getOne);

export default router;
