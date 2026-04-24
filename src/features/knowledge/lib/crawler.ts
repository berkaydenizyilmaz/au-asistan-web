import "server-only";

import { generateObject } from "ai";
import * as cheerio from "cheerio";
import { z } from "zod";

import { getChatModel } from "@/lib/ai/provider";

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

export async function crawlSite(
  rootUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlDiscovery[]> {
  const { maxDepth = 3, maxPages = 100 } = options;

  const rootDomain = new URL(rootUrl).hostname;
  const visited = new Set<string>();
  const discoveries: CrawlDiscovery[] = [];

  const sitemapUrls = await trySitemap(rootUrl);
  if (sitemapUrls.length > 0) {
    for (const url of sitemapUrls.slice(0, maxPages)) {
      if (shouldSkip(url, rootDomain)) continue;
      discoveries.push({ url, depth: 0 });
    }
    return discoveries;
  }

  await crawlPage(rootUrl, 0);

  return discoveries;

  async function crawlPage(url: string, depth: number) {
    if (depth > maxDepth) return;
    if (visited.size >= maxPages) return;
    if (visited.has(url)) return;
    if (shouldSkip(url, rootDomain)) return;

    visited.add(url);

    let html: string;
    try {
      const response = await fetch(url, {
        headers: CRAWL_HEADERS,
        cache: "no-store",
      });
      if (!response.ok) return;
      html = await response.text();
    } catch {
      return;
    }

    const $ = cheerio.load(html);
    const title = $("h1").first().text().trim() || $("title").text().trim();

    discoveries.push({ url, depth, title: title || undefined });

    const links: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      if (href.startsWith("#")) return;

      try {
        const resolved = new URL(href, url);
        resolved.hash = ""; // fragment'ı temizle — aynı sayfa farklı anchor = tek URL
        links.push(resolved.toString());
      } catch {
      }
    });

    for (const link of links) {
      await crawlPage(link, depth + 1);
    }
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
