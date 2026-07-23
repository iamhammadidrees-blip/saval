"use client";

import { useCallback, useState } from "react";
import { DatabaseBackup, FileDown } from "lucide-react";
import { toast } from "sonner";

import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { Button } from "@/components/ui/button";
import { usePendingData } from "@/hooks/usePendingData";
import {
  downloadPendingParts,
  downloadRequiredPartsFileB,
} from "@/lib/exportUtils";

export function Dashboard() {
  const {
    lastUpdated,
    isHydrated,
    pendingParts,
    requiredParts,
  } = usePendingData();
  const [isExporting, setIsExporting] = useState(false);

  const lastUpdatedText = !isHydrated
    ? "Loading…"
    : lastUpdated
      ? `Last updated ${new Date(lastUpdated).toLocaleString()}`
      : "No data yet";

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-8 py-8">
      <header className="flex items-center justify-between gap-4 border-b pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Pending Parts Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">{lastUpdatedText}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            disabled={
              !isHydrated ||
              requiredParts.length === 0 ||
              isExporting
            }
            onClick={() => void handleDownloadFileB()}
          >
            <FileDown data-icon="inline-start" />
            Download File B
          </Button>
          <Button
            variant="outline"
            disabled={
              !isHydrated ||
              pendingParts.length === 0 ||
              isExporting
            }
            onClick={() => void handleDownloadPending()}
          >
            <FileDown data-icon="inline-start" />
            Download Pending
          </Button>
          <Button variant="outline" disabled>
            <DatabaseBackup data-icon="inline-start" />
            Backup
          </Button>
        </div>
      </header>

      <SummaryCards />
      <FileDropzone />
      <DashboardTabs />
    </div>
  );
}
