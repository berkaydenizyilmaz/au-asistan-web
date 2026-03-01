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
