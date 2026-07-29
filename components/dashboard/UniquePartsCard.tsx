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
import {
  plateCardClass,
  plateMetricRowClass,
  plateNumClass,
  plateSubClass,
  plateTagClass,
} from "@/constants/plateStyles";
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
      <Card size="sm" className={plateCardClass}>
        <CardHeader>
          <CardDescription className={plateTagClass}>Unique Parts</CardDescription>
          <div className={plateMetricRowClass}>
            <CardTitle className={plateNumClass}>
              {uniqueParts.length.toLocaleString()}
            </CardTitle>
            <span className={plateSubClass}>Distinct part numbers</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasParts}
              onClick={() => setOpen(true)}
              className="border-[#c2c7ce] bg-white/80"
            >
              <Eye data-icon="inline-start" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasParts || isExporting}
              onClick={() => void handleDownload()}
              className="border-[#c2c7ce] bg-white/80"
            >
              <FileDown data-icon="inline-start" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[80vh] w-[60vw] max-w-[60vw] flex-col gap-4 overflow-hidden sm:max-w-[60vw]">
          <DialogHeader className="shrink-0">
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
            className="min-h-0 flex-1"
            tableClassName="h-full overflow-y-auto"
            stickyHeader
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
