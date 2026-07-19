"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileSpreadsheet, Upload } from "lucide-react";

import { useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";

export function FileDropzone() {
  const uploadFiles = useFileUpload();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      void uploadFiles(acceptedFiles);
    },
    [uploadFiles],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      multiple: true,
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-excel": [".xls"],
      },
    });

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps({
          className: cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-card px-6 py-10 text-center transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
          ),
        })}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <>
            <FileSpreadsheet className="size-8 text-primary" />
            <p className="text-sm font-medium">Drop the Excel files here</p>
          </>
        ) : (
          <>
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag &amp; drop Excel files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Accepts .xlsx and .xls — multiple files supported
            </p>
          </>
        )}
      </div>
      {fileRejections.length > 0 && (
        <p className="text-xs text-destructive">
          {fileRejections.length} file(s) rejected — only .xlsx / .xls are
          accepted.
        </p>
      )}
    </div>
  );
}
