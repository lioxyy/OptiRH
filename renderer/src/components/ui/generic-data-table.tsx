import * as React from "react"
import {
    Column,
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// SORTING HEADER COMPONENT
// ---------------------------------------------------------------------------
interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>
    title: string
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: DataTableColumnHeaderProps<TData, TValue>) {
    if (!column.getCanSort()) {
        return <div className={cn("text-sm font-medium text-muted-foreground", className)}>{title}</div>
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="-ml-3 h-8 text-sm data-[state=open]:bg-accent font-medium">
                        <span>{title}</span>
                        {column.getIsSorted() === "desc" ? (
                            <ArrowDownIcon className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "asc" ? (
                            <ArrowUpIcon className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDownIcon className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                        <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Asc
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                        <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Desc
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

// ---------------------------------------------------------------------------
// MAIN DATA TABLE COMPONENT
// ---------------------------------------------------------------------------
export interface SearchOption {
    id: string
    label: string
}

interface GenericDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string   // Default column to search if no options provided
    searchPlaceholder?: string
    searchOptions?: SearchOption[]
}

export function GenericDataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    searchOptions
}: GenericDataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

    const [currentSearchKey, setCurrentSearchKey] = React.useState<string>(
        searchOptions?.[0]?.id || searchKey || ""
    )

    React.useEffect(() => {
        if (searchOptions?.length && !searchOptions.find(o => o.id === currentSearchKey)) {
            setCurrentSearchKey(searchOptions[0].id)
        }
    }, [searchOptions, currentSearchKey])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    })

    const handleSearchKeyChange = (newKey: string) => {
        if (currentSearchKey) {
            table.getColumn(currentSearchKey)?.setFilterValue("")
        }
        setCurrentSearchKey(newKey)
    }

    return (
        <div className="space-y-4">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {searchOptions && searchOptions.length > 0 ? (
                    <div className="relative flex flex-1 items-center w-full sm:max-w-md">
                        <Input
                            placeholder={`Search ${searchOptions.find((o) => o.id === currentSearchKey)?.label.toLowerCase() || ""}...`}
                            value={(table.getColumn(currentSearchKey)?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn(currentSearchKey)?.setFilterValue(event.target.value)
                            }
                            className="w-full h-9 pr-[135px]"
                        />
                        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1">
                            <div className="h-4 w-[1px] bg-border mr-1"></div>
                            <Select value={currentSearchKey} onValueChange={handleSearchKeyChange}>
                                <SelectTrigger className="w-[125px] h-7 text-xs border-0 bg-transparent focus:ring-0 focus:ring-offset-0 text-muted-foreground shadow-none">
                                    <SelectValue placeholder="Search by..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {searchOptions.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id} className="text-xs">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : searchKey ? (
                    <Input
                        placeholder={searchPlaceholder}
                        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn(searchKey)?.setFilterValue(event.target.value)
                        }
                        className="w-full sm:max-w-sm h-9"
                    />
                ) : (
                    <div className="flex-1" />
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto h-9">
                            Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id.replace(/_/g, " ")}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* TABLE DATA */}
            <Card className="overflow-hidden p-0 border-0 shadow-none">
                <CardContent className="p-0 border-0">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="py-3 text-sm">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* PAGINATION */}
            <div className="flex items-center justify-between py-2">
                <div className="text-sm text-muted-foreground">
                    Showing {table.getFilteredRowModel().rows.length} entries
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
