"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import {
  filterPending,
  toPendingParts,
} from "@/lib/dataProcessor";
import { parseFileA } from "@/lib/excelParser";
import type { UploadedFile } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown upload error.";
}

/**
 * Runs the Phase 2 File A upload pipeline.
 * Files are handled sequentially so each replacement finishes atomically
 * before the next file begins.
 */
export function useFileUpload() {
  const upsertFile = useAppStore((state) => state.upsertFile);

  return useCallback(
    async (files: File[]): Promise<void> => {
      for (const file of files) {
        try {
          const wasReplacement = useAppStore
            .getState()
            .files.some(
              (existingFile) =>
                existingFile.fileName === file.name,
            );

          const buffer = await file.arrayBuffer();
          const parsed = await parseFileA(buffer, file.name);
          const pendingRows = filterPending(parsed.rows);
          const pendingParts = toPendingParts(
            pendingRows,
            file.name,
          );
          const uploadedFile: UploadedFile = {
            fileName: file.name,
            uploadedAt: new Date().toISOString(),
            rowCount: pendingParts.length,
            status: "active",
          };

          await upsertFile(uploadedFile, pendingParts);

          toast.success(
            `${file.name}: ${parsed.totalRows} rows → ${pendingParts.length} pending${
              wasReplacement ? " (replaced previous)" : ""
            }`,
            parsed.errors.length > 0
              ? {
                  description: `${parsed.errors.length} parser warning(s).`,
                }
              : undefined,
          );
        } catch (error) {
          toast.error(`${file.name}: upload failed`, {
            description: errorMessage(error),
          });
        }
      }
    },
    [upsertFile],
  );
}
