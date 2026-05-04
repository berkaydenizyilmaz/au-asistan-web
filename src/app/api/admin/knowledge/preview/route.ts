import { z } from "zod";

import { parseJsonBody, successResponse, withErrorHandler } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth/server";
import { scrapeUrl } from "@/features/knowledge/lib/scraper";
import { suggestMetadata } from "@/features/knowledge/lib/crawler";
import { parseOrThrow } from "@/lib/validation";

export const maxDuration = 60;

const previewInputSchema = z.object({
  url: z.string().url(),
});

export const POST = withErrorHandler(async (request) => {
  await requireAdmin();
  const body = await parseJsonBody(request);
  const { url } = parseOrThrow(previewInputSchema, body, "Invalid preview input");

  const scraped = await scrapeUrl(url);
  const suggestion = await suggestMetadata(url, scraped.title, scraped.text.slice(0, 500));

  return successResponse({
    suggestedTitle: suggestion.title,
    suggestedUnit: suggestion.unit ?? null,
    sourceType: scraped.sourceType,
    contentLength: scraped.text.length,
  });
});
