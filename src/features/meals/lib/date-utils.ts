import { getNowParts } from "@/lib/date";

export const MEALS_MIN_YEAR = 2026;
export const MEALS_MIN_MONTH = 1;

export function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

export function skipWeekends(d: Date, direction: 1 | -1): Date {
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + direction);
  }
  return d;
}

export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = `${formatMonth(year, month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${formatMonth(year, month)}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function isBeforeMin(year: number, month: number): boolean {
  return year < MEALS_MIN_YEAR || (year === MEALS_MIN_YEAR && month < MEALS_MIN_MONTH);
}

export function clampMonth(year: number, month: number): { year: number; month: number } {
  const now = getNowParts();

  if (isBeforeMin(year, month)) {
    return { year: MEALS_MIN_YEAR, month: MEALS_MIN_MONTH };
  }
  if (year > now.year || (year === now.year && month > now.month)) {
    return { year: now.year, month: now.month };
  }
  return { year, month };
}
