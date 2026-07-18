"use client";

import { create } from "zustand";

import {
  clearAll as clearAllFromDB,
  deleteByFileName,
  getAllFiles,
  getAllPendingParts,
  putFile,
  putPendingParts,
} from "@/lib/indexedDB";
import type { PendingPart, UploadedFile } from "@/lib/types";

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
        pendingParts,
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
}));
