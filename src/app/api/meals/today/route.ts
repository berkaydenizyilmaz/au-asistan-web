import { eq } from "drizzle-orm";

import { successResponse, errorResponse } from "@/lib/api";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { meals } from "@/lib/db/schema/content";
import { getTodayStr } from "@/features/meals/lib/date-utils";

export async function GET() {
  try {
    const dateStr = getTodayStr();

    const db = await createDrizzleSupabaseClient();
    const result = await db.admin
      .select()
      .from(meals)
      .where(eq(meals.date, dateStr))
      .limit(1);

    if (result.length === 0) {
      return errorResponse("NOT_FOUND", "No meal found for today", 404);
    }

    return successResponse(result[0]);
  } catch (error) {
    return errorResponse(
      "FETCH_FAILED",
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
}
