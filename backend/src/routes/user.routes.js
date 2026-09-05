import { Router } from "express";
import {
  createOperatorUser,
  createTechnicianUser,
  update,
} from "../controllers/user.controller.js";

const router = Router();

// Have to connect authentication and role authorization here later.
router.post("/operators", createOperatorUser);
router.post("/technicians", createTechnicianUser);
router.patch("/:id", update);

export default router;