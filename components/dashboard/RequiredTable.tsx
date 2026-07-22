"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/common/DataTable";
import { createRequiredColumns } from "@/constants/tableColumns";
import { usePendingData } from "@/hooks/usePendingData";

export function RequiredTable() {
  const { requiredParts } = usePendingData();
  const columns = useMemo(() => createRequiredColumns(), []);

  return (
    <DataTable
      columns={columns}
      data={requiredParts}
      emptyMessage="No required parts yet"
      searchPlaceholder="Search by Part No.…"
    />
  );
}
