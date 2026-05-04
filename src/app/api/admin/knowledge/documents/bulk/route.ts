import { parseJsonBody, successResponse, withErrorHandler } from "@/lib/api/server";
import { bulkCreateDocumentStubs } from "@/features/knowledge/lib/mutations";

export const POST = withErrorHandler(async (request) => {
  const body = await parseJsonBody(request);
  const result = await bulkCreateDocumentStubs(body);
  return successResponse(result, 201);
});
