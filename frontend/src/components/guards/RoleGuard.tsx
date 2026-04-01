import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import type { UserRole } from '@/types/auth'

interface RoleGuardProps {
  roles?: UserRole[]
  children?: ReactNode
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const location = useLocation()
  const currentUser = useAuthStore((state) => state.currentUser)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)

  if (isBootstrapping) {
    return (
      <div className="mx-auto mt-20 max-w-2xl rounded-[28px] bg-white p-8 shadow-soft">
        <LoadingSkeleton lines={8} />
      </div>
    )
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  if (roles && !roles.some((role) => currentUser.roles.includes(role))) {
    return <Navigate replace to="/forbidden" />
  }

  return children ? <>{children}</> : <Outlet />
}

export default RoleGuard
