import * as cheerio from "cheerio";
import type { Element } from "domhandler";

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

// Extract month (MM) and year (YYYY) from the table header
function parseMonthYear($: cheerio.CheerioAPI): { month: string; year: string } | null {
  let result: { month: string; year: string } | null = null;

  $("td").each((_, el) => {
    const text = $(el).text().trim();
    if (!/YEMEK\s+L[İI]STES[İI]/i.test(text)) return;

    for (const [turkishMonth, monthNum] of Object.entries(TURKISH_MONTHS)) {
      if (text.includes(turkishMonth)) {
        const yearMatch = text.match(/(\d{4})/);
        if (yearMatch) {
          result = { month: monthNum, year: yearMatch[1] };
          return false; // break .each()
        }
      }
    }
  });

  return result;
}


// Parse a single table row into a ParsedMeal
function parseRow(
  $: cheerio.CheerioAPI,
  row: Element,
  month: string,
  year: string,
): ParsedMeal | null {
  const cells = $(row).find("td");
  if (cells.length < 6) return null;

  // Parse date — extract day number
  const dateText = cells.eq(0).text().trim();
  const dayMatch = dateText.match(/^(\d{1,2})/);
  if (!dayMatch) return null;

  const day = dayMatch[1].padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Parse food items (cells 1-4)
  const items: MealItem[] = [];
  for (let i = 0; i < 4; i++) {
    const name = cells.eq(i + 1).text().trim();
    if (name) {
      items.push({ name, category: CATEGORIES[i] });
    }
  }

  // Skip empty days
  if (items.length === 0) return null;

  // Parse calories — "1208 Kalori" → 1208
  let calories: number | null = null;
  const calMatch = cells.eq(5).text().match(/(\d+)\s*Kalori/i);
  if (calMatch) {
    calories = parseInt(calMatch[1], 10);
  }

  return { date: dateStr, items, calories };
}

// Fetch and parse the monthly meal list from the university website
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
  const $ = cheerio.load(html);

  const monthYear = parseMonthYear($);
  if (!monthYear) {
    throw new Error("Could not parse month/year from meal page header");
  }

  const { month, year } = monthYear;
  const meals: ParsedMeal[] = [];

  $("tbody tr").each((_, row) => {
    const meal = parseRow($, row, month, year);
    if (meal) {
      meals.push(meal);
    }
  });

  return meals;
}
