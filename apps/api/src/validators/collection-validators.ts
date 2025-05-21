import { z } from "zod";

// Basic collection schema
export const collectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Create collection request schema
export const createCollectionSchema = z.object({
  collection: collectionSchema.omit({ id: true }),
});

// Update collection request schema
export const updateCollectionSchema = z.object({
  collection: z
    .object({
      title: z.string().min(1, "Title is required"),
      updatedAt: z.string().datetime(),
      members: z.array(
        z.object({
          id: z.string(),
          color: z.string().optional().nullable(),
        }),
      ),
    })
    .optional(),
});

// Collection params schema (for routes with :id)
export const collectionParamsSchema = z.object({
  id: z.string(),
});

export const collectionMemberParamsSchema = z.object({
  id: z.string(),
  userId: z.string(),
});
