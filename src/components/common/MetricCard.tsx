"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({ label, value, icon: Icon, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] p-6 transition-all duration-300 hover:border-[#faff69]/30",
        className
      )}
    >
      {/* Subtle accent line at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#faff69]/20 to-transparent" />

      <div className="flex items-start justify-between gap-4">
        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-[#888888] mb-3">
            {label}
          </p>
          {/* Stat value — yellow, large */}
          <p className="font-stat-display text-[#faff69] truncate">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>

        {/* Icon */}
        {Icon && (
          <div className="flex-shrink-0 rounded-lg bg-[#242424] border border-[#2a2a2a] p-3">
            <Icon className="h-5 w-5 text-[#faff69]" />
          </div>
        )}
      </div>
    </div>
  );
}