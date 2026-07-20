import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calendar date only: "Fri Jan 31 2025".
 * Strips time and timezone from Date objects or date strings.
 */
export function toShortDate(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toDateString();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial date (days since 1899-12-30).
    const utcDays = Math.floor(value - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!Number.isNaN(date.getTime())) {
      return date.toDateString();
    }
  }

  const raw = String(value).trim();
  if (!raw) return undefined;

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toDateString();
  }

  return raw;
}
