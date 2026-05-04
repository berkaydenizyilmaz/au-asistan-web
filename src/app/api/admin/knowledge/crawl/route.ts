import { parseJsonBody, successResponse, withErrorHandler } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth/server";
import { crawlSite, suggestMetadata } from "@/features/knowledge/lib/crawler";
import { crawlInputSchema } from "@/features/knowledge/lib/validators";
import { parseOrThrow } from "@/lib/validation";
import { logger } from "@/lib/logger";

export const POST = withErrorHandler(async (request) => {
  await requireAdmin();

  const body = await parseJsonBody(request);
  const input = parseOrThrow(crawlInputSchema, body, "Invalid crawl input");

  const discoveries = await crawlSite(input.rootUrl, {
    maxDepth: input.maxDepth,
    maxPages: input.maxPages,
  });

  logger.info(`[crawl/route] ${discoveries.length} pages found, starting sequential metadata suggestions`);

  const results = [];
  for (let i = 0; i < discoveries.length; i++) {
    const d = discoveries[i];
    logger.info(`[crawl/route] metadata ${i + 1}/${discoveries.length} — ${d.url}`);

    let suggestion;
    try {
      suggestion = await suggestMetadata(d.url, d.title ?? "", d.snippet ?? "");
    } catch {
      suggestion = { title: d.title ?? d.url, unit: undefined, shouldIndex: true, skipReason: undefined };
    }

    results.push({
      url: d.url,
      depth: d.depth,
      title: suggestion.title ?? d.title ?? d.url,
      unit: suggestion.unit,
      shouldIndex: suggestion.shouldIndex ?? true,
      skipReason: suggestion.skipReason,
    });
  }

  const indexable = results.filter((r) => r.shouldIndex);
  const skipped = results.filter((r) => !r.shouldIndex);

  logger.info(`[crawl/route] done — ${indexable.length} indexable, ${skipped.length} skipped`);

  return successResponse({ indexable, skipped, total: results.length });
});
