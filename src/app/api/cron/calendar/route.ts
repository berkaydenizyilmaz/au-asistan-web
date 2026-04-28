import { successResponse, withCronAuth } from "@/lib/api/server";
import { recordedCronRun } from "@/features/admin/lib/cron-jobs";

export const POST = withCronAuth(async () => {
  const result = await recordedCronRun("calendar", "cron");
  return successResponse(result);
});
