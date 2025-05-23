import { AppError } from "./AppError";

export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(message: string = "Validation failed", cause?: Error) {
    super(message, cause);
  }
}
