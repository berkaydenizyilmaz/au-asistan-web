import { ValidationError, UnauthorizedError, NotFoundError } from "./errors";

export interface ApiError {
  code: string;
  message: string;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export function successResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data } satisfies ApiResponse<T>, {
    status,
  });
}

export function errorResponse(code: string, message: string, status = 400) {
  return Response.json(
    { success: false, error: { code, message } } satisfies ApiResponse<never>,
    { status }
  );
}

// Convert DAL errors to HTTP responses
export function handleError(error: unknown) {
  if (error instanceof ValidationError) {
    return errorResponse("VALIDATION_ERROR", error.message, 400);
  }
  if (error instanceof UnauthorizedError) {
    return errorResponse("UNAUTHORIZED", error.message, 401);
  }
  if (error instanceof NotFoundError) {
    return errorResponse("NOT_FOUND", error.message, 404);
  }
  return errorResponse(
    "INTERNAL_ERROR",
    error instanceof Error ? error.message : "Unknown error",
    500,
  );
}
