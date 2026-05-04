import { successResponse, withErrorHandler } from "@/lib/api/server";
import { ValidationError } from "@/lib/errors";
import {
  listAnnouncementCategories,
  listEventCategories,
} from "@/features/notifications/lib/queries";

export const GET = withErrorHandler(async (request) => {
  const type = new URL(request.url).searchParams.get("type");
  if (type === "announcement") {
    return successResponse(await listAnnouncementCategories());
  }
  if (type === "event") {
    return successResponse(await listEventCategories());
  }
  throw new ValidationError("type must be 'announcement' or 'event'");
});
