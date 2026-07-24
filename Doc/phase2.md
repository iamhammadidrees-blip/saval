# Phase 2 — Core Intelligence (step-by-step)

**Project:** Pending Parts Dashboard v2.0  
**Depends on:** Phase 1 complete (types, IndexedDB, Zustand hydrate, dashboard shell, FileDropzone stub)  
**Out of scope:** Backup/Restore UI polish, UploadedFilesList delete UX, Vercel deploy (Phase 3)

---

## Goal

Turn the Phase 1 shell into a working product core:

1. Parse File A Excel (color-aware, **2nd status column** left-to-right)
2. Filter pending rows only
3. Smart replace when same filename is re-uploaded
4. Aggregate Required Parts on-the-fly
5. Real Pending + Required tables
6. Export File B (and raw Pending Excel)

**Phase 2 exit:** Upload real File A → see pending rows + required summary → download File B → re-upload same file replaces data → refresh keeps data.

---

## Flow (Phase 2)

```
FileDropzone
  → excelParser (ExcelJS: headers, 2nd status column, color/keyword)
  → dataProcessor (filter pending + map to PendingPart[])
  → upsertFile (deleteByFileName if exists → put new parts + file meta)
  → IndexedDB + Zustand
  → aggregateRequired (computed)
  → SummaryCards + PendingTable + RequiredTable
  → exportUtils → File B / Pending Excel download
```

---

## Step 2.1 — Fill `constants/parserConfig.ts`

Single config file for all File A rules (easy to calibrate with sample).

Define:

| Config key | Purpose |
|---|---|
| `HEADER_ALIASES` | Map flexible header text → field keys (`partNumber`, `partName`, `batch`, `date`, `quantity`, `remarks`, `handlingMethod`) |
| `HEADER_MARKERS` | Strings that identify the real header row (e.g. `"Part No."`, `"Part Name"`) |
| `STATUS_HEADER_HINTS` | Detect status columns (`Status`, `Status-1`/`2`/`3`, dated under Status group — not Remarks) |
| `STATUS_COLUMN_RULE` | FINAL: `expectedCount: 2`, `decisionColumnIndex: 1` → **always 2nd status column** (not by name, not right-most) |
| `PENDING_COLORS` | Exact ARGB fills that mean pending (orange / yellow / light green) |
| `RESOLVED_COLORS` | Exact ARGB fill that means resolved (green `#92D050`) |
| `PENDING_KEYWORDS` | Fallback if color missing: `"under observation"`, `"need to order"`, `"need to order sub-assy part"` |
| `RESOLVED_KEYWORDS` | Fallback: `"issued from inventory"`, `/^pk[- ]?\d+/i` |
| `QUANTITY_FIELD` | Always `Affected Qty` (alias list) |

Also add small helpers here or in utils:

- `normalizeHeader(text)` — trim, lowercase, collapse spaces
- `isOrangeLike(argb)` / `isGreenLike(argb)` — fuzzy match (Excel orange varies)

**Done when:** config exports are typed and importable; no ExcelIO yet.

---

## Step 2.2 — `lib/excelParser.ts` (parse workbook → row records)

Use ExcelJS. Entry point:

```ts
parseFileA(buffer: ArrayBuffer, fileName: string): Promise<ParseResult>
```

### 2.2.1 Load workbook

1. `new ExcelJS.Workbook()` → `workbook.xlsx.load(buffer)`
2. Use first worksheet (or sheet with most data rows if needed)
3. Ignore images / drawings entirely

### 2.2.2 Find header row

1. Scan first ~30 rows
2. Pick first row that contains enough `HEADER_MARKERS` (both Part No. and Part Name preferred)
3. Build `colIndex → fieldKey` map from aliases
4. Collect **all real status column indexes** (Status / Status-N / dated under Status group; **not** Remarks); sort left → right
5. **Decision column (FINAL)** = **2nd** status column (`STATUS_COLUMN_RULE.decisionColumnIndex = 1`) — not Status-2-by-name, not right-most
6. Fail if fewer than 2 status columns: `"Could not find 2 status columns…"`

If header not found → throw clear error: `"Could not find header row (Part No. / Part Name)"`.

### 2.2.3 Read data rows

For each row after header:

1. Skip fully empty rows
2. Read mapped fields: partNumber, partName, batch, date, quantity (Affected Qty)
3. Read **2nd status column** cell: **text** + **fill color** (ARGB from `cell.fill`)
4. Skip rows with no partName and no partNumber

Return intermediate type (not yet filtered):

```ts
interface RawParsedRow {
  partName: string;
  partNumber?: string;
  batch?: string;
  date?: string;
  quantity: number;
  status: string;
  color?: string;       // "orange" | "yellow" | "lightgreen" | "green" | "none"
}
```

```ts
interface ParseResult {
  fileName: string;
  totalRows: number;
  rows: RawParsedRow[];
  errors: string[];     // soft warnings per row if any
}
```

**Done when:** unit-testable parse of a sample File A yields correct columns + **2nd status** text/color for a few known rows (calibrate against real `.xlsx` when available). See `Doc/decision.md`.

---

## Step 2.3 — Pending filter in `lib/dataProcessor.ts`

```ts
isPendingRow(row: RawParsedRow): boolean
filterPending(rows: RawParsedRow[]): RawParsedRow[]
toPendingParts(rows: RawParsedRow[], fileName: string): PendingPart[]
aggregateRequired(parts: PendingPart[]): RequiredPart[]
```

### Pending decision (confirmed)

1. **Color first:** if **2nd status column** fill is orange/yellow/light-green → pending; green → not pending
2. **Keyword fallback** if color is missing/none:
   - pending keywords → pending
   - resolved keywords / PK-ref pattern → not pending
3. If neither matches → treat as **not pending** (safe default; log warning)

### Map to `PendingPart`

- `id` = `nanoid()`
- `fileName` = source file name
- `quantity` = numeric Affected Qty (default 0 if invalid)
- `processedAt` = ISO now
- keep `status`, `color` from the **2nd status column** (plus date, batch, part fields)

### Aggregate Required Parts (FINAL as coded)

Group key: `normalize(partNumber || partName) + "|" + normalize(model)`  
where `model = extractModelFromBatch(batch)`.

For each group:

- `totalQuantity` = sum of quantities
- `countInPending` = number of rows
- `model` = single model string (empty batch → shared `""` bucket; UI/export may label `UNKNOWN`)
- `id` = stable `partKey|modelKey`

**RequiredPart is never written to IndexedDB** — compute in store selector / hook whenever `pendingParts` changes. See `Doc/decision.md`.

**Done when:** given a fixed array of RawParsedRow, filter + aggregate match expected counts from sample screenshot logic.

---

## Step 2.4 — Wire upload pipeline (smart replace)

### 2.4.1 `hooks/useFileUpload.ts`

1. Accept `File[]` from dropzone
2. For each file:
   - `arrayBuffer()`
   - `parseFileA(buffer, file.name)`
   - `filterPending` → `toPendingParts`
   - Build `UploadedFile` `{ fileName, uploadedAt, rowCount: pendingCount, status: "active" }`
   - Call store `upsertFile(fileMeta, parts)`
3. Toast summary per file or batch:
   - `"Apr.xlsx: 42 rows → 18 pending (replaced previous)"`
   - errors → toast.error with message

### 2.4.2 Complete `upsertFile` in Zustand (replace-by-fileName)

Exact order:

1. `await deleteByFileName(fileName)` in IndexedDB (file meta + old parts)
2. `await putFile(fileMeta)`
3. `await putPendingParts(parts)`
4. Update in-memory state:
   - remove old parts with that fileName
   - append new parts
   - upsert file in `files[]`
   - set `lastUpdated`
5. Do **not** store RequiredPart

### 2.4.3 Connect FileDropzone

Replace Phase 1 toast-only stub with `useFileUpload().onDrop`.

Show loading flag while parsing (`isLoading` or local `isParsing`).

**Done when:** dropping one File A fills cards/tables; dropping same filename again replaces rows (count changes, no duplicates).

---

## Step 2.5 — SummaryCards (live numbers)

Compute from store `pendingParts` + `files`:

| Card | Formula |
|---|---|
| Total Pending | `pendingParts.length` |
| Total Qty | `sum(quantity)` |
| Unique Parts | distinct group keys (same as Required) |
| Files Uploaded | `files.length` |

Re-render automatically when store updates. No IndexedDB reads in the component.

**Done when:** cards match table totals after upload.

---

## Step 2.6 — Column defs in `constants/tableColumns.ts`

### Pending table columns

Suggested: Date, Batch, Part No., Part Name, Qty, Status (badge by color), Status Date, Handling, Remarks, Source File

### Required table columns

Suggested: Part No., Part Name, Total Qty, Count in Pending, Files Involved, Last Updated

Export column helper factories for TanStack `ColumnDef<PendingPart>` / `ColumnDef<RequiredPart>`.

**Done when:** columns compile and import into table components.

---

## Step 2.7 — Real tables (TanStack React Table v8)

### 2.7.1 Optional shared `components/common/DataTable.tsx`

Generic table wrapper: header, body, sorting, global filter input, empty state.

### 2.7.2 `PendingTable.tsx`

- Data = `pendingParts` from store
- Features: sort, global search, color badge on status
- Empty state: "Upload File A to see pending parts"

### 2.7.3 `RequiredTable.tsx`

- Data = `aggregateRequired(pendingParts)` (via `useMemo` / selector in `usePendingData`)
- Features: sort, global search
- Empty state: "No required parts yet"

Wire both into existing `DashboardTabs` (replace placeholders).

**Done when:** both tabs show real data after upload; search/sort work.

---

## Step 2.8 — `lib/exportUtils.ts` (File B + Pending export)

Use ExcelJS for write (consistent with parse).

### File B — Required Parts (primary)

Columns: Part No., Part Name, Total Qty, Count in Pending, Files Involved, Last Updated

- Styled header row (bold, light fill)
- Filename suggestion: `Required_Parts_FileB_YYYY-MM-DD.xlsx`
- Trigger download in browser (`Blob` + object URL)

### Pending export — raw list

Columns mirror Pending table (all detail fields)

- Filename: `Pending_Parts_YYYY-MM-DD.xlsx`

### UI

Replace Phase 1 disabled Export buttons with working:

- **Download File B** (Required)
- **Download Pending** (optional secondary)

Disable buttons when arrays are empty.

**Done when:** exported File B opens in Excel and totals match Required tab.

---

## Step 2.9 — Calibration with real sample File A

1. Place client sample `.xlsx` under e.g. `Doc/samples/` (or project root — gitignore if large)
2. Upload in UI
3. Spot-check against screenshot rules:
   - Orange "Need to Order" / "Under Observation" → pending
   - Green "Issued from Inventory" / PK-xxxx → excluded
   - Qty uses Affected Qty
   - Latest status column wins when multiple status dates exist
4. Adjust `parserConfig.ts` color hex / keywords until matches expected pending count
5. Document the expected pending count for that sample in a short comment in `parserConfig.ts`

**Done when:** sample file produces correct pending set and File B.

---

## Step 2.10 — Smoke verify checklist (Phase 2 done)

- [ ] Upload one File A → Pending tab populated
- [ ] Required tab shows aggregated unique parts + summed Affected Qty
- [ ] Summary cards match tables
- [ ] Re-upload same filename → old rows gone, new rows only (no duplicates)
- [ ] Upload a second different filename → both files' pending rows coexist
- [ ] Download File B opens correctly; numbers match Required tab
- [ ] Download Pending Excel opens correctly
- [ ] Refresh page → data still present (IndexedDB)
- [ ] Corrupt / non-Excel file → clear toast error, app does not crash
- [ ] Sheet with only resolved (green) rows → empty pending + helpful empty state

**Phase 2 exit:** core intelligence works end-to-end with real File A. Phase 3 adds file list delete UX, Backup/Restore UI, polish, Vercel.

---

## Files touched in Phase 2 (new or filled)

```
constants/parserConfig.ts      ← fill (was stub)
constants/tableColumns.ts      ← fill (was stub)
lib/excelParser.ts             ← new
lib/dataProcessor.ts           ← new
lib/exportUtils.ts             ← new
hooks/useFileUpload.ts         ← new
hooks/usePendingData.ts        ← extend (aggregate selector)
store/useAppStore.ts           ← complete upsertFile replace path
components/upload/FileDropzone.tsx
components/dashboard/SummaryCards.tsx
components/dashboard/PendingTable.tsx
components/dashboard/RequiredTable.tsx
components/dashboard/DashboardTabs.tsx
components/common/DataTable.tsx      ← optional
components/common/ExportButtons.tsx  ← optional
```

---

## Suggested build order (one sitting each)

| Order | Step | Focus |
|------:|------|--------|
| 1 | 2.1 | parserConfig |
| 2 | 2.2 | excelParser |
| 3 | 2.3 | dataProcessor (filter + aggregate) |
| 4 | 2.4 | upload pipeline + upsertFile |
| 5 | 2.5–2.7 | cards + columns + tables |
| 6 | 2.8 | export File B |
| 7 | 2.9–2.10 | calibrate + checklist |
