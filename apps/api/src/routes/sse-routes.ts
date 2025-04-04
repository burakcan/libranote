import express from "express";
import type { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { connectSSE } from "../controllers/sse-controller.js";

const router: Router = express.Router();

// Apply authentication middleware
router.use(requireAuth);

// SSE endpoint
router.get("/", connectSSE);

export default router;
