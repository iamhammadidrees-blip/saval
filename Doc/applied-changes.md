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
| Required grouping | Part No (or Name) **+ Model** (first 3 letters of Batch) | `aggregateRequired` |
| Empty model label | Always **`UNKNOWN`** in Required / Models tables + File B / model Excel | `requiredModelLabel` |
| Unique Parts | Separate aggregator by **Part No. only**; sum qty; skip empty Part No. | `aggregateUniqueParts` / `UniquePart` |

---

## Product features (landed)

| Feature | Behavior |
|---------|----------|
| Models tab | Dropdown of models, filtered Required table, per-model Excel download |
| Unique Parts card | Count + **View** (dialog `DataTable`) + **Download** Excel |
| Files Uploaded tab | List + per-file delete (`window.confirm`) |
| Exports | File B, Pending Excel, model Excel, Unique Parts Excel (`exportUtils`) |
| Download placement (current) | File B + Download Pending live on **Models** search toolbar; Unique Download on Unique card; model download beside Models dropdown |
| Header | Title “Pending Parts Dashboard”; last-updated / Loading / No data yet; **Backup** button present but **disabled** |
| Summary cards order | Total Pending → Total Qty → Unique Parts → Files Uploaded |

---

## UI / UX (landed)

| Area | Applied approach |
|------|------------------|
| Tab rail | Centered `max-w-xl` steel rail; charcoal active key + rust (`#C45C26`) 2px base-line; uppercase labels |
| File dropzone | Centered `max-w-xl`; white→grey radial splash into page background |
| Table headers | `pageStickyHeader` on Pending / Required / Models (sticks while page scrolls) |
| Unique dialog table | Internal scroll + `stickyHeader` so column headers stay visible |
| Search | Part No. only (`DataTable` globalFilterFn) |
| Design previews | `Doc/ui-preview-silver.html` (Polished Bay demo); `preview/palette.html` (palette tokens, serve on :3001) |

---

## Explicitly not applied / still open

- Backup / Restore wiring (snapshot APIs may exist in IDB; UI Backup is disabled)
- Clear All header UI
- shadcn Dialog for file delete (still `window.confirm`)
- Vercel deploy + user guide README rewrite
- Moving Download File / Download Pending onto Pending / Required toolbars (discussed; not in current tree)

---

## Doc map

| Doc | Role |
|-----|------|
| `decision.md` | Runtime rules (status column, pending text filter, aggregation) |
| `logic-flow.md` | How each table/view is derived |
| `phase1.md` / `phase2.md` / `phase3.md` | Phase roadmaps (update “as coded” notes when rules change) |
| `BuildPlan.md` | Full build narrative |
| `applied-changes.md` | This file — concise “what changed / what’s live” |
