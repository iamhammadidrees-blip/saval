"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { PendingPart, RequiredPart, UniquePart } from "@/lib/types";
import { isMissingPartNumber, requiredModelLabel } from "@/lib/dataProcessor";
import { toShortDate } from "@/lib/utils";

const EMPTY_CELL = "—";
const MISSING_PART_NO = "🔴 —";

function displayText(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || EMPTY_CELL;
}

function pendingPartNumberCell(partNumber: string | undefined): string {
  if (isMissingPartNumber({ partNumber })) {
    return MISSING_PART_NO;
  }
  return partNumber!.trim();
}

const indexColumn = <T,>(): ColumnDef<T> => ({
  id: "index",
  header: "#",
  enableSorting: false,
  cell: ({ row }) => row.index + 1,
});

/** Column factory for the Pending Parts table. */
export function createPendingColumns(): ColumnDef<PendingPart>[] {
  return [
    indexColumn<PendingPart>(),
    {
      accessorKey: "date",
      header: "Date",
      enableSorting: false,
      cell: ({ row }) => toShortDate(row.original.date) ?? EMPTY_CELL,
    },
    {
      accessorKey: "batch",
      header: "Batch",
      enableSorting: false,
      cell: ({ row }) => displayText(row.original.batch),
    },
    {
      accessorKey: "partNumber",
      header: "Part No.",
      enableSorting: false,
      cell: ({ row }) => pendingPartNumberCell(row.original.partNumber),
    },
    {
      accessorKey: "partName",
      header: "Part Name",
      enableSorting: false,
      cell: ({ row }) => displayText(row.original.partName),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => row.original.quantity.toLocaleString(),
    },
    {
      id: "status",
      accessorFn: (row) => row.status,
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => displayText(row.original.status),
    },
  ];
}

/** Column factory for the Required Parts table. */
export function createRequiredColumns(): ColumnDef<RequiredPart>[] {
  return [
    indexColumn<RequiredPart>(),
    {
      id: "model",
      accessorFn: (row) => requiredModelLabel(row.model),
      header: "Model",
      enableSorting: false,
      cell: ({ row }) => requiredModelLabel(row.original.model),
    },
    {
      accessorKey: "partNumber",
      header: "Part No.",
      enableSorting: false,
      cell: ({ row }) => displayText(row.original.partNumber),
    },
    {
      accessorKey: "partName",
      header: "Part Name",
      enableSorting: false,
      cell: ({ row }) => displayText(row.original.partName),
    },
    {
      accessorKey: "totalQuantity",
      header: "Total Qty",
      cell: ({ row }) => row.original.totalQuantity.toLocaleString(),
    },
    {
      accessorKey: "countInPending",
      header: "Count in Pending",
      enableSorting: false,
      cell: ({ row }) => row.original.countInPending.toLocaleString(),
    },
  ];
}

/** Column factory for the Models tab (filtered Required rows). */
export function createModelColumns(): ColumnDef<RequiredPart>[] {
  return [
    indexColumn<RequiredPart>(),
    {
      id: "model",
      accessorFn: (row) => requiredModelLabel(row.model),
      header: "Model",
      enableSorting: false,
      meta: { className: "pl-20" },
      cell: ({ row }) => requiredModelLabel(row.original.model),
    },
    {
      accessorKey: "partNumber",
      header: "Part No.",
      enableSorting: false,
      cell: ({ row }) => displayText(row.original.partNumber),
    },
    {
      accessorKey: "partName",
      header: "Part Name",
      enableSorting: false,
      cell: ({ row }) => displayText(row.original.partName),
    },
    {
      accessorKey: "totalQuantity",
      header: "Qty",
      meta: { className: "pr-30" },
      cell: ({ row }) => row.original.totalQuantity.toLocaleString(),
    },
  ];
}

/** Column factory for the Unique Parts dialog (Part No. aggregation). */
export function createUniquePartColumns(): ColumnDef<UniquePart>[] {
  return [
    indexColumn<UniquePart>(),
    {
      accessorKey: "partNumber",
      header: "Part No.",
      enableSorting: false,
      cell: ({ row }) => displayText(row.original.partNumber),
    },
    {
      accessorKey: "partName",
      header: "Part Name",
      enableSorting: false,
      cell: ({ row }) => displayText(row.original.partName),
    },
    {
      accessorKey: "totalQuantity",
      header: "Qty",
      cell: ({ row }) => row.original.totalQuantity.toLocaleString(),
    },
  ];
}
