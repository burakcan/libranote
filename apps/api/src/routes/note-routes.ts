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
import { validate } from "../middleware/validate.js";
import {
  createNoteSchema,
  updateNoteSchema,
  noteParamsSchema,
  collectionParamsSchema,
} from "../validators/note-validators.js";

const router: Router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Note routes
router.get("/", getNotes);
router.get("/:id", validate(noteParamsSchema, "params"), getNote);
router.get(
  "/collection/:collectionId",
  validate(collectionParamsSchema, "params"),
  getNotesByCollection,
);
router.post("/", validate(createNoteSchema), createNote);
router.put("/:id", validate(noteParamsSchema, "params"), validate(updateNoteSchema), updateNote);
router.delete("/:id", validate(noteParamsSchema, "params"), deleteNote);

export default router;
