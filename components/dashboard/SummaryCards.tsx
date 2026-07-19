"use client";

import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { aggregateRequired } from "@/lib/dataProcessor";
import { useAppStore } from "@/store/useAppStore";

export function SummaryCards() {
  const pendingParts = useAppStore((state) => state.pendingParts);
  const files = useAppStore((state) => state.files);

  const { totalPending, totalQuantity, uniqueParts } = useMemo(
    () => ({
      totalPending: pendingParts.length,
      totalQuantity: pendingParts.reduce(
        (sum, part) => sum + part.quantity,
        0,
      ),
      uniqueParts: aggregateRequired(pendingParts).length,
    }),
    [pendingParts],
  );
  const filesUploaded = files.length;

  const cards = [
    {
      label: "Total Pending",
      value: totalPending,
      description: "Pending rows",
    },
    {
      label: "Total Qty",
      value: totalQuantity,
      description: "Sum of affected qty",
    },
    {
      label: "Unique Parts",
      value: uniqueParts,
      description: "Normalized required groups",
    },
    {
      label: "Files Uploaded",
      value: filesUploaded,
      description: "Active source files",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {card.value.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {card.description}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
