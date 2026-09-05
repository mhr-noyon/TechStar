import { Router } from "express";
import {
  available,
  getOne,
  list,
} from "../controllers/technician.controller.js";

const router = Router();

// Have to connect authentication and role authorization here later.
router.get("/available", available);
router.get("/:id", getOne);
router.get("/", list);

export default router;