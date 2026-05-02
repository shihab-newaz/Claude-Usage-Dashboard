# Claude Usage Dashboard

Personal analytics dashboard for tracking Claude Code usage. Reads transcript data and displays aggregated metrics including tokens, cost, and tool usage.

## Tech Stack

- **Next.js 16** (App Router)
- **Tailwind CSS** + shadcn/ui
- **Recharts** for data visualization
- **TanStack Query** for data fetching
- **Zustand** for UI state

## Data Source

Reads from local Claude Code transcript files:

- `~/.claude/usage-data/session-meta/` — per-session aggregated stats
- `~/.claude/usage-data/facets/` — per-session detailed facets
- `~/.claude/history.jsonl` — global session history

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   └── (dashboard)/      # Dashboard pages
├── components/
│   ├── charts/           # Recharts components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
└── lib/
    ├── db/               # Database parsing & sync
    └── types/            # TypeScript types
```

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run lint` — Run ESLint
