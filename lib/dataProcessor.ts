import { nanoid } from "nanoid";

import {
  PENDING_KEYWORDS,
  RESOLVED_KEYWORDS,
  type StatusKeyword,
} from "@/constants/parserConfig";
import type { RawParsedRow } from "@/lib/excelParser";
import type { PendingPart, RequiredPart, UniquePart } from "@/lib/types";
import { extractModelFromBatch, toShortDate } from "@/lib/utils";

const PENDING_STATUS_COLORS = new Set([
  "orange",
  "yellow",
  "lightgreen",
]);
const RESOLVED_STATUS_COLORS = new Set(["green"]);

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesKeyword(
  status: string,
  keyword: StatusKeyword,
): boolean {
  if (typeof keyword === "string") {
    return normalizeText(status).includes(normalizeText(keyword));
  }

  keyword.lastIndex = 0;
  return keyword.test(status.trim());
}

function matchesAnyKeyword(
  status: string,
  keywords: readonly StatusKeyword[],
): boolean {
  return keywords.some((keyword) => matchesKeyword(status, keyword));
}

/**
 * Decides from the authoritative/latest status only.
 * Fill color has priority; keywords are used only when no known fill exists.
 */
export function isPendingRow(row: RawParsedRow): boolean {
  const color = normalizeText(row.color);

  if (PENDING_STATUS_COLORS.has(color)) return true;
  if (RESOLVED_STATUS_COLORS.has(color)) return false;

  if (matchesAnyKeyword(row.status, PENDING_KEYWORDS)) return true;
  if (matchesAnyKeyword(row.status, RESOLVED_KEYWORDS)) return false;

  console.warn(
    `Unrecognized status treated as not pending: "${row.status || "(empty)"}".`,
  );
  return false;
}

export function filterPending(
  rows: RawParsedRow[],
): RawParsedRow[] {
  return rows.filter(isPendingRow);
}

/**
 * Converts already-filtered rows into records suitable for IndexedDB.
 */
export function toPendingParts(
  rows: RawParsedRow[],
  fileName: string,
): PendingPart[] {
  const processedAt = new Date().toISOString();

  return rows.map((row) => ({
    id: nanoid(),
    fileName,
    partName: row.partName,
    partNumber: row.partNumber,
    batch: row.batch,
    date: toShortDate(row.date),
    quantity: Number.isFinite(row.quantity) ? row.quantity : 0,
    status: row.status,
    color: row.color,
    processedAt,
  }));
}

interface RequiredAccumulator {
  id: string;
  partName: string;
  partNumber?: string;
  model?: string;
  totalQuantity: number;
  countInPending: number;
}

/**
 * Part identity for Required grouping / Unique Parts card
 * (Part No, else Part Name). Model is applied separately.
 */
export function requiredPartKey(part: PendingPart): string {
  return normalizeText(part.partNumber) || normalizeText(part.partName);
}

/**
 * Computes the Required view from pending parts.
 * Group = Part No (or Name) + Model from batch.
 * Same part + same model → one row (sum qty).
 * Same part + different models → separate rows.
 * Empty model → shared "" bucket for that part.
 * Derived only — never written to IndexedDB.
 */
export function aggregateRequired(
  parts: PendingPart[],
): RequiredPart[] {
  const groups = new Map<string, RequiredAccumulator>();

  for (const part of parts) {
    const partKey = requiredPartKey(part);
    if (!partKey) continue;

    const model = extractModelFromBatch(part.batch);
    const modelKey = normalizeText(model);
    const groupKey = `${partKey}|${modelKey}`;
    const existing = groups.get(groupKey);

    if (existing) {
      existing.totalQuantity += Number.isFinite(part.quantity)
        ? part.quantity
        : 0;
      existing.countInPending += 1;

      if (!existing.partName && part.partName) {
        existing.partName = part.partName;
      }
      if (!existing.partNumber && part.partNumber) {
        existing.partNumber = part.partNumber;
      }

      continue;
    }

    groups.set(groupKey, {
      id: groupKey,
      partName: part.partName,
      partNumber: part.partNumber,
      model,
      totalQuantity: Number.isFinite(part.quantity) ? part.quantity : 0,
      countInPending: 1,
    });
  }

  return Array.from(groups.values(), (group) => ({
    id: group.id,
    partName: group.partName,
    partNumber: group.partNumber,
    model: group.model,
    totalQuantity: group.totalQuantity,
    countInPending: group.countInPending,
  }));
}

interface UniqueAccumulator {
  id: string;
  partNumber: string;
  partName: string;
  totalQuantity: number;
}

/**
 * Unique Parts view — group by Part No. only.
 * Same part number → one row (sum qty), ignoring batch, name, and status.
 * Rows without a part number are skipped. Derived only — never written to IndexedDB.
 */
export function aggregateUniqueParts(parts: PendingPart[]): UniquePart[] {
  const groups = new Map<string, UniqueAccumulator>();

  for (const part of parts) {
    const partNumberKey = normalizeText(part.partNumber);
    if (!partNumberKey) continue;

    const existing = groups.get(partNumberKey);
    const qty = Number.isFinite(part.quantity) ? part.quantity : 0;

    if (existing) {
      existing.totalQuantity += qty;
      if (!existing.partName && part.partName) {
        existing.partName = part.partName;
      }
      continue;
    }

    groups.set(partNumberKey, {
      id: partNumberKey,
      partNumber: part.partNumber!.trim(),
      partName: part.partName,
      totalQuantity: qty,
    });
  }

  return Array.from(groups.values(), (group) => ({
    id: group.id,
    partNumber: group.partNumber,
    partName: group.partName,
    totalQuantity: group.totalQuantity,
  }));
}

/** Label used when a Required row has no model (also used in filenames). */
export const UNKNOWN_MODEL = "UNKNOWN";

export function requiredModelLabel(model: string | undefined): string {
  const trimmed = model?.trim() ?? "";
  return trimmed || UNKNOWN_MODEL;
}

/** Unique models from Required parts, sorted A–Z. Missing model → UNKNOWN. */
export function listRequiredModels(parts: RequiredPart[]): string[] {
  const models = new Set<string>();

  for (const part of parts) {
    models.add(requiredModelLabel(part.model));
  }

  return Array.from(models).sort((left, right) => left.localeCompare(right));
}

/** Rows belonging to one model (missing model matches UNKNOWN). */
export function filterRequiredByModel(
  parts: RequiredPart[],
  model: string,
): RequiredPart[] {
  return parts.filter(
    (part) => requiredModelLabel(part.model) === model,
  );
}
