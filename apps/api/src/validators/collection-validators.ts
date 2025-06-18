import { CollectionMemberRole } from "@repo/db";
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
  collection: z.object({
    title: z.string().min(1, "Title is required"),
    updatedAt: z.string().datetime(),
  }),
});

// Update membership request schema
export const updateMembershipSchema = z.object({
  membership: z
    .object({
      color: z.string().optional().nullable(),
      // Future membership properties can be added here:
      // notifications: z.boolean().optional(),
      // displayPreferences: z.object({...}).optional(),
      // etc.
    })
    .partial(), // Make all properties optional for flexibility
});

// Collection params schema (for routes with :id)
export const collectionParamsSchema = z.object({
  id: z.string(),
});

export const invitationParamsSchema = z.object({
  invitationId: z.string(),
});

export const collectionInvitationParamsSchema = z.object({
  id: z.string(),
  invitationId: z.string(),
});

export const collectionMemberParamsSchema = z.object({
  id: z.string(),
  userId: z.string(),
});

export const inviteToCollectionSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(CollectionMemberRole),
  callbackUrl: z.string().url(),
});
