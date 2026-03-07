export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly details?: unknown;

  constructor(options: {
    message: string;
    code: string;
    statusCode: number;
    isOperational?: boolean;
    details?: unknown;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  declare details: { path: string; message: string }[];

  constructor(
    message: string,
    issues?: { path: string; message: string }[],
  ) {
    super({
      message,
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: issues,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Login required") {
    super({ message, code: "UNAUTHORIZED", statusCode: 401 });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super({ message, code: "FORBIDDEN", statusCode: 403 });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super({ message, code: "NOT_FOUND", statusCode: 404 });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super({ message, code: "CONFLICT", statusCode: 409 });
  }
}
