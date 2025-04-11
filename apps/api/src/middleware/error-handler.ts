import type { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/errors.js";
import { Prisma } from "../db/prisma.js";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  console.error("Error:", err);

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025": // Record not found
        res.status(404).json({
          error: "NotFound",
          message: "Resource not found",
        });
        return;
      case "P2002": // Unique constraint failed
        res.status(409).json({
          error: "Conflict",
          message: "A resource with this identifier already exists",
        });
        return;
      default:
        res.status(500).json({
          error: "DatabaseError",
          message: "Database operation failed",
        });
        return;
    }
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    res.status(400).json({
      error: "ValidationError",
      message: "Invalid request data",
      details: err.cause,
    });
    return;
  }

  // Handle custom API errors
  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
    });
    return;
  }

  // Handle generic errors
  res.status(500).json({
    error: "InternalServerError",
    message: "Something went wrong",
  });
};
