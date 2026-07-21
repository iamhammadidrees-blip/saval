# UI / Table Additions (step-by-step)

**Project:** Pending Parts Dashboard v2.0  
**Depends on:** App already built (Pending + Required tables in place)  
**Decision rules:** unchanged — see [Doc/decision.md](decision.md). Color fill is still used **only** in the parser (`isPendingRow`) to decide pending vs not. No edits to decision / parse / filter logic.

---

## Summary of changes

| # | Change | Edit code? |
|---|---|---|
| 1 | Pending table: show Status as **plain text only** (no color fill / Badge) | Yes |
| 2 | Color still used for **decision of parts** (Status 2 fill → pending filter) | No |
| 3 | Add **index (#)** column to Pending and Required tables | Yes |
| 4 | Required table: add **static** column with tag `"pending"` on every row | Yes |

---

## Step A1 — Pending Status: text only (no color UI)

**File:** [constants/tableColumns.ts](../constants/tableColumns.ts)

Current Status cell uses `Badge` + `statusBadgeClass(color)` (orange/yellow/green fills).

**Change:**

1. Replace Status `cell` with plain text: `displayText(row.original.status)`.
2. Remove `statusBadgeClass` helper if unused.
3. Remove `Badge` / `createElement` imports if no longer needed in this file.
4. Keep storing `color` on `PendingPart` in DB (still useful for debugging / future); just **do not render** it in the Pending tab.

**Do not touch:**

- `lib/excelParser.ts`
- `lib/dataProcessor.ts` / `isPendingRow`
- `constants/parserConfig.ts`
- [Doc/decision.md](decision.md)

**Done when:** Pending tab Status column shows text like `"Need to Order"` with no colored background.

---

## Step A2 — Color for decision only (confirm, no code)

Per [Doc/decision.md](decision.md):

- Status 2 (right-most status) fill color decides first
- Orange / yellow / lightgreen → pending; green → drop
- Keyword fallback if no fill
- Only pending rows reach IndexedDB

**Action:** none. Verify after A1 that uploads still filter correctly (regression only).

---

## Step A3 — Index column on both tables

**File:** [constants/tableColumns.ts](../constants/tableColumns.ts)

Add a first column to **both** `createPendingColumns()` and `createRequiredColumns()`:

| Prop | Value |
|---|---|
| `id` | `"index"` |
| `header` | `"#"` (or `"Sr."`) |
| `cell` | `row.index + 1` (1-based index of the **current** sorted/filtered view) |
| `enableSorting` | `false` (optional) |

Notes:

- Index follows the visible table order after search/sort (standard list index).
- No need to store index in IndexedDB or on `PendingPart` / `RequiredPart`.

**Done when:** both tabs show `#` as the leftmost column: 1, 2, 3…

---

## Step A4 — Static `"pending"` tag column on Required table

**File:** [constants/tableColumns.ts](../constants/tableColumns.ts) (`createRequiredColumns` only)

Add a column (suggested placement: after `#`, or after Part Name — prefer **after index**, before Part No.):

| Prop | Value |
|---|---|
| `id` | `"tag"` or `"state"` |
| `header` | `"Status"` or `"Tag"` |
| `cell` | always `"pending"` (static string; ignore row data) |

UI options (pick one when implementing):

- Plain text: `"pending"`
- Or a neutral Badge with text `"pending"` (no Excel color mapping — this is a fixed label, not Status 2 fill)

**Do not** derive this from Excel color. Every Required row is already aggregated from pending parts, so the tag is always `"pending"`.

**Done when:** Required tab shows a column where every row displays `pending`.

---

## Suggested column order after changes

### Pending tab

`#` → Date → Batch → Part No. → Part Name → Qty → Status *(text only)*

### Required tab

`#` → Status/Tag (`pending`) → Part No. → Part Name → Total Qty → Count in Pending  
*(or: `#` → Part No. → … → Tag — either is fine; default = Tag early for visibility)*

---

## Step A5 — Smoke checklist

- [ ] Pending Status has **no** orange/yellow/green cell fill
- [ ] Pending Status still shows correct status **text** from Status 2
- [ ] Re-upload File A: green rows still excluded; orange/yellow/lightgreen still pending (decision unchanged)
- [ ] Both tables show `#` 1…N matching visible row order
- [ ] Search/sort updates `#` to the new visible order
- [ ] Required table every row shows static `pending` tag
- [ ] File B export: decide whether to include `#` / `pending` tag columns (default: **optional** — only add if client wants them in Excel; UI change does not require export change unless requested)

---

## Files to edit

```
constants/tableColumns.ts     ← main change (A1, A3, A4)
```

Optional only if export should match UI:

```
lib/exportUtils.ts            ← add # / pending tag columns to Excel (only if requested)
constants/tableColumns.ts     ← already covers UI
```

No changes to parser, processor, store, or decision docs.

---

## Build order

| Order | Step | Focus |
|------:|------|--------|
| 1 | A1 | Plain-text Status in Pending |
| 2 | A3 | Index column both tables |
| 3 | A4 | Static `pending` tag on Required |
| 4 | A2 + A5 | Regression on color decision + checklist |
