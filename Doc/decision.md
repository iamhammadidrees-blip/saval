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
  → text  (e.g. "Need to Order")   → PendingPart.status
  → fill  (ARGB)                   → PendingPart.color
```

1st status column is ignored for pending / color decisions.

---

### 2. How fill color decides pending vs not

Color is mapped first (exact client hexes in `PENDING_COLORS` / `RESOLVED_COLORS`):

| 2nd-status fill | Mapped as | Decision |
|-----------------|-----------|----------|
| `#FFC000` | orange | Pending |
| `#FFFF00` | yellow | Pending |
| `#A9D08E` | lightgreen | Pending |
| `#92D050` | green | Not pending |
| No / unknown fill | none | Fall back to keywords |

**`isPendingRow()` order:**

1. Color pending (orange / yellow / lightgreen) → keep  
2. Color green → drop  
3. Else keywords: `"need to order"`, `"under observation"`, … → keep  
4. Else keywords: `"issued from inventory"`, `/^pk[- ]?\d+/i` → drop  
5. Else → drop (not pending)

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
  - return ALL raw rows (pending + resolved)
  ↓
filterPending()
  - keep only pending by color/keywords
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
  - Pending table ← pendingParts
  - Required table ← aggregateRequired(pendingParts)  [NOT stored]
```

**Stored in IndexedDB:** `uploadedFiles`, `pendingParts` (pending rows only, with status + color from the **2nd** status column).

**Not stored:** full workbook, resolved/green rows, Required aggregates.

**On refresh:** hydrate() → IndexedDB → Zustand → tables (no re-parse until re-upload).

**Bottom line:** 2nd status column fill/text decides pending; only pending rows hit IndexedDB; Required is computed from that list.

---

### 4. Required aggregation (Part No + Model) — FINAL

```text
Group key = normalize(partNumber || partName) + "|" + normalize(model)
```

- `model` = `extractModelFromBatch(batch)` — first 3 letters of Batch (e.g. `ALW6001` → `ALW`)
- Empty / unparseable batch → model key `""` (shared “no model” bucket)
- Same Part No + same model → one Required row; sum Affected Qty; `countInPending++`
- Same Part No + different models → separate Required rows
- `RequiredPart.model` is a single model string (not a joined list)
- Unique Parts card/view = **Part No. only** (`aggregateUniqueParts`); rows without Part No are skipped
- Models tab / export label empty model as **`UNKNOWN`** via `requiredModelLabel()`
