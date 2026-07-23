# Phase 3 — Polish and Delivery (step-by-step)

**Project:** Pending Parts Dashboard v2.0  
**Depends on:** Phase 2 complete (parse File A, smart replace, tables, File B export, IndexedDB persistence)  
**Out of scope:** New parsing rules, new data models, backend/API, offline PWA service-worker (optional later)

---

## Goal

Ship a client-ready product:

1. Manage uploaded files (list + delete one file’s data)
2. Backup / Restore full JSON snapshot
3. Clear All with confirmation
4. Production UX: toasts, loading, errors, last-updated
5. Responsive layout polish
6. Build, real-file QA, Vercel deploy
7. Short user guide for the client

**Phase 3 exit:** Client can use the live Vercel URL daily — upload, decide from Required view, export File B, backup data, without developer help.

---

## Flow (Phase 3 additions)

```
Dashboard
  ├── UploadedFilesList → removeFile(fileName) → IDB + store refresh
  ├── Backup → exportSnapshot() → download JSON
  ├── Restore → importSnapshot() → hydrate store
  ├── Clear All → confirm dialog → clearAll()
  └── Polish: toasts / loading / empty / responsive / lastUpdated
        → pnpm build → Vercel → User Guide
```

---

## Step 3.1 — `UploadedFilesList` component

**File:** `components/upload/UploadedFilesList.tsx`

Show every entry from store `files[]`:

| Column / field | Source |
|---|---|
| File name | `fileName` |
| Uploaded at | `uploadedAt` (formatted local time) |
| Pending rows | `rowCount` (or live count from `pendingParts` filtered by fileName) |
| Actions | Delete button |

Behavior:

1. Delete opens confirm dialog (shadcn `Dialog`):  
   `"Remove {fileName} and all its pending parts?"`
2. On confirm → call store `removeFile(fileName)`  
   (already should call `deleteByFileName` in IndexedDB + update state — verify from Phase 1/2)
3. Toast: `"Removed {fileName}"`
4. Empty state: `"No files uploaded yet"`

Place list below FileDropzone (or in a collapsible side panel on desktop).

**Done when:** deleting one of two uploaded files removes only that file’s rows; Required totals update; refresh keeps the remaining file.

---

## Step 3.2 — Backup JSON (download)

**Files:** reuse `lib/indexedDB.ts` `exportSnapshot()` + small UI in header / `components/common/BackupRestore.tsx`

1. Button: **Backup**
2. On click:
   - `const snapshot = await exportSnapshot()`  
     (`version: 1`, `exportedAt`, `files`, `pendingParts`)
   - Download as `pending-parts-backup_YYYY-MM-DD.json`
3. Toast success with counts: `"Backup saved (N pending rows, M files)"`
4. Disable if not hydrated or both arrays empty (optional — still allow empty backup)

**Done when:** downloaded JSON is valid and contains current data.

---

## Step 3.3 — Restore JSON (import)

1. Button: **Restore** → hidden `<input type="file" accept="application/json,.json" />`
2. Read file as text → `JSON.parse`
3. Validate:
   - `version === 1`
   - `files` and `pendingParts` are arrays
   - basic field checks (e.g. each part has `id`, `fileName`, `partName`, `quantity`)
4. Confirm dialog:  
   `"This will replace all current data. Continue?"`
5. On confirm → `importSnapshot(snapshot)` then store `hydrate()` (or set state from snapshot directly)
6. Toast success / error for invalid files

**Done when:** restore after clear (or on another browser profile) brings back exact pending + files; tables match.

---

## Step 3.4 — Clear All

1. Button: **Clear All** (destructive style)
2. Confirm dialog with strong copy:  
   `"Delete all uploaded files and pending parts? This cannot be undone. Use Backup first."`
3. On confirm → `clearAll()` (IndexedDB wipe + reset store)
4. Toast: `"All data cleared"`
5. UI returns to empty states; cards show zeros

**Done when:** Clear All empties IDB; refresh stays empty.

---

## Step 3.5 — Loading states

Cover these moments:

| Moment | UX |
|---|---|
| Initial hydrate | Full-page or dashboard skeleton / spinner until `isHydrated` |
| Parsing upload(s) | Disable dropzone; show progress text `"Parsing N file(s)…"` |
| Export File B / Pending | Button loading spinner; disable double-clicks |
| Backup / Restore / Clear / Delete | Button or dialog action loading |

Rules:

- Never leave the UI interactive in a half-written state
- Prefer store `isLoading` + local flags for short actions

**Done when:** slow parse (large Excel) does not allow a second overlapping upload that corrupts state.

---

## Step 3.6 — Toasts and error handling

Use sonner (wired in Phase 1). Standardize messages:

| Event | Type | Example |
|---|---|---|
| Upload success | success | `"FileA.xlsx: 18 pending (replaced previous)"` |
| Upload partial | warning | `"2 files OK, 1 failed"` |
| Parse failure | error | `"Could not find header row (Part No. / Part Name)"` |
| Bad file type | error | `"Only .xlsx / .xls files are supported"` |
| Export done | success | `"File B downloaded"` |
| Backup / Restore | success / error | as above |
| Delete / Clear | success | as above |
| Unexpected | error | `"Something went wrong — try again"` + `console.error` |

Also:

- Catch ExcelJS / IDB errors in upload + export paths
- Never show raw stack traces in the UI
- Keep empty-state copy helpful (not just blank white)

**Done when:** every failure path shows a human message and the app stays usable.

---

## Step 3.7 — Last updated + header actions

1. Show **Last updated** in header from store `lastUpdated` (format: local date/time; `"—"` if null)
2. Update `lastUpdated` on: upload, delete file, restore, clear
3. Group header actions clearly:
   - Primary: Download File B
   - Secondary: Download Pending, Backup, Restore
   - Destructive: Clear All
4. Optional: disable exports when no data

**Done when:** timestamp moves after each mutating action and survives refresh (derive from max `processedAt` / `uploadedAt` if needed).

---

## Step 3.8 — Responsive UI polish

Pass over the dashboard for desktop + mobile:

1. **Mobile (< md):**
   - Stack SummaryCards 2×2 or single column
   - Tables: horizontal scroll (sticky first column optional)
   - Dropzone full width; file list stacked
   - Header actions → wrap or dropdown menu if crowded
2. **Desktop:**
   - Comfortable max-width content (e.g. full width with padding)
   - Tabs + tables readable without cramped columns
3. Visual direction (keep industrial / clean; avoid purple / cream AI defaults):
   - Consistent spacing, typography hierarchy
   - Status color badges readable (orange / green)
4. Accessibility basics: button labels, dialog focus, contrast on badges

**Done when:** usable on phone width (~375px) and laptop (~1280px) without broken layout.

---

## Step 3.9 — Production build verification

1. `pnpm lint` — fix introduced issues
2. `pnpm build` — must succeed (Next 16)
3. `pnpm start` (or preview) — smoke the production bundle:
   - hydrate
   - upload sample File A
   - export File B
   - backup / restore
   - delete file / clear all
4. Fix any client-only / SSR issues (ExcelJS, IndexedDB, dropzone must stay behind `"use client"`)

**Done when:** production build passes and critical paths work outside `next dev`.

---

## Step 3.10 — Deploy to Vercel

Primary delivery (confirmed earlier):

1. Push repo to GitHub (if not already)
2. Import project in Vercel → framework Next.js → deploy
3. Confirm env: **no secrets required** (pure client app)
4. Smoke on production URL:
   - Upload File A
   - Refresh (IndexedDB is per-browser — expected)
   - Export File B
5. Share URL with client

Notes to tell client:

- Data lives in **their browser** (IndexedDB), not on Vercel servers
- Different PC / browser = empty until they Restore a backup or re-upload
- Recommend Backup before clearing browser data

**Done when:** production URL works for the happy path.

---

## Step 3.11 — User guide (short)

Add a concise section to `README.md` and/or `Doc/USER_GUIDE.md` (1–2 pages worth):

1. What the app does (Pending vs Required)
2. How to upload File A (drag & drop, multi-file, replace same name)
3. How to read Summary cards + Required tab (decision view)
4. How to download File B
5. How to delete one file / Clear All
6. How to Backup / Restore (and when to use it)
7. Browser tip: Chrome/Edge recommended; do not clear site data without Backup
8. Production URL link

Optional: 15-min training call checklist (talking points only — not a script dump).

**Done when:** a non-developer can follow the guide without asking basic questions.

---

## Step 3.12 — Final acceptance checklist (Phase 3 done)

### Feature

- [ ] Uploaded files list shows all files with row counts
- [ ] Delete one file removes only its parts; other files remain
- [ ] Backup downloads valid JSON
- [ ] Restore replaces data after confirm; invalid JSON rejected
- [ ] Clear All wipes everything after confirm
- [ ] Last updated reflects mutations
- [ ] Loading states block double actions
- [ ] Toasts cover success and failure paths

### Quality

- [ ] Responsive on mobile + desktop
- [ ] `pnpm build` succeeds
- [ ] Production smoke test passed
- [ ] Vercel URL live
- [ ] User guide written

### Regression (from Phase 2)

- [ ] Parse + pending filter still correct on sample File A
- [ ] Smart replace by filename still works
- [ ] Required aggregation + File B export still match
- [ ] Refresh persistence still works

**Phase 3 exit:** polished, documented, deployed. Project delivery complete for the client.

---

## Files touched in Phase 3 (new or extended)

```
components/upload/UploadedFilesList.tsx   ← new
components/common/BackupRestore.tsx       ← new (or inline in header)
components/common/ConfirmDialog.tsx       ← optional shared wrapper
components/dashboard/*                    ← wire list + polish layout
store/useAppStore.ts                      ← verify removeFile / clearAll / import path
lib/indexedDB.ts                          ← verify exportSnapshot / importSnapshot validation
hooks/usePendingData.ts                   ← lastUpdated helpers if needed
app/layout.tsx / globals.css              ← minor polish
README.md                                 ← user guide section
Doc/USER_GUIDE.md                         ← optional dedicated guide
```

---

## Suggested build order

| Order | Step | Focus |
|------:|------|--------|
| 1 | 3.1 | UploadedFilesList + delete |
| 2 | 3.2–3.4 | Backup, Restore, Clear All |
| 3 | 3.5–3.7 | Loading, toasts/errors, last-updated |
| 4 | 3.8 | Responsive polish |
| 5 | 3.9 | lint + production build smoke |
| 6 | 3.10 | Vercel deploy |
| 7 | 3.11–3.12 | User guide + acceptance checklist |
