export type ParserFieldKey =
  | "partNumber"
  | "partName"
  | "batch"
  | "date"
  | "quantity"
  | "remarks"
  | "handlingMethod";

export type StatusKeyword = string | RegExp;

/**
 * Normalized File A header aliases.
 * Add new aliases here when a supplier changes its column wording.
 */
export const HEADER_ALIASES = {
  "part no.": "partNumber",
  "part no": "partNumber",
  "part number": "partNumber",
  "part #": "partNumber",
  "part code": "partNumber",
  "part name": "partName",
  "part description": "partName",
  "item name": "partName",
  batch: "batch",
  "batch no.": "batch",
  "batch no": "batch",
  "batch number": "batch",
  date: "date",
  "record date": "date",
  "affected qty": "quantity",
  "affected qty.": "quantity",
  "affected quantity": "quantity",
  remarks: "remarks",
  remark: "remarks",
  comments: "remarks",
  "handling method": "handlingMethod",
  "handling method.": "handlingMethod",
  handling: "handlingMethod",
} as const satisfies Readonly<Record<string, ParserFieldKey>>;

/** Both markers should normally be present on the real header row. */
export const HEADER_MARKERS = [
  "part no.",
  "part no",
  "part number",
  "part name",
] as const;

export const STATUS_HEADER_HINTS = [
  "status",
  "status as of",
  "status 1",
  "status 2",
] as const;

/**
 * File A normally has two status columns. Status 2 is authoritative.
 * If columns are date-labelled instead, the parser should use the right-most
 * status column as the latest value.
 */
export const STATUS_COLUMN_RULE = {
  expectedCount: 2,
  preferredHeader: "status 2",
  fallbackPosition: "rightmost",
} as const;

/** Affected Qty is the only source used for Pending/Required quantities. */
export const QUANTITY_FIELD = [
  "affected qty",
  "affected qty.",
  "affected quantity",
] as const;

/** Exact RGB fills calibrated from the client's File A workbook. */
export const PENDING_COLORS = {
  orange: ["FFFFC000"],
  yellow: ["FFFFFF00"],
  lightGreen: ["FFA9D08E"],
} as const;

/** The client's resolved status fill: RGB #92D050. */
export const RESOLVED_COLORS = ["FF92D050"] as const;

export const PENDING_KEYWORDS: readonly StatusKeyword[] = [
  "under observation",
  "need to order",
  "need to order sub-assy part",
  "need to order sub assy part",
];

export const RESOLVED_KEYWORDS: readonly StatusKeyword[] = [
  "issued from inventory",
  /^pk[- ]?\d+/i,
];

export function normalizeHeader(text: unknown): string {
  return String(text ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeArgb(argb: string | undefined): string {
  const value = (argb ?? "").replace(/^#/, "").trim().toUpperCase();

  if (/^[0-9A-F]{8}$/.test(value)) return value.slice(2);
  if (/^[0-9A-F]{6}$/.test(value)) return value;

  return "";
}

function matchesExactColor(
  argb: string | undefined,
  colors: readonly string[],
): boolean {
  const candidate = normalizeArgb(argb);
  return (
    candidate !== "" &&
    colors.some((color) => normalizeArgb(color) === candidate)
  );
}

export function isOrangeLike(argb: string | undefined): boolean {
  return matchesExactColor(argb, PENDING_COLORS.orange);
}

export function isYellowLike(argb: string | undefined): boolean {
  return matchesExactColor(argb, PENDING_COLORS.yellow);
}

/** Returns true only for the client's resolved green (#92D050). */
export function isGreenLike(argb: string | undefined): boolean {
  return matchesExactColor(argb, RESOLVED_COLORS);
}

export function isLightGreenLike(argb: string | undefined): boolean {
  return matchesExactColor(argb, PENDING_COLORS.lightGreen);
}

export function isPendingColor(argb: string | undefined): boolean {
  return (
    isOrangeLike(argb) ||
    isYellowLike(argb) ||
    isLightGreenLike(argb)
  );
}
