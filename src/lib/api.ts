import { env } from "./env";
import { AppError, UnauthorizedError, ValidationError } from "./errors";
import { logger } from "./logger";

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

  logger.error("Unhandled error", error);
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

type RouteHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function withCronAuth(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const secret = request.headers.get("x-cron-secret");
    if (!env.cronSecret || secret !== env.cronSecret) {
      throw new UnauthorizedError("Invalid cron secret");
    }

    try {
      return await handler(request);
    } catch (error) {
      return handleError(error);
    }
  };
}
