"use client";

import { useMemo } from "react";

import { UndefinedRowsCard } from "@/components/dashboard/UndefinedRowsCard";
import { UniquePartsCard } from "@/components/dashboard/UniquePartsCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  plateCardClass,
  plateNumClass,
  plateSubClass,
  plateTagClass,
} from "@/constants/plateStyles";
import { useAppStore } from "@/store/useAppStore";

export function SummaryCards() {
  const pendingParts = useAppStore((state) => state.pendingParts);
  const files = useAppStore((state) => state.files);

  const totalQuantity = useMemo(
    () =>
      pendingParts.reduce((sum, part) => sum + part.quantity, 0),
    [pendingParts],
  );

  return (
    <div className="grid grid-cols-4 gap-3.5">
      <UndefinedRowsCard pendingParts={pendingParts} />

      <Card size="sm" className={plateCardClass}>
        <CardHeader>
          <CardDescription className={plateTagClass}>Total Qty</CardDescription>
          <CardTitle className={plateNumClass}>
            {totalQuantity.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent className={plateSubClass}>
          Sum of affected qty
        </CardContent>
      </Card>

      <UniquePartsCard pendingParts={pendingParts} />

      <Card size="sm" className={plateCardClass}>
        <CardHeader>
          <CardDescription className={plateTagClass}>
            Files Uploaded
          </CardDescription>
          <CardTitle className={plateNumClass}>
            {files.length.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent className={plateSubClass}>
          Active source files
        </CardContent>
      </Card>
    </div>
  );
}
