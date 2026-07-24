# Phase 3 — Polish and Delivery (roadmap)

**Project:** Pending Parts Dashboard v2.0  
**Status:** Foundation + Core Intelligence are largely complete. Phase 3 finishes the remaining product gaps and ships to Vercel.  
**Delivery:** Vercel (primary). Pure client-side app — no API routes, no server secrets.

---

## Where we are now (already built)

Do **not** rebuild these. Phase 3 only polishes, wires missing UI, and deploys.

### Foundation (Phase 1) — done

- Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + sonner
- `lib/types.ts`, `lib/indexedDB.ts`, Zustand store with hydrate / upsert / remove / clearAll
- Dashboard shell, SummaryCards, FileDropzone, tabs layout

### Core intelligence (Phase 2) — done

- ExcelJS File A parse (header detection, Status 2 / right-most status, color + keyword pending filter)
- Smart replace-by-fileName → IndexedDB + store
- Pending table + Required table (TanStack) + File B / Pending Excel export
- Upload toasts + parsing loading state on dropzone
- Decision rules live in `Doc/decision.md` (color for filter only)

### Later product additions — done

| Feature | Where |
|---|---|
| Pending Status = plain text (no color Badge) | `constants/tableColumns.ts` |
| `#` index column on tables | `constants/tableColumns.ts` |
| Required **Model** from batch (first 3 letters, e.g. `ALW6001` → `ALW`) | `utils` + `dataProcessor` + columns |
| **Models** tab (filter Required by model + per-model export) | `ModelsView.tsx` |
| **Files Uploaded** tab + per-file delete | `UploadedFilesList.tsx` (uses `window.confirm`) |
| Unique Parts card + dialog export | `UniquePartsCard.tsx` |
| Header: Last updated, Download File B, Download Pending | `Dashboard.tsx` |
| IDB `exportSnapshot` / `importSnapshot` APIs | `lib/indexedDB.ts` (API ready; UI incomplete) |

### Still open (this Phase 3 roadmap)

| Gap | Notes |
|---|---|
| Backup button | Present in header but **disabled** — needs wiring |
| Restore | No UI yet (IDB import exists) |
| Clear All | Store action exists — no header UI / confirm |
| Confirm dialogs | File delete still uses `window.confirm`; prefer shadcn Dialog |
| Hydrate loading | Header shows “Loading…” only — optional fuller skeleton |
| Responsive polish | Summary cards are `grid-cols-4` — tighten mobile |
| Production build + Vercel | Not deployed yet |
| User guide | README is still create-next-app default |

---

## Goal (Phase 3 exit)

Client can open the **live Vercel URL** and:

1. Upload File A → see Pending / Required / Models  
2. Download File B (and model / pending exports)  
3. Backup / Restore / Clear All safely  
4. Delete one uploaded file without breaking others  
5. Follow a short user guide without developer help  

---

## Flow (remaining work only)

```
Dashboard header
  ├── Backup  → exportSnapshot() → JSON download     [WIRE]
  ├── Restore → file picker → importSnapshot()       [NEW UI]
  └── Clear All → Dialog confirm → clearAll()        [NEW UI]

Files Uploaded tab
  └── Delete → shadcn Dialog (replace window.confirm) [POLISH]

Then: responsive pass → pnpm build → Vercel → USER_GUIDE
```

---

## Step 3.1 — Wire Backup (download JSON)

**Already exists:** `exportSnapshot()` in `lib/indexedDB.ts`, disabled Backup button in `Dashboard.tsx`.

1. Enable Backup button when `isHydrated`
2. On click:
   - `const snapshot = await exportSnapshot()`
   - Download `pending-parts-backup_YYYY-MM-DD.json`
3. Toast: `"Backup saved (N pending rows, M files)"`
4. Handle errors with toast (never crash)

Optional: allow empty backup (still useful for testing).

**Done when:** clicking Backup downloads valid JSON that matches current IndexedDB data.

---

## Step 3.2 — Restore (import JSON)

1. Add **Restore** button + hidden `<input accept=".json,application/json">`
2. Parse + validate (`version === 1`, arrays present; optional field checks)
3. Confirm dialog: `"This will replace all current data. Continue?"`
4. `importSnapshot(snapshot)` then refresh store (re-hydrate or set state from snapshot)
5. Update `lastUpdated`; toast success / reject invalid files

**Done when:** Restore after Clear (or on a fresh browser profile) restores files + pending rows exactly.

---

## Step 3.3 — Clear All (with confirm)

**Already exists:** `clearAll()` in Zustand + IndexedDB.

1. Add destructive **Clear All** button in header (or under Files tab)
2. Confirm dialog copy:  
   `"Delete all uploaded files and pending parts? This cannot be undone. Use Backup first."`
3. On confirm → `clearAll()` → empty UI / zero cards
4. Toast: `"All data cleared"`

**Done when:** Clear All empties IDB; refresh stays empty.

---

## Step 3.4 — Polish Files Uploaded delete UX

**Already exists:** `UploadedFilesList` with delete + toasts.

Upgrade only:

1. Replace `window.confirm` with shadcn `Dialog`
2. Keep loading disable on the Delete button while in flight
3. Confirm empty state copy is clear

**Done when:** delete one of two files leaves the other intact; Required / Models / cards update; refresh persists.

---

## Step 3.5 — Loading + toast audit (light pass)

Mostly done. Verify / fill gaps:

| Moment | Expected |
|---|---|
| Hydrate | Header “Loading…” or small dashboard skeleton until `isHydrated` |
| Upload parse | Dropzone disabled + spinner (done) |
| Export File B / Pending / Model | Button loading / `isExporting` (mostly done) |
| Backup / Restore / Clear / Delete | Disable actions while running |

Toast audit: upload success/fail, export success/fail, backup/restore/clear/delete — human messages only, no stack traces in UI.

**Done when:** slow uploads cannot double-fire; every failure path shows a clear toast.

---

## Step 3.6 — Responsive polish

Quick pass for client devices:

1. **Mobile:** SummaryCards → 2×2 or 1-col; header actions wrap; tables keep horizontal scroll
2. **Desktop:** keep current max-width layout
3. Dropzone + tabs usable on ~375px width
4. Status in Pending stays **text-only** (no color fills in UI — decision color stays in parser only)

**Done when:** no broken layout at phone + laptop widths.

---

## Step 3.7 — Production build verification

1. `pnpm lint` — fix blockers
2. `pnpm build` — must succeed (Next 16)
3. `pnpm start` smoke:
   - hydrate from IndexedDB
   - upload sample File A
   - Pending / Required / Models look correct (Model = first 3 batch letters)
   - Download File B + Pending + model export
   - Backup → Clear → Restore
   - Delete one file
4. Confirm ExcelJS / IndexedDB / dropzone stay behind `"use client"`

**Done when:** critical paths work in the production bundle (not only `next dev`).

---

## Step 3.8 — Deploy to Vercel

1. Push repo to GitHub (if needed)
2. Import in Vercel → Next.js → deploy  
3. Env: **none required**
4. Production smoke on the live URL (same as 3.7 happy path)
5. Share URL with client

**Tell the client:**

- Data lives in **their browser** (IndexedDB), not on Vercel
- New PC / browser = empty until Restore or re-upload
- Backup before clearing site data

**Done when:** production URL works for the daily workflow.

---

## Step 3.9 — User guide

Replace / extend the default README (and optionally add `Doc/USER_GUIDE.md`):

1. What the app does (Pending vs Required vs Models)
2. Upload File A (multi-file, same name = replace)
3. How pending is decided (Status 2 color/keywords — pointer to `Doc/decision.md`)
4. Model = first 3 letters of Batch
5. Download File B / Pending / per-model export
6. Files Uploaded → delete one file
7. Backup / Restore / Clear All
8. Browser tip: Chrome/Edge; don’t clear site data without Backup
9. Production URL

**Done when:** a non-developer can run the daily flow from the guide alone.

---

## Step 3.10 — Final acceptance checklist

### Already expected to pass (regression)

- [ ] File A parse + pending filter (color/keywords) still correct
- [ ] Smart replace by filename still works
- [ ] Required aggregation + Model column correct (`ALW6001` → `ALW`)
- [ ] Models tab filter + export works
- [ ] File B / Pending exports match tables
- [ ] Refresh persistence (IndexedDB) works
- [ ] Pending Status is text-only (no color Badge)
- [ ] `#` index columns present

### Phase 3 must pass

- [ ] Backup downloads valid JSON
- [ ] Restore replaces data after confirm; bad JSON rejected
- [ ] Clear All wipes everything after confirm
- [ ] File delete uses confirm dialog; only that file’s rows removed
- [ ] Loading states block double actions
- [ ] Toasts cover success and failure for new actions
- [ ] Responsive on mobile + desktop
- [ ] `pnpm build` succeeds
- [ ] Production smoke passed
- [ ] Vercel URL live
- [ ] User guide written

**Phase 3 exit:** polished, documented, deployed. Client delivery complete.

---

## Files to touch in Phase 3

```
components/dashboard/Dashboard.tsx          ← wire Backup / Restore / Clear All
components/common/BackupRestore.tsx         ← optional extracted component
components/upload/UploadedFilesList.tsx     ← Dialog confirm polish
store/useAppStore.ts                        ← optional restoreFromSnapshot helper
lib/indexedDB.ts                            ← already has export/import (verify only)
app/globals.css                             ← responsive tweaks if needed
README.md                                   ← user guide
Doc/USER_GUIDE.md                           ← optional dedicated guide
```

**Do not rework:** parser, pending filter, aggregation, Models tab core logic, or decision rules — unless a deploy bug forces a fix.

---

## Suggested build order

| Order | Step | Focus |
|------:|------|--------|
| 1 | 3.1–3.3 | Backup + Restore + Clear All |
| 2 | 3.4–3.5 | File-delete Dialog + loading/toast audit |
| 3 | 3.6 | Responsive polish |
| 4 | 3.7 | lint + production build smoke |
| 5 | 3.8 | Vercel deploy |
| 6 | 3.9–3.10 | User guide + acceptance checklist |
