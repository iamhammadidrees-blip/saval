"use client";

import { create } from "zustand";

import {
  clearAll as clearAllFromDB,
  deleteByFileName,
  getAllFiles,
  getAllPendingParts,
  importSnapshot,
  putFile,
  putPendingParts,
} from "@/lib/indexedDB";
import type { BackupSnapshot, PendingPart, UploadedFile } from "@/lib/types";
import { toShortDate } from "@/lib/utils";

interface AppState {
  files: UploadedFile[];
  pendingParts: PendingPart[];
  isLoading: boolean;
  isHydrated: boolean;
  lastUpdated: string | null;
  hydrate: () => Promise<void>;
  upsertFile: (file: UploadedFile, parts: PendingPart[]) => Promise<void>;
  removeFile: (fileName: string) => Promise<void>;
  clearAll: () => Promise<void>;
  restoreFromSnapshot: (snapshot: BackupSnapshot) => Promise<void>;
}

const initialState = {
  files: [],
  pendingParts: [],
  isLoading: false,
  isHydrated: false,
  lastUpdated: null,
} satisfies Pick<
  AppState,
  "files" | "pendingParts" | "isLoading" | "isHydrated" | "lastUpdated"
>;

export const useAppStore = create<AppState>()((set, get) => ({
  ...initialState,

  hydrate: async () => {
    if (get().isLoading || get().isHydrated) return;

    set({ isLoading: true });

    try {
      const [files, pendingParts] = await Promise.all([
        getAllFiles(),
        getAllPendingParts(),
      ]);

      set({
        files,
        pendingParts: pendingParts.map((part) => ({
          ...part,
          date: toShortDate(part.date),
        })),
        isLoading: false,
        isHydrated: true,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  upsertFile: async (file, parts) => {
    await deleteByFileName(file.fileName);
    await putFile(file);
    await putPendingParts(parts);

    set((state) => ({
      files: [
        ...state.files.filter(
          (existingFile) => existingFile.fileName !== file.fileName,
        ),
        file,
      ],
      pendingParts: [
        ...state.pendingParts.filter(
          (part) => part.fileName !== file.fileName,
        ),
        ...parts,
      ],
      lastUpdated: new Date().toISOString(),
    }));
  },

  removeFile: async (fileName) => {
    await deleteByFileName(fileName);

    set((state) => ({
      files: state.files.filter((file) => file.fileName !== fileName),
      pendingParts: state.pendingParts.filter(
        (part) => part.fileName !== fileName,
      ),
      lastUpdated: new Date().toISOString(),
    }));
  },

  clearAll: async () => {
    await clearAllFromDB();
    set({
      files: [],
      pendingParts: [],
      isLoading: false,
      lastUpdated: null,
    });
  },

  restoreFromSnapshot: async (snapshot) => {
    await importSnapshot(snapshot);

    set({
      files: snapshot.files,
      pendingParts: snapshot.pendingParts.map((part) => ({
        ...part,
        date: toShortDate(part.date),
      })),
      isLoading: false,
      isHydrated: true,
      lastUpdated: new Date().toISOString(),
    });
  },
}));
