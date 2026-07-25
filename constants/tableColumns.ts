"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { PendingPart, RequiredPart, UniquePart } from "@/lib/types";
import { requiredModelLabel } from "@/lib/dataProcessor";
import { toShortDate } from "@/lib/utils";

const EMPTY_CELL = "—";

function displayText(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || EMPTY_CELL;
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
      cell: ({ row }) => toShortDate(row.original.date) ?? EMPTY_CELL,
    },
    {
      accessorKey: "batch",
      header: "Batch",
      cell: ({ row }) => displayText(row.original.batch),
    },
    {
      accessorKey: "partNumber",
      header: "Part No.",
      cell: ({ row }) => displayText(row.original.partNumber),
    },
    {
      accessorKey: "partName",
      header: "Part Name",
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
      cell: ({ row }) => requiredModelLabel(row.original.model),
    },
    {
      accessorKey: "partNumber",
      header: "Part No.",
      cell: ({ row }) => displayText(row.original.partNumber),
    },
    {
      accessorKey: "partName",
      header: "Part Name",
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
      cell: ({ row }) => requiredModelLabel(row.original.model),
    },
    {
      accessorKey: "partNumber",
      header: "Part No.",
      cell: ({ row }) => displayText(row.original.partNumber),
    },
    {
      accessorKey: "partName",
      header: "Part Name",
      cell: ({ row }) => displayText(row.original.partName),
    },
    {
      accessorKey: "totalQuantity",
      header: "Qty",
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
      cell: ({ row }) => displayText(row.original.partNumber),
    },
    {
      accessorKey: "partName",
      header: "Part Name",
      cell: ({ row }) => displayText(row.original.partName),
    },
    {
      accessorKey: "totalQuantity",
      header: "Qty",
      cell: ({ row }) => row.original.totalQuantity.toLocaleString(),
    },
  ];
}
