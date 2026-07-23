### decision with color fills and text match _  
pending - db ; 

Which cell decides?
Only Status 2 (or the right-most status column if there’s no header named “Status 2”).

For each Excel row the parser reads:

Status 2 cell
  → text  (e.g. "Need to Order")
  → fill color ARGB (e.g. FFFFC000 = orange)
Status 1 is ignored for the decision.
---------------------------------------------------------

2. How Status 2 color decides pending vs not
Color is mapped first:

Status 2 fill	Mapped as	Decision
#FFC000 orange
orange
Pending
#FFFF00 yellow
yellow
Pending
#A9D08E light green
lightgreen
Pending
#92D050 green
green
Not pending
No / unknown fill
none

-----------------------------------------------
Fall back to keywords
Decision order in isPendingRow():

1. Color pending?  → keep
2. Color green?    → drop
3. Else keywords:
     "need to order", "under observation" → keep
     "issued from inventory", PK-xxxx     → drop


4. Else            → drop (not pending)
Only pending rows continue. Resolved green rows never reach the DB.

----------------------------------------------------------
3. Full flow into the database

Drop Excel file
    ↓
parseFileA()
  - find Status 2 column
  - for each row: read Status 2 text + fill color
  - return ALL raw rows (pending + resolved)
    ↓
filterPending()
  - keep only pending by color/keywords
    ↓
toPendingParts()
  - add id, fileName, quantity, status, color, ...
    ↓
upsertFile()  (Zustand + IndexedDB)
  1. deleteByFileName(fileName)   ← remove old data for same name
  2. putFile(fileMeta)            ← uploadedFiles store
  3. putPendingParts(parts)       ← pendingParts store
  4. update in-memory store       ← UI refreshes
    ↓
Dashboard
  - Pending table ← pendingParts from store/DB
  - Required table ← aggregateRequired(pendingParts)  [NOT stored in DB]

What is stored in IndexedDB
Store	Contents
uploadedFiles
File name, upload time, pending count
pendingParts

---------------------------------------------------------
Only pending rows (with status + color from Status 2)

What is not stored
Full Excel workbook
Resolved/green rows
Required aggregated rows (computed live from pending)

On refresh
Page load → hydrate() → read IndexedDB → Zustand → tables
No re-parse of Excel unless the user uploads again.
-------------------------------------------
Dropped → never in DB
Bottom line: Status 2 fill color decides first; only pending rows are written to IndexedDB; Required is calculated from that stored pending list, not saved separately.

----------------------------------------------------------
4. Required aggregation (Part No + Model)

Group key = normalize(partNumber || partName) + "|" + normalize(model)

- model = extractModelFromBatch(batch) — first 3 letters of Batch (e.g. ALW6001 → ALW)
- Empty / unparseable batch → model key "" (shared "no model" bucket for that part)
- Same Part No + same model → one Required row; sum Affected Qty; countInPending++
- Same Part No + different models → separate Required rows (each with own qty)
- RequiredPart.model is a single model string (not a joined list)
- Unique Parts summary card = distinct Part No (or Part Name fallback), NOT part+model rows