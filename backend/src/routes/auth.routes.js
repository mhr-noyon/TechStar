import { Router } from "express";
import { login, refresh, logout, getMe } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { sensitiveRateLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/login", sensitiveRateLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticateToken, getMe);

export default router;
