"use client";

import { PackageSearch } from "lucide-react";

export function PendingTable() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card p-8 text-center">
      <PackageSearch className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">No pending parts yet</p>
      <p className="text-sm text-muted-foreground">
        Upload File A to see pending parts
      </p>
    </div>
  );
}
