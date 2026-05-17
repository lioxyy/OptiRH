import * as React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarX, CheckCircle, Clock, FileText, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { contractService } from './contract.service'
import type { Contract } from './types'

function statusBadgeVariant(status: Contract['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default'
    case 'pending-renewal':
      return 'secondary'
    case 'draft':
      return 'outline'
    case 'expired':
    case 'terminated':
      return 'destructive'
    default:
      return 'outline'
  }
}

function statusIcon(status: Contract['status']): React.ReactNode {
  switch (status) {
    case 'active':
      return <CheckCircle className="mr-1 size-3.5" />
    case 'pending-renewal':
      return <AlertTriangle className="mr-1 size-3.5" />
    case 'draft':
      return <Clock className="mr-1 size-3.5" />
    case 'expired':
      return <CalendarX className="mr-1 size-3.5" />
    case 'terminated':
      return <Clock className="mr-1 size-3.5" />
    default:
      return null
  }
}

function currency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function ContractListPage() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | Contract['status']>('all')
  const [expiryFilter, setExpiryFilter] = React.useState<'all' | 'active' | 'expiring' | 'expired'>('all')

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractService.listContracts(),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => contractService.deleteContract(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  })

  const filteredContracts = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return contracts.filter((contract) => {
      if (statusFilter !== 'all' && contract.status !== statusFilter) return false
      if (expiryFilter === 'expiring' && (contract.daysUntilExpiry < 0 || contract.daysUntilExpiry > 90)) return false
      if (expiryFilter === 'expired' && !contract.isExpired) return false
      if (expiryFilter === 'active' && (contract.isExpired || contract.status === 'terminated')) return false
      if (!q) return true
      return contract.employeeName.toLowerCase().includes(q) || contract.description.toLowerCase().includes(q)
    })
  }, [contracts, search, statusFilter, expiryFilter])

  const stats = React.useMemo(() => {
    const active = contracts.filter((contract) => contract.status === 'active')
    const expiring = contracts.filter((contract) => contract.daysUntilExpiry > 0 && contract.daysUntilExpiry <= 90)
    const expired = contracts.filter((contract) => contract.isExpired)
    const totalSalary = contracts.filter((c) => c.status === 'active').reduce((sum, c) => sum + c.salary, 0)
    return {
      total: contracts.length,
      active: active.length,
      expiring: expiring.length,
      expired: expired.length,
      totalSalary,
    }
  }, [contracts])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 p-4 pt-0">
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="gap-4 border-b pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="size-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Contract management</span>
              </div>
              <CardTitle className="text-3xl">CRUD, statuses, lifecycle, and expiry tracking</CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Create and manage employment contracts, track status, lifecycle milestones, and expiry dates across the workforce.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                <FileText className="size-3.5" />
                {stats.total} contracts
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-muted-foreground">
                {stats.active} active
              </Badge>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-4">
            <Card>
              <CardHeader>
                <CardDescription>Active contracts</CardDescription>
                <CardTitle className="text-2xl">{stats.active}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Expiring soon</CardDescription>
                <CardTitle className="text-2xl">{stats.expiring}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Expired contracts</CardDescription>
                <CardTitle className="text-2xl">{stats.expired}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Total salary commitment</CardDescription>
                <CardTitle className="text-2xl text-nowrap">{currency(stats.totalSalary)}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-lg">Contract directory</CardTitle>
              <CardDescription>Search, filter by status and expiry, view details, or manage lifecycle.</CardDescription>
            </div>
            <Link to="/dashboard/contracts/new">
              <Button size="sm">New contract</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_repeat(2,200px)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contracts or employees" className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending-renewal">Pending renewal</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={expiryFilter} onValueChange={(value) => setExpiryFilter(value as typeof expiryFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="active">Not expiring</SelectItem>
                <SelectItem value="expiring">Expiring (90 days)</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <Link to={`/dashboard/contracts/${contract.id}`} className="font-medium hover:underline">
                      {contract.employeeName}
                    </Link>
                    <p className="text-sm text-muted-foreground">{contract.contractType}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{contract.contractType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(contract.status)}>
                      {statusIcon(contract.status)}
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{contract.salary > 0 ? currency(contract.salary) : 'N/A'}</TableCell>
                  <TableCell>
                    {contract.endDate ? (
                      <div className="text-sm">
                        <p className={contract.isExpired ? 'text-destructive font-medium' : contract.daysUntilExpiry <= 90 ? 'text-amber-600 font-medium' : ''}>
                          {contract.daysUntilExpiry < 0 ? 'Expired' : `${contract.daysUntilExpiry} days`}
                        </p>
                        <p className="text-muted-foreground">{new Date(contract.endDate).toLocaleDateString()}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No expiry</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/dashboard/contracts/${contract.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                      <Link to={`/dashboard/contracts/${contract.id}/edit`}>
                        <Button size="sm" variant="ghost">Edit</Button>
                      </Link>
                      <Button size="sm" variant="destructive" onClick={() => deleteMut.mutate(contract.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
