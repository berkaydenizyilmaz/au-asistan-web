import { successResponse, withCronAuth } from "@/lib/api/server";
import { recordedCronRun } from "@/features/admin/lib/cron-jobs";

export const POST = withCronAuth(async () => {
  const result = await recordedCronRun("meals", "cron");
  return successResponse(result);
});
