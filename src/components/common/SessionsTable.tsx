"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { formatUSD } from "@/lib/cost";
import type { SessionSummary } from "@/lib/types";
import Link from "next/link";

interface SessionsTableProps {
  sessions: SessionSummary[];
}

export function SessionsTable({ sessions }: SessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[#888888]">
        No sessions found
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2a2a]">
      <Table>
        <TableHeader>
          <TableRow className="border-[#2a2a2a] bg-[#121212] hover:bg-[#121212]">
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-[#888888]">
              Project
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-[#888888]">
              Date
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-[#888888] text-right">
              Duration
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-[#888888] text-right">
              Input
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-[#888888] text-right">
              Output
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-[#888888] text-right">
              Cost
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-widest text-[#888888]">
              Tools
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow
              key={session.sessionId}
              className="border-[#2a2a2a] hover:bg-[#1a1a1a] cursor-pointer transition-colors"
            >
              <TableCell className="max-w-50 truncate">
                <Link
                  href={`/claude-usage/${session.sessionId}`}
                  className="text-[#ffffff] font-medium hover:text-[#faff69] transition-colors"
                >
                  {session.projectPath.split(/[/\\]/).pop() ?? session.projectPath}
                </Link>
              </TableCell>
              <TableCell className="text-[#888888]">
                {format(new Date(session.startTime), "yyyy-MM-dd HH:mm")}
              </TableCell>
              <TableCell className="text-right text-[#888888]">
                {Math.round(session.durationMinutes)}m
              </TableCell>
              <TableCell className="text-right text-[#faff69]">
                {session.inputTokens.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-[#3b82f6]">
                {session.outputTokens.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-[#22c55e]">
                ${session.estimatedCostUSD.toFixed(4)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  {session.topTools.slice(0, 3).map((t) => (
                    <span
                      key={t.tool}
                      className="inline-flex items-center rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1 text-[11px] font-medium text-[#888888]"
                    >
                      {t.tool}
                    </span>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}