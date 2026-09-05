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

const router = Router();

// Have to connect authentication and role authorization here later.
router.post("/", create);
router.get("/", list);
router.get("/track", track);
router.get("/:id/history", getHistory);
router.patch("/:id/assign", assign);
router.patch("/:id/status", updateStatus);
router.patch("/:id/progress", updateProgress);
router.patch("/:id/complete", complete);
router.patch("/:id/cancel", cancel);
router.patch("/:id", update);
router.get("/:id", getOne);

export default router;
