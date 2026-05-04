import { parseJsonBody, successResponse, withErrorHandler } from "@/lib/api/server";
import {
  getPreferences,
} from "@/features/notifications/lib/queries";
import { updatePreferences } from "@/features/notifications/lib/mutations";

export const GET = withErrorHandler(async () => {
  const prefs = await getPreferences();
  return successResponse(prefs);
});

export const PUT = withErrorHandler(async (request) => {
  const body = await parseJsonBody(request);
  await updatePreferences(body);
  return successResponse({ ok: true });
});
