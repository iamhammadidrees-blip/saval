"use client";

import { useCallback, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { createPendingColumns } from "@/constants/tableColumns";
import { usePendingData } from "@/hooks/usePendingData";
import { downloadPendingParts } from "@/lib/exportUtils";

export function PendingTable() {
  const { pendingParts, isHydrated } = usePendingData();
  const columns = useMemo(() => createPendingColumns(), []);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPending = useCallback(async () => {
    if (pendingParts.length === 0 || isExporting) return;

    setIsExporting(true);
    try {
      await downloadPendingParts(pendingParts);
      toast.success("Pending parts downloaded");
    } catch (error) {
      toast.error("Could not download pending export", {
        description:
          error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, pendingParts]);

  return (
    <DataTable
      columns={columns}
      data={pendingParts}
      emptyMessage="Upload File A to see pending parts"
      searchPlaceholder="Search by Part No.…"
      pageStickyHeader
      toolbarActions={
        <Button
          variant="outline"
          size="sm"
          disabled={
            !isHydrated || pendingParts.length === 0 || isExporting
          }
          onClick={() => void handleDownloadPending()}
        >
          <FileDown data-icon="inline-start" />
          Download Pending
        </Button>
      }
    />
  );
}
