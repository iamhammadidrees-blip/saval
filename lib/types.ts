export interface UploadedFile {
  fileName: string;
  uploadedAt: string;
  rowCount: number;
  status: "active" | "archived";
}

export interface PendingPart {
  id: string;
  fileName: string;
  partName: string;
  partNumber?: string;
  batch?: string;
  date?: string;
  quantity: number;
  status: string;
  /** e.g. "orange" | "yellow" | "lightgreen" | ... */
  color?: string;
  processedAt: string;
}

/** Computed only — not stored in IndexedDB. */
export interface RequiredPart {
  id: string;
  partName: string;
  partNumber?: string;
  /** First 3 letters of batch (e.g. ALW6001 → ALW). */
  model?: string;
  totalQuantity: number;
  countInPending: number;
}

/** Computed only — grouped by Part No. across all batches/models. */
export interface UniquePart {
  id: string;
  partNumber: string;
  partName: string;
  totalQuantity: number;
}

export interface BackupSnapshot {
  version: 1;
  exportedAt: string;
  files: UploadedFile[];
  pendingParts: PendingPart[];
}
