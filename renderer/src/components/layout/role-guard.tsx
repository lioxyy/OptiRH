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
  if (!roles.includes(user.role)) return null

  return <>{children}</>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
