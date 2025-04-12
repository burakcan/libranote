import type { Request, Response, NextFunction } from "express";
import type { Collection } from "../db/prisma.js";
import { CollectionService } from "../services/collection-service.js";

/**
 * Get all collections for the current user (owned + member of)
 */
export async function getCollections(req: Request, res: Response, next: NextFunction) {
  try {
    const collections = await CollectionService.getCollections(req.userId);
    res.status(200).json({ collections });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a specific collection by ID
 */
export async function getCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new Error("Collection ID is required");
    }

    const collection = await CollectionService.getCollection(req.userId, id);
    res.status(200).json({ collection });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new collection
 */
export async function createCollection(
  req: Request<{}, {}, { collection: Pick<Collection, "title" | "createdAt" | "updatedAt"> }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { collection } = req.body;
    const clientId = (req.headers["x-client-id"] as string) || "";

    const newCollection = await CollectionService.createCollection(userId, collection, clientId);
    res.status(201).json({ collection: newCollection });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  req: Request<{ id: string }, {}, { collection: Pick<Collection, "title" | "updatedAt"> }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = req;
    const { id } = req.params;
    if (!id) {
      throw new Error("Collection ID is required");
    }

    const { collection } = req.body;
    const clientId = (req.headers["x-client-id"] as string) || "";

    const updatedCollection = await CollectionService.updateCollection(
      userId,
      id,
      collection,
      clientId,
    );

    res.status(200).json({ collection: updatedCollection });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req;
    const { id } = req.params;
    if (!id) {
      throw new Error("Collection ID is required");
    }

    const clientId = (req.headers["x-client-id"] as string) || "";

    await CollectionService.deleteCollection(userId, id, clientId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
