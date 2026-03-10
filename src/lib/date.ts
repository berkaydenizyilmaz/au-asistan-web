export const APP_TIMEZONE = "Europe/Istanbul";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

interface DateParts {
  year: number;
  month: number;
  day: number;
}

export function getNowParts(): DateParts {
  const parts = partsFormatter.formatToParts(new Date());
  return {
    year: Number(parts.find((p) => p.type === "year")!.value),
    month: Number(parts.find((p) => p.type === "month")!.value),
    day: Number(parts.find((p) => p.type === "day")!.value),
  };
}

export function getTodayStr(): string {
  return dateFormatter.format(new Date());
}

export function formatDateInTimezone(d: Date): string {
  return dateFormatter.format(d);
}

export function isAfterNow(year: number, month: number, day?: number): boolean {
  const now = getNowParts();
  if (year > now.year) return true;
  if (year < now.year) return false;
  if (month > now.month) return true;
  if (month < now.month) return false;
  if (day !== undefined && day > now.day) return true;
  return false;
}
