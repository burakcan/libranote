import { z } from "zod";

// Basic note schema
export const noteSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  isPublic: z.boolean().optional().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  collectionId: z.string().uuid().nullable().optional(),
});

// Create note request schema
export const createNoteSchema = z.object({
  note: noteSchema,
});

// Update note request schema
export const updateNoteSchema = z.object({
  note: z.object({
    title: z.string(),
    description: z.string().nullable().optional(),
    isPublic: z.boolean().optional(),
    updatedAt: z.string().datetime().optional(),
    // collectionId empty string or uuid
    collectionId: z.string().uuid().nullable().optional(),
  }),
});

// Note params schema (for routes with :id)
export const noteParamsSchema = z.object({
  id: z.string().uuid(),
});

// Collection params schema (for routes with :collectionId)
export const collectionParamsSchema = z.object({
  collectionId: z.string().uuid(),
});
