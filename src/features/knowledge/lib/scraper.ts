import "server-only";

import crypto from "crypto";

import * as cheerio from "cheerio";
import { getDocumentProxy, extractText } from "unpdf";

import { AppError } from "@/lib/errors";

import type { ScrapedContent } from "../types";

const SCRAPE_HEADERS = {
  "User-Agent": "AU-Asistan/1.0",
  Accept: "text/html,application/pdf,*/*",
};

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function validateUrlTarget(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError({ code: "SCRAPE_FAILED", message: "Geçersiz URL", statusCode: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError({ code: "SCRAPE_FAILED", message: "Sadece HTTP/HTTPS URL'leri desteklenir", statusCode: 400 });
  }

  const hostname = parsed.hostname;
  if (PRIVATE_IP_PATTERNS.some((re) => re.test(hostname))) {
    throw new AppError({ code: "SCRAPE_FAILED", message: "İç ağ adreslerine erişim engellendi", statusCode: 400 });
  }
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  validateUrlTarget(url);

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: SCRAPE_HEADERS,
    });
  } catch {
    throw new AppError({ code: "SCRAPE_FAILED", message: `URL fetch edilemedi: ${url}`, statusCode: 500 });
  }

  if (!response.ok) {
    throw new AppError({ code: "SCRAPE_FAILED", message: `URL fetch başarısız (${response.status}): ${url}`, statusCode: 500 });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isPdf =
    contentType.includes("application/pdf") ||
    url.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return scrapePdf(url, response);
  }

  return scrapeHtml(url, response);
}

async function scrapeHtml(
  url: string,
  response: Response
): Promise<ScrapedContent> {
  let html: string;

  try {
    html = await response.text();
  } catch {
    throw new AppError({ code: "SCRAPE_PARSE_FAILED", message: "HTML okunamadı", statusCode: 500 });
  }

  const $ = cheerio.load(html);

  // Gereksiz elementleri kaldır
  $(
    "nav, footer, header, script, style, noscript, iframe, " +
      ".sidebar, .breadcrumb, .pagination, .social-media, " +
      ".quick-links, .hizli-erisim, [class*='menu'], [class*='nav'], " +
      "[id*='menu'], [id*='nav'], [id*='footer'], [id*='header']"
  ).remove();

  // Başlık
  const title =
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    new URL(url).pathname;

  // İçerik: önce main/article, yoksa body
  const contentEl =
    $("main").length > 0
      ? $("main")
      : $("article").length > 0
        ? $("article")
        : $(".content, #content, .main-content").length > 0
          ? $(".content, #content, .main-content").first()
          : $("body");

  const text = contentEl
    .text()
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    throw new AppError({ code: "SCRAPE_PARSE_FAILED", message: "Sayfa içeriği boş", statusCode: 500 });
  }

  return {
    url,
    title,
    text,
    sourceType: "html",
    contentHash: hashContent(text),
  };
}

async function scrapePdf(
  url: string,
  response: Response
): Promise<ScrapedContent> {
  let arrayBuffer: ArrayBuffer;

  try {
    arrayBuffer = await response.arrayBuffer();
  } catch {
    throw new AppError({ code: "SCRAPE_PARSE_FAILED", message: "PDF indirilemedi", statusCode: 500 });
  }

  try {
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
    const { text } = await extractText(pdf, { mergePages: true });

    const title = url.split("/").pop()?.replace(".pdf", "") ?? "Belge";
    const cleanText = text.replace(/\s+/g, " ").trim();

    if (!cleanText) {
      throw new AppError({ code: "SCRAPE_PARSE_FAILED", message: "PDF içeriği boş", statusCode: 500 });
    }

    return {
      url,
      title,
      text: cleanText,
      sourceType: "pdf",
      contentHash: hashContent(cleanText),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError({ code: "SCRAPE_PARSE_FAILED", message: "PDF parse edilemedi", statusCode: 500 });
  }
}

function hashContent(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}
