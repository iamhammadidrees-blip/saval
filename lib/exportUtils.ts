import ExcelJS from "exceljs";

import { requiredModelLabel } from "@/lib/dataProcessor";
import type { PendingPart, RequiredPart, UniquePart } from "@/lib/types";
import { toShortDate } from "@/lib/utils";

const PENDING_HEADERS = [
  "Date",
  "Batch",
  "Part No.",
  "Part Name",
  "Qty",
  "Status",
] as const;

const PENDING_SHEET_NAME = "Pending Parts";

const STATUS_FILL_ARGB: Record<string, string> = {
  orange: "FFFFC000",
  yellow: "FFFFFF00",
  lightgreen: "FFA9D08E",
  green: "FF92D050",
};

const FILE_B_HEADERS = [
  "Model",
  "Part No.",
  "Part Name",
  "Total Qty",
  "Count in Pending",
] as const;

const FILE_B_SHEET_NAME = "Required Parts";

const MODEL_PARTS_HEADERS = ["Model", "Part No.", "Part Name", "Qty"] as const;
const MODEL_PARTS_SHEET_NAME = "Model Parts";

const UNIQUE_PARTS_HEADERS = ["Part No.", "Part Name", "Qty"] as const;
const UNIQUE_PARTS_SHEET_NAME = "Unique Parts";

const HEADER_FILL_ARGB = "FFD9E1F2";

function assertBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("Export is only available in the browser.");
  }
}

/** Suggested download name: `Required_Parts_FileB_YYYY-MM-DD.xlsx` */
export function getRequiredPartsFileBFileName(
  date: Date = new Date(),
): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `Required_Parts_FileB_${isoDate}.xlsx`;
}

/** Suggested download name: `Pending_Parts_YYYY-MM-DD.xlsx` */
export function getPendingPartsFileName(date: Date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `Pending_Parts_${isoDate}.xlsx`;
}

/** Suggested download name: `Required_Parts_ALW_YYYY-MM-DD.xlsx` */
export function getModelPartsFileName(
  model: string,
  date: Date = new Date(),
): string {
  const safeModel = requiredModelLabel(model).replace(/[^\w-]+/g, "_");
  const isoDate = date.toISOString().slice(0, 10);
  return `Required_Parts_${safeModel}_${isoDate}.xlsx`;
}

/** Suggested download name: `Unique_Parts_YYYY-MM-DD.xlsx` */
export function getUniquePartsFileName(date: Date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `Unique_Parts_${isoDate}.xlsx`;
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

async function buildRequiredPartsWorkbook(
  parts: RequiredPart[],
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(FILE_B_SHEET_NAME);

  worksheet.addRow([...FILE_B_HEADERS]);

  styleHeaderRow(worksheet);

  for (const part of parts) {
    worksheet.addRow([
      requiredModelLabel(part.model),
      part.partNumber ?? "",
      part.partName,
      part.totalQuantity,
      part.countInPending,
    ]);
  }

  worksheet.columns = [
    { width: 10 },
    { width: 14 },
    { width: 32 },
    { width: 12 },
    { width: 18 },
  ];

  return workbook;
}

async function buildModelPartsWorkbook(
  parts: RequiredPart[],
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(MODEL_PARTS_SHEET_NAME);

  worksheet.addRow([...MODEL_PARTS_HEADERS]);
  styleHeaderRow(worksheet);

  for (const part of parts) {
    worksheet.addRow([
      requiredModelLabel(part.model),
      part.partNumber ?? "",
      part.partName,
      part.totalQuantity,
    ]);
  }

  worksheet.columns = [
    { width: 10 },
    { width: 14 },
    { width: 32 },
    { width: 12 },
  ];

  return workbook;
}

async function buildUniquePartsWorkbook(
  parts: UniquePart[],
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(UNIQUE_PARTS_SHEET_NAME);

  worksheet.addRow([...UNIQUE_PARTS_HEADERS]);
  styleHeaderRow(worksheet);

  for (const part of parts) {
    worksheet.addRow([
      part.partNumber,
      part.partName,
      part.totalQuantity,
    ]);
  }

  worksheet.columns = [{ width: 14 }, { width: 32 }, { width: 12 }];

  return workbook;
}

function styleHeaderRow(worksheet: ExcelJS.Worksheet): void {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL_ARGB },
  };
}

async function buildPendingPartsWorkbook(
  parts: PendingPart[],
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(PENDING_SHEET_NAME);

  worksheet.addRow([...PENDING_HEADERS]);
  styleHeaderRow(worksheet);

  const statusColumnIndex = PENDING_HEADERS.indexOf("Status") + 1;

  for (const part of parts) {
    const row = worksheet.addRow([
      toShortDate(part.date) ?? "",
      part.batch ?? "",
      part.partNumber ?? "",
      part.partName,
      part.quantity,
      part.status,
    ]);

    const colorKey = (part.color ?? "").toLowerCase();
    const fillArgb = STATUS_FILL_ARGB[colorKey];
    if (fillArgb) {
      const statusCell = row.getCell(statusColumnIndex);
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillArgb },
      };
    }
  }

  worksheet.columns = [
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 32 },
    { width: 8 },
    { width: 28 },
  ];

  return workbook;
}

/**
 * File B — exports aggregated Required Parts to Excel and starts a browser download.
 */
export async function downloadRequiredPartsFileB(
  parts: RequiredPart[],
): Promise<void> {
  assertBrowser();

  const workbook = await buildRequiredPartsWorkbook(parts);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  triggerDownload(blob, getRequiredPartsFileBFileName());
}

/**
 * Exports one model's required list (Model, Part No., Qty) and downloads it.
 * No-op when parts is empty.
 */
export async function downloadModelParts(
  parts: RequiredPart[],
  model: string,
): Promise<void> {
  if (parts.length === 0) return;

  assertBrowser();

  const workbook = await buildModelPartsWorkbook(parts);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  triggerDownload(blob, getModelPartsFileName(model));
}

/**
 * Exports unique parts (Part No. only aggregation) and downloads Excel.
 * No-op when parts is empty.
 */
export async function downloadUniqueParts(parts: UniquePart[]): Promise<void> {
  if (parts.length === 0) return;

  assertBrowser();

  const workbook = await buildUniquePartsWorkbook(parts);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  triggerDownload(blob, getUniquePartsFileName());
}

/**
 * Exports the raw pending-parts list (same fields as the Pending table) and downloads it.
 */
export async function downloadPendingParts(
  parts: PendingPart[],
): Promise<void> {
  assertBrowser();

  const workbook = await buildPendingPartsWorkbook(parts);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  triggerDownload(blob, getPendingPartsFileName());
}
