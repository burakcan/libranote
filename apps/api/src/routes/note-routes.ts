import express from "express";
import type { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getNotes,
  getNote,
  getNotesByCollection,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/note-controller.js";

const router: Router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Note routes
router.get("/", getNotes);
router.get("/:id", getNote);
router.get("/collection/:collectionId", getNotesByCollection);
router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;
