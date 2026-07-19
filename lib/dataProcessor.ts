import { nanoid } from "nanoid";

import {
  PENDING_KEYWORDS,
  RESOLVED_KEYWORDS,
  type StatusKeyword,
} from "@/constants/parserConfig";
import type { RawParsedRow } from "@/lib/excelParser";
import type { PendingPart, RequiredPart } from "@/lib/types";

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
    date: row.date,
    quantity: Number.isFinite(row.quantity) ? row.quantity : 0,
    status: row.status,
    color: row.color,
    statusDate: row.statusDate,
    remarks: row.remarks,
    handlingMethod: row.handlingMethod,
    processedAt,
  }));
}

function latestTimestamp(
  current: string,
  candidate: string,
): string {
  if (!candidate) return current;
  if (!current) return candidate;

  const currentTime = Date.parse(current);
  const candidateTime = Date.parse(candidate);

  if (Number.isNaN(currentTime)) return candidate;
  if (Number.isNaN(candidateTime)) return current;

  return candidateTime > currentTime ? candidate : current;
}

interface RequiredAccumulator {
  id: string;
  partName: string;
  partNumber?: string;
  totalQuantity: number;
  countInPending: number;
  filesInvolved: Set<string>;
  lastUpdated: string;
}

/**
 * Computes the Required view from pending parts.
 * This result is derived data and is never written to IndexedDB.
 */
export function aggregateRequired(
  parts: PendingPart[],
): RequiredPart[] {
  const groups = new Map<string, RequiredAccumulator>();

  for (const part of parts) {
    const groupKey =
      normalizeText(part.partNumber) || normalizeText(part.partName);

    if (!groupKey) continue;

    const timestamp = part.processedAt || part.date || "";
    const existing = groups.get(groupKey);

    if (existing) {
      existing.totalQuantity += Number.isFinite(part.quantity)
        ? part.quantity
        : 0;
      existing.countInPending += 1;
      existing.filesInvolved.add(part.fileName);
      existing.lastUpdated = latestTimestamp(
        existing.lastUpdated,
        timestamp,
      );

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
      totalQuantity: Number.isFinite(part.quantity) ? part.quantity : 0,
      countInPending: 1,
      filesInvolved: new Set([part.fileName]),
      lastUpdated: timestamp,
    });
  }

  return Array.from(groups.values(), (group) => ({
    id: group.id,
    partName: group.partName,
    partNumber: group.partNumber,
    totalQuantity: group.totalQuantity,
    countInPending: group.countInPending,
    filesInvolved: Array.from(group.filesInvolved).sort(),
    lastUpdated: group.lastUpdated,
  }));
}
