import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './features/auth/login-page'
import { DashboardLayout } from './components/layout/dashboard-layout'
import { OverviewPage } from './features/overview/overview-page'
import { RecruitmentPage } from './features/recruitment/recruitment-page'
import CandidateForm from './features/recruitment/candidate-form'
import CandidateDetail from './features/recruitment/candidate-detail'
import { DepartmentListPage } from './features/departments/department-list'
import { DepartmentFormPage } from './features/departments/department-form'
import { DepartmentDetailPage } from './features/departments/department-detail'
import { ContractListPage } from './features/contracts/contract-list'
import { ContractFormPage } from './features/contracts/contract-form'
import { ContractDetailPage } from './features/contracts/contract-detail'
import { AdminUsersPage } from './features/admin-users/admin-users-page'
import { AdminUserFormPage } from './features/admin-users/admin-user-form'
import { AdminUserDetailPage } from './features/admin-users/admin-user-detail'
import { AgentsPage } from './features/agents/agents-page'
import { AgentFormPage } from './features/agents/agent-form'
import { AgentDetailPage } from './features/agents/agent-detail'
import { FormationsPage } from './features/formations/formations-page'
import FormationForm from './features/formations/formation-form'
import FormationDetail from './features/formations/formation-detail'
import { EmployeesPage } from './features/employees/employees-page'
import { EmployeeDetail } from './features/employees/employee-detail'
import { EmployeeForm } from './features/employees/employee-form'
import { RoleGuard } from './components/layout/role-guard'

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
            path="departments"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <DepartmentListPage />
              </RoleGuard>
            }
          />
          <Route
            path="departments/new"
            element={
              <RoleGuard roles={['Admin']}>
                <DepartmentFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="departments/:id"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <DepartmentDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="departments/:id/edit"
            element={
              <RoleGuard roles={['Admin']}>
                <DepartmentFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="leave"
            element={<PlaceholderPage title="Leave" />}
          />
          <Route
            path="contracts"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <ContractListPage />
              </RoleGuard>
            }
          />
          <Route
            path="contracts/new"
            element={
              <RoleGuard roles={['Admin']}>
                <ContractFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="contracts/:id"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <ContractDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="contracts/:id/edit"
            element={
              <RoleGuard roles={['Admin']}>
                <ContractFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="payroll"
            element={
              <RoleGuard roles={['Admin']}>
                <PlaceholderPage title="Payroll" />
              </RoleGuard>
            }
          />
          <Route
            path="tasks"
            element={<PlaceholderPage title="Tasks" />}
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
            path="recruitment/candidates/new"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <CandidateForm />
              </RoleGuard>
            }
          />
          <Route
            path="recruitment/candidates/:id"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <CandidateDetail />
              </RoleGuard>
            }
          />
          <Route
            path="recruitment/candidates/:id/edit"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <CandidateForm />
              </RoleGuard>
            }
          />
          <Route
            path="evaluations"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <PlaceholderPage title="Evaluations" />
              </RoleGuard>
            }
          />
          <Route
            path="analytics"
            element={
              <RoleGuard roles={['Admin']}>
                <OverviewPage />
              </RoleGuard>
            }
          />
          <Route
            path="admin-users"
            element={
              <RoleGuard roles={['Admin']}>
                <AdminUsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="formations"
            element={
              <RoleGuard roles={['Admin','Agent']}>
                <FormationsPage />
              </RoleGuard>
            }
          />
          <Route
            path="formations/new"
            element={
              <RoleGuard roles={['Admin']}>
                <FormationForm />
              </RoleGuard>
            }
          />
          <Route
            path="formations/:id"
            element={
              <RoleGuard roles={['Admin','Agent']}>
                <FormationDetail />
              </RoleGuard>
            }
          />
          <Route
            path="formations/:id/edit"
            element={
              <RoleGuard roles={['Admin']}>
                <FormationForm />
              </RoleGuard>
            }
          />
          <Route
            path="agents"
            element={
              <RoleGuard roles={['Admin']}>
                <AgentsPage />
              </RoleGuard>
            }
          />
          <Route
            path="agents/new"
            element={
              <RoleGuard roles={['Admin']}>
                <AgentFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="agents/:id"
            element={
              <RoleGuard roles={['Admin']}>
                <AgentDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="agents/:id/edit"
            element={
              <RoleGuard roles={['Admin']}>
                <AgentFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="admin-users/:id"
            element={
              <RoleGuard roles={['Admin']}>
                <AdminUserDetailPage />
              </RoleGuard>
            }
          />
          <Route
            path="admin-users/new"
            element={
              <RoleGuard roles={['Admin']}>
                <AdminUserFormPage />
              </RoleGuard>
            }
          />
          <Route
            path="admin-users/:id/edit"
            element={
              <RoleGuard roles={['Admin']}>
                <AdminUserFormPage />
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
