import { parseJsonBody, successResponse, withErrorHandler } from "@/lib/api/server";
import { listSubscriptions } from "@/features/notifications/lib/queries";
import { addSubscription } from "@/features/notifications/lib/mutations";

export const GET = withErrorHandler(async () => {
  const subscriptions = await listSubscriptions();
  return successResponse(subscriptions);
});

export const POST = withErrorHandler(async (request) => {
  const body = await parseJsonBody(request);
  const subscription = await addSubscription(body);
  return successResponse(subscription);
});
