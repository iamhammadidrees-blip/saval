import ExcelJS from "exceljs";

import type { RequiredPart } from "@/lib/types";

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

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: HEADER_FILL_ARGB },
  };

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
