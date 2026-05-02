# Claude Usage Dashboard Feature Roadmap

This document turns the initial feature brainstorm into implementation-ready notes. Each feature includes the user value, the likely app/database touch points, and a concrete build path.

## 1. Full Sessions API and Real All Sessions View

### What It Adds

The dashboard currently exposes `recentSessions`, which is capped at 10 sessions. A real sessions API would power the All Sessions page, exports, project aggregation, and search without silently dropping older data.

### Implementation

- Add `GET /api/sessions` with query parameters for `limit`, `offset`, `sort`, `order`, `project`, `model`, `tool`, `dateFrom`, and `dateTo`.
- Query the `sessions` table directly and join per-session tools/languages only for the current page of rows.
- Return pagination metadata: `total`, `limit`, `offset`, `hasMore`.
- Update `SessionSummary` or add a separate `PaginatedSessionsResponse` type.
- Add a `useSessions` hook backed by TanStack Query.
- Update `src/app/(dashboard)/claude-usage/sessions/page.tsx` to use the new hook instead of `useClaudeUsage().recentSessions`.
- Add pagination controls and basic empty/loading/error states.

### Notes

Keep `/api/claude-usage` focused on overview data. Avoid expanding it into a large all-purpose payload.

## 2. Date Range Filters

### What It Adds

Global time filtering makes every metric more useful: last 7 days, last 30 days, this month, all time, and custom date ranges.

### Implementation

- Add optional `dateFrom` and `dateTo` query parameters to `/api/claude-usage`.
- Apply the date filter consistently to summary totals, time series, tool breakdown, language breakdown, model breakdown, and recent sessions.
- Add a small date-range control near the dashboard header.
- Store the selected range in URL search params so links are shareable and refresh-safe.
- Update `useClaudeUsage` to include the active filters in its query key.
- Reuse the same date range params for `/api/sessions` and future aggregation endpoints.

### Notes

Default to all time to preserve current behavior.

## 3. Project-Level Backend Analytics

### What It Adds

The Projects page currently computes project stats from only recent sessions. Backend aggregation would make it accurate and unlock richer project comparisons.

### Implementation

- Add `GET /api/projects` with optional `dateFrom`, `dateTo`, `limit`, and `offset`.
- Group by `sessions.project_path`.
- Return per-project totals: sessions, input tokens, output tokens, cache tokens, cost, duration, user messages, assistant messages, first session, and last session.
- Add top tools per project by joining `session_tools`.
- Add top models per project by joining `session_models`.
- Create a `ProjectUsageEntry` type.
- Update `src/app/(dashboard)/claude-usage/projects/page.tsx` to consume the API instead of deriving from `recentSessions`.
- Add project detail navigation later if needed: `/claude-usage/projects/[projectId]` or a query-param detail view.

### Notes

Project paths may be long and machine-specific. Display the folder name prominently and keep the full path as secondary text.

## 4. Cost Forecasting

### What It Adds

Forecasting turns the dashboard from historical reporting into a lightweight budget tool.

### Implementation

- Add current-month aggregation to `/api/claude-usage` or a dedicated `GET /api/cost`.
- Compute:
  - month-to-date cost
  - average daily cost for active days
  - projected month-end cost
  - highest-cost day
  - highest-cost session
- Add metric cards on the overview page.
- Add a small cost trend chart using the existing area/bar chart components.
- Use the existing `estimateCost` helper everywhere instead of duplicating pricing formulas.

### Notes

Forecasting should clearly label itself as estimated. Use calendar days elapsed for conservative projections, and optionally add active-day projections later.

## 5. Token Efficiency Metrics

### What It Adds

Efficiency metrics help explain how usage changes, not just how much usage happened.

### Implementation

- Add derived fields to the overview response:
  - average cost per session
  - tokens per session
  - output tokens per user message
  - tool calls per session
  - tokens per minute
  - cache hit rate
- Add a compact "Efficiency" section to the overview page.
- Add a tooltip or small label for metrics that may be misunderstood, especially cache hit rate.
- Handle divide-by-zero cases with `0` or `"N/A"` depending on the UI context.

### Notes

These can be computed in the API without schema changes.

## 6. Session Search and Filters

### What It Adds

Search makes the session list useful once the data set grows beyond a handful of sessions.

### Implementation

- Build on the full sessions API.
- Add filters for project path/name, model, tool, minimum cost, maximum cost, date range, MCP usage, and Task agent usage.
- Add debounced text input for project/session search.
- Add select controls for model and tool filters populated from existing breakdown data or a small metadata endpoint.
- Keep active filters in URL search params.
- Show active filter chips with clear actions.

### Notes

Start with project search and date range first. Add model/tool filters after the API shape is stable.

## 7. Tool Usage Timeline

### What It Adds

Tool timeline charts show how behavior changes over time: Bash-heavy days, edit-heavy sessions, or increased search/read activity.

### Implementation

- Add `GET /api/tools/timeline`.
- Join `sessions` and `session_tools`, bucket by `DATE(sessions.start_time)`, and group by tool name.
- Support `dateFrom`, `dateTo`, and optional `tools` query params.
- Add a stacked bar or multi-series area chart to the Tools page.
- Default to the top 5 tools and group the rest into "Other".

### Notes

Keep the response bounded. Without a top-tools limit, a multi-series chart can become noisy quickly.

## 8. Code Change Metrics

### What It Adds

The schema already has `lines_added`, `lines_removed`, and `files_modified`, but they are currently stored as zero. Filling them in would make the dashboard feel more tied to actual coding output.

### Implementation

- Extend `parseJsonlFile` to inspect Write, Edit, and MultiEdit tool inputs.
- Track touched file paths per session and derive `filesModified`.
- For Write calls, estimate added lines from the written content if available.
- For Edit/MultiEdit calls, estimate line churn from old/new string line counts when available.
- Persist `linesAdded`, `linesRemoved`, and `filesModified` in `syncAllSessions` instead of hardcoding zeros.
- Add these metrics to session summaries, project stats, and overview cards.
- Add tests or fixture parsing samples for Write/Edit/MultiEdit entries.

### Notes

Treat these as estimates. Tool input shape can vary, so parsing should be defensive and skip unknown shapes.

## 9. Model Comparison Page

### What It Adds

The existing model page can become a true comparison surface instead of only summary charts.

### Implementation

- Add derived per-model metrics:
  - average input tokens per message
  - average output tokens per message
  - estimated cost per message
  - percentage of total spend
  - percentage of total messages
- Add a sortable model details table.
- Add a model trend chart grouped by day.
- Optionally add a model filter that can drive the sessions page.

### Notes

Use the existing `session_models` table. No schema changes should be required for the first version.

## 10. Activity Heatmap

### What It Adds

A GitHub-style heatmap makes personal Claude Code activity patterns immediately visible.

### Implementation

- Reuse the existing daily time series from `/api/claude-usage`.
- Add a heatmap component that maps dates to intensity.
- Let the user switch intensity mode between sessions, tokens, duration, and cost.
- Add the heatmap to the overview page below the top metrics.
- Use stable square dimensions so the grid does not shift while loading.

### Notes

This can be implemented entirely on the client once the time series includes enough fields. Cost and duration may require adding fields to `TimeSeriesPoint`.

## 11. Today's Usage Command Center

### What It Adds

A focused daily page makes the app useful as a quick check-in tool.

### Implementation

- Add `/claude-usage/today`.
- Query usage data with `dateFrom` set to the local start of today and `dateTo` set to now.
- Show sessions today, cost today, tokens today, active projects, top tools, top models, and last session.
- Add comparison to yesterday using a second query or a dedicated endpoint.
- Add a sidebar link under Analytics.

### Notes

Use local time consistently. The app is personal, so user-local calendar days are more intuitive than UTC days.

## 12. Personal Coding Rhythm

### What It Adds

This shows when Claude Code is most often used by hour and weekday.

### Implementation

- Add `GET /api/activity/rhythm`.
- Group sessions by local hour of day and day of week.
- Return counts, tokens, duration, and cost per bucket.
- Add a page or overview section with:
  - hour-of-day bar chart
  - weekday chart
  - longest sessions
  - most active time window
- Add date range support.

### Notes

SQLite date/time handling can be tricky with time zones. Prefer doing local-time bucketing in TypeScript after fetching the relevant session rows unless the data grows large.

## 13. Session Replay Lite

### What It Adds

Session detail becomes a readable timeline instead of only aggregate metrics.

### Implementation

- Add a parser path that can read a single JSONL transcript by session id.
- Add `GET /api/sessions/[id]/timeline`.
- Return sanitized timeline events:
  - user message
  - assistant message summary
  - tool call name
  - tool result status if available
  - timestamp
  - token usage for assistant events
- Add a timeline section to `src/app/(dashboard)/claude-usage/[sessionId]/page.tsx`.
- Collapse long text by default and avoid rendering huge transcript payloads all at once.

### Notes

Be careful with privacy. Avoid exporting or displaying full sensitive content unless the user intentionally opens it.

## 14. Anomaly Detection

### What It Adds

The app can automatically surface unusual sessions worth reviewing.

### Implementation

- Add a derived anomalies section to `/api/claude-usage` or a dedicated `GET /api/anomalies`.
- Compare each session against global or date-range averages.
- Flag sessions with:
  - unusually high cost
  - unusually long duration
  - unusually high tool count
  - unusually high cache creation
  - unusually high output tokens
- Add an "Anomalies" panel to the overview page with links to session detail pages.

### Notes

Start with simple threshold-based rules. Avoid complex statistics until there is enough data to justify it.

## 15. Budget Alerts

### What It Adds

Budget alerts make costs more actionable.

### Implementation

- Add a settings page to configure daily budget, monthly budget, and per-session warning threshold.
- Store settings locally first, either in localStorage or a small SQLite settings table.
- Compare current usage against configured thresholds.
- Show warning cards on overview and today pages.
- Add budget fields to exports if useful.

### Notes

For a personal local dashboard, localStorage is enough for v1. Use SQLite only if settings need to affect server-side API responses.

## Suggested Build Order

1. Full sessions API and real All Sessions page.
2. Date range filters.
3. Project-level backend analytics.
4. Token efficiency metrics.
5. Today's Usage page.
6. Cost forecasting.
7. Tool timeline.
8. Code change metrics.
9. Model comparison improvements.
10. Activity heatmap.
11. Session search and filters.
12. Personal coding rhythm.
13. Session replay lite.
14. Anomaly detection.
15. Budget alerts.

This order fixes data correctness first, then adds daily usefulness, then layers on deeper analytics.
