import { successResponse, withErrorHandler } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth/server";
import { ValidationError } from "@/lib/errors";
import {
  CRON_JOB_NAMES,
  type CronJobName,
} from "@/features/admin/lib/cron-jobs";
import { listCronRuns } from "@/features/admin/lib/queries";

export const GET = withErrorHandler(async (request, context) => {
  await requireAdmin();
  const { job } = await context.params;
  if (!CRON_JOB_NAMES.includes(job as CronJobName)) {
    throw new ValidationError(`Unknown cron job: ${job}`);
  }
  const url = new URL(request.url);
  const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20);
  const runs = await listCronRuns(job as CronJobName, limit);
  return successResponse(runs);
});
