# CLAUDE.md

## Project Overview

Personal Claude Code usage analytics dashboard. Reads transcript data from
`~/.claude/` and displays aggregated metrics (tokens, cost, tool usage).

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS + shadcn/ui
- Recharts for charts
- TanStack Query for data fetching
- Zustand for UI state

## Data Source

Read-only access to transcript JSON files at:
- `C:\Users\bteb\.claude\usage-data\session-meta\` — per-session aggregated stats
- `C:\Users\bteb\.claude\usage-data\facets\` — per-session detailed facets
- `C:\Users\bteb\.claude\history.jsonl` — global session history

## Key Conventions

- API routes go in `src/app/api/`
- Dashboard pages in `src/app/(dashboard)/`
- Custom hooks in `src/hooks/`
- Recharts components in `src/components/charts/`
- All API responses use NextResponse.json()
