# Hold Parts Dashboard

A browser-based dashboard for tracking and managing on-hold vehicle parts. Upload Excel **File A**, filter pending rows, explore aggregated views, and export results — all client-side with offline persistence.

## Features

- **Excel upload** — drag-and-drop `.xlsx` / `.xls` files; supports multiple source files
- **Pending table** — raw filtered rows from File A (one Excel row = one table row)
- **Merged view** — parts aggregated by Part No. + Model (batch prefix)
- **Models view** — filter merged data by model; export per-model Excel
- **Summary cards** — total pending rows, total quantity, unique parts, undefined rows
- **Exports** — Pending list, File B (merged), unique parts, per-model downloads
- **Backup & restore** — JSON snapshot of IndexedDB data
- **Persistent storage** — data survives page refresh via IndexedDB

## Tech stack

| Layer | Tools |
|-------|-------|
| Framework | [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| Data | ExcelJS (parse/export), IndexedDB via `idb`, Zustand |
| Tables | TanStack React Table |

## Getting started

**Prerequisites:** Node.js 20+, [pnpm](https://pnpm.io)

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Run production server (after build) |
| `pnpm lint` | Run ESLint |

For a clean production build, stop the dev server first:

```bash
pnpm build
pnpm start
```

## How data flows

```text
File A upload
  → parse & filter (drop rows whose status includes "resolve")
  → pendingParts (IndexedDB + Zustand)
        ├─ Pending tab
        ├─ Merged tab      (aggregate by Part No. + Model)
        ├─ Models tab      (filter merged by selected model)
        └─ Summary cards   (totals, unique parts, undefined rows)
```

- **Quantity** comes from the **Affected Qty** column in File A.
- **Merged / Models / Unique** views are derived in memory — not stored separately.
- Re-uploading a file with the **same name** replaces that file's rows; a **new filename** appends rows.

Full filter rules, grouping logic, and export formats: [`Doc/logic-flow.md`](Doc/logic-flow.md).

## Project structure

```text
app/                    Next.js App Router (layout, page, globals)
components/
  dashboard/            Dashboard, tabs, tables, summary cards
  upload/               Dropzone, uploaded files list
  common/               Shared DataTable
hooks/                  File upload, pending data hydration
lib/
  excelParser.ts        File A parsing & header detection
  dataProcessor.ts      Filters, aggregation, grouping
  exportUtils.ts        Excel export helpers
  indexedDB.ts          Browser persistence & backup
store/                  Zustand app state
constants/              Parser aliases, table columns, UI tokens
Doc/                    Specs, phases, logic flow, UI previews
```

## Documentation

| Document | Contents |
|----------|----------|
| [`Doc/logic-flow.md`](Doc/logic-flow.md) | Filters, tables, quantity rules (source of truth) |
| [`Doc/phase3.md`](Doc/phase3.md) | Current phase scope & checklist |
| [`Doc/BuildPlan.md`](Doc/BuildPlan.md) | Overall build plan |
| [`preview/palette.html`](preview/palette.html) | Design tokens & UI reference |

## Deploy

The app is fully static-client after hydration — suitable for Vercel, Netlify, or any static host:

```bash
pnpm build
```

Output is a static `/` route. No server-side API or database is required at runtime; all data lives in the user's browser (IndexedDB).

## License

Private project (`"private": true` in `package.json`).
