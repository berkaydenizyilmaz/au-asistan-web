import { successResponse, withErrorHandler } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth/server";
import { ValidationError } from "@/lib/errors";
import {
  CRON_JOB_NAMES,
  recordedCronRun,
  type CronJobName,
} from "@/features/admin/lib/cron-jobs";

export const POST = withErrorHandler(async (_request, context) => {
  await requireAdmin();
  const { job } = await context.params;
  if (!CRON_JOB_NAMES.includes(job as CronJobName)) {
    throw new ValidationError(`Unknown cron job: ${job}`);
  }
  const result = await recordedCronRun(job as CronJobName, "admin");
  return successResponse(result);
});
