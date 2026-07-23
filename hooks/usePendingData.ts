"use client";

import { useEffect, useMemo } from "react";

import { aggregateRequired } from "@/lib/dataProcessor";
import { useAppStore } from "@/store/useAppStore";

export function usePendingData() {
  const store = useAppStore();
  const hydrate = store.hydrate;
  const pendingParts = useAppStore((state) => state.pendingParts);

  useEffect(() => {
    void hydrate().catch((error: unknown) => {
      console.error("Failed to hydrate pending-parts data:", error);
    });
  }, [hydrate]);

  const requiredParts = useMemo(
    () => aggregateRequired(pendingParts),
    [pendingParts],
  );

  return {
    ...store,
    pendingParts,
    requiredParts,
  };
}
