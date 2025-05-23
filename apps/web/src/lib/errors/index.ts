export * from "./AppError";
export * from "./NetworkError";
export * from "./SyncError";
export * from "./ValidationError";

import { AppError } from "./AppError";
import { NetworkError } from "./NetworkError";
import { ValidationError } from "./ValidationError";

interface ErrorWithStatus extends Error {
  status: number;
}

export class ErrorService {
  static handle(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Check if error has status property (ApiServiceError-like)
    if (
      error instanceof Error &&
      "status" in error &&
      typeof (error as ErrorWithStatus).status === "number"
    ) {
      return new NetworkError(error.message, error);
    }

    if (error instanceof Error) {
      return new NetworkError("An unexpected error occurred", error);
    }

    return new NetworkError("An unknown error occurred");
  }

  static isNetworkError(error: unknown): boolean {
    return (
      error instanceof NetworkError ||
      (error instanceof Error &&
        "status" in error &&
        typeof (error as ErrorWithStatus).status === "number")
    );
  }

  static isValidationError(error: unknown): boolean {
    return error instanceof ValidationError;
  }
}
