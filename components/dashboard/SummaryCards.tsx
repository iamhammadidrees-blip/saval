"use client";

import { useMemo } from "react";

import { UniquePartsCard } from "@/components/dashboard/UniquePartsCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";

export function SummaryCards() {
  const pendingParts = useAppStore((state) => state.pendingParts);
  const files = useAppStore((state) => state.files);

  const { totalPending, totalQuantity } = useMemo(
    () => ({
      totalPending: pendingParts.length,
      totalQuantity: pendingParts.reduce(
        (sum, part) => sum + part.quantity,
        0,
      ),
    }),
    [pendingParts],
  );

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card size="sm">
        <CardHeader>
          <CardDescription>Total Pending</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {totalPending.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Pending rows
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardDescription>Total Qty</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {totalQuantity.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Sum of affected qty
        </CardContent>
      </Card>

      <UniquePartsCard pendingParts={pendingParts} />

      <Card size="sm">
        <CardHeader>
          <CardDescription>Files Uploaded</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {files.length.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Active source files
        </CardContent>
      </Card>
    </div>
  );
}
