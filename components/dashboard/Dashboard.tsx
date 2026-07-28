"use client";

import { useCallback, useState } from "react";
import { DatabaseBackup } from "lucide-react";
import { toast } from "sonner";

import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { Button } from "@/components/ui/button";
import { usePendingData } from "@/hooks/usePendingData";
import { exportSnapshot } from "@/lib/indexedDB";

function getBackupFileName(date: Date = new Date()): string {
  const isoDate = date.toISOString().slice(0, 10);
  return `pending-parts-backup_${isoDate}.json`;
}

function downloadJson(data: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function Dashboard() {
  const { lastUpdated, isHydrated } = usePendingData();
  const [isBackingUp, setIsBackingUp] = useState(false);

  const lastUpdatedText = !isHydrated
    ? "Loading…"
    : lastUpdated
      ? `Last updated ${new Date(lastUpdated).toLocaleString()}`
      : "No data yet";

  const handleBackup = useCallback(async () => {
    if (!isHydrated || isBackingUp) return;

    setIsBackingUp(true);
    try {
      const snapshot = await exportSnapshot();
      downloadJson(snapshot, getBackupFileName());
      toast.success(
        `Backup saved (${snapshot.pendingParts.length} pending rows, ${snapshot.files.length} files)`,
      );
    } catch (error) {
      toast.error("Could not save backup", {
        description:
          error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsBackingUp(false);
    }
  }, [isBackingUp, isHydrated]);

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
            disabled={!isHydrated || isBackingUp}
            onClick={() => void handleBackup()}
          >
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
