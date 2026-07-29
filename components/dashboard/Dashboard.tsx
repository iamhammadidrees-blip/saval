"use client";

import { useCallback, useRef, useState } from "react";
import { DatabaseBackup, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePendingData } from "@/hooks/usePendingData";
import { exportSnapshot } from "@/lib/indexedDB";
import type { BackupSnapshot } from "@/lib/types";

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

function parseBackupSnapshot(raw: unknown): BackupSnapshot {
  if (
    !raw ||
    typeof raw !== "object" ||
    (raw as BackupSnapshot).version !== 1 ||
    !Array.isArray((raw as BackupSnapshot).files) ||
    !Array.isArray((raw as BackupSnapshot).pendingParts)
  ) {
    throw new Error(
      "Invalid backup file. Expected version 1 with files and pendingParts.",
    );
  }

  return raw as BackupSnapshot;
}

export function Dashboard() {
  const { isHydrated, restoreFromSnapshot, clearAll } = usePendingData();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const busy = isBackingUp || isRestoring || isClearing;

  const handleBackup = useCallback(async () => {
    if (!isHydrated || busy) return;

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
  }, [busy, isHydrated]);

  const handleRestoreClick = useCallback(() => {
    if (!isHydrated || busy) return;
    restoreInputRef.current?.click();
  }, [busy, isHydrated]);

  const handleRestoreFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || busy) return;

      const confirmed = window.confirm(
        "This will replace all current data. Continue?",
      );
      if (!confirmed) return;

      setIsRestoring(true);
      try {
        const text = await file.text();
        const snapshot = parseBackupSnapshot(JSON.parse(text) as unknown);
        await restoreFromSnapshot(snapshot);
        toast.success(
          `Restored (${snapshot.pendingParts.length} pending rows, ${snapshot.files.length} files)`,
        );
      } catch (error) {
        toast.error("Could not restore backup", {
          description:
            error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsRestoring(false);
      }
    },
    [busy, restoreFromSnapshot],
  );

  const handleClearAllClick = useCallback(() => {
    if (!isHydrated || busy) return;
    setClearDialogOpen(true);
  }, [busy, isHydrated]);

  const handleClearAllConfirm = useCallback(async () => {
    if (!isHydrated || busy) return;

    setIsClearing(true);
    try {
      await clearAll();
      setClearDialogOpen(false);
      toast.success("All data cleared");
    } catch (error) {
      toast.error("Could not clear data", {
        description:
          error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsClearing(false);
    }
  }, [busy, clearAll, isHydrated]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-8 py-8">
      <header className="flex items-center justify-between gap-4 border-b pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Hold-Parts-Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            | Pending filters | Merged Numbers | Models call | Unique counts | qty |
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            disabled={!isHydrated || busy}
            onClick={() => void handleBackup()}
          >
            <DatabaseBackup data-icon="inline-start" />
            Backup
          </Button>
          <Button
            variant="outline"
            disabled={!isHydrated || busy}
            onClick={handleRestoreClick}
          >
            <Upload data-icon="inline-start" />
            Restore
          </Button>
          <Button
            variant="destructive"
            disabled={!isHydrated || busy}
            onClick={handleClearAllClick}
          >
            <Trash2 data-icon="inline-start" />
            Clear All
          </Button>
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-hidden
            tabIndex={-1}
            onChange={(event) => void handleRestoreFile(event)}
          />
        </div>
      </header>

      <Dialog
        open={clearDialogOpen}
        onOpenChange={(open) => {
          if (isClearing) return;
          setClearDialogOpen(open);
        }}
      >
        <DialogContent showCloseButton={!isClearing} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all data?</DialogTitle>
            <DialogDescription>
              Delete all uploaded files and pending parts? This cannot be
              undone. Use Backup first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isClearing}
              onClick={() => setClearDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isClearing}
              onClick={() => void handleClearAllConfirm()}
            >
              {isClearing ? "Clearing…" : "Clear All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SummaryCards />
      <FileDropzone />
      <DashboardTabs />
    </div>
  );
}
