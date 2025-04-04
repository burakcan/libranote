import express from "express";
import type { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
} from "../controllers/collection-controller.js";

const router: Router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Collection routes
router.get("/", getCollections);
router.get("/:id", getCollection);
router.post("/", createCollection);
router.put("/:id", updateCollection);
router.delete("/:id", deleteCollection);

export default router;
