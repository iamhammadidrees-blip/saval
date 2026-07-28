# Logic flow — filters & tables (FINAL as coded)

Source: `lib/excelParser.ts`, `lib/dataProcessor.ts`, dashboard components.  
All views below start from **pending parts** (or Required derived from them).  
Required / Models / Unique are **not** stored in IndexedDB — recomputed from `pendingParts`.

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
        ├─→ aggregateRequired()    → Required table / File B
        │         │
        │         └─→ filterRequiredByModel() → Models tab
        └─→ aggregateUniqueParts() → Unique Parts card
```

---

## 1. Pending list

What it does: shows every pending row kept after Status filter. One Excel pending row → one table row. No grouping.

```text
parseFileA()
  → filterPending() / isPendingRow()
  → toPendingParts()
  → store pendingParts
  → Pending table
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

Download Pending Excel is available from the **Models** tab toolbar (with File B).

---

## 2. Required table

What it does: takes pending parts only and groups by **Part No. + Model**.

```text
pendingParts
  → aggregateRequired()
  → Required table
  → Download File B (Models tab toolbar)
```

Not stored in IndexedDB — recomputed whenever `pendingParts` changes.

### Filter / group basis

| Rule | Behavior |
|------|----------|
| Group key | `normalize(partNumber) + "\|" + normalize(model)` |
| Model | `extractModelFromBatch(batch)` — first 3 letters (e.g. ALW6001 → ALW) |
| Empty model | shared `""` bucket for that part; display / export as **`UNKNOWN`** |
| Same part + same model | **1 row**; sum qty; `countInPending++` |
| Same part + different models | **separate rows** |
| Skipped | no Part No. |
| Qty | sum of pending `quantity` in the group |

---

## 3. Models list

What it does: takes **Required** rows and filters to one selected model.

```text
requiredParts (= aggregateRequired(pendingParts))
  → listRequiredModels()     → dropdown (A–Z)
  → filterRequiredByModel()  → table for selected model
  → Download model Excel
```

Also hosts shared exports: **Download File B** + **Download Pending** on the search toolbar.

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

## Quick compare

| View | Source | Group / filter key |
|------|--------|-------------------|
| Pending | File A → status **text** filter | none (row-level) |
| Required | pendingParts | Part No (or Name) **+ Model** |
| Models | Required | selected Model (`UNKNOWN` if empty) |
| Unique Parts | pendingParts | Part No **only** |
