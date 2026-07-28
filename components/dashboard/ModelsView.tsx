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
} from "@/lib/exportUtils";
import { cn } from "@/lib/utils";

export function ModelsView() {
  const {
    requiredParts,
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

  const emptyMessage =
    requiredParts.length === 0
      ? "Upload File A to see models"
      : "No parts for this model";

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
      />
    </div>
  );
}
