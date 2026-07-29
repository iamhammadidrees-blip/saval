# Applied changes — as coded

Living changelog of decisions and UI that landed in the app.  
Details of filter/aggregation rules: `Doc/decision.md`, `Doc/logic-flow.md`.

---

## Filter & data (core)

| Change | Applied approach | Where |
|--------|------------------|--------|
| Status decision column | Always **2nd** status column left→right (≥2 required) | `parserConfig` / `excelParser` |
| Pending keep/drop | **Text only** — drop if status includes `"resolve"`; else keep | `dataProcessor.isPendingRow` |
| Color | Still parsed into `PendingPart.color`; **not** used for keep/drop | `excelParser` + `toPendingParts` |
| Removed from filter path | Color-first pending/resolved sets + `PENDING_KEYWORDS` / `RESOLVED_KEYWORDS` | was in older `dataProcessor` / docs |
| Required grouping | **Part No. only** + Model (first 3 letters of Batch); rows with empty Part No. are **skipped** | `aggregateRequired` / `isMissingPartNumber` |
| Empty model label | Always **`UNKNOWN`** in Merged / Models tables + File B / model Excel | `requiredModelLabel` |
| Unique Parts | Separate aggregator by **Part No. only**; sum qty; skip empty Part No. | `aggregateUniqueParts` / `UniquePart` |
| Undefined Rows | Pending rows with empty Part No.; indices shown on Total Pending card | `UndefinedRowsCard` / `isMissingPartNumber` |

---

## Product features (landed)

| Feature | Behavior |
|---------|----------|
| Tabs (UI labels) | **Pending** · **Merged** (Required table) · **Models** · **Files Uploaded** |
| Models tab | Dropdown of models, filtered Required table, per-model Excel download |
| Unique Parts card | Count + **View** (dialog `DataTable`) + **Download** Excel |
| Undefined Rows | Popover on Total Pending card — 1-based row indices with missing Part No. |
| Files Uploaded tab | List + per-file delete (`window.confirm`) |
| Exports | File B, Pending Excel, model Excel, Unique Parts Excel (`exportUtils`) |
| Download placement (current) | **Download Pending** on Pending toolbar; **Download File B** on Merged toolbar; model download beside Models dropdown; Unique Download on Unique card |
| Header | Title **Hold-Parts-Dashboard**; last-updated / Loading / No data yet; **Backup** / **Restore** / **Clear All** all wired |
| Summary cards order | Total Pending (+ Undefined Rows) → Total Qty → Unique Parts → Files Uploaded |
| Backup / Restore / Clear All | Backup → `exportSnapshot` JSON; Restore → file picker + `importSnapshot`; Clear All → Dialog confirm + `clearAll()` |

---

## UI / UX (landed)

| Area | Applied approach |
|------|------------------|
| Theme | **Polished Bay** tokens in `app/globals.css` (silver / steel / ink / rust ring); page wash gradient |
| Tab rail | Centered `max-w-xl` steel rail; charcoal active key + rust (`#C45C26`) 2px base-line; uppercase labels |
| File dropzone | Centered `max-w-xl`; white→recess radial (`#D5D9DE`) |
| Table headers | Silver `bg-muted`; `pageStickyHeader` on Pending / Merged / Models |
| Unique dialog table | Internal scroll + `stickyHeader` so column headers stay visible |
| Search | Part No. only (`DataTable` globalFilterFn) |
| Design previews | `Doc/ui-preview-silver.html` (Polished Bay demo); `preview/palette.html` (palette tokens) |

---

## Explicitly not applied / still open

- File delete still uses `window.confirm` (prefer shadcn Dialog)
- Vercel deploy + user guide README rewrite
- Optional hydrate skeleton beyond header “Loading…”
- Responsive tighten for summary cards on mobile

---

## Doc map

| Doc | Role |
|-----|------|
| `decision.md` | Runtime rules (status column, pending text filter, aggregation) |
| `logic-flow.md` | How each table/view is derived |
| `phase1.md` / `phase2.md` / `phase3.md` | Phase roadmaps (update “as coded” notes when rules change) |
| `BuildPlan.md` | Full build narrative |
| `applied-changes.md` | This file — concise “what changed / what’s live” |
