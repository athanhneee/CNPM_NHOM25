import { Navigate, Route, Routes } from 'react-router-dom'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { AppShell } from '@/components/layout/AppShell'
import { ReportsPage } from '@/features/academic/ReportsPage'
import { AssignLecturerPage } from '@/features/academic/AssignLecturerPage'
import { CourseCatalogPage } from '@/features/academic/CourseCatalogPage'
import { CreateSectionPage } from '@/features/academic/CreateSectionPage'
import { RegistrationManagementPage } from '@/features/academic/RegistrationManagementPage'
import { ScheduleRoomsPage } from '@/features/academic/ScheduleRoomsPage'
import { WaitlistOverridePage } from '@/features/academic/WaitlistOverridePage'
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { AuditLogsPage } from '@/features/admin/AuditLogsPage'
import { RolesPage } from '@/features/admin/RolesPage'
import { SettingsPage } from '@/features/admin/SettingsPage'
import { UserAccountsPage } from '@/features/admin/UserAccountsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { AssignedSectionsPage } from '@/features/lecturer/AssignedSectionsPage'
import { SectionStudentsPage } from '@/features/lecturer/SectionStudentsPage'
import { SemesterTeachingPage } from '@/features/lecturer/SemesterTeachingPage'
import { WeekTeachingPage } from '@/features/lecturer/WeekTeachingPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { CancelRegistrationPage } from '@/features/student/CancelRegistrationPage'
import { CourseDetailPage } from '@/features/student/CourseDetailPage'
import { HistoryPage } from '@/features/student/HistoryPage'
import { OpenSectionsPage } from '@/features/student/OpenSectionsPage'
import { PrerequisitePage } from '@/features/student/PrerequisitePage'
import { RegisterPage } from '@/features/student/RegisterPage'
import { RegisteredPage } from '@/features/student/RegisteredPage'
import { SemesterSchedulePage } from '@/features/student/SemesterSchedulePage'
import { WeekSchedulePage } from '@/features/student/WeekSchedulePage'
import { WishPage } from '@/features/student/WishPage'
import { WithdrawPage } from '@/features/student/WithdrawPage'
import { ForbiddenPage } from '@/features/system/ForbiddenPage'
import { NotFoundPage } from '@/features/system/NotFoundPage'

export function AppRouter() {
  return (
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
        </Route>

        <Route element={<RoleGuard roles={['ADMIN']} />}>
          <Route path="admin/users" element={<UserAccountsPage />} />
          <Route path="admin/roles" element={<RolesPage />} />
          <Route path="admin/settings" element={<SettingsPage />} />
          <Route path="admin/audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>
      <Route path="/home" element={<Navigate replace to="/" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRouter
