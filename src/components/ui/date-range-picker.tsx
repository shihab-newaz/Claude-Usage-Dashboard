"use client"

import * as React from "react"
import {
  DateRangePicker as RDRPicker,
  defaultStaticRanges,
  type Range,
} from "react-date-range"
import { format, startOfMonth, subDays, startOfDay } from "date-fns"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  value?: { from?: string; to?: string }
  onChange?: (range: { from?: string; to?: string }) => void
  className?: string
}

function toInputValue(d: Date): string {
  return format(d, "yyyy-MM-dd")
}

function toDate(value?: string): Date | undefined {
  return value ? new Date(value + "T00:00:00") : undefined
}

function toRange(value?: { from?: string; to?: string }): Range {
  return {
    startDate: toDate(value?.from),
    endDate: toDate(value?.to),
    key: "selection",
  }
}

const PRESETS = [
  {
    label: "Last 7 Days",
    range() {
      const t = startOfDay(new Date())
      return { startDate: subDays(t, 6), endDate: t }
    },
  },
  {
    label: "Last 30 Days",
    range() {
      const t = startOfDay(new Date())
      return { startDate: subDays(t, 29), endDate: t }
    },
  },
  {
    label: "This Month",
    range() {
      const t = startOfDay(new Date())
      return { startDate: startOfMonth(t), endDate: t }
    },
  },
  {
    label: "All Time",
    range() {
      return { startDate: undefined, endDate: undefined }
    },
  },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [sel, setSel] = React.useState<Range>(toRange(value))

  // Keep internal state in sync when value prop changes externally
  React.useEffect(() => {
    setSel(toRange(value))
  }, [value])

  function handleChange(r: Range) {
    setSel(r)
    onChange?.({
      from: r.startDate ? toInputValue(r.startDate) : undefined,
      to: r.endDate ? toInputValue(r.endDate) : undefined,
    })
  }

  function handlePreset(fn: () => { startDate?: Date; endDate?: Date }) {
    const r = fn()
    const range: Range = { startDate: r.startDate, endDate: r.endDate, key: "selection" }
    setSel(range)
    onChange?.({
      from: r.startDate ? toInputValue(r.startDate) : undefined,
      to: r.endDate ? toInputValue(r.endDate) : undefined,
    })
    setOpen(false)
  }

  const displayValue = sel.startDate && sel.endDate
    ? `${toInputValue(sel.startDate)} → ${toInputValue(sel.endDate)}`
    : sel.startDate
    ? `${toInputValue(sel.startDate)} → …`
    : "All Time"

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Preset shortcuts */}
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(p.range)}
            className="text-xs h-7 px-2"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Calendar trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Button
            variant="outline"
            className="h-8 px-2.5 text-xs justify-start font-normal"
            onClick={() => setOpen((v) => !v)}
          >
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <RDRPicker
            date={sel.startDate ?? new Date()}
            onChange={handleChange}
            ranges={[sel]}
            staticRanges={defaultStaticRanges}
            inputRanges={[]}
            showMonthAndYearPickers
            direction="horizontal"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
