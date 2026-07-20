"use client";

import { createElement } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import type { PendingPart, RequiredPart } from "@/lib/types";
import { toShortDate } from "@/lib/utils";

const EMPTY_CELL = "—";

function displayText(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || EMPTY_CELL;
}

function statusBadgeClass(color: string | undefined): string {
  switch ((color ?? "").toLowerCase()) {
    case "orange":
      return "border-transparent bg-[#FFC000] text-black";
    case "yellow":
      return "border-transparent bg-[#FFFF00] text-black";
    case "lightgreen":
      return "border-transparent bg-[#A9D08E] text-black";
    case "green":
      return "border-transparent bg-[#92D050] text-black";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

/** Column factory for the Pending Parts table. */
export function createPendingColumns(): ColumnDef<PendingPart>[] {
  return [
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
      cell: ({ row }) => {
        const { status, color } = row.original;

        return createElement(
          Badge,
          { className: statusBadgeClass(color) },
          displayText(status),
        );
      },
    },
  ];
}

/** Column factory for the Required Parts table. */
export function createRequiredColumns(): ColumnDef<RequiredPart>[] {
  return [
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
