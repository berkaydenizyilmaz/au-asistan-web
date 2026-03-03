// Earliest available meal data
export const MEALS_MIN_YEAR = 2026;
export const MEALS_MIN_MONTH = 1;

// Format a Date object as YYYY-MM-DD
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Get today's date as YYYY-MM-DD
export function getTodayStr(): string {
  return formatDate(new Date());
}

// Build a YYYY-MM string from year and month
export function formatMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// Get the Monday of the week containing the given date
export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

// Skip weekends in a given direction (+1 forward, -1 backward)
export function skipWeekends(d: Date, direction: 1 | -1): Date {
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + direction);
  }
  return d;
}

// Get the first and last day strings of a month
export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = `${formatMonth(year, month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${formatMonth(year, month)}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

// Check if a year/month is before the minimum allowed date
export function isBeforeMin(year: number, month: number): boolean {
  return year < MEALS_MIN_YEAR || (year === MEALS_MIN_YEAR && month < MEALS_MIN_MONTH);
}

// Check if a year/month(/day) is after the current date
export function isAfterNow(year: number, month: number, day?: number): boolean {
  const now = new Date();
  if (year > now.getFullYear()) return true;
  if (year === now.getFullYear() && month > now.getMonth() + 1) return true;
  if (day && year === now.getFullYear() && month === now.getMonth() + 1 && day > now.getDate()) return true;
  return false;
}

// Clamp year/month to valid range (MEALS_MIN – current month)
export function clampMonth(year: number, month: number): { year: number; month: number } {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  if (isBeforeMin(year, month)) {
    return { year: MEALS_MIN_YEAR, month: MEALS_MIN_MONTH };
  }
  if (year > nowYear || (year === nowYear && month > nowMonth)) {
    return { year: nowYear, month: nowMonth };
  }
  return { year, month };
}
