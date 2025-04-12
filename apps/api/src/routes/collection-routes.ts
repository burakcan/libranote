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
import { validate } from "../middleware/validate.js";
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionParamsSchema,
} from "../validators/collection-validators.js";

const router: Router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Collection routes
router.get("/", getCollections);
router.get("/:id", validate(collectionParamsSchema, "params"), getCollection);
router.post("/", validate(createCollectionSchema), createCollection);
router.put(
  "/:id",
  validate(collectionParamsSchema, "params"),
  validate(updateCollectionSchema),
  updateCollection,
);
router.delete("/:id", validate(collectionParamsSchema, "params"), deleteCollection);

export default router;
