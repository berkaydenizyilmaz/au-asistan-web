import { successResponse, withErrorHandler } from "@/lib/api/server";
import { listNotifications } from "@/features/notifications/lib/queries";

export const GET = withErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const result = await listNotifications({
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
    unreadOnly: searchParams.get("unreadOnly") === "true",
  });
  return successResponse(result);
});
