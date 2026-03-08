import { AppError, ValidationError } from "./errors";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
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

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Invalid JSON body");
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details != null && { details: error.details }),
        },
      } satisfies ApiResponse<never>,
      { status: error.statusCode },
    );
  }

  console.error("[UNHANDLED]", error);
  return Response.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    } satisfies ApiResponse<never>,
    { status: 500 },
  );
}
