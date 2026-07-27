# Pending Parts Dashboard v2.0 — Build Plan

## Context

Building inside the existing saval repo: fresh Next.js 16.2 + React 19 + Tailwind v4 starter (App Router, pnpm). Delivery: Vercel (primary). Pure client-side — no API routes.

## File A format (confirmed)

Non-Conformance Record sheet. Title row on top; find header row by "Part No." / "Part Name". FINAL (as coded): the **2nd status column left-to-right** supplies status text + fill. **Pending keep/drop = text only** — drop if status includes `"resolve"`; else keep. Color is stored but not used for filtering. Quantity = Affected Qty. Ignore embedded photos. See `Doc/decision.md` and `Doc/applied-changes.md`.

## Stack

ExcelJS (color-aware parse + export), TanStack Table v8, Zustand, idb, react-dropzone, nanoid, shadcn/ui.

---

## Phase 1 — Foundation (step-by-step)

Goal: runnable dashboard shell with types, IndexedDB, Zustand hydration, and UI scaffolding. **No Excel parsing yet.**

### Step 1.1 — Install dependencies

1. `pnpm install`
2. `pnpm add exceljs @tanstack/react-table zustand idb react-dropzone nanoid`
3. Confirm `pnpm dev` still boots

### Step 1.2 — Read Next 16 bundled docs

1. Open `node_modules/next/dist/docs/` (per AGENTS.md)
2. Skim: App Router, `"use client"`, layout/metadata
3. Decision: thin server `page.tsx` → client `<Dashboard />`

### Step 1.3 — Init shadcn/ui

1. `npx shadcn@latest init` (Tailwind v4 / existing globals.css)
2. `npx shadcn@latest add button card tabs table dialog sonner badge input`
3. Wire `<Toaster />` in `app/layout.tsx`
4. Metadata → "Pending Parts Dashboard"

### Step 1.4 — Folder skeleton

```
lib/types.ts
lib/indexedDB.ts
lib/utils.ts
store/useAppStore.ts
hooks/usePendingData.ts
constants/parserConfig.ts   (stub)
constants/tableColumns.ts   (stub)
components/dashboard/SummaryCards.tsx
components/dashboard/DashboardTabs.tsx
components/dashboard/PendingTable.tsx   (placeholder)
components/dashboard/RequiredTable.tsx  (placeholder)
components/upload/FileDropzone.tsx
```

### Step 1.5 — `lib/types.ts`

- `UploadedFile` — fileName, uploadedAt, rowCount, status
- `PendingPart` — id, fileName, partName, partNumber?, batch?, date?, quantity, status, color?, processedAt
- `RequiredPart` — computed only: partName, partNumber?, model?, totalQuantity, countInPending
- `UniquePart` — computed only: partNumber, partName, totalQuantity (Part No. only)
- `BackupSnapshot` — version: 1, exportedAt, files, pendingParts

### Step 1.6 — `lib/indexedDB.ts`

DB: `pending-parts-db` v1

| Store | keyPath | Indexes |
|---|---|---|
| uploadedFiles | fileName | — |
| pendingParts | id | byFileName |

API: openDB, getAllFiles, getAllPendingParts, putFile, putPendingParts, deleteByFileName, clearAll, exportSnapshot, importSnapshot. SSR-safe (`typeof window` guard).

### Step 1.7 — Zustand `store/useAppStore.ts`

State: files, pendingParts, isLoading, isHydrated, lastUpdated

Actions:
- hydrate() — load from IndexedDB on mount
- upsertFile(file, parts) — write IDB + state (full replace logic in Phase 2)
- removeFile(fileName)
- clearAll()

Wire via `useEffect` in Dashboard / `usePendingData`.

### Step 1.8 — Dashboard shell UI

1. Header — title, last-updated, placeholder Export/Backup
2. SummaryCards — Total Pending, Total Qty, Unique Parts, Files Uploaded (zeros until Phase 2)
3. FileDropzone — accept .xlsx/.xls, multi; toast only (no ExcelJS yet)
4. DashboardTabs — Pending / Required placeholders with empty states
5. Simple industrial layout; polish later

### Step 1.9 — Smoke verify checklist

- [ ] `pnpm dev` loads clean
- [ ] Empty hydrate; cards show 0
- [ ] Tabs switch
- [ ] Dropzone accepts files + toast/console
- [ ] Refresh does not crash
- [ ] Optional: fake upsertFile → survives refresh

**Phase 1 exit:** foundation compiles, persists, shows shell. Parsing / tables / File B = Phase 2.

---

## Phase 2 — Core intelligence

excelParser (ExcelJS, **2nd status column** color/keyword), smart replace-by-fileName, aggregateRequired, PendingTable + RequiredTable, File B export.

## Phase 3 — Polish and delivery

UploadedFilesList, Backup/Restore, Clear All, toasts/errors, responsive, Vercel deploy, user guide.
