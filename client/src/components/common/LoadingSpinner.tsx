import { cn } from '@/lib/utils'
import { Shield } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingSpinner({ size = 'md', className, fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Shield
        className={cn(
          'text-primary-600 animate-pulse',
          sizeClasses[size]
        )}
      />
      <div className="relative">
        <div
          className={cn(
            'animate-spin rounded-full border-2 border-slate-200 border-t-primary-600',
            sizeClasses[size]
          )}
        />
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}
