# Phase 3 — Polish and Delivery (roadmap)

**Project:** Pending Parts Dashboard v2.0  
**Status:** Foundation + Core Intelligence + Models / Unique Parts UI are largely complete. Phase 3 finishes remaining product gaps and ships to Vercel.  
**Delivery:** Vercel (primary). Pure client-side app — no API routes, no server secrets.  
**See also:** `Doc/applied-changes.md`, `Doc/decision.md`, `Doc/logic-flow.md`.

---

## Where we are now (already built)

Do **not** rebuild these. Phase 3 only polishes, wires missing UI, and deploys.

### Foundation (Phase 1) — done

- Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + sonner
- `lib/types.ts`, `lib/indexedDB.ts`, Zustand store with hydrate / upsert / remove / clearAll
- Dashboard shell, SummaryCards, FileDropzone, tabs layout

### Core intelligence (Phase 2) — done

- ExcelJS File A parse (header detection, **2nd status column** left-to-right)
- **Pending filter (applied):** Status 2 **text only** — drop if includes `"resolve"`; else keep. Color stored, not used for keep/drop
- Smart replace-by-fileName → IndexedDB + store
- Pending table + Required table (TanStack) + File B / Pending Excel export
- Upload toasts + parsing loading state on dropzone

### Later product additions — done

| Feature | Where / notes |
|---|---|
| Pending Status = plain text (no color Badge) | `constants/tableColumns.ts` |
| `#` index column on tables | `constants/tableColumns.ts` |
| Required **Model** from batch (first 3 letters) | `utils` + `dataProcessor` + columns |
| Empty model → **`UNKNOWN`** in UI + exports | `requiredModelLabel()` |
| **Models** tab (filter + per-model export) | `ModelsView.tsx` |
| File B + Download Pending on Models toolbar | `ModelsView.tsx` `toolbarActions` |
| **Files Uploaded** tab + per-file delete | `UploadedFilesList.tsx` (`window.confirm`) |
| Unique Parts card: View dialog + Download | `UniquePartsCard.tsx` + `aggregateUniqueParts` |
| Sticky table headers (page scroll) | Pending / Required / Models `pageStickyHeader` |
| Unique dialog scroll + sticky header | `stickyHeader` + max-height scroll |
| Industrial tab rail + dropzone silver splash | `DashboardTabs.tsx`, `FileDropzone.tsx` |
| Header last-updated + **Backup wired** | `Dashboard.tsx` |
| IDB `exportSnapshot` / `importSnapshot` | `lib/indexedDB.ts` (export used by Backup; import still unused) |

### Still open (this Phase 3 roadmap)

| Gap | Notes |
|---|---|
| Backup button | **Wired** — downloads `pending-parts-backup_YYYY-MM-DD.json` via `exportSnapshot()` |
| Restore | No UI yet (IDB `importSnapshot` exists) |
| Clear All | Store action exists — no header UI / confirm |
| Confirm dialogs | File delete still uses `window.confirm`; prefer shadcn Dialog |
| Hydrate loading | Header shows “Loading…” only — optional fuller skeleton |
| Responsive polish | Summary cards are `grid-cols-4` — tighten mobile |
| Production build + Vercel | Not deployed yet |
| User guide | README is still create-next-app default |

---

## Goal (Phase 3 exit)

Client can open the **live Vercel URL** and:

1. Upload File A → see Pending / Required / Models / Unique Parts  
2. Download File B, Pending, model, and Unique exports  
3. Backup / Restore / Clear All safely  
4. Delete one uploaded file without breaking others  
5. Follow a short user guide without developer help  

---

## Flow (remaining work only)

```
Dashboard header
  ├── Backup  → exportSnapshot() → JSON download     [DONE]
  ├── Restore → file picker → importSnapshot()       [NEW UI]
  └── Clear All → Dialog confirm → clearAll()        [NEW UI]

Files Uploaded tab
  └── Delete → shadcn Dialog (replace window.confirm) [POLISH]

Then: responsive pass → pnpm build → Vercel → USER_GUIDE
```

---

## Step 3.1 — Wire Backup (download JSON) ✅ DONE

**Already exists:** `exportSnapshot()` in `lib/indexedDB.ts`.

**Applied:**
1. Backup enabled when `isHydrated` (disabled while export runs)
2. On click → `exportSnapshot()` → download `pending-parts-backup_YYYY-MM-DD.json`
3. Toast: `"Backup saved (N pending rows, M files)"`
4. Errors toast only — never crash

**Done when:** clicking Backup downloads valid JSON that matches current IndexedDB data.

---

## Step 3.2 — Restore (import JSON)

1. Add **Restore** button + hidden `<input accept=".json,application/json">`
2. Parse + validate (`version === 1`, arrays present)
3. Confirm dialog: `"This will replace all current data. Continue?"`
4. `importSnapshot(snapshot)` then refresh store
5. Update `lastUpdated`; toast success / reject invalid files

**Done when:** Restore after Clear restores files + pending rows exactly.

---

## Step 3.3 — Clear All (with confirm)

**Already exists:** `clearAll()` in Zustand + IndexedDB.

1. Add destructive **Clear All** button in header (or under Files tab)
2. Confirm: `"Delete all uploaded files and pending parts? This cannot be undone. Use Backup first."`
3. On confirm → `clearAll()` → empty UI
4. Toast: `"All data cleared"`

**Done when:** Clear All empties IDB; refresh stays empty.

---

## Step 3.4 — Polish Files Uploaded delete UX

1. Replace `window.confirm` with shadcn `Dialog`
2. Keep loading disable on Delete while in flight

**Done when:** delete one of two files leaves the other intact; cards update; refresh persists.

---

## Step 3.5 — Loading + toast audit (light pass)

| Moment | Expected |
|---|---|
| Hydrate | Header “Loading…” or small skeleton until `isHydrated` |
| Upload parse | Dropzone disabled + spinner (done) |
| Export File B / Pending / Model / Unique | Button loading / `isExporting` |
| Backup / Restore / Clear / Delete | Disable actions while running |

**Done when:** slow uploads cannot double-fire; every failure path shows a clear toast.

---

## Step 3.6 — Responsive polish

1. **Mobile:** SummaryCards → 2×2 or 1-col; header actions wrap; tables keep horizontal scroll
2. **Desktop:** keep current max-width layout
3. Dropzone + tabs usable on ~375px width

**Done when:** no broken layout at phone + laptop widths.

---

## Step 3.7 — Production build verification

1. `pnpm lint` / `pnpm build` / `pnpm start` smoke
2. Upload File A; Pending filter uses **resolve** text rule
3. Required / Models / Unique / exports
4. Backup → Clear → Restore; delete one file

**Done when:** critical paths work in the production bundle.

---

## Step 3.8 — Deploy to Vercel

1. Import in Vercel → Next.js → deploy (no env required)
2. Tell client: data lives in **their browser** IndexedDB; Backup before clearing site data

---

## Step 3.9 — User guide

README / `Doc/USER_GUIDE.md`: upload, **resolve** text filter, Model = first 3 batch letters, downloads, Unique Parts, Files delete, Backup/Restore/Clear All, production URL.

---

## Step 3.10 — Final acceptance checklist

### Regression

- [ ] File A parse + **resolve**-text pending filter still correct
- [ ] Smart replace by filename still works
- [ ] Required + Model (`ALW6001` → `ALW`); empty → `UNKNOWN`
- [ ] Models tab filter + export
- [ ] Unique Parts Part-No-only sum
- [ ] File B / Pending / Unique exports match tables
- [ ] Refresh persistence works
- [ ] Sticky headers work on main tables

### Phase 3 must pass

- [ ] Backup / Restore / Clear All
- [ ] File delete uses Dialog
- [ ] Loading + toasts
- [ ] Responsive
- [ ] `pnpm build` + Vercel URL + user guide

**Phase 3 exit:** polished, documented, deployed.

---

## Files to touch in Phase 3

```
components/dashboard/Dashboard.tsx          ← wire Backup / Restore / Clear All
components/common/BackupRestore.tsx         ← optional
components/upload/UploadedFilesList.tsx     ← Dialog confirm polish
store/useAppStore.ts                        ← optional restoreFromSnapshot helper
lib/indexedDB.ts                            ← already has export/import
README.md / Doc/USER_GUIDE.md
```

**Do not rework:** parser column rule, `"resolve"` filter, aggregation, Models/Unique core — unless a bug forces a fix.

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
