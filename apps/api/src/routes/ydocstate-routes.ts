import express from "express";
import type { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getYDocStates } from "../controllers/ydocstate-controller.js";

const router: Router = express.Router();

router.use(requireAuth);

router.get("/", getYDocStates);

export default router;
