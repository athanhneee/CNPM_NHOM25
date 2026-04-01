import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 4, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('grid gap-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded-full bg-slate-200"
          style={{ width: `${100 - index * 8}%` }}
        />
      ))}
    </div>
  )
}

export default LoadingSkeleton
