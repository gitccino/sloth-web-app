import { useState } from 'react'
import {
  Archive,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Moon,
  Plus,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface CalendarDropdownProps {
  selectedDate?: Date | null
  onSelectDate?: (date: Date | null) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  icon?: LucideIcon
}

export function CalendarDropdown({
  selectedDate,
  onSelectDate,
  open,
  onOpenChange,
  icon: Icon = CalendarDays,
}: CalendarDropdownProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  // Get days from previous month to fill the first row
  const prevMonthDays = getDaysInMonth(
    viewMonth === 0 ? viewYear - 1 : viewYear,
    viewMonth === 0 ? 11 : viewMonth - 1,
  )

  const isToday = (day: number) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

  const isPast = (day: number) => {
    const date = new Date(viewYear, viewMonth, day)
    // Zero out time to compare dates only
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    )
    return date < todayStart
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      day === selectedDate.getDate() &&
      viewMonth === selectedDate.getMonth() &&
      viewYear === selectedDate.getFullYear()
    )
  }

  const isCurrentOrPastMonth =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth <= today.getMonth())

  const handlePrevMonth = () => {
    if (isCurrentOrPastMonth) return
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleSelectDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day)
    onSelectDate?.(date)
    onOpenChange?.(false)
  }

  const handleSelectToday = () => {
    onSelectDate?.(today)
    onOpenChange?.(false)
  }

  // const handleSelectSomeday = () => {
  //   // Someday = no specific date, just a marker
  //   onSelectDate?.(null)
  //   onOpenChange?.(false)
  // }

  // Build calendar grid cells
  const cells: Array<{
    day: number
    isCurrentMonth: boolean
    key: string
  }> = []

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      key: `prev-${prevMonthDays - i}`,
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true, key: `curr-${d}` })
  }

  // Next month leading days to fill the last row
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, isCurrentMonth: false, key: `next-${i}` })
    }
  }

  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', {
    month: 'long',
  })

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="none"
          size="none"
          className={cn(
            'p-1 hover:bg-[#4c4c50] rounded-md [&_svg]:pointer-events-auto outline-none border-0 ring-0',
            open && 'bg-sloth-background-hover-2',
          )}
        >
          <Icon size={12} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 p-0 bg-sloth-aside-background border-0 shadow-lg rounded-lg text-core-background"
      >
        {/* Quick options */}
        <div className="flex flex-col px-1 pt-1">
          <button
            type="button"
            className="flex items-center gap-2 px-2.5 py-1 rounded-md text-sm font-medium hover:bg-sloth-aside-background-hover transition-colors text-left"
            onClick={handleSelectToday}
          >
            <Star size={14} color="#FFD400" fill="#FFD400" />
            <span>Today</span>
          </button>
          {/* <button
            type="button"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium hover:bg-[#4c4c50] transition-colors text-left"
          >
            <Moon size={14} color="#A0A0FF" />
            <span>This Evening</span>
          </button> */}
        </div>

        {/* Calendar */}
        <div className="px-2 pt-2 pb-1">
          {/* Month header with nav */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-core-background/70">
              {monthName} {viewYear}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={isCurrentOrPastMonth}
                className={cn(
                  'p-0.5 rounded transition-colors',
                  isCurrentOrPastMonth
                    ? 'opacity-30 cursor-default'
                    : 'hover:bg-sloth-aside-background-hover',
                )}
              >
                <ChevronLeft size={12} className="text-core-background/50" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-0.5 rounded hover:bg-sloth-aside-background-hover transition-colors"
              >
                <ChevronRight size={12} className="text-core-background/50" />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-[0.65rem] font-medium text-core-background/40 text-center py-0"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((cell) => {
              const past = cell.isCurrentMonth && isPast(cell.day)
              const disabled = !cell.isCurrentMonth || past
              return (
                <button
                  data-ignore-click-outside
                  key={cell.key}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    cell.isCurrentMonth && !past && handleSelectDay(cell.day)
                  }
                  className={cn(
                    'py-1 text-xs w-full rounded transition-colors flex items-center justify-center',
                    cell.isCurrentMonth && !past
                      ? 'text-sloth-foreground hover:bg-sloth-aside-background-hover cursor-pointer'
                      : 'text-sloth-foreground/10 cursor-default',
                    isToday(cell.day) &&
                      cell.isCurrentMonth &&
                      'text-[#FFD400]',
                    isSelected(cell.day) &&
                      cell.isCurrentMonth &&
                      'bg-[#4c4c50] text-core-background',
                  )}
                >
                  {isToday(cell.day) && cell.isCurrentMonth ? (
                    <Star size={12} fill="#FFD400" />
                  ) : (
                    cell.day
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom options */}
        {/* <div className="flex flex-col px-1 pb-1 border-t border-white/5">
          <button
            type="button"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium hover:bg-[#4c4c50] transition-colors text-left mt-1"
            onClick={handleSelectSomeday}
          >
            <Archive size={14} color="#C4A24E" />
            <span>Someday</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium hover:bg-[#4c4c50] transition-colors text-left"
          >
            <Plus size={14} />
            <span>Add Reminder</span>
          </button>
        </div> */}
      </PopoverContent>
    </Popover>
  )
}
