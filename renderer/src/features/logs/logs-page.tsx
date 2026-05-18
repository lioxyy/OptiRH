import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Eye, History, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { GenericDataTable, DataTableColumnHeader } from '../../components/ui/generic-data-table'
import { toast } from 'sonner'
import { DateRangePicker } from '../../components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'

interface AuditLog {
  id_log: number
  actor_id: number | null
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'GENERATE' | string
  target_model: string
  target_id: number
  snapshot: string
  timestamp: string
  actor?: {
    name: string
    email: string
  } | null
}

const ACTION_CONFIG: Record<string, { label: string; className: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }> = {
  CREATE: { label: 'Create', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 font-semibold', variant: 'outline' },
  UPDATE: { label: 'Update', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/10 font-semibold', variant: 'outline' },
  DELETE: { label: 'Delete', className: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/10 font-semibold', variant: 'outline' },
  APPROVE: { label: 'Approve', className: 'bg-indigo-500 hover:bg-indigo-600 text-white font-semibold', variant: 'default' },
  REJECT: { label: 'Reject', className: 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/10 font-semibold', variant: 'outline' },
  GENERATE: { label: 'Generate', className: 'bg-violet-600 hover:bg-violet-700 text-white font-semibold', variant: 'default' },
}

function LogDetailsModal({ log, open, onClose }: { log: AuditLog; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  let prettyJson = ''
  try {
    prettyJson = JSON.stringify(JSON.parse(log.snapshot), null, 2)
  } catch (e) {
    prettyJson = log.snapshot
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(prettyJson)
    setCopied(true)
    toast.success('Snapshot copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-none bg-background text-foreground shadow-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Audit State Snapshot — Log #{log.id_log}
          </DialogTitle>
          <DialogDescription>
            Historical record of the model state when the action was committed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs p-3 bg-muted/40 rounded-lg border">
            <div>
              <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider">Action & Model</span>
              <span className="font-semibold text-foreground">{log.action} on {log.target_model} (ID: {log.target_id})</span>
            </div>
            <div>
              <span className="text-muted-foreground block uppercase font-bold text-[9px] tracking-wider">Timestamp</span>
              <span className="font-semibold text-foreground font-mono">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="relative group">
            <Button
              size="sm"
              variant="outline"
              className="absolute right-3 top-3 h-8 w-8 p-0 rounded-lg opacity-80 group-hover:opacity-100 transition-all border bg-background/50 hover:bg-background"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <pre className="p-4 rounded-lg bg-zinc-950 text-zinc-200 overflow-x-auto text-[11px] font-mono leading-relaxed border border-zinc-800 max-h-[50vh]">
              {prettyJson}
            </pre>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" className="rounded-lg h-9 text-xs" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function LogsPage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [targetModel, setTargetModel] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const { data = { data: [], total: 0 }, isLoading } = useQuery<{ data: AuditLog[]; total: number }>({
    queryKey: ['auditLogs', page, limit, targetModel, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', String(limit))
      if (targetModel && targetModel !== 'all') params.append('target_model', targetModel)
      if (dateRange?.from) params.append('from', dateRange.from.toISOString())
      if (dateRange?.to) {
        // Set to end of day to include the full end date
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        params.append('to', toDate.toISOString())
      }

      const res = await api.get(`/api/audit?${params.toString()}`)
      return res.data.data
    }
  })

  const totalPages = Math.ceil(data.total / limit) || 1

  const columns: ColumnDef<AuditLog>[] = [
    {
      id: "actor",
      accessorFn: (row) => row.actor?.name ?? 'System',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Actor" />,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.original.actor?.name ?? 'System'}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.actor?.email ?? 'automated@optirh.internal'}</span>
        </div>
      )
    },
    {
      id: "action",
      accessorKey: "action",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
      cell: ({ row }) => {
        const act = row.original.action
        const cfg = ACTION_CONFIG[act] || { label: act, variant: 'outline' as const, className: 'text-muted-foreground border-border' }
        return (
          <Badge variant={cfg.variant} className={`text-[10px] py-0.5 px-2 rounded-full border ${cfg.className}`}>
            {cfg.label}
          </Badge>
        )
      }
    },
    {
      id: "target_model",
      accessorKey: "target_model",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Target Model" />,
      cell: ({ row }) => (
        <span className="font-semibold text-muted-foreground">{row.original.target_model}</span>
      )
    },
    {
      id: "target_id",
      accessorKey: "target_id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Target ID" />,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.target_id}</span>
    },
    {
      id: "timestamp",
      accessorKey: "timestamp",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
      cell: ({ row }) => (
        <span className="font-medium">{new Date(row.original.timestamp).toLocaleString()}</span>
      )
    },
    {
      id: "actions",
      header: () => <div className="text-right">Snapshot</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setSelected(row.original)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">System Audit Logs</h1>
        <p className="text-muted-foreground text-sm">
          Monitor real-time personnel record creations, calculations, and operational history.
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <>
            <GenericDataTable
              columns={columns}
              data={data.data}
              searchOptions={[
                { id: "actor", label: "Actor" },
                { id: "action", label: "Action" },
                { id: "target_model", label: "Model" }
              ]}
              extraActions={
                <div className="flex items-center gap-2 no-print mr-2">
                  <Select value={targetModel} onValueChange={(v) => { setTargetModel(v); setPage(1); }}>
                    <SelectTrigger className="w-40 h-9 text-xs rounded-lg border-0 bg-muted/10 shadow-none">
                      <SelectValue placeholder="All Models" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      <SelectItem value="Employee">Employees</SelectItem>
                      <SelectItem value="Department">Departments</SelectItem>
                      <SelectItem value="Contract">Contracts</SelectItem>
                      <SelectItem value="Conge">Leaves (Congés)</SelectItem>
                      <SelectItem value="Absence">Absences</SelectItem>
                      <SelectItem value="Salaire">Payroll (Salaire)</SelectItem>
                      <SelectItem value="Massrouf">Massrouf</SelectItem>
                      <SelectItem value="Task">Tasks</SelectItem>
                      <SelectItem value="Candidat">Candidates</SelectItem>
                      <SelectItem value="Formation">Formations</SelectItem>
                    </SelectContent>
                  </Select>

                  <DateRangePicker
                    date={dateRange}
                    onDateChange={(range) => { setDateRange(range); setPage(1); }}
                    borderless={true}
                  />
                </div>
              }
            />

            {/* Pagination Controls */}
            <div className="flex items-center justify-between py-2 no-print">
              <span className="text-xs text-muted-foreground">
                Showing {data.data.length} logs of {data.total} total records
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-xs font-semibold px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <LogDetailsModal
          log={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
