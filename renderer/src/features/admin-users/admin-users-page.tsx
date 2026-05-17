import * as React from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { adminUsersService } from './admin-users.service'
import type { Role } from './types'
import { useAuth } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const roleVariant: Record<Role, 'default' | 'secondary' | 'outline'> = {
  Admin: 'default',
  Agent: 'secondary',
  Employee: 'outline',
}

export function AdminUsersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState<Role | 'all'>('all')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminUsersService.listUsers(),
  })

  const { data: permissions } = useQuery({
    queryKey: ['admin-users-permissions'],
    queryFn: () => adminUsersService.getPermissionsMatrix(),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminUsersService.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Failed to delete user'),
  })

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => adminUsersService.updateRole(id, role),
    onSuccess: () => {
      toast.success('Role updated')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: () => toast.error('Failed to update role'),
  })

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!q) return true
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
  }, [users, search, roleFilter])

  const totals = React.useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'Admin').length,
      agents: users.filter((u) => u.role === 'Agent').length,
      employees: users.filter((u) => u.role === 'Employee').length,
    }
  }, [users])

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-6 p-4 pt-0">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Admin user management</CardTitle>
              <CardDescription>Admin CRUD, permissions visibility, and role management.</CardDescription>
            </div>
            <Button asChild>
              <Link to="/dashboard/admin-users/new">Create user</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Stat title="Total users" value={totals.total} />
            <Stat title="Admins" value={totals.admins} />
            <Stat title="Agents" value={totals.agents} />
            <Stat title="Employees" value={totals.employees} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px]">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" />
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Agent">Agent</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id_emp}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.email}</div>
                  </TableCell>
                  <TableCell>{item.department?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Select value={item.role} onValueChange={(v) => roleMut.mutate({ id: item.id_emp, role: v as Role })}>
                      <SelectTrigger className="w-35">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Agent">Agent</SelectItem>
                        <SelectItem value="Employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.permissions.slice(0, 2).map((p) => (
                        <Badge key={p} variant={roleVariant[item.role]}>{p}</Badge>
                      ))}
                      {item.permissions.length > 2 && <Badge variant="outline">+{item.permissions.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/dashboard/admin-users/${item.id_emp}`}>View</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/dashboard/admin-users/${item.id_emp}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={user?.id_emp === item.id_emp}
                        onClick={() => deleteMut.mutate(item.id_emp)}
                      >
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

      <Card>
        <CardHeader>
          <CardTitle>Permission matrix</CardTitle>
          <CardDescription>Effective permissions by role.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {(permissions?.roles ?? []).map((role) => (
              <div key={role} className="rounded-md border p-3">
                <div className="mb-2 font-medium">{role}</div>
                <div className="flex flex-wrap gap-1">
                  {(permissions?.matrix?.[role] ?? []).map((perm) => (
                    <Badge key={perm} variant="outline">{perm}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
