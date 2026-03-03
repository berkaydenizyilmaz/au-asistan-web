// Custom error classes for DAL layer.
// DAL functions throw these; API routes catch via handleError().

export class ValidationError extends Error {
  name = "ValidationError" as const;
  constructor(
    message: string,
    public issues?: { path: string; message: string }[],
  ) {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  name = "UnauthorizedError" as const;
  constructor(message = "Login required") {
    super(message);
  }
}

export class NotFoundError extends Error {
  name = "NotFoundError" as const;
  constructor(message = "Not found") {
    super(message);
  }
}
