"use client";

import { useDropzone } from "react-dropzone";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";

import { useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";

export function FileDropzone() {
  const { onDrop, isParsing } = useFileUpload();

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      multiple: true,
      disabled: isParsing,
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-excel": [".xls"],
      },
    });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      <div
        {...getRootProps({
          className: cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
            "bg-[radial-gradient(120%_90%_at_50%_20%,#ffffff_0%,#f1f2f4_45%,#D5D9DE_100%)]",
            isParsing
              ? "cursor-wait border-primary/40 opacity-80"
              : "cursor-pointer",
            !isParsing && isDragActive
              ? "border-primary"
              : !isParsing && "border-border hover:border-primary/50",
          ),
        })}
      >
        <input {...getInputProps()} />
        {isParsing ? (
          <>
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Parsing Excel file(s)…</p>
            <p className="text-xs text-muted-foreground">
              Filtering pending rows and updating the dashboard
            </p>
          </>
        ) : isDragActive ? (
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
