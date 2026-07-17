Pending Parts Dashboard v2.0 — Build Plan

Context


Building inside the existing saval repo: fresh Next.js 16.2 + React 19 + Tailwind v4 starter (App Router, pnpm). Newer than the Next 14 in PLAN 3.1 but fully compatible with everything planned. Dependencies are not installed yet (pnpm install first, then read the bundled Next docs in node_modules/next/dist/docs/ per AGENTS.md before writing code).



Delivery: Vercel (primary). No static-export/Start.bat work needed; the app remains 100% client-side (no API routes, no server data), so Vercel is just static hosting + free HTTPS.

File A format (confirmed from client screenshot)

The sheet is a Non-Conformance Record (e.g., "TANK 500 Non-Conformance Record Apr - 26"):



Row 1 is a merged title row; the real header row is below it (parser must skip title rows and find the row containing "Part No." / "Part Name").



Columns: Sr. No., Date, Batch, Claim Ref No., Part No., Part Name, Per Unit Qty, Affected Qty, Proposed Purchase Qty, Discovery Location, Malfunctioning, Resp. Dept., Part Photo, Detail Photo, Remarks, one or more dated Status columns (e.g., "1-Apr-26", "30-Apr-26" under a "Status as of" group header), Handling Method.



Status columns are dynamic: there can be N dated status columns; the right-most one is the latest status and is the one that decides pending.



Embedded part photos exist; the parser ignores images.

Confirmed parsing rules:





Pending rule: a row is pending when its LATEST status is orange / unresolved — statuses like "Under Observation", "Need to Order", "Need to Order Sub-Assy Part" (orange fill). Green statuses ("Issued from Inventory", PK-xxxx claim references) mean resolved and are excluded. Detection uses fill color first, keyword list as fallback (both configurable in constants/parserConfig.ts).



Quantity: aggregate Affected Qty for Required Parts / File B.



Field mapping: partNumber = Part No., partName = Part Name, batch = Batch, date = Date, quantity = Affected Qty, status = latest status text, color = latest status cell fill. Remarks and Handling Method are also captured for display.

Key stack corrections (expert notes)





ExcelJS instead of SheetJS for parsing: free SheetJS CE cannot read cell fill colors (Pro-only). ExcelJS reads fills reliably and also writes styled Excel, so it covers both File A parsing (color detection) and File B export with one library.



Everything else stays per PLAN 3.1: TanStack Table v8, Zustand, idb, react-dropzone, shadcn/ui (Tailwind v4 compatible via current shadcn CLI).

Architecture / Data flow

flowchart LR
    Dropzone[FileDropzone] --> Parser[excelParser: ExcelJS + color detect]
    Parser --> Processor[dataProcessor: filter pending + replace-by-fileName]
    Processor --> DB[(IndexedDB via idb)]
    DB --> Store[Zustand store]
    Store --> Agg[aggregateRequired computed]
    Store --> PendingTab[PendingTable]
    Agg --> RequiredTab[RequiredTable + SummaryCards]
    Agg --> Export[exportUtils: File B via ExcelJS]





IndexedDB stores two object stores: uploadedFiles (keyed by fileName) and pendingParts (keyed by id, indexed by fileName for fast replace/delete).



RequiredPart[] is never stored — computed via a memoized selector grouping by normalized partNumber ?? partName.



Data models per PLAN 3.1 (UploadedFile, PendingPart, RequiredPart) in lib/types.ts, with PendingPart extended for the confirmed File A columns: remarks, handlingMethod, and statusDate (the date of the latest status column).

Folder structure

Per PLAN 3.1, adapted to this repo (paths relative to repo root): app/page.tsx (dashboard), components/{dashboard,upload,common,ui}/, lib/{types,excelParser,dataProcessor,indexedDB,exportUtils}.ts, store/useAppStore.ts, hooks/{useFileUpload,usePendingData}.ts, constants/{tableColumns,parserConfig}.ts. The extra constants/parserConfig.ts holds header aliases, pending keywords, and color hex mappings so sample-file calibration touches one file.

_______________________________________________________________________________________________________

Phases

Phase 1 — Foundation (step-by-step)

Goal: runnable dashboard shell with types, IndexedDB, Zustand hydration, and UI scaffolding. No Excel parsing yet — dropzone only accepts files and logs them; tables show empty/placeholder state.

flowchart TD
    S1[1.1 Install deps] --> S2[1.2 Read Next 16 docs]
    S2 --> S3[1.3 Init shadcn/ui]
    S3 --> S4[1.4 Folder skeleton]
    S4 --> S5[1.5 types.ts]
    S5 --> S6[1.6 indexedDB.ts]
    S6 --> S7[1.7 Zustand store]
    S7 --> S8[1.8 Dashboard shell UI]
    S8 --> S9[1.9 Smoke verify]

Step 1.1 — Install dependencies


Run pnpm install (base Next 16 / React 19 / Tailwind v4).

Add app deps:

   pnpm add exceljs @tanstack/react-table zustand idb react-dropzone nanoid
   

Add types if needed: pnpm add -D @types/node already present; ExcelJS ships its own types.

Confirm pnpm dev still boots the starter page.

Step 1.2 — Read Next 16 bundled docs



Open node_modules/next/dist/docs/ (per AGENTS.md).



Skim only what Phase 1 needs:





App Router + "use client" boundaries (dashboard is client-heavy).



Any notes on fonts / metadata / layout for App Router.



Confirm no server features are required (no API routes for this app).



Decision locked: all data logic runs in client components; page.tsx can be a thin server shell that renders a client <Dashboard />.

Step 1.3 — Init shadcn/ui





Init shadcn for Tailwind v4 in this repo (npx shadcn@latest init — follow prompts; use existing globals.css).



Add components used in Phase 1 + later polish:

   npx shadcn@latest add button card tabs table dialog sonner badge input
   






Wire <Toaster /> (sonner) into app/layout.tsx.



Update metadata title/description to "Pending Parts Dashboard".

Step 1.4 — Create folder skeleton

Create empty modules (or with export {} stubs) so imports resolve:

lib/
  types.ts
  indexedDB.ts
  utils.ts          # cn() helper if shadcn didn't already add it
store/
  useAppStore.ts
hooks/
  usePendingData.ts # hydrate helper; thin wrapper for now
constants/
  parserConfig.ts   # stub only — filled in Phase 2
  tableColumns.ts   # stub only — filled in Phase 2
components/
  dashboard/
    SummaryCards.tsx
    DashboardTabs.tsx
    PendingTable.tsx   # placeholder empty table
    RequiredTable.tsx  # placeholder empty table
  upload/
    FileDropzone.tsx
  common/              # reserved for Phase 2 DataTable / ExportButtons

Step 1.5 — lib/types.ts

Define (no logic):

interface UploadedFile {
  fileName: string;
  uploadedAt: string;
  rowCount: number;
  status: "active" | "archived";
}

interface PendingPart {
  id: string;
  fileName: string;
  partName: string;
  partNumber?: string;
  batch?: string;
  date?: string;
  quantity: number;
  status: string;
  color?: string;           // "orange" | "yellow" | "lightgreen" | ...
  statusDate?: string;      // header text of latest status column
  remarks?: string;
  handlingMethod?: string;
  processedAt: string;
}

interface RequiredPart {
  id: string;
  partName: string;
  partNumber?: string;
  totalQuantity: number;
  countInPending: number;
  filesInvolved: string[];
  lastUpdated: string;
}

interface BackupSnapshot {
  version: 1;
  exportedAt: string;
  files: UploadedFile[];
  pendingParts: PendingPart[];
}

RequiredPart is typed here but not stored in IndexedDB.

Step 1.6 — lib/indexedDB.ts

Use idb library. DB name e.g. pending-parts-db, version 1.







Object store



keyPath



Indexes





uploadedFiles



fileName



—





pendingParts



id



byFileName on fileName

API to implement:





openDB() — create stores + index on upgrade



getAllFiles() / getAllPendingParts()



putFile(file) / putPendingParts(parts[]) (bulk)



deleteByFileName(fileName) — delete file record + all parts with that index



clearAll()



exportSnapshot(): BackupSnapshot / importSnapshot(snapshot) (validate version === 1)

All functions are browser-only; guard against SSR (typeof window === "undefined" → no-op / throw clear error).

Step 1.7 — Zustand store (store/useAppStore.ts)

State:





files: UploadedFile[]



pendingParts: PendingPart[]



isLoading: boolean



isHydrated: boolean



lastUpdated: string | null

Actions:





hydrate() — set loading → load both stores from IndexedDB → set state → isHydrated = true



upsertFile(file, parts) — stub for Phase 1: write to IDB then update state (real replace logic lands in Phase 2; for now just replace-by-fileName in memory+IDB so shell can be wired later)



removeFile(fileName) — call deleteByFileName, refresh state



clearAll() — wipe IDB + reset state

Wire: in a client Dashboard (or hooks/usePendingData.ts), useEffect(() => { hydrate() }, []) on mount.

Step 1.8 — Dashboard shell UI

Replace starter content in app/page.tsx with a client dashboard composition:



Header — app title "Pending Parts Dashboard", last-updated text (from store), placeholder action buttons (Export / Backup disabled or no-ops until Phase 2/3).



SummaryCards — four cards reading from store (will be 0 until Phase 2):


Total Pending rows



Total Qty (sum of quantity)



Unique Parts (distinct partNumber/partName)



Files Uploaded (files.length)



FileDropzone — react-dropzone, accept .xlsx,.xls, multiple files. Phase 1 behavior: on drop, toast "N file(s) received — parsing comes in Phase 2" (or console.log). Do not call ExcelJS yet.



DashboardTabs — shadcn Tabs with two panels:


Pending → PendingTable placeholder (empty state: "Upload File A to see pending parts")



Required → RequiredTable placeholder (same empty state)



Layout: single column on mobile, full-width content area, light professional industrial look (no purple/cream AI defaults). Keep it simple — polish visuals later.

Step 1.9 — Smoke verify (Phase 1 done checklist)


pnpm dev loads without errors



Empty IndexedDB hydrates; cards show zeros



Tabs switch Pending ↔ Required



Dropzone accepts Excel files and shows toast / console feedback



Refresh keeps empty state (no crash on hydrate)



Optional: manually call upsertFile from console / temp button with fake PendingPart[] → cards update and survive refresh → then remove temp button

Phase 1 exit criteria: foundation compiles, persists, and shows the shell. Parsing, aggregation, real tables, and File B export are Phase 2.


_______________________________________________________________________________________
Phase 2 — Core intelligence


lib/excelParser.ts: ExcelJS workbook read from ArrayBuffer; skip title row and locate the header row (row containing "Part No."/"Part Name"); alias mapping for columns; detect all dated status columns and pick the right-most as latest; cell fill (ARGB) to color-name mapping; pending = orange fill or keyword fallback ("Under Observation", "Need to Order", ...). Calibrate against the real sample File A once dropped in the workspace.



Smart replace: same fileName → delete old rows, insert new, update uploadedFiles entry.



lib/dataProcessor.ts: aggregateRequired(pendingParts) for RequiredPart[].



PendingTable and RequiredTable (TanStack v8: sorting, global filter, column filters, color badges on pending rows).



lib/exportUtils.ts: File B (formatted aggregated Excel) + raw Pending export, both via ExcelJS with styled headers.


_________________________________________________________________________
Phase 3 — Polish and delivery


UploadedFilesList with per-file delete (removes its PendingParts, recomputes).



Backup/Restore JSON (full snapshot download / import with validation) + Clear All with confirm dialog.



Loading states, sonner toasts for upload results (rows parsed / pending found / replaced), error handling for corrupt/unknown files, "Last updated" timestamp, responsive layout.



pnpm build verification, test with real File A samples, deploy to Vercel, short user-guide README section.

Verification



Test end-to-end in the browser with the sample File A: upload, re-upload same filename (replace), delete file, export File B, refresh page (persistence), backup/restore.

