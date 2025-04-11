import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

type ValidationSource = "body" | "query" | "params";

/**
 * Creates a middleware that validates request data using a Zod schema
 */
export const validate =
  (schema: ZodSchema, source: ValidationSource = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req[source]);
      req[source] = result; // Replace with validated and transformed data
      next();
    } catch (error: any) {
      // Set error name for the error handler to recognize
      error.name = "ZodError";
      next(error);
    }
  };
