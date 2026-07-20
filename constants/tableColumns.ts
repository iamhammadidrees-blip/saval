"use client";

import { createElement } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import type { PendingPart, RequiredPart } from "@/lib/types";

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

function formatTimestamp(value: string | undefined): string {
  if (!value) return EMPTY_CELL;

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;

  return new Date(parsed).toLocaleString();
}

/** Column factory for the Pending Parts table. */
export function createPendingColumns(): ColumnDef<PendingPart>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => displayText(row.original.date),
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
    {
      accessorKey: "statusDate",
      header: "Status Date",
      cell: ({ row }) => displayText(row.original.statusDate),
    },
    {
      accessorKey: "handlingMethod",
      header: "Handling",
      cell: ({ row }) => displayText(row.original.handlingMethod),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: ({ row }) => displayText(row.original.remarks),
    },
    {
      accessorKey: "fileName",
      header: "Source File",
      cell: ({ row }) => displayText(row.original.fileName),
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
    {
      id: "filesInvolved",
      accessorFn: (row) => row.filesInvolved.join(", "),
      header: "Files Involved",
      cell: ({ row }) => {
        const files = row.original.filesInvolved;
        return files.length > 0 ? files.join(", ") : EMPTY_CELL;
      },
    },
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ row }) => formatTimestamp(row.original.lastUpdated),
    },
  ];
}
