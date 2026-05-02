"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatUSD } from "@/lib/cost";
import type { SessionSummary } from "@/lib/types";

interface SessionsTableProps {
  sessions: SessionSummary[];
}

export function SessionsTable({ sessions }: SessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground">
        No sessions found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead className="text-right">Input Tokens</TableHead>
            <TableHead className="text-right">Output Tokens</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Lines</TableHead>
            <TableHead>Top Tools</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.sessionId}>
              <TableCell className="max-w-[200px] truncate font-medium">
                {session.projectPath.split(/[/\\]/).pop() ?? session.projectPath}
              </TableCell>
              <TableCell>
                {format(new Date(session.startTime), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell className="text-right">{session.durationMinutes}m</TableCell>
              <TableCell className="text-right">
                {session.inputTokens.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {session.outputTokens.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{formatUSD(session.estimatedCostUSD)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-green-600">+{session.linesAdded.toLocaleString()}</span>
                {" / "}
                <span className="text-red-600">-{session.linesRemoved.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {session.topTools.slice(0, 3).map((t) => (
                    <Badge key={t.tool} variant="outline" className="text-xs">
                      {t.tool}
                    </Badge>
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
