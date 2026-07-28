"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

/**
 * Temporary Files Uploaded panel (Phase 3 will polish this into UploadedFilesList).
 * Lets you delete any uploaded source file and its pending parts.
 */
export function UploadedFilesList() {
  const files = useAppStore((state) => state.files);
  const removeFile = useAppStore((state) => state.removeFile);
  const [deletingFileName, setDeletingFileName] = useState<string | null>(
    null,
  );

  async function handleDelete(fileName: string) {
    const confirmed = window.confirm(
      `Remove ${fileName} and all its pending parts?`,
    );
    if (!confirmed) return;

    setDeletingFileName(fileName);
    try {
      await removeFile(fileName);
      toast.success(`Removed ${fileName}`);
    } catch (error) {
      toast.error(`Could not remove ${fileName}`, {
        description:
          error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setDeletingFileName(null);
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="px-3 py-2 text-center font-medium">File name</th>
            <th className="px-3 py-2 font-medium">Uploaded at</th>
            <th className="px-3 py-2 font-medium">Pending rows</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.fileName} className="border-b last:border-b-0">
              <td className="px-3 py-2 text-center font-medium">{file.fileName}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {new Date(file.uploadedAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 tabular-nums">{file.rowCount}</td>
              <td className="px-3 py-2">
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingFileName === file.fileName}
                  onClick={() => void handleDelete(file.fileName)}
                >
                  <Trash2 data-icon="inline-start" />
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
