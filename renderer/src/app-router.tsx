import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './features/auth/login-page'
import { ProtectedRoute, RoleGuard } from './components/layout/role-guard'

function PlaceholderPage({ title }: { title: string }) {
  return <div className="p-6"><h1 className="text-xl font-bold">{title}</h1></div>
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Dashboard" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/employees"
        element={
          <RoleGuard roles={['Admin', 'Agent']}>
            <PlaceholderPage title="Employees" />
          </RoleGuard>
        }
      />
      <Route
        path="/dashboard/leave"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Leave" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/contracts"
        element={
          <RoleGuard roles={['Admin', 'Agent']}>
            <PlaceholderPage title="Contracts" />
          </RoleGuard>
        }
      />
      <Route
        path="/dashboard/payroll"
        element={
          <RoleGuard roles={['Admin']}>
            <PlaceholderPage title="Payroll" />
          </RoleGuard>
        }
      />
      <Route
        path="/dashboard/tasks"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Tasks" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/recruitment"
        element={
          <RoleGuard roles={['Admin', 'Agent']}>
            <PlaceholderPage title="Recruitment" />
          </RoleGuard>
        }
      />
      <Route
        path="/dashboard/evaluations"
        element={
          <RoleGuard roles={['Admin', 'Agent']}>
            <PlaceholderPage title="Evaluations" />
          </RoleGuard>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
