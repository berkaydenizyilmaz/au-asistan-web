import "server-only";

import { generateObject } from "ai";
import * as cheerio from "cheerio";
import { z } from "zod";

import { getChatModel } from "@/lib/ai/provider";
import { logger } from "@/lib/logger";

import type { CrawlDiscovery, MetadataSuggestion } from "../types";

const CRAWL_HEADERS = {
  "User-Agent": "AU-Asistan/1.0",
  Accept: "text/html,*/*",
};

const SKIP_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".ico",
  ".css",
  ".js",
  ".woff",
  ".woff2",
  ".ttf",
  ".zip",
  ".rar",
  ".xlsx",
  ".doc",
  ".docx",
];

const SKIP_PATTERNS = [
  /\/(login|logout|signin|signout|auth|oauth|portal)/i,
  /\/(obs|ogr|ogrenci-bilgi)\./i,
  /mailto:/,
  /tel:/,
  /javascript:/,
];

const EXTERNAL_SKIP_DOMAINS = [
  "obs.amasya.edu.tr",
  "kalite.amasya.edu.tr",
  "uzem.amasya.edu.tr",
  "mail.amasya.edu.tr",
];

interface CrawlOptions {
  maxDepth?: number;
  maxPages?: number;
}

export interface CrawlSiteResult {
  discoveries: CrawlDiscovery[];
  /** Sitemap modunda limit kesilmeden önceki toplam uygun URL sayısı. */
  totalEligible: number;
}

export async function crawlSite(
  rootUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlSiteResult> {
  const { maxDepth = 3, maxPages = 100 } = options;

  const rootParsed = new URL(rootUrl);
  if (rootParsed.pathname !== "/" && rootParsed.pathname.endsWith("/")) {
    rootParsed.pathname = rootParsed.pathname.slice(0, -1);
    rootUrl = rootParsed.toString();
  }
  const rootDomain = rootParsed.hostname;
  const visited = new Set<string>();
  const discoveries: CrawlDiscovery[] = [];

  logger.info(`[crawl] starting — root=${rootUrl} maxDepth=${maxDepth} maxPages=${maxPages}`);

  const sitemapUrls = await trySitemap(rootUrl);
  if (sitemapUrls.length > 0) {
    // Filter first so maxPages is applied after removing skip-worthy URLs.
    const eligible = sitemapUrls.filter((url) => !shouldSkip(url, rootDomain));
    logger.info(`[crawl] sitemap — ${sitemapUrls.length} total, ${eligible.length} eligible, limit=${maxPages}`);

    for (const url of eligible.slice(0, maxPages)) {
      const meta = await fetchPageMeta(url);
      discoveries.push({ url, depth: 0, ...meta });
    }

    logger.info(`[crawl] sitemap done — ${discoveries.length} pages fetched`);
    return { discoveries, totalEligible: eligible.length };
  }

  logger.info(`[crawl] no sitemap — starting recursive crawl`);
  await crawlPage(rootUrl, 0);
  // visited.size hitting maxPages means there were likely more pages to explore.
  const hitLimit = visited.size >= maxPages;
  logger.info(`[crawl] done — ${discoveries.length} pages discovered${hitLimit ? " (limit reached)" : ""}`);

  return { discoveries, totalEligible: hitLimit ? maxPages + 1 : discoveries.length };

  async function crawlPage(url: string, depth: number) {
    if (depth > maxDepth) return;
    if (visited.size >= maxPages) return;
    if (visited.has(url)) return;
    if (shouldSkip(url, rootDomain)) return;

    visited.add(url);
    logger.debug(`[crawl] visiting [${depth}] ${url}`);

    let html: string;
    try {
      const response = await fetch(url, {
        headers: CRAWL_HEADERS,
        cache: "no-store",
      });
      if (!response.ok) {
        logger.debug(`[crawl] skip ${url} — HTTP ${response.status}`);
        return;
      }
      html = await response.text();
    } catch (err) {
      logger.debug(`[crawl] skip ${url} — fetch error`, err);
      return;
    }

    const $ = cheerio.load(html);
    const title = $("h1").first().text().trim() || $("title").text().trim();
    const snippet = $("body").text().replace(/\s+/g, " ").trim().slice(0, 500);

    discoveries.push({ url, depth, title: title || undefined, snippet: snippet || undefined });

    const links: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      if (href.startsWith("#")) return;

      try {
        const resolved = new URL(href, url);
        resolved.hash = "";
        // Normalize trailing slash so /foo and /foo/ aren't visited twice.
        if (resolved.pathname !== "/" && resolved.pathname.endsWith("/")) {
          resolved.pathname = resolved.pathname.slice(0, -1);
        }
        links.push(resolved.toString());
      } catch {
      }
    });

    for (const link of links) {
      await crawlPage(link, depth + 1);
    }
  }
}

async function fetchPageMeta(url: string): Promise<{ title?: string; snippet?: string }> {
  try {
    const response = await fetch(url, { headers: CRAWL_HEADERS, cache: "no-store" });
    if (!response.ok) return {};
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $("h1").first().text().trim() || $("title").text().trim();
    const snippet = $("body").text().replace(/\s+/g, " ").trim().slice(0, 500);
    return { title: title || undefined, snippet: snippet || undefined };
  } catch {
    return {};
  }
}

async function trySitemap(rootUrl: string): Promise<string[]> {
  const base = new URL(rootUrl).origin;
  const sitemapUrl = `${base}/sitemap.xml`;

  try {
    const response = await fetch(sitemapUrl, {
      headers: CRAWL_HEADERS,
      cache: "no-store",
    });
    if (!response.ok) return [];

    const xml = await response.text();
    const urls: string[] = [];

    const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
    for (const match of matches) {
      urls.push(match[1].trim());
    }

    return urls;
  } catch {
    return [];
  }
}

function shouldSkip(url: string, allowedDomain: string): boolean {
  try {
    const parsed = new URL(url);

    if (parsed.hostname !== allowedDomain) return true;
    if (EXTERNAL_SKIP_DOMAINS.includes(parsed.hostname)) return true;

    const path = parsed.pathname.toLowerCase();
    if (SKIP_EXTENSIONS.some((ext) => path.endsWith(ext))) return true;
    if (SKIP_PATTERNS.some((re) => re.test(url))) return true;

    return false;
  } catch {
    return true;
  }
}

const metadataSchema = z.object({
  title: z.string(),
  unit: z.string().nullable(),
  shouldIndex: z.boolean(),
  skipReason: z.string().nullable(),
});

export async function suggestMetadata(
  url: string,
  pageTitle: string,
  snippet: string
): Promise<MetadataSuggestion> {
  logger.debug(`[metadata] suggesting for ${url}`);
  const { object } = await generateObject({
    model: getChatModel(),
    schema: metadataSchema,
    prompt: `Aşağıdaki üniversite sayfası için metadata öner.

URL: ${url}
Sayfa başlığı: ${pageTitle}
İçerik özeti (ilk 500 karakter): ${snippet.slice(0, 500)}

Yanıtla:
- title: Düzgün bir başlık öner
- unit: Sayfanın ait olduğu birim/fakülte (örn: "Mühendislik Fakültesi", "Öğrenci İşleri"). Bilinemiyorsa null.
- shouldIndex: Bu sayfa bilgi tabanına eklenebilir mi? Login sayfaları, portal yönlendirmeleri, tekrar eden navigasyon sayfaları için false.
- skipReason: shouldIndex false ise neden atlandığını belirt, değilse null.`,
  });

  return {
    title: object.title,
    unit: object.unit ?? undefined,
    shouldIndex: object.shouldIndex,
    skipReason: object.skipReason ?? undefined,
  };
}
