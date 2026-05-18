"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
    date: DateRange | undefined
    onDateChange: (date: DateRange | undefined) => void
    placeholder?: string
}

export function DateRangePicker({
    className,
    date,
    onDateChange,
    placeholder = "Pick a date",
}: DateRangePickerProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        size="sm"
                        className={cn(
                            "w-[260px] h-9 justify-start text-left font-normal text-xs rounded-lg border-muted-foreground/20 bg-muted/10 hover:bg-muted/20 transition-colors",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 rounded-xl shadow-2xl border-none bg-background/95 backdrop-blur-md" align="start">
                    <Calendar
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={onDateChange}
                        numberOfMonths={2}
                        className="p-4"
                        classNames={{
                            months: "flex flex-col md:flex-row gap-8",
                            month: "space-y-4",
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
