import { and, asc, gte, lte } from "drizzle-orm";

import { successResponse, errorResponse } from "@/lib/api";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals } from "@/lib/db/schema/content";
import { getMonthRange } from "@/features/meals/lib/date-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Default to current month if no range provided
  const now = new Date();
  const currentRange = getMonthRange(now.getFullYear(), now.getMonth() + 1);
  const defaultFrom = fromParam ?? currentRange.from;
  const defaultTo = toParam ?? currentRange.to;

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(defaultFrom) || !dateRegex.test(defaultTo)) {
    return errorResponse(
      "INVALID_DATE",
      "Date parameters must be in YYYY-MM-DD format",
      400
    );
  }

  try {
    const db = await createDrizzleSupabaseClient();
    const result = await db.admin
      .select()
      .from(meals)
      .where(and(gte(meals.date, defaultFrom), lte(meals.date, defaultTo)))
      .orderBy(asc(meals.date));

    return successResponse(result);
  } catch (error) {
    return errorResponse(
      "FETCH_FAILED",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}
