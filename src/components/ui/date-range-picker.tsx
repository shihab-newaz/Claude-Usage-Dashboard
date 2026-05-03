"use client"

import * as React from "react"
import { format, startOfMonth, subDays, startOfDay } from "date-fns"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  value?: { from?: string; to?: string }
  onChange?: (range: { from?: string; to?: string }) => void
  className?: string
}

type Preset = { label: string; days?: number; thisMonth?: boolean; allTime?: boolean }

const PRESETS: Preset[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "This Month", thisMonth: true },
  { label: "All Time", allTime: true },
]

function toInputValue(d: Date): string {
  return format(d, "yyyy-MM-dd")
}

function getPresetRange(preset: Preset): { from?: string; to?: string } {
  const today = startOfDay(new Date())
  if (preset.allTime) return {}
  if (preset.days) return { from: toInputValue(subDays(today, preset.days - 1)), to: toInputValue(today) }
  if (preset.thisMonth) return { from: toInputValue(startOfMonth(today)), to: toInputValue(today) }
  return {}
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const range = value ?? {}

  function handlePreset(preset: Preset) {
    onChange?.(getPresetRange(preset))
  }

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.({ from: e.target.value || undefined, to: range.to })
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange?.({ from: range.from, to: e.target.value || undefined })
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Preset buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset)}
            className={cn(
              "text-xs h-7 px-2",
              preset.allTime && !range.from && !range.to && buttonVariants({ variant: "secondary" })
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Date inputs */}
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={range.from ?? ""}
          onChange={handleFromChange}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={range.to ?? ""}
          onChange={handleToChange}
          className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        />
      </div>
    </div>
  )
}