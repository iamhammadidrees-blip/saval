"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye, FileDown } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createUniquePartColumns } from "@/constants/tableColumns";
import { aggregateUniqueParts } from "@/lib/dataProcessor";
import { downloadUniqueParts } from "@/lib/exportUtils";
import type { PendingPart } from "@/lib/types";

interface UniquePartsCardProps {
  pendingParts: PendingPart[];
}

export function UniquePartsCard({ pendingParts }: UniquePartsCardProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const uniqueParts = useMemo(
    () => aggregateUniqueParts(pendingParts),
    [pendingParts],
  );
  const columns = useMemo(() => createUniquePartColumns(), []);
  const hasParts = uniqueParts.length > 0;

  const handleDownload = useCallback(async () => {
    if (!hasParts || isExporting) return;

    setIsExporting(true);
    try {
      await downloadUniqueParts(uniqueParts);
      toast.success("Unique parts downloaded");
    } catch (error) {
      toast.error("Could not download unique parts", {
        description:
          error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  }, [hasParts, isExporting, uniqueParts]);

  return (
    <>
      <Card size="sm">
        <CardHeader>
          <CardDescription>Unique Parts</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {uniqueParts.length.toLocaleString()}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Distinct part numbers
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasParts}
              onClick={() => setOpen(true)}
            >
              <Eye data-icon="inline-start" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasParts || isExporting}
              onClick={() => void handleDownload()}
            >
              <FileDown data-icon="inline-start" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Unique Parts</DialogTitle>
            <DialogDescription>
              Quantities summed by Part No. across all batches and models.
            </DialogDescription>
          </DialogHeader>
          <DataTable
            columns={columns}
            data={uniqueParts}
            emptyMessage="No unique parts"
            searchPlaceholder="Search by Part No.…"
            tableClassName="max-h-[min(60vh,28rem)] overflow-y-auto"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
