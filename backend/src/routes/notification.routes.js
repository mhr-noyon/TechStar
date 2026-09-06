import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  fetchUserNotifications,
  fetchUnreadCount,
  markSingleAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(authenticateToken);

router.get("/", fetchUserNotifications);
router.get("/unread-count", fetchUnreadCount);
router.patch("/:id/read", markSingleAsRead);
router.post("/read-all", markAllAsRead);

export default router;
