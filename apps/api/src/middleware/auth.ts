import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { APIError } from "better-auth/api";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

/**
 * Middleware to validate user session
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to access this resource",
      });

      return;
    }

    // Attach user ID and user object to request for use in routes
    req.userId = (session.user as { id: string }).id;

    next();
  } catch (error) {
    if (error instanceof APIError) {
      res.status(error.status as number).json({
        error: error.name,
        message: error.message,
      });

      return;
    }

    res.status(500).json({
      error: "InternalServerError",
      message: "An error occurred while validating your session",
    });
  }
};
