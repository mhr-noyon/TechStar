import { Router } from "express";
import { overview } from "../controllers/supervisor.controller.js";

const router = Router();
router.get("/overview", overview);
export default router;
