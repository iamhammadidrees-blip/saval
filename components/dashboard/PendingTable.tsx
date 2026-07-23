"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/common/DataTable";
import { createPendingColumns } from "@/constants/tableColumns";
import { useAppStore } from "@/store/useAppStore";

export function PendingTable() {
  const pendingParts = useAppStore((state) => state.pendingParts);
  const columns = useMemo(() => createPendingColumns(), []);

  return (
    <DataTable
      columns={columns}
      data={pendingParts}
      emptyMessage="Upload File A to see pending parts"
      searchPlaceholder="Search by Part No.…"
    />
  );
}
