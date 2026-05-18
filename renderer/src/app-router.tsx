import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './features/auth/login-page'
import { DashboardLayout } from './components/layout/dashboard-layout'
import { OverviewPage } from './features/overview/overview-page'
import { EmployeesPage } from './features/employees/employees-page'
import { EmployeeDetail } from './features/employees/employee-detail'
import { LeavePage } from './features/leaves/leave-page'
import { ContractsPage } from './features/contracts/contracts-page'
import { RoleGuard } from './components/layout/role-guard'
import { PayrollPage } from './features/payroll/payroll-page'
import { PayslipPage } from './features/payroll/payslip-page'
import { MassroufPage } from './features/massrouf/massrouf-page'
import { AttendancePage } from './features/attendance/attendance-page'
import { TasksPage } from './features/tasks/tasks-page'
import { RecruitmentPage } from './features/recruitment/recruitment-page'
import { EvaluationsPage } from './features/evaluations/evaluations-page'
import { AnalyticsPage } from './features/analytics/analytics-page'
import { DepartmentsPage } from './features/departments/departments-page'
import { DepartmentDetail } from './features/departments/department-detail'

import { FormationPage } from './features/formation/formation-page'
import { LogsPage } from './features/logs/logs-page'

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
            path="employees/:id"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <EmployeeDetail />
              </RoleGuard>
            }
          />
          <Route
            path="departments"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <DepartmentsPage />
              </RoleGuard>
            }
          />
          <Route
            path="departments/:id"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <DepartmentDetail />
              </RoleGuard>
            }
          />

          <Route
            path="leave"
            element={<LeavePage />}
          />
          <Route
            path="leaves"
            element={<LeavePage />}
          />
          <Route
            path="contracts"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <ContractsPage />
              </RoleGuard>
            }
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
            path="payslips"
            element={<PayslipPage />}
          />
          <Route
            path="massrouf"
            element={<MassroufPage />}
          />
          <Route
            path="attendance"
            element={<AttendancePage />}
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
            path="formations"
            element={<FormationPage />}
          />
          <Route
            path="analytics"
            element={
              <RoleGuard roles={['Admin']}>
                <AnalyticsPage />
              </RoleGuard>
            }
          />
          <Route
            path="logs"
            element={
              <RoleGuard roles={['Admin']}>
                <LogsPage />
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
