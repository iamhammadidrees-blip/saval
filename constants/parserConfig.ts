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

/**
 * Common Excel ARGB/RGB fills. These exact values are calibration anchors;
 * the color helpers below also tolerate nearby shades.
 */
export const PENDING_COLORS = {
  orange: [
    "FFFFA500",
    "FFF4B183",
    "FFED7D31",
    "FFFFC000",
    "FFF8CBAD",
  ],
  yellow: [
    "FFFFFF00",
    "FFFFD966",
    "FFFFE699",
    "FFFFF2CC",
    "FFFFEB9C",
  ],
  lightGreen: [
    "FFC6E0B4",
    "FFE2F0D9",
    "FFA9D18E",
    "FF92D050",
    "FFC6EFCE",
  ],
} as const;

/** Only strong pure/dark greens are resolved; light greens are pending. */
export const RESOLVED_COLORS = [
  "FF00FF00",
  "FF00B050",
  "FF008000",
  "FF006100",
  "FF006400",
  "FF004D00",
] as const;

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

interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

function toHsl(argb: string | undefined): HslColor | null {
  const rgb = normalizeArgb(argb);
  if (!rgb) return null;

  const red = Number.parseInt(rgb.slice(0, 2), 16) / 255;
  const green = Number.parseInt(rgb.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(rgb.slice(4, 6), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation =
    delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;

  if (maximum === red) {
    hue = 60 * (((green - blue) / delta) % 6);
  } else if (maximum === green) {
    hue = 60 * ((blue - red) / delta + 2);
  } else {
    hue = 60 * ((red - green) / delta + 4);
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation,
    lightness,
  };
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
  if (matchesExactColor(argb, PENDING_COLORS.orange)) return true;

  const color = toHsl(argb);
  return (
    color !== null &&
    color.hue >= 15 &&
    color.hue <= 45 &&
    color.saturation >= 0.35 &&
    color.lightness >= 0.35
  );
}

export function isYellowLike(argb: string | undefined): boolean {
  if (matchesExactColor(argb, PENDING_COLORS.yellow)) return true;

  const color = toHsl(argb);
  return (
    color !== null &&
    color.hue > 45 &&
    color.hue <= 70 &&
    color.saturation >= 0.25 &&
    color.lightness >= 0.55
  );
}

/**
 * Returns true only for resolved pure/dark green.
 * It deliberately excludes pale and light green fills.
 */
export function isGreenLike(argb: string | undefined): boolean {
  if (matchesExactColor(argb, RESOLVED_COLORS)) return true;

  const color = toHsl(argb);
  if (
    color === null ||
    color.hue < 75 ||
    color.hue > 155 ||
    color.saturation < 0.3
  ) {
    return false;
  }

  const isDarkGreen = color.lightness <= 0.42;
  const isPureGreen =
    color.saturation >= 0.75 && color.lightness <= 0.58;

  return isDarkGreen || isPureGreen;
}

export function isLightGreenLike(argb: string | undefined): boolean {
  if (matchesExactColor(argb, PENDING_COLORS.lightGreen)) return true;
  if (isGreenLike(argb)) return false;

  const color = toHsl(argb);
  return (
    color !== null &&
    color.hue >= 75 &&
    color.hue <= 155 &&
    color.saturation >= 0.15 &&
    color.lightness >= 0.43
  );
}

export function isPendingColor(argb: string | undefined): boolean {
  return (
    isOrangeLike(argb) ||
    isYellowLike(argb) ||
    isLightGreenLike(argb)
  );
}
