"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyMessage: string;
  searchPlaceholder?: string;
  /** Optional classes for the scrollable table area (e.g. max-height + overflow). */
  tableClassName?: string;
  /** Keep # / column headers visible while rows scroll. */
  stickyHeader?: boolean;
}

function SortIcon({
  sorted,
}: {
  sorted: false | "asc" | "desc";
}) {
  if (sorted === "asc") {
    return <ArrowUp className="size-3.5 shrink-0 opacity-70" />;
  }

  if (sorted === "desc") {
    return <ArrowDown className="size-3.5 shrink-0 opacity-70" />;
  }

  return <ArrowUpDown className="size-3.5 shrink-0 opacity-40" />;
}

/**
 * Shared TanStack Table wrapper used by Pending and Required tables.
 * Owns sorting, global search, and empty-state rendering.
 */
export function DataTable<TData>({
  columns,
  data,
  emptyMessage,
  searchPlaceholder = "Search…",
  tableClassName,
  stickyHeader = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").trim().toLowerCase();
      if (!query) return true;

      const partNumber = String(
        (row.original as { partNumber?: string }).partNumber ?? "",
      ).toLowerCase();
      return partNumber.includes(query);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Input
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-sm"
          aria-label="Search table"
        />
        <p className="text-xs text-muted-foreground tabular-nums">
          {rows.length.toLocaleString()} row{rows.length === 1 ? "" : "s"}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-xl border bg-card",
            stickyHeader ? "overflow-hidden" : tableClassName,
          )}
        >
          <Table
            containerClassName={stickyHeader ? tableClassName : undefined}
          >
            <TableHeader
              className={
                stickyHeader
                  ? "sticky top-0 z-10 bg-card [&_tr]:border-b"
                  : undefined
              }
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();

                    return (
                      <TableHead
                        key={header.id}
                        className={stickyHeader ? "bg-card" : undefined}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-foreground",
                              sorted && "text-foreground",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            <SortIcon sorted={sorted} />
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No matching rows.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
