import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { AppShell } from '@/components/layout/AppShell'

const ReportsPage = lazy(() => import('@/features/academic/ReportsPage'))
const AssignLecturerPage = lazy(() => import('@/features/academic/AssignLecturerPage'))
const CourseCatalogPage = lazy(() => import('@/features/academic/CourseCatalogPage'))
const CreateSectionPage = lazy(() => import('@/features/academic/CreateSectionPage'))
const RegistrationManagementPage = lazy(() => import('@/features/academic/RegistrationManagementPage'))
const ScheduleRoomsPage = lazy(() => import('@/features/academic/ScheduleRoomsPage'))
const WaitlistOverridePage = lazy(() => import('@/features/academic/WaitlistOverridePage'))
const WishReviewPage = lazy(() => import('@/features/academic/WishReviewPage'))
const ChangePasswordPage = lazy(() => import('@/features/auth/ChangePasswordPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const AuditLogsPage = lazy(() => import('@/features/admin/AuditLogsPage'))
const RolesPage = lazy(() => import('@/features/admin/RolesPage'))
const SettingsPage = lazy(() => import('@/features/admin/SettingsPage'))
const UserAccountsPage = lazy(() => import('@/features/admin/UserAccountsPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const AssignedSectionsPage = lazy(() => import('@/features/lecturer/AssignedSectionsPage'))
const SectionStudentsPage = lazy(() => import('@/features/lecturer/SectionStudentsPage'))
const SemesterTeachingPage = lazy(() => import('@/features/lecturer/SemesterTeachingPage'))
const WeekTeachingPage = lazy(() => import('@/features/lecturer/WeekTeachingPage'))
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage'))
const CancelRegistrationPage = lazy(() => import('@/features/student/CancelRegistrationPage'))
const CourseDetailPage = lazy(() => import('@/features/student/CourseDetailPage'))
const HistoryPage = lazy(() => import('@/features/student/HistoryPage'))
const OpenSectionsPage = lazy(() => import('@/features/student/OpenSectionsPage'))
const PrerequisitePage = lazy(() => import('@/features/student/PrerequisitePage'))
const RegisterPage = lazy(() => import('@/features/student/RegisterPage'))
const RegisteredPage = lazy(() => import('@/features/student/RegisteredPage'))
const SemesterSchedulePage = lazy(() => import('@/features/student/SemesterSchedulePage'))
const WeekSchedulePage = lazy(() => import('@/features/student/WeekSchedulePage'))
const WishPage = lazy(() => import('@/features/student/WishPage'))
const WithdrawPage = lazy(() => import('@/features/student/WithdrawPage'))
const ForbiddenPage = lazy(() => import('@/features/system/ForbiddenPage'))
const NotFoundPage = lazy(() => import('@/features/system/NotFoundPage'))

function RouteFallback() {
  return <div className="mx-auto mt-20 h-28 max-w-3xl rounded-2xl bg-white shadow-soft" />
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route
          element={
            <RoleGuard>
              <AppShell />
            </RoleGuard>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />

          <Route element={<RoleGuard roles={['STUDENT']} />}>
            <Route path="student/open-sections" element={<OpenSectionsPage />} />
            <Route path="student/open-sections/:sectionId" element={<CourseDetailPage />} />
            <Route path="student/register" element={<RegisterPage />} />
            <Route path="student/cancel" element={<CancelRegistrationPage />} />
            <Route path="student/withdraw" element={<WithdrawPage />} />
            <Route path="student/schedule/week" element={<WeekSchedulePage />} />
            <Route path="student/schedule/semester" element={<SemesterSchedulePage />} />
            <Route path="student/history" element={<HistoryPage />} />
            <Route path="student/prerequisites" element={<PrerequisitePage />} />
            <Route path="student/wish" element={<WishPage />} />
            <Route path="student/registered" element={<RegisteredPage />} />
          </Route>

          <Route element={<RoleGuard roles={['LECTURER']} />}>
            <Route path="lecturer/sections" element={<AssignedSectionsPage />} />
            <Route path="lecturer/sections/:sectionId/students" element={<SectionStudentsPage />} />
            <Route path="lecturer/schedule/week" element={<WeekTeachingPage />} />
            <Route path="lecturer/schedule/semester" element={<SemesterTeachingPage />} />
          </Route>

          <Route element={<RoleGuard roles={['ACADEMIC_OFFICE']} />}>
            <Route path="academic/courses" element={<CourseCatalogPage />} />
            <Route path="academic/sections/create" element={<CreateSectionPage />} />
            <Route path="academic/assign-lecturer" element={<AssignLecturerPage />} />
            <Route path="academic/registrations" element={<RegistrationManagementPage />} />
            <Route path="academic/schedule-rooms" element={<ScheduleRoomsPage />} />
            <Route path="academic/reports" element={<ReportsPage />} />
            <Route path="academic/waitlist-override" element={<WaitlistOverridePage />} />
            <Route path="academic/wishes" element={<WishReviewPage />} />
          </Route>

          <Route element={<RoleGuard roles={['ADMIN']} />}>
            <Route path="admin/users" element={<UserAccountsPage />} />
            <Route path="admin/roles" element={<RolesPage />} />
            <Route path="admin/settings" element={<SettingsPage />} />
            <Route path="admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="admin/wishes" element={<WishReviewPage />} />
          </Route>
        </Route>
        <Route path="/home" element={<Navigate replace to="/" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
