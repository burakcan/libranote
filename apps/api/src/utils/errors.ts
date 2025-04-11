export class APIError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends APIError {
  constructor(message = "Resource not found") {
    super(message, 404, "NotFound");
  }
}

export class ForbiddenError extends APIError {
  constructor(message = "You don't have permission to access this resource") {
    super(message, 403, "Forbidden");
  }
}

export class BadRequestError extends APIError {
  constructor(message = "Invalid request data") {
    super(message, 400, "BadRequest");
  }
}

export class InternalServerError extends APIError {
  constructor(message = "Internal server error") {
    super(message, 500, "InternalServerError");
  }
}
