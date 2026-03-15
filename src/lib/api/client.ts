import type { ApiError, ApiResponse } from "./types";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.code = error.code;
    this.status = status;
    this.details = error.details;
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options);
  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new ApiClientError(json.error, res.status);
  }

  return json.data;
}
