import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './features/auth/login-page'
import { DashboardLayout } from './components/layout/dashboard-layout'
import { OverviewPage } from './features/overview/overview-page'
import { EmployeesPage } from './features/employees/employees-page'
import { EmployeeDetail } from './features/employees/employee-detail'
import { EmployeeForm } from './features/employees/employee-form'
import { RoleGuard } from './components/layout/role-guard'
import { EvaluationsDashboard } from './features/evaluations/evaluations-dashboard'
import { EvaluationReport } from './features/evaluations/evaluation-report'
import { EvaluationForm } from './features/evaluations/evaluation-form'
import { EvaluationsHistory } from './features/evaluations/evaluations-history'
import { CampaignsPage } from './features/evaluations/campaigns-page'
import { CriteriaPage } from './features/evaluations/criteria-page'
import { MyEvaluationsPage } from './features/evaluations/my-evaluations'
import { RecruitmentDashboard } from './features/recruitment/recruitment-dashboard'
import { OffersPage } from './features/recruitment/offers-page'
import { CandidatesPage } from './features/recruitment/candidates-page'
import { ApplicationsKanban } from './features/recruitment/applications-kanban'
import { InterviewsPage } from './features/recruitment/interviews-page'
import { PublicCareers } from './features/recruitment/public-careers'

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
            element={<PlaceholderPage title="Leave" />}
          />
          <Route
            path="contracts"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <PlaceholderPage title="Contracts" />
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
            path="evaluations"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <EvaluationsDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="evaluations/new"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <EvaluationForm />
              </RoleGuard>
            }
          />
          <Route
            path="evaluations/history"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <EvaluationsHistory />
              </RoleGuard>
            }
          />
          <Route
            path="evaluations/report/:id"
            element={
              <RoleGuard roles={['Admin', 'Agent', 'Employee']}>
                <EvaluationReport />
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
          <Route
            path="evaluations/campaigns"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <CampaignsPage />
              </RoleGuard>
            }
          />
          <Route
            path="evaluations/criteria"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <CriteriaPage />
              </RoleGuard>
            }
          />
          <Route
            path="my-evaluations"
            element={
              <RoleGuard roles={['Admin', 'Agent', 'Employee']}>
                <MyEvaluationsPage />
              </RoleGuard>
            }
          />
          <Route
            path="recruitment"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <RecruitmentDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="recruitment/offers"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <OffersPage />
              </RoleGuard>
            }
          />
          <Route
            path="recruitment/candidates"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <CandidatesPage />
              </RoleGuard>
            }
          />
          <Route
            path="recruitment/applications"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <ApplicationsKanban />
              </RoleGuard>
            }
          />
          <Route
            path="recruitment/interviews"
            element={
              <RoleGuard roles={['Admin', 'Agent']}>
                <InterviewsPage />
              </RoleGuard>
            }
          />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/careers" element={<PublicCareers />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </RootLayout>
  )
}
