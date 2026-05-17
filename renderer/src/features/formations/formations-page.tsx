import * as React from 'react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listFormations, deleteFormation } from './formation.service'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function FormationsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState('')

  const { data: formations = [], isLoading } = useQuery({
    queryKey: ['formations'],
    queryFn: () => listFormations(),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteFormation(id),
    onSuccess: () => {
      toast.success('Formation deleted')
      queryClient.invalidateQueries({ queryKey: ['formations'] })
    },
    onError: () => toast.error('Failed to delete formation'),
  })

  if (isLoading) return <div className="p-6">Loading...</div>

  const filtered = formations.filter((f) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      f.name.toLowerCase().includes(q)
      || (f.description ?? '').toLowerCase().includes(q)
      || (f.location ?? '').toLowerCase().includes(q)
      || (f.instructor?.name ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 p-4 pt-0">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Formation catalog</CardTitle>
              <CardDescription>Manage formations with CRUD, instructor assignment, and scheduling.</CardDescription>
            </div>
            <Button asChild>
              <Link to="/dashboard/formations/new">New formation</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Stat title="Total formations" value={formations.length} />
            <Stat title="Assigned instructors" value={formations.filter((f) => !!f.instructor).length} />
            <Stat title="Unassigned" value={formations.filter((f) => !f.instructor).length} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, location, instructor" />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Formation</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id_formation}>
                  <TableCell>
                    <div className="font-medium">{f.name}</div>
                    <div className="text-sm text-muted-foreground">{f.location ?? 'No location'}{f.description ? ` · ${f.description}` : ''}</div>
                  </TableCell>
                  <TableCell>
                    {f.instructor?.name
                      ? <Badge>{f.instructor.name}</Badge>
                      : <Badge variant="outline">Unassigned</Badge>}
                  </TableCell>
                  <TableCell>{new Date(f.date_deb).toLocaleDateString()} · {f.duration_days} days</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/dashboard/formations/${f.id_formation}`}>View</Link>
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/dashboard/formations/${f.id_formation}/edit`}>Edit</Link>
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMut.mutate(f.id_formation)}>
                        Delete
                      </Button>
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

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
