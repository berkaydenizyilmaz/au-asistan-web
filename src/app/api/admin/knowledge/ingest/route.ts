import { parseJsonBody, successResponse, withErrorHandler } from "@/lib/api/server";
import { ingestDocument } from "@/features/knowledge/lib/mutations";
import { ingestUrlSchema } from "@/features/knowledge/lib/validators";
import { parseOrThrow } from "@/lib/validation";

export const POST = withErrorHandler(async (request) => {
  const body = await parseJsonBody(request);
  const input = parseOrThrow(ingestUrlSchema, body, "Invalid ingest input");
  const documentId = await ingestDocument(input);
  return successResponse({ id: documentId }, 201);
});
