import type { Request, Response } from "express";
import { randomUUID } from "crypto";
import { Prisma, prisma, type Collection } from "../db/prisma.js";
import { SSEService } from "../services/sse-service.js";

const whereCanViewCollection = (userId: string) => ({
  OR: [
    {
      ownerId: userId,
    },
    { members: { some: { userId } } },
  ],
});

const whereCanEditCollection = (userId: string) => ({
  OR: [
    {
      ownerId: userId,
    },
    { members: { some: { userId, canEdit: true } } },
  ],
});

const whereCanDeleteCollection = (userId: string) => ({
  ownerId: userId,
});

/**
 * Get all collections for the current user (owned + member of)
 */
export async function getCollections(req: Request, res: Response): Promise<void> {
  const { userId } = req;

  try {
    // Get collections where user is a member or owner
    const collections = await prisma.collection.findMany({
      where: whereCanViewCollection(userId),
      orderBy: { updatedAt: "desc" },
    });

    res.status(200).json({ collections });

    return;
  } catch (error) {
    console.error("Error fetching collections:", error);

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to fetch collections",
    });

    return;
  }
}

/**
 * Get a specific collection by ID
 */
export async function getCollection(
  req: Request<{ id: string }, {}, {}, { userId: string }>,
  res: Response,
) {
  const { userId } = req.query;
  const { id } = req.params;

  try {
    // Get collection with data needed for permission checks
    const collection = await prisma.collection.findUnique({
      where: {
        id,
        ...whereCanViewCollection(userId),
      },
    });

    if (!collection) {
      res.status(404).json({
        error: "NotFound",
        message: "Collection not found",
      });

      return;
    }

    res.status(200).json({ collection });

    return;
  } catch (error) {
    console.error("Error fetching collection:", error);

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to fetch collection",
    });

    return;
  }
}

/**
 * Create a new collection
 */
export async function createCollection(
  req: Request<{}, {}, { collection: Pick<Collection, "title" | "createdAt" | "updatedAt"> }>,
  res: Response,
) {
  const { userId } = req;
  const { collection } = req.body;
  const clientId = (req.headers["x-client-id"] as string) || "";

  try {
    // Validate input
    if (
      !collection.title ||
      typeof collection.title !== "string" ||
      !collection.createdAt ||
      typeof collection.createdAt !== "string" ||
      !collection.updatedAt ||
      typeof collection.updatedAt !== "string"
    ) {
      res.status(400).json({
        error: "BadRequest",
        message: "Title, createdAt, and updatedAt are required and must be strings",
      });

      return;
    }

    const newCollection = await prisma.collection.create({
      data: {
        id: randomUUID(),
        title: collection.title,
        ownerId: userId,
        createdAt: new Date(collection.createdAt),
        updatedAt: new Date(collection.updatedAt),
      },
    });

    // Broadcast event to other clients
    if (clientId) {
      SSEService.broadcastSSE(userId, clientId, {
        type: "COLLECTION_CREATED",
        collection: newCollection,
      });
    }

    res.status(201).json({ collection: newCollection });

    return;
  } catch (error) {
    console.error("Error creating collection:", error);

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to create collection",
    });

    return;
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  req: Request<{ id: string }, {}, { collection: Pick<Collection, "title" | "updatedAt"> }>,
  res: Response,
) {
  const { userId } = req;
  const { id } = req.params;
  const { collection } = req.body;
  const clientId = (req.headers["x-client-id"] as string) || "";

  try {
    // Validate input
    if (
      !collection.title ||
      typeof collection.title !== "string" ||
      !collection.updatedAt ||
      typeof collection.updatedAt !== "string"
    ) {
      res.status(400).json({
        error: "BadRequest",
        message: "Title and updatedAt are required and must be strings",
      });

      return;
    }

    // Update collection
    const updatedCollection = await prisma.collection.update({
      where: {
        id,
        ...whereCanEditCollection(userId),
      },
      data: {
        title: collection.title,
        updatedAt: new Date(collection.updatedAt),
      },
    });

    SSEService.broadcastSSE(userId, clientId, {
      type: "COLLECTION_UPDATED",
      collection: updatedCollection,
    });

    res.status(200).json({ collection: updatedCollection });

    return;
  } catch (error) {
    console.error("Error updating collection:", error);

    if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025") {
      res.status(404).json({
        error: "NotFound",
        message: "Collection not found",
      });

      return;
    }

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to update collection",
    });

    return;
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  req: Request<{ id: string }, {}, {}, { userId: string }>,
  res: Response,
) {
  const { userId } = req;
  const { id } = req.params;
  const clientId = (req.headers["x-client-id"] as string) || "";

  try {
    // Delete collection (Prisma will cascade delete related records)
    await prisma.collection.delete({
      where: { id, ...whereCanDeleteCollection(userId) },
    });

    SSEService.broadcastSSE(userId, clientId, {
      type: "COLLECTION_DELETED",
      collectionId: id,
    });

    res.status(204).send();

    return;
  } catch (error) {
    console.error("Error deleting collection:", error);

    if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025") {
      res.status(404).json({
        error: "NotFound",
        message: "Collection not found",
      });

      return;
    }

    res.status(500).json({
      error: "InternalServerError",
      message: "Failed to delete collection",
    });

    return;
  }
}
