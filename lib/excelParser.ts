import ExcelJS, { type Cell, type Worksheet } from "exceljs";

import {
  HEADER_ALIASES,
  HEADER_MARKERS,
  STATUS_COLUMN_RULE,
  STATUS_HEADER_HINTS,
  isGreenLike,
  isLightGreenLike,
  isOrangeLike,
  isYellowLike,
  normalizeHeader,
  type ParserFieldKey,
} from "@/constants/parserConfig";

const IGNORED_WORKSHEET_NODES = ["drawing", "picture"] as const;
const HEADER_SCAN_LIMIT = 30;
const DATE_HEADER_PATTERN =
  /^\d{1,2}[\s./-](?:\d{1,2}|[a-z]{3,9})[\s,./-]\d{2,4}$/i;

export interface HeaderDetectionResult {
  headerRowNumber: number;
  columnMap: Map<number, ParserFieldKey>;
  statusColumnIndexes: number[];
  statusHeaders: Map<number, string>;
  latestStatusColumnIndex: number;
}

export type StatusColor =
  | "orange"
  | "yellow"
  | "lightgreen"
  | "green"
  | "none";

export interface RawParsedRow {
  partName: string;
  partNumber?: string;
  batch?: string;
  date?: string;
  quantity: number;
  status: string;
  color?: StatusColor;
  statusDate?: string;
  remarks?: string;
  handlingMethod?: string;
}

export interface ParseResult {
  fileName: string;
  totalRows: number;
  rows: RawParsedRow[];
  errors: string[];
}

/**
 * Loads File A and returns its first worksheet.
 *
 * Header detection and row parsing are intentionally handled by the next
 * parser steps; this function is responsible only for workbook loading.
 */
export async function loadFileAWorksheet(
  buffer: ArrayBuffer,
): Promise<Worksheet> {
  if (buffer.byteLength === 0) {
    throw new Error("Cannot read an empty Excel file.");
  }

  const workbook = new ExcelJS.Workbook();

  try {
    // ExcelJS supports ArrayBuffer at runtime, although its type declaration
    // still names the accepted browser buffer as Node's Buffer.
    await workbook.xlsx.load(
      buffer as Parameters<typeof workbook.xlsx.load>[0],
      { ignoreNodes: [...IGNORED_WORKSHEET_NODES] },
    );
  } catch (error) {
    throw new Error("Could not read the Excel workbook.", { cause: error });
  }

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("The Excel workbook does not contain a worksheet.");
  }

  return worksheet;
}

function fieldKeyForHeader(header: string): ParserFieldKey | undefined {
  const aliases = HEADER_ALIASES as Readonly<
    Record<string, ParserFieldKey | undefined>
  >;
  return aliases[header];
}

function isHeaderRow(worksheet: Worksheet, rowNumber: number): boolean {
  const values = new Set<string>();

  worksheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell) => {
    values.add(normalizeHeader(cell.text));
  });

  const hasPartName = values.has("part name");
  const hasPartNumber = HEADER_MARKERS.some(
    (marker) => marker !== "part name" && values.has(marker),
  );

  return hasPartName && hasPartNumber;
}

function hasStatusHint(text: string): boolean {
  const normalized = normalizeHeader(text);
  return STATUS_HEADER_HINTS.some(
    (hint) => normalized === hint || normalized.includes(hint),
  );
}

function isDatedStatusHeader(cell: Cell): boolean {
  return (
    cell.value instanceof Date ||
    DATE_HEADER_PATTERN.test(cell.text.trim())
  );
}

function hasStatusGroupAbove(
  worksheet: Worksheet,
  rowNumber: number,
  columnNumber: number,
): boolean {
  for (let offset = 1; offset <= 2 && rowNumber - offset >= 1; offset += 1) {
    if (
      hasStatusHint(
        worksheet.getCell(rowNumber - offset, columnNumber).text,
      )
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Finds File A's real header row and maps its data/status columns.
 * The search ignores title rows and examines only the first 30 rows.
 */
export function findHeaderRow(
  worksheet: Worksheet,
): HeaderDetectionResult {
  const lastRowToScan = Math.min(HEADER_SCAN_LIMIT, worksheet.rowCount);
  let headerRowNumber: number | undefined;

  for (let rowNumber = 1; rowNumber <= lastRowToScan; rowNumber += 1) {
    if (isHeaderRow(worksheet, rowNumber)) {
      headerRowNumber = rowNumber;
      break;
    }
  }

  if (headerRowNumber === undefined) {
    throw new Error(
      "Could not find header row (Part No. / Part Name)",
    );
  }

  const columnMap = new Map<number, ParserFieldKey>();
  const statusColumnIndexes: number[] = [];
  const statusHeaders = new Map<number, string>();
  const headerRow = worksheet.getRow(headerRowNumber);

  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = normalizeHeader(cell.text);
    const fieldKey = fieldKeyForHeader(header);

    if (fieldKey) {
      columnMap.set(columnNumber, fieldKey);
      return;
    }

    const isStatusColumn =
      hasStatusHint(header) ||
      isDatedStatusHeader(cell) ||
      hasStatusGroupAbove(worksheet, headerRowNumber, columnNumber);

    if (isStatusColumn) {
      statusColumnIndexes.push(columnNumber);
      statusHeaders.set(columnNumber, cell.text.trim());
    }
  });

  statusColumnIndexes.sort((left, right) => left - right);

  if (statusColumnIndexes.length === 0) {
    throw new Error("Could not find status columns.");
  }

  const preferredStatusColumn = statusColumnIndexes.find(
    (columnNumber) =>
      normalizeHeader(statusHeaders.get(columnNumber)) ===
      STATUS_COLUMN_RULE.preferredHeader,
  );
  const latestStatusColumnIndex =
    preferredStatusColumn ??
    statusColumnIndexes[statusColumnIndexes.length - 1];

  return {
    headerRowNumber,
    columnMap,
    statusColumnIndexes,
    statusHeaders,
    latestStatusColumnIndex,
  };
}

function optionalText(cell: Cell | undefined): string | undefined {
  const text = cell?.text.trim() ?? "";
  return text || undefined;
}

function readQuantity(cell: Cell | undefined): number | null {
  if (!cell) return null;

  if (typeof cell.value === "number" && Number.isFinite(cell.value)) {
    return cell.value;
  }

  if (typeof cell.result === "number" && Number.isFinite(cell.result)) {
    return cell.result;
  }

  const normalized = cell.text.replace(/,/g, "").trim();
  if (!normalized) return null;

  const quantity = Number(normalized);
  return Number.isFinite(quantity) ? quantity : null;
}

function readFillArgb(cell: Cell): string | undefined {
  if (cell.fill.type !== "pattern") return undefined;
  return cell.fill.fgColor?.argb;
}

function statusColorFromArgb(argb: string | undefined): StatusColor {
  if (isOrangeLike(argb)) return "orange";
  if (isYellowLike(argb)) return "yellow";
  if (isLightGreenLike(argb)) return "lightgreen";
  if (isGreenLike(argb)) return "green";
  return "none";
}

function columnsByField(
  columnMap: Map<number, ParserFieldKey>,
): Map<ParserFieldKey, number> {
  const result = new Map<ParserFieldKey, number>();

  for (const [columnNumber, fieldKey] of columnMap) {
    result.set(fieldKey, columnNumber);
  }

  return result;
}

export function parseWorksheetRows(
  worksheet: Worksheet,
  header: HeaderDetectionResult,
): Pick<ParseResult, "totalRows" | "rows" | "errors"> {
  const fields = columnsByField(header.columnMap);
  const rows: RawParsedRow[] = [];
  const errors: string[] = [];
  let totalRows = 0;

  const cellForField = (
    rowNumber: number,
    fieldKey: ParserFieldKey,
  ): Cell | undefined => {
    const columnNumber = fields.get(fieldKey);
    return columnNumber
      ? worksheet.getCell(rowNumber, columnNumber)
      : undefined;
  };

  for (
    let rowNumber = header.headerRowNumber + 1;
    rowNumber <= worksheet.rowCount;
    rowNumber += 1
  ) {
    const row = worksheet.getRow(rowNumber);
    if (!row.hasValues) continue;

    totalRows += 1;

    const partName = optionalText(
      cellForField(rowNumber, "partName"),
    );
    const partNumber = optionalText(
      cellForField(rowNumber, "partNumber"),
    );

    if (!partName && !partNumber) {
      errors.push(
        `Row ${rowNumber}: skipped because Part No. and Part Name are empty.`,
      );
      continue;
    }

    const quantityCell = cellForField(rowNumber, "quantity");
    const parsedQuantity = readQuantity(quantityCell);

    if (
      parsedQuantity === null &&
      (quantityCell?.text.trim() ?? "") !== ""
    ) {
      errors.push(
        `Row ${rowNumber}: invalid Affected Qty; defaulted to 0.`,
      );
    }

    const statusCell = worksheet.getCell(
      rowNumber,
      header.latestStatusColumnIndex,
    );
    const fillArgb = readFillArgb(statusCell);

    rows.push({
      partName: partName ?? "",
      partNumber,
      batch: optionalText(cellForField(rowNumber, "batch")),
      date: optionalText(cellForField(rowNumber, "date")),
      quantity: parsedQuantity ?? 0,
      status: statusCell.text.trim(),
      color: statusColorFromArgb(fillArgb),
      statusDate:
        header.statusHeaders.get(header.latestStatusColumnIndex) ||
        undefined,
      remarks: optionalText(cellForField(rowNumber, "remarks")),
      handlingMethod: optionalText(
        cellForField(rowNumber, "handlingMethod"),
      ),
    });
  }

  return { totalRows, rows, errors };
}

/**
 * Public File A parser entry point.
 * It loads the workbook, discovers its columns, then reads unfiltered rows.
 */
export async function parseFileA(
  buffer: ArrayBuffer,
  fileName: string,
): Promise<ParseResult> {
  const worksheet = await loadFileAWorksheet(buffer);
  const header = findHeaderRow(worksheet);
  const parsed = parseWorksheetRows(worksheet, header);

  return {
    fileName,
    ...parsed,
  };
}
