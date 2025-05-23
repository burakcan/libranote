import { AppError } from "./AppError";

export class SyncError extends AppError {
  readonly code = "SYNC_ERROR";
  readonly statusCode = 500;

  constructor(message: string = "Synchronization failed", cause?: Error) {
    super(message, cause);
  }
}
