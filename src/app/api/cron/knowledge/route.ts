import { successResponse, withCronAuth } from "@/lib/api/server";
import { logger } from "@/lib/logger";
import { checkWatchedDocuments } from "@/features/knowledge/lib/mutations";

export const POST = withCronAuth(async () => {
  const result = await checkWatchedDocuments();
  logger.info(`Knowledge cron: checked=${result.checked}, reingested=${result.reingested}`);
  return successResponse(result);
});
