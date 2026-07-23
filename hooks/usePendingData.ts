"use client";

import { useEffect } from "react";

import { useAppStore } from "@/store/useAppStore";

export function usePendingData() {
  const store = useAppStore();
  const hydrate = store.hydrate;

  useEffect(() => {
    void hydrate().catch((error: unknown) => {
      console.error("Failed to hydrate pending-parts data:", error);
    });
  }, [hydrate]);

  return store;
}
