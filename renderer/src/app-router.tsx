import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './features/auth/login-page'
import { DashboardLayout } from './components/layout/dashboard-layout'
import { OverviewPage } from './features/overview/overview-page'
import { EmployeesPage } from './features/employees/employees-page'
import { EmployeeDetail } from './features/employees/employee-detail'
import { EmployeeForm } from './features/employees/employee-form'
import { LeavePage } from './features/leave/leave-page'
import { ContractsPage } from './features/contracts/contracts-page'
import { RoleGuard } from './components/layout/role-guard'
import { PayrollPage } from './features/payroll/payroll-page'
import { TasksPage } from './features/tasks/tasks-page'
import { RecruitmentPage } from './features/recruitment/recruitment-page'
import { EvaluationsPage } from './features/evaluations/evaluations-page'

function PlaceholderPage({ title }: { title: string }) {
  return <div className="p-6"><h1 className="text-xl font-bold">{title}</h1></div>
}

import { RootLayout } from './components/layout/root-layout'

export function AppRouter() {
  return (
    <RootLayout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route
            path="employees"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <EmployeesPage />
              </RoleGuard>
            }
          />
          <Route
            path="employees/new"
            element={
              <RoleGuard roles={['Admin']}>
                <EmployeeForm />
              </RoleGuard>
            }
          />
          <Route
            path="employees/:id"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <EmployeeDetail />
              </RoleGuard>
            }
          />
          <Route
            path="leave"
            element={<LeavePage />}
          />
          <Route
            path="contracts"
            element={<ContractsPage />}
          />
          <Route
            path="payroll"
            element={
              <RoleGuard roles={['Admin']}>
                <PayrollPage />
              </RoleGuard>
            }
          />
          <Route
            path="tasks"
            element={<TasksPage />}
          />
          <Route
            path="recruitment"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <RecruitmentPage />
              </RoleGuard>
            }
          />
          <Route
            path="evaluations"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <EvaluationsPage />
              </RoleGuard>
            }
          />
          <Route
            path="analytics"
            element={
              <RoleGuard roles={['Admin']}>
                <PlaceholderPage title="Analytics" />
              </RoleGuard>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </RootLayout>
  )
}
