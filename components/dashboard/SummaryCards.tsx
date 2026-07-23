"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";

export function SummaryCards() {
  const pendingParts = useAppStore((state) => state.pendingParts);
  const files = useAppStore((state) => state.files);

  const totalPending = pendingParts.length;
  const totalQuantity = pendingParts.reduce((sum, part) => sum + part.quantity, 0);
  const uniqueParts = new Set(
    pendingParts.map((part) => part.partNumber ?? part.partName),
  ).size;
  const filesUploaded = files.length;

  const cards = [
    { label: "Total Pending", value: totalPending, description: "Pending rows" },
    { label: "Total Qty", value: totalQuantity, description: "Sum of affected qty" },
    { label: "Unique Parts", value: uniqueParts, description: "Distinct part numbers" },
    { label: "Files Uploaded", value: filesUploaded, description: "Active source files" },
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
