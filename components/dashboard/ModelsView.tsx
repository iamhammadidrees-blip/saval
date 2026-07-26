"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { createModelColumns } from "@/constants/tableColumns";
import { usePendingData } from "@/hooks/usePendingData";
import {
  filterRequiredByModel,
  listRequiredModels,
} from "@/lib/dataProcessor";
import {
  downloadModelParts,
  downloadPendingParts,
  downloadRequiredPartsFileB,
} from "@/lib/exportUtils";
import { cn } from "@/lib/utils";

export function ModelsView() {
  const {
    requiredParts,
    pendingParts,
    isHydrated,
  } = usePendingData();
  const columns = useMemo(() => createModelColumns(), []);
  const models = useMemo(
    () => listRequiredModels(requiredParts),
    [requiredParts],
  );

  const [selectedModel, setSelectedModel] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (models.length === 0) {
      setSelectedModel("");
      return;
    }

    if (!models.includes(selectedModel)) {
      setSelectedModel(models[0] ?? "");
    }
  }, [models, selectedModel]);

  const filteredParts = useMemo(
    () =>
      selectedModel
        ? filterRequiredByModel(requiredParts, selectedModel)
        : [],
    [requiredParts, selectedModel],
  );

  const handleDownloadModel = useCallback(async () => {
    if (!selectedModel || filteredParts.length === 0 || isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      await downloadModelParts(filteredParts, selectedModel);
      toast.success(`${selectedModel} parts downloaded`);
    } catch (error) {
      toast.error(`Could not download ${selectedModel}`, {
        description:
          error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredParts, isExporting, selectedModel]);

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

  const emptyMessage =
    requiredParts.length === 0
      ? "Upload File A to see models"
      : "No parts for this model";

  const exportToolbar = (
    <div className="flex flex-wrap items-center gap-2">
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
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Model</span>
          <select
            value={selectedModel}
            onChange={(event) => setSelectedModel(event.target.value)}
            disabled={!isHydrated || models.length === 0}
            className={cn(
              "h-8 min-w-40 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label="Select model"
          >
            {models.length === 0 ? (
              <option value="">No models</option>
            ) : (
              models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))
            )}
          </select>
        </label>

        <Button
          variant="outline"
          disabled={
            !isHydrated ||
            !selectedModel ||
            filteredParts.length === 0 ||
            isExporting
          }
          onClick={() => void handleDownloadModel()}
        >
          <FileDown data-icon="inline-start" />
          {selectedModel
            ? `Download ${selectedModel}`
            : "Download model"}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredParts}
        emptyMessage={emptyMessage}
        searchPlaceholder="Search by Part No.…"
        pageStickyHeader
        toolbarActions={exportToolbar}
      />
    </div>
  );
}
