"use client";

import { useCallback, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { createRequiredColumns } from "@/constants/tableColumns";
import { usePendingData } from "@/hooks/usePendingData";
import { downloadRequiredPartsFileB } from "@/lib/exportUtils";

export function RequiredTable() {
  const { requiredParts, isHydrated } = usePendingData();
  const columns = useMemo(() => createRequiredColumns(), []);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadFileB = useCallback(async () => {
    if (requiredParts.length === 0 || isExporting) return;

    setIsExporting(true);
    try {
      await downloadRequiredPartsFileB(requiredParts);
      toast.success("File B downloaded");
    } catch (error) {
      toast.error("Could not download File B", {
        description:
          error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, requiredParts]);

  return (
    <DataTable
      columns={columns}
      data={requiredParts}
      emptyMessage="No required parts yet"
      searchPlaceholder="Search by Part No.…"
      pageStickyHeader
      toolbarActions={
        <Button
          variant="outline"
          size="sm"
          disabled={
            !isHydrated || requiredParts.length === 0 || isExporting
          }
          onClick={() => void handleDownloadFileB()}
        >
          <FileDown data-icon="inline-start" />
          Download File B
        </Button>
      }
    />
  );
}
