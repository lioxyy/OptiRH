import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Calendar, Mail, Phone, Shield, ShieldAlert, User } from 'lucide-react'

import { adminUsersService } from './admin-users.service'
import type { Role } from './types'
import { useAuth } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

const roleVariant: Record<Role, 'default' | 'secondary' | 'outline'> = {
  Admin: 'default',
  Agent: 'secondary',
  Employee: 'outline',
}

const permissionsByRole: Record<Role, string[]> = {
  Admin: [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'roles:manage', 'permissions:manage', 'departments:manage', 'audit:read',
  ],
  Agent: ['employees:read-department', 'recruitment:manage', 'contracts:read-write'],
  Employee: ['profile:read', 'profile:update-self'],
}

export function AdminUserDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()

  const [selectedRole, setSelectedRole] = React.useState<Role>('Employee')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', numericId],
    queryFn: () => adminUsersService.getUser(numericId),
    enabled: Number.isFinite(numericId) && numericId > 0,
  })

  React.useEffect(() => {
    if (user) setSelectedRole(user.role)
  }, [user])

  const roleMut = useMutation({
    mutationFn: (role: Role) => adminUsersService.updateRole(numericId, role),
    onSuccess: (updated) => {
      toast.success(`Role updated to ${updated.role}`)
      queryClient.invalidateQueries({ queryKey: ['admin-user', numericId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      const reason = error?.response?.data?.details?.reason
      if (reason === 'LAST_ADMIN_REQUIRED') toast.error('Cannot change role: this is the last admin')
      else if (reason === 'SELF_ROLE_CHANGE_FORBIDDEN') toast.error('Cannot change your own role')
      else toast.error('Failed to update role')
    },
  })

  const passwordMut = useMutation({
    mutationFn: (password: string) => adminUsersService.resetPassword(numericId, password),
    onSuccess: () => {
      toast.success('Password reset successfully')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: () => toast.error('Failed to reset password'),
  })

  const deleteMut = useMutation({
    mutationFn: () => adminUsersService.deleteUser(numericId),
    onSuccess: () => {
      toast.success('User deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      navigate('/dashboard/admin-users')
    },
    onError: (error: any) => {
      const reason = error?.response?.data?.details?.reason
      if (reason === 'LAST_ADMIN_REQUIRED') toast.error('Cannot delete: this is the last admin')
      else if (reason === 'SELF_DELETE_FORBIDDEN') toast.error('Cannot delete your own account')
      else toast.error('Failed to delete user')
    },
  })

  if (isLoading) return <div className="p-6">Loading...</div>
  if (!user) return <div className="p-6">User not found</div>

  const isSelf = currentUser?.id_emp === numericId
  const permissionsChanged = selectedRole !== user.role
  const previewPermissions = permissionsByRole[selectedRole] ?? []

  return (
    <div className="space-y-6 p-4 pt-0">
      {/* Profile header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="size-6" />
              </div>
              <div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to={`/dashboard/admin-users/${numericId}/edit`}>Edit profile</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <InfoItem icon={<Shield className="size-4" />} label="Role">
              <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
            </InfoItem>
            <InfoItem icon={<Building2 className="size-4" />} label="Department">
              {user.department?.name ?? '—'}
            </InfoItem>
            <InfoItem icon={<Mail className="size-4" />} label="Email">
              <span className="truncate">{user.email}</span>
            </InfoItem>
            <InfoItem icon={<Phone className="size-4" />} label="Phone">
              {user.phone || '—'}
            </InfoItem>
            <InfoItem icon={<Calendar className="size-4" />} label="Date of birth">
              {user.date_birth ? new Date(user.date_birth).toLocaleDateString() : '—'}
            </InfoItem>
            <InfoItem icon={<Calendar className="size-4" />} label="Employment date">
              {user.date_employment ? new Date(user.date_employment).toLocaleDateString() : '—'}
            </InfoItem>
            {user.supervisor && (
              <InfoItem icon={<User className="size-4" />} label="Supervisor">
                {user.supervisor.name}
              </InfoItem>
            )}
            {user.gender && (
              <InfoItem icon={<User className="size-4" />} label="Gender">
                {user.gender}
              </InfoItem>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Role management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" />
              Role management
            </CardTitle>
            <CardDescription>Change the user's role to update their access level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current role</Label>
              <div>
                <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Assign new role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {permissionsChanged && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <p className="mb-2 text-xs font-medium text-amber-800 dark:text-amber-200">
                  Permissions that will apply after role change:
                </p>
                <div className="flex flex-wrap gap-1">
                  {previewPermissions.map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
            <Button
              onClick={() => roleMut.mutate(selectedRole)}
              disabled={roleMut.isPending || !permissionsChanged || isSelf}
            >
              {roleMut.isPending ? 'Updating...' : 'Apply role'}
            </Button>
            {isSelf && (
              <p className="text-xs text-muted-foreground">You cannot change your own role.</p>
            )}
          </CardContent>
        </Card>

        {/* Effective permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4" />
              Effective permissions
            </CardTitle>
            <CardDescription>
              All permissions granted by the <strong>{user.role}</strong> role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No permissions assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((p) => (
                  <Badge key={p} variant={roleVariant[user.role]}>{p}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Password reset */}
      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Set a new password for this account. The user will need to use it on next login.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid max-w-sm gap-4">
            <div className="space-y-1">
              <Label>New password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
            <Button
              className="w-fit"
              onClick={() => {
                if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
                if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
                passwordMut.mutate(newPassword)
              }}
              disabled={passwordMut.isPending}
            >
              {passwordMut.isPending ? 'Resetting...' : 'Reset password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Permanent actions that cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Delete this user</p>
              <p className="text-sm text-muted-foreground">
                Permanently removes the account and all associated data.
                {user.role === 'Admin' && ' The last admin cannot be deleted.'}
              </p>
            </div>
            <Button
              variant="destructive"
              disabled={isSelf || deleteMut.isPending}
              onClick={() => {
                if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return
                deleteMut.mutate()
              }}
            >
              {deleteMut.isPending ? 'Deleting...' : 'Delete user'}
            </Button>
          </div>
          {isSelf && (
            <p className="mt-2 text-xs text-muted-foreground">You cannot delete your own account.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}
