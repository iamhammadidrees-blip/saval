# Logic flow — filters & tables (FINAL as coded)

Source: `lib/excelParser.ts`, `lib/dataProcessor.ts`, dashboard components.  
All views below start from **pending parts** (or Required / Merged derived from them).  
Required / Models / Unique are **not** stored in IndexedDB — recomputed from `pendingParts`.

UI tab label **Merged** = Required table (`TabsTrigger value="required"`).

---

## Pipeline overview

```text
File A upload
  → parseFileA()          (all rows + 2nd status text/color)
  → filterPending()       (text: drop if status includes "resolve")
  → toPendingParts()
  → IndexedDB + Zustand   (pendingParts)
        │
        ├─→ Pending table          (raw pendingParts)
        │     └─ Download Pending (Pending toolbar)
        ├─→ aggregateRequired()    → Merged (Required) table
        │         │                   └─ Download File B (Merged toolbar)
        │         └─→ filterRequiredByModel() → Models tab
        │                   └─ Download {model} Excel
        ├─→ aggregateUniqueParts() → Unique Parts card (View / Download)
        └─→ isMissingPartNumber()  → Undefined Rows on Total Pending card
```

---

## 1. Pending list

What it does: shows every pending row kept after Status filter. One Excel pending row → one table row. No grouping.

```text
parseFileA()
  → filterPending() / isPendingRow()
  → toPendingParts()
  → store pendingParts
  → Pending table (+ Download Pending)
```

Stored in IndexedDB. Survives refresh via hydrate.

### Filter basis (applied)

| Rule | Behavior |
|------|----------|
| Status cell | **2nd** status column left→right (not by name, not right-most) |
| Keep / drop | **Text only** — if normalized status includes `"resolve"` → **drop**; else **keep** |
| Color | Still read & stored on `PendingPart.color`; **not** used for keep/drop |
| Qty | Affected Qty from File A (invalid → 0) |
| Skipped at parse | empty Part No **and** empty Part Name |

---

## 2. Merged (Required) table

What it does: takes pending parts only and groups by **Part No. + Model**.

```text
pendingParts
  → aggregateRequired()   (skips empty Part No.)
  → Merged table
  → Download File B (Merged toolbar)
```

Not stored in IndexedDB — recomputed whenever `pendingParts` changes.

### Filter / group basis

| Rule | Behavior |
|------|----------|
| Group key | `normalize(partNumber) + "\|" + normalize(model)` — **Part No. only** (not Name fallback) |
| Model | `extractModelFromBatch(batch)` — first 3 letters (e.g. ALW6001 → ALW) |
| Empty model | shared `""` bucket for that part; display / export as **`UNKNOWN`** |
| Same part + same model | **1 row**; sum qty; `countInPending++` |
| Same part + different models | **separate rows** |
| Skipped | no Part No. (those stay in Pending + Undefined Rows only) |
| Qty | sum of pending `quantity` in the group |
| Columns | #, Model, Part No., Part Name, Total Qty, Count in Pending |

---

## 3. Models list

What it does: takes **Required / Merged** rows and filters to one selected model.

```text
requiredParts (= aggregateRequired(pendingParts))
  → listRequiredModels()     → dropdown (A–Z)
  → filterRequiredByModel()  → table for selected model
  → Download model Excel
```

Not stored — derived from Required.

### Filter / group basis

| Rule | Behavior |
|------|----------|
| Input | Required rows (already Part+Model aggregated) |
| Model list | unique `requiredModelLabel(model)` from Required |
| Empty model label | shown / matched as **`UNKNOWN`** |
| Table filter | `requiredModelLabel(part.model) === selectedModel` |
| Qty | same as Required row `totalQuantity` (no re-sum) |
| Columns | #, Model, Part No., Part Name, Qty |

---

## 4. Unique Parts list

What it does: takes pending parts only and groups by **Part No. only**.

```text
pendingParts
  → aggregateUniqueParts()
  → card number = uniqueParts.length
  → View dialog (scrollable + sticky header) / Download
```

Not stored in IndexedDB — recomputed whenever `pendingParts` changes.

### Filter / group basis

| Rule | Behavior |
|------|----------|
| Group key | normalized **Part Number** only |
| Ignored | batch, model, status, date, file name |
| Skipped | rows with **no Part No.** |
| Same Part No, different models | **1 row**; qty summed |
| Qty | sum of pending `quantity` for that Part No. |
| Part Name | first non-empty name seen for the group |
| Columns | #, Part No., Part Name, Qty |

---

## 5. Undefined Rows

What it does: surfaces pending rows that have **no Part No.** (still shown in Pending table; excluded from Merged / Unique / Models).

```text
pendingParts
  → isMissingPartNumber()
  → Undefined Rows popover on Total Pending card
  → lists 1-based indices into the pending list
```

Not stored — derived from `pendingParts`.

---

## Quick compare

| View | Source | Group / filter key |
|------|--------|-------------------|
| Pending | File A → status **text** filter | none (row-level) |
| Merged (Required) | pendingParts | Part No. **+ Model** (skip empty Part No.) |
| Models | Required | selected Model (`UNKNOWN` if empty) |
| Unique Parts | pendingParts | Part No **only** |
| Undefined Rows | pendingParts | empty Part No. (indices only) |
