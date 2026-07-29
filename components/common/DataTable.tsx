"use client";

import { useState, type ReactNode } from "react";
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
import {
  SHEET_BAR_STICKY_TOP,
  sheetBarClass,
  sheetClass,
  sheetRowsClass,
  sheetSearchClass,
} from "@/constants/plateStyles";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyMessage: string;
  searchPlaceholder?: string;
  /** Optional classes for the outer wrapper. */
  className?: string;
  /** Optional classes for the scrollable table area (e.g. max-height + overflow). */
  tableClassName?: string;
  /** Keep headers visible while scrolling inside the table container. */
  stickyHeader?: boolean;
  /** Keep bar + headers fixed at the top of the page while the document scrolls. */
  pageStickyHeader?: boolean;
  /** Extra controls on the search bar row (right side, before row count). */
  toolbarActions?: ReactNode;
}

function columnClassName<TData>(
  columnDef: ColumnDef<TData, unknown>,
): string | undefined {
  return (columnDef.meta as { className?: string } | undefined)?.className;
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
 * Shared TanStack Table wrapper.
 * Sheet chrome: white `.bar` over brushed thead. Sticky modes:
 * - stickyHeader: bar stays outside scroll; thead sticks at top of scroll box
 * - pageStickyHeader: bar sticks at top-0; thead sticks under bar (top-10)
 */
export function DataTable<TData>({
  columns,
  data,
  emptyMessage,
  searchPlaceholder = "Search…",
  className,
  tableClassName,
  stickyHeader = false,
  pageStickyHeader = false,
  toolbarActions,
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
  const rowLabel = `${rows.length.toLocaleString()} row${rows.length === 1 ? "" : "s"}`;

  return (
    <div
      className={cn(
        sheetClass,
        "flex min-h-0 flex-col",
        stickyHeader && "flex-1 overflow-hidden",
        className,
      )}
    >
      {/* White bar over header — sticks with page scroll when pageStickyHeader */}
      <div
        className={cn(
          sheetBarClass,
          "shrink-0",
          pageStickyHeader && "sticky top-0 z-20",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            className={sheetSearchClass}
            aria-label="Search table"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {toolbarActions}
          <span className={sheetRowsClass}>{rowLabel}</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex min-h-64 flex-1 items-center justify-center p-8 text-center">
          <p className="text-sm text-[#5c6370]">{emptyMessage}</p>
        </div>
      ) : (
        <div
          className={cn(
            "min-h-0",
            stickyHeader && "flex-1 overflow-hidden",
            !stickyHeader && tableClassName,
          )}
        >
          <Table
            containerClassName={
              stickyHeader
                ? cn("h-full max-h-full overflow-y-auto", tableClassName)
                : pageStickyHeader
                  ? "overflow-x-clip"
                  : undefined
            }
          >
            <TableHeader
              className={cn(
                stickyHeader && "sticky top-0 z-10",
                pageStickyHeader &&
                  cn("sticky z-10", SHEET_BAR_STICKY_TOP),
                (stickyHeader || pageStickyHeader) &&
                  "[&_tr]:border-b [&_tr]:border-[#c2c7ce]",
              )}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();

                    return (
                      <TableHead
                        key={header.id}
                        className={columnClassName(header.column.columnDef)}
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
                  <TableRow
                    key={row.id}
                    className="border-[#edeff2] hover:bg-[#f6f7f9]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={columnClassName(cell.column.columnDef)}
                      >
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
                    className="h-32 text-center text-[#5c6370]"
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
