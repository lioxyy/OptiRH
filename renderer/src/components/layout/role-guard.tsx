import { useAuth } from '../../context/auth-context'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

interface RoleGuardProps {
  roles: string[]
  children: ReactNode
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
          <p className="text-sm text-muted-foreground mt-4">Your role: {user.role}</p>
          <p className="text-sm text-muted-foreground">Required roles: {roles.join(', ')}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
