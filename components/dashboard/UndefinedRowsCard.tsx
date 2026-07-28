"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { isMissingPartNumber } from "@/lib/dataProcessor";
import type { PendingPart } from "@/lib/types";

interface UndefinedRowsCardProps {
  pendingParts: PendingPart[];
}

export function UndefinedRowsCard({ pendingParts }: UndefinedRowsCardProps) {
  const undefinedIndices = useMemo(
    () =>
      pendingParts
        .map((part, index) => (isMissingPartNumber(part) ? index + 1 : null))
        .filter((index): index is number => index !== null),
    [pendingParts],
  );
  const undefinedCount = undefinedIndices.length;
  const hasUndefinedRows = undefinedCount > 0;

  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>Total Pending</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {pendingParts.length.toLocaleString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Pending rows</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-fit justify-between gap-2"
              disabled={!hasUndefinedRows}
            >
              Undefined Rows
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col gap-1 text-xs" align="start">
            <p className="text-muted-foreground">
              pending rows count ={" "}
              <span className="font-medium tabular-nums text-foreground">
                {undefinedCount.toLocaleString()}
              </span>
            </p>
            <p className="text-muted-foreground">
              row number{" "}
              <span className="font-medium tabular-nums text-foreground">
                {undefinedIndices.join(", ")}
              </span>
            </p>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}
