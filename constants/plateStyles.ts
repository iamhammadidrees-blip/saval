import { cn } from "@/lib/utils";

/** Stat plate face from Doc/ui-preview-silver.html (colors only — original type sizes) */
export const plateCardClass = cn(
  "relative overflow-hidden rounded-none border-[1.5px] border-[#7a828e] bg-card ring-0",
  "bg-linear-to-b from-[#fdfdfe] via-[#eceef1] to-[#e3e6ea]",
  "[clip-path:polygon(14px_0,100%_0,100%_100%,0_100%,0_14px)]",
  "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-white/95",
);

export const plateTagClass = "text-sm text-muted-foreground";

export const plateNumClass =
  "text-3xl font-semibold tabular-nums text-foreground";

export const plateSubClass = "text-xs text-muted-foreground";

/** Worksheet thead — brushed grey strip; original header type scale */
export const sheetHeaderClass = cn(
  "h-10 px-2 text-left align-middle text-sm font-medium text-foreground",
  "border-b border-[#c2c7ce]",
  "[background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.5)_0_1px,transparent_1px_3px),linear-gradient(180deg,#eef0f2,#e2e5e9)]",
  "bg-[#e6e9ed]",
);

/** Worksheet shell (.sheet) */
export const sheetClass = cn(
  "rounded-[10px] border border-[#c2c7ce] bg-white",
  "shadow-[0_1px_2px_rgba(35,39,46,0.06)]",
);

/** Worksheet toolbar (.bar) — original control height (~40px) */
export const sheetBarClass = cn(
  "flex min-h-10 flex-wrap items-center justify-between gap-2",
  "border-b border-[#c2c7ce] bg-white px-3 py-2",
);

/** Worksheet search — original Input scale */
export const sheetSearchClass = cn(
  "h-8 w-full max-w-sm rounded-lg border border-[#c2c7ce] bg-[#fbfcfd]",
  "px-2.5 text-sm text-foreground",
  "shadow-[inset_0_1px_3px_rgba(35,39,46,0.07)]",
);

/** Worksheet row count — original muted xs */
export const sheetRowsClass =
  "shrink-0 text-xs text-muted-foreground tabular-nums";

/** Sticky offset for thead when page-sticky bar sits above (~40px) */
export const SHEET_BAR_STICKY_TOP = "top-10";
