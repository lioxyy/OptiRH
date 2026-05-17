import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Clock, FileText, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { contractService } from './contract.service'
import type { Contract } from './types'

function currency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function statusVariant(status: Contract['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
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

interface LifecycleStep {
  label: string
  date: string
  completed: boolean
}

function lifecycleSteps(contract: Contract): LifecycleStep[] {
  const steps: LifecycleStep[] = [
    { label: 'Created', date: new Date(contract.createdAt).toLocaleDateString(), completed: true },
    { label: 'Start date', date: new Date(contract.startDate).toLocaleDateString(), completed: new Date() >= new Date(contract.startDate) },
    { label: 'Current', date: 'Present', completed: contract.status === 'active' },
  ]
  if (contract.endDate) {
    steps.push({ label: 'End date', date: new Date(contract.endDate).toLocaleDateString(), completed: contract.isExpired })
  }
  if (contract.renewalDate) {
    steps.push({ label: 'Renewal date', date: new Date(contract.renewalDate).toLocaleDateString(), completed: false })
  }
  return steps
}

export function ContractDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', numericId],
    queryFn: () => contractService.getContract(numericId),
    enabled: !!numericId,
  })

  const deleteMut = useMutation({
    mutationFn: (contractId: number) => contractService.deleteContract(contractId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      navigate('/dashboard/contracts')
    },
  })

  const statusMut = useMutation({
    mutationFn: ({ status }: { status: Contract['status'] }) => contractService.updateStatus(numericId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contract', numericId] }),
  })

  const renewMut = useMutation({
    mutationFn: ({ newEndDate }: { newEndDate: string }) => contractService.renewContract(numericId, newEndDate),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contract', numericId] }),
  })

  const terminateMut = useMutation({
    mutationFn: () => contractService.terminateContract(numericId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contract', numericId] }),
  })

  if (isLoading) return <div className="p-6">Loading...</div>
  if (!contract) return <div className="p-6">Contract not found</div>

  const steps = lifecycleSteps(contract)

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <FileText className="size-5" />
            <span className="text-sm font-medium uppercase tracking-wide">Contract detail</span>
          </div>
          <h1 className="text-2xl font-bold">{contract.employeeName}</h1>
          <p className="text-sm text-muted-foreground">{contract.description}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/dashboard/contracts/${contract.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Button variant="destructive" onClick={() => deleteMut.mutate(contract.id)}>
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Contract metadata, type, compensation, and current status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-2">{contract.contractType}</Badge>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={statusVariant(contract.status)} className="mt-2">
                  {contract.status}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Salary</p>
                <p className="mt-1 text-xl font-semibold">{contract.salary > 0 ? currency(contract.salary) : 'N/A'}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Start date</p>
                <p className="mt-1 text-sm font-medium">{new Date(contract.startDate).toLocaleDateString()}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Duration</p>
                <p className="mt-1 text-sm font-medium">{contract.endDate ? `Until ${new Date(contract.endDate).toLocaleDateString()}` : 'Permanent'}</p>
              </div>
            </div>

            <Separator />
            <div>
              <p className="font-medium mb-2">Description</p>
              <p className="text-sm text-muted-foreground">{contract.description}</p>
            </div>

            <div>
              <p className="font-medium mb-2">Terms & Conditions</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contract.terms}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 h-fit">
          <CardHeader>
            <CardTitle>Status & actions</CardTitle>
            <CardDescription>Manage contract lifecycle and expiry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border p-4 bg-muted/30">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="size-4" />
                <span className="text-sm font-medium">Expiry status</span>
              </div>
              {contract.endDate ? (
                <div className="space-y-1">
                  <p className={`font-medium ${contract.isExpired ? 'text-destructive' : contract.daysUntilExpiry <= 90 && contract.daysUntilExpiry > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {contract.isExpired ? 'Expired' : contract.daysUntilExpiry > 0 ? `${contract.daysUntilExpiry} days remaining` : 'No expiry'}
                  </p>
                  <p className="text-xs text-muted-foreground">Ends on {new Date(contract.endDate).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Permanent contract (no expiry)</p>
              )}
            </div>

            <div className="space-y-2">
              <Select value={contract.status} onValueChange={(value) => statusMut.mutate({ status: value as Contract['status'] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending-renewal">Pending renewal</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {contract.status === 'active' && contract.endDate && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  const newEnd = new Date(contract.endDate!)
                  newEnd.setFullYear(newEnd.getFullYear() + 1)
                  renewMut.mutate({ newEndDate: newEnd.toISOString().split('T')[0] })
                }}
              >
                Renew contract (+1 year)
              </Button>
            )}

            {contract.status !== 'terminated' && (
              <Button size="sm" variant="destructive" className="w-full" onClick={() => terminateMut.mutate()}>
                Terminate contract
              </Button>
            )}

            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>Created: {new Date(contract.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(contract.updatedAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Lifecycle timeline</CardTitle>
          <CardDescription>Key milestones and status changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.label} className="flex gap-3">
                <div className={step.completed ? 'flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600' : 'flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground'}>
                  <CheckCircle className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
