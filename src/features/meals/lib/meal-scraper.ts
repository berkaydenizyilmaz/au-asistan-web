import type { MealCategory, MealItem, ParsedMeal } from "../types";

const MEAL_URL = "https://amasya.edu.tr/aylik-yemek-listesi";

const TURKISH_MONTHS: Record<string, string> = {
  Ocak: "01",
  Şubat: "02",
  Mart: "03",
  Nisan: "04",
  Mayıs: "05",
  Haziran: "06",
  Temmuz: "07",
  Ağustos: "08",
  Eylül: "09",
  Ekim: "10",
  Kasım: "11",
  Aralık: "12",
};

const CATEGORIES: MealCategory[] = ["soup", "main", "side", "dessert"];

// Decode HTML entities (hex &#xHEX; and decimal &#DEC;)
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCharCode(parseInt(dec, 10))
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ");
}

// Strip HTML tags from a string
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

// Extract month (MM) and year (YYYY) from the table header.
// Looks for pattern like "Mart 2026 YEMEK LİSTESİ"
function parseMonthYear(html: string): { month: string; year: string } | null {
  // Match the header row containing "YEMEK LİSTESİ"
  const headerMatch = html.match(
    /<td[^>]*>([^<]*YEMEK\s+L[İI]STES[İI][^<]*)<\/td>/i
  );
  if (!headerMatch) return null;

  const headerText = decodeHtmlEntities(headerMatch[1]).trim();

  // Extract Turkish month name and year
  for (const [turkishMonth, monthNum] of Object.entries(TURKISH_MONTHS)) {
    if (headerText.includes(turkishMonth)) {
      const yearMatch = headerText.match(/(\d{4})/);
      if (yearMatch) {
        return { month: monthNum, year: yearMatch[1] };
      }
    }
  }

  return null;
}

// Parse a single table row into a ParsedMeal.
// Expected: 6 cells — Date | Soup | Main | Side | Dessert | Calories
function parseRow(
  row: string,
  month: string,
  year: string
): ParsedMeal | null {
  const cellMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
  if (cellMatches.length < 6) return null;

  const cells = cellMatches.map((m) => decodeHtmlEntities(stripTags(m[1])));

  // Parse date — extract day number from "02 Mar 2026" or just "02"
  const dateCell = cells[0].trim();
  const dayMatch = dateCell.match(/^(\d{1,2})/);
  if (!dayMatch) return null;

  const day = dayMatch[1].padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Parse food items (cells 1-4)
  const items: MealItem[] = [];
  for (let i = 0; i < 4; i++) {
    const name = cells[i + 1].trim();
    if (name) {
      items.push({ name, category: CATEGORIES[i] });
    }
  }

  // Skip empty days (no food items)
  if (items.length === 0) return null;

  // Parse calories — "1208 Kalori" → 1208
  let calories: number | null = null;
  const calMatch = cells[5].match(/(\d+)\s*Kalori/i);
  if (calMatch) {
    calories = parseInt(calMatch[1], 10);
  }

  return { date: dateStr, items, calories };
}

// Fetch and parse the monthly meal list from the university website.
export async function scrapeMeals(): Promise<ParsedMeal[]> {
  const response = await fetch(MEAL_URL, {
    headers: {
      "User-Agent": "AU-Asistan/1.0",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch meal page: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();

  // Extract month/year from header
  const monthYear = parseMonthYear(html);
  if (!monthYear) {
    throw new Error("Could not parse month/year from meal page header");
  }

  const { month, year } = monthYear;

  // Extract tbody rows
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    throw new Error("Could not find table body in meal page");
  }

  const rows = [...tbodyMatch[1].matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  const meals: ParsedMeal[] = [];

  for (const [row] of rows) {
    const meal = parseRow(row, month, year);
    if (meal) {
      meals.push(meal);
    }
  }

  return meals;
}
