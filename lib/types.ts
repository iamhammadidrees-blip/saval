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
  totalQuantity: number;
  countInPending: number;
}

export interface BackupSnapshot {
  version: 1;
  exportedAt: string;
  files: UploadedFile[];
  pendingParts: PendingPart[];
}
