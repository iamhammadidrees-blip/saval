import ExcelJS from "exceljs";

import type { PendingPart, RequiredPart } from "@/lib/types";

const PENDING_HEADERS = [
  "Date",
  "Batch",
  "Part No.",
  "Part Name",
  "Qty",
  "Status",
  "Status Date",
  "Handling",
  "Remarks",
  "Source File",
] as const;

const PENDING_SHEET_NAME = "Pending Parts";

const STATUS_FILL_ARGB: Record<string, string> = {
  orange: "FFFFC000",
  yellow: "FFFFFF00",
  lightgreen: "FFA9D08E",
  green: "FF92D050",
};

const FILE_B_HEADERS = [
  "Part No.",
  "Part Name",
  "Total Qty",
  "Count in Pending",
  "Files Involved",
  "Last Updated",
] as const;

const FILE_B_SHEET_NAME = "Required Parts";
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

function formatLastUpdated(value: string): string {
  if (!value.trim()) return "";

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;

  return new Date(parsed).toLocaleString();
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
      part.partNumber ?? "",
      part.partName,
      part.totalQuantity,
      part.countInPending,
      part.filesInvolved.join(", "),
      formatLastUpdated(part.lastUpdated),
    ]);
  }

  worksheet.columns = [
    { width: 14 },
    { width: 32 },
    { width: 12 },
    { width: 18 },
    { width: 42 },
    { width: 22 },
  ];

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
      part.date ?? "",
      part.batch ?? "",
      part.partNumber ?? "",
      part.partName,
      part.quantity,
      part.status,
      part.statusDate ?? "",
      part.handlingMethod ?? "",
      part.remarks ?? "",
      part.fileName,
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
    { width: 14 },
    { width: 18 },
    { width: 24 },
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
