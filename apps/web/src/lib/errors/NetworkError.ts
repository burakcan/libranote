import { AppError } from "./AppError";

export class NetworkError extends AppError {
  readonly code = "NETWORK_ERROR";
  readonly statusCode = 500;

  constructor(message: string = "A network error occurred", cause?: Error) {
    super(message, cause);
  }
}
