### Decision log — FINAL (as coded)

Source of truth for runtime behavior: `constants/parserConfig.ts`, `lib/excelParser.ts`, `lib/dataProcessor.ts`.

---

### 1. Which status cell decides? (FINAL)

**Always the 2nd status column, left → right.**

| Rule | Value |
|------|--------|
| Detection | Real status headers only: `Status`, `Status-1` / `Status-2` / `Status-3`, plain `Status`, or dated headers under a Status group |
| Decision column | `STATUS_COLUMN_RULE.decisionColumnIndex = 1` → **2nd** column in that sorted list |
| Not used | Status-2 **by name**, right-most / “latest”, or 1st status column |
| Fail upload if | Fewer than **2** real status columns |
| Ignore | Remarks (and similar) even if under a “Status as of” group row |

Config: `constants/parserConfig.ts` → `STATUS_COLUMN_RULE`, `STATUS_HEADER_HINTS`.  
Parser stores the decision column on `HeaderDetectionResult.latestStatusColumnIndex` (name is legacy; value = **2nd** status column).

For each Excel data row the parser reads **that** cell only:

```text
2nd status column cell
  → text  (e.g. "Need to Order", "Resolved")   → PendingPart.status
  → fill  (ARGB)                               → PendingPart.color  (stored for display/export; not used for keep/drop)
```

1st status column is ignored for pending decisions.

---

### 2. How pending vs not is decided (FINAL — text only)

**Applied approach (current):** keep/drop uses **Status 2 text only**. Fill color is still extracted and stored, but **does not** decide pending.

| Status 2 text (normalized, case-insensitive) | Decision |
|----------------------------------------------|----------|
| Contains `"resolve"` (e.g. resolve, resolved, Resolution…) | **Drop** (not pending) |
| Anything else (including empty / unknown) | **Keep** (pending) |

```ts
// lib/dataProcessor.ts — isPendingRow()
return !normalizeText(row.status).includes("resolve");
```

**Changed from earlier approach:** color-first (`#FFC000` / `#FFFF00` / `#A9D08E` pending, `#92D050` resolved) + keyword lists (`PENDING_KEYWORDS` / `RESOLVED_KEYWORDS`) are **no longer used for filtering**. Color hex helpers remain in `parserConfig.ts` for reference / future UI, and the parser still writes `PendingPart.color`.

Only pending rows are written to IndexedDB.

---

### 3. Full flow into the database

```text
Drop Excel file
  ↓
parseFileA()
  - find ≥2 status columns
  - decision = 2nd left-to-right
  - for each row: read that cell’s text + fill
  - return ALL raw rows
  ↓
filterPending() / isPendingRow()
  - drop if status text includes "resolve"; else keep
  ↓
toPendingParts()
  - id, fileName, quantity, status, color, …
  ↓
upsertFile()  (Zustand + IndexedDB)
  1. deleteByFileName(fileName)
  2. putFile(fileMeta)
  3. putPendingParts(parts)
  4. update in-memory store
  ↓
Dashboard
  - Pending table ← pendingParts (+ Download Pending)
  - Merged (Required) ← aggregateRequired(pendingParts)  [NOT stored] (+ File B)
  - Models tab ← filter Required by model
  - Unique Parts ← aggregateUniqueParts(pendingParts) [NOT stored]
  - Undefined Rows ← empty Part No. indices on Total Pending card
  - Backup / Restore / Clear All ← header (IndexedDB snapshot)
```

**Stored in IndexedDB:** `uploadedFiles`, `pendingParts` (pending rows only, with status + color from the **2nd** status column).

**Not stored:** full workbook, resolved rows, Required / Unique aggregates.

**On refresh:** hydrate() → IndexedDB → Zustand → tables (no re-parse until re-upload).

**Bottom line:** 2nd status column supplies text + fill; **text containing “resolve” drops the row**; everything else is pending and hits IndexedDB; Merged / Models / Unique / Undefined are computed from that list.

---

### 4. Required / Merged aggregation (Part No + Model) — FINAL

UI tab label **Merged** = Required table.

```text
Group key = normalize(partNumber) + "|" + normalize(model)
```

- Group uses **Part No. only** (`requiredPartKey`) — **not** `partNumber || partName`
- Rows with empty Part No. are **skipped** (`isMissingPartNumber`) — they stay in Pending and appear under **Undefined Rows**
- `model` = `extractModelFromBatch(batch)` — first 3 letters of Batch (e.g. `ALW6001` → `ALW`)
- Empty / unparseable batch → model key `""` (shared “no model” bucket)
- Same Part No + same model → one Required row; sum Affected Qty; `countInPending++`
- Same Part No + different models → separate Required rows
- `RequiredPart.model` is a single model string (not a joined list)
- Unique Parts card/view = **Part No. only** (`aggregateUniqueParts`); rows without Part No are skipped
- Merged / Models / exports label empty model as **`UNKNOWN`** via `requiredModelLabel()` (tables and Excel — not `—`)

### 5. Downloads (where buttons live)

| Export | UI location |
|--------|-------------|
| Download Pending | Pending tab toolbar |
| Download File B | Merged (Required) tab toolbar |
| Download {model} | Models tab (beside model dropdown) |
| Unique Parts Excel | Unique Parts card |
| Backup JSON | Header Backup button |
