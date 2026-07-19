import ExcelJS, { type Worksheet } from "exceljs";

const IGNORED_WORKSHEET_NODES = ["drawing", "picture"] as const;

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
