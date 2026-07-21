export type ParserFieldKey =
  | "partNumber"
  | "partName"
  | "batch"
  | "date"
  | "quantity";

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
 * File A normally has two status columns. Status 2 alone drives
 * pending/resolved decisions — Status 1 and other status columns are ignored.
 * Upload fails if Status 2 cannot be found (no rightmost fallback).
 */
export const STATUS_COLUMN_RULE = {
  expectedCount: 2,
  preferredHeader: "status 2",
  requirePreferred: true,
  preferredAliases: ["status 2", "status2", "status-2"] as const,
} as const;

/** Affected Qty is the only source used for Pending/Required quantities. */
export const QUANTITY_FIELD = [
  "affected qty",
  "affected qty.",
  "affected quantity",
] as const;

export type StatusFillName =
  | "orange"
  | "yellow"
  | "lightgreen"
  | "green";

/** Client File A Status 2 fills — ARGB8 and RGB6 aliases. */
export const PENDING_COLORS = {
  orange: ["FFFFC000", "FFC000"],
  yellow: ["FFFFFF00", "FFFF00"],
  lightGreen: ["FFA9D08E", "A9D08E"],
} as const;

/** Resolved Status 2 fill — ARGB8 and RGB6. */
export const RESOLVED_COLORS = ["FF92D050", "92D050"] as const;

/** Max Euclidean RGB distance for nearest-palette classification. */
export const STATUS_COLOR_MATCH_THRESHOLD = 48;

/**
 * Office default theme scheme colors (lt1, dk1, lt2, dk2, accent1–6).
 * Used when ExcelJS exposes theme+tint instead of argb.
 */
const OFFICE_THEME_RGB6 = [
  "FFFFFF", // 0 lt1
  "000000", // 1 dk1
  "E7E6E6", // 2 lt2
  "44546A", // 3 dk2
  "5B9BD5", // 4 accent1
  "ED7D31", // 5 accent2
  "A5A5A5", // 6 accent3
  "FFC000", // 7 accent4
  "4472C4", // 8 accent5
  "70AD47", // 9 accent6
  "0563C1", // 10 hlink
  "954F72", // 11 folHlink
] as const;

const STATUS_PALETTE: readonly {
  name: StatusFillName;
  rgb6: string;
}[] = [
  { name: "orange", rgb6: "FFC000" },
  { name: "yellow", rgb6: "FFFF00" },
  { name: "lightgreen", rgb6: "A9D08E" },
  { name: "green", rgb6: "92D050" },
];

export type FillColorInput = {
  argb?: string;
  theme?: number;
  tint?: number;
};

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

/** Normalize `#RGB` / RGB6 / ARGB8 to uppercase RGB6. */
export function normalizeToRgb6(input: string | undefined): string {
  const value = (input ?? "").replace(/^#/, "").trim().toUpperCase();

  if (/^[0-9A-F]{8}$/.test(value)) return value.slice(2);
  if (/^[0-9A-F]{6}$/.test(value)) return value;

  return "";
}

function parseRgbChannels(
  rgb6: string,
): { r: number; g: number; b: number } | null {
  if (!/^[0-9A-F]{6}$/.test(rgb6)) return null;

  return {
    r: Number.parseInt(rgb6.slice(0, 2), 16),
    g: Number.parseInt(rgb6.slice(2, 4), 16),
    b: Number.parseInt(rgb6.slice(4, 6), 16),
  };
}

function toRgb6(r: number, g: number, b: number): string {
  const clamp = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel)));

  return [clamp(r), clamp(g), clamp(b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/** Euclidean distance between two RGB6 colors. */
export function rgbDistance(a: string, b: string): number {
  const left = parseRgbChannels(normalizeToRgb6(a));
  const right = parseRgbChannels(normalizeToRgb6(b));

  if (!left || !right) return Number.POSITIVE_INFINITY;

  const dr = left.r - right.r;
  const dg = left.g - right.g;
  const db = left.b - right.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * OOXML tint: negative darkens, positive lightens toward white.
 * @see ECMA-376 color transforms
 */
function applyTint(rgb6: string, tint: number | undefined): string {
  const channels = parseRgbChannels(rgb6);
  if (!channels) return "";
  if (tint === undefined || !Number.isFinite(tint) || tint === 0) {
    return rgb6;
  }

  const transform = (channel: number): number => {
    if (tint < 0) return channel * (1 + tint);
    return channel * (1 - tint) + 255 * tint;
  };

  return toRgb6(
    transform(channels.r),
    transform(channels.g),
    transform(channels.b),
  );
}

/** Map Office theme index (+ optional tint) to RGB6. */
export function resolveThemeColor(
  theme: number,
  tint?: number,
): string {
  if (!Number.isInteger(theme) || theme < 0 || theme >= OFFICE_THEME_RGB6.length) {
    return "";
  }

  return applyTint(OFFICE_THEME_RGB6[theme], tint);
}

/** Nearest fixed client palette color within threshold, else null. */
export function classifyStatusColor(
  rgb6: string | undefined,
): StatusFillName | null {
  const candidate = normalizeToRgb6(rgb6);
  if (!candidate) return null;

  let bestName: StatusFillName | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const swatch of STATUS_PALETTE) {
    const distance = rgbDistance(candidate, swatch.rgb6);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = swatch.name;
    }
  }

  if (
    bestName === null ||
    bestDistance > STATUS_COLOR_MATCH_THRESHOLD
  ) {
    return null;
  }

  return bestName;
}

/**
 * Resolve Excel fill (argb and/or theme+tint) to a Status 2 palette name.
 * When both argb and theme classify but disagree, theme wins (cell theme
 * often overrides a shared base style that reports a fixed orange argb).
 */
export function matchStatusFillColor(
  input: FillColorInput | string | undefined,
): StatusFillName | null {
  if (input === undefined || input === null) return null;

  if (typeof input === "string") {
    return classifyStatusColor(input);
  }

  const fromArgb = classifyStatusColor(input.argb);
  const fromTheme =
    typeof input.theme === "number"
      ? classifyStatusColor(
          resolveThemeColor(input.theme, input.tint),
        )
      : null;

  if (fromTheme && fromArgb && fromTheme !== fromArgb) {
    return fromTheme;
  }

  return fromArgb ?? fromTheme;
}

export function isOrangeLike(
  input: FillColorInput | string | undefined,
): boolean {
  return matchStatusFillColor(input) === "orange";
}

export function isYellowLike(
  input: FillColorInput | string | undefined,
): boolean {
  return matchStatusFillColor(input) === "yellow";
}

export function isLightGreenLike(
  input: FillColorInput | string | undefined,
): boolean {
  return matchStatusFillColor(input) === "lightgreen";
}

/** Resolved green (#92D050 family). */
export function isGreenLike(
  input: FillColorInput | string | undefined,
): boolean {
  return matchStatusFillColor(input) === "green";
}

export function isPendingColor(
  input: FillColorInput | string | undefined,
): boolean {
  const name = matchStatusFillColor(input);
  return name === "orange" || name === "yellow" || name === "lightgreen";
}
