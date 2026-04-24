import { parseJsonBody, successResponse, withErrorHandler } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth/server";
import { crawlSite, suggestMetadata } from "@/features/knowledge/lib/crawler";
import { crawlInputSchema } from "@/features/knowledge/lib/validators";
import { parseOrThrow } from "@/lib/validation";

export const POST = withErrorHandler(async (request) => {
  await requireAdmin();

  const body = await parseJsonBody(request);
  const input = parseOrThrow(crawlInputSchema, body, "Invalid crawl input");

  const discoveries = await crawlSite(input.rootUrl, {
    maxDepth: input.maxDepth,
    maxPages: input.maxPages,
  });

  // AI metadata önerileri üret (paralel)
  const suggestions = await Promise.allSettled(
    discoveries.map(async (d) =>
      suggestMetadata(d.url, d.title ?? "", "").catch(() => ({
        title: d.title ?? d.url,
        unit: undefined,
        shouldIndex: true,
        skipReason: undefined,
      }))
    )
  );

  const results = discoveries.map((d, i) => {
    const suggestion =
      suggestions[i].status === "fulfilled" ? suggestions[i].value : null;

    return {
      url: d.url,
      depth: d.depth,
      title: suggestion?.title ?? d.title ?? d.url,
      unit: suggestion?.unit,
      shouldIndex: suggestion?.shouldIndex ?? true,
      skipReason: suggestion?.skipReason,
    };
  });

  const indexable = results.filter((r) => r.shouldIndex);
  const skipped = results.filter((r) => !r.shouldIndex);

  return successResponse({ indexable, skipped, total: results.length });
});
