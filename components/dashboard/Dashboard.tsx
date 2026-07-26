"use client";

import { DatabaseBackup } from "lucide-react";

import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { Button } from "@/components/ui/button";
import { usePendingData } from "@/hooks/usePendingData";

export function Dashboard() {
  const { lastUpdated, isHydrated } = usePendingData();

  const lastUpdatedText = !isHydrated
    ? "Loading…"
    : lastUpdated
      ? `Last updated ${new Date(lastUpdated).toLocaleString()}`
      : "No data yet";

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
