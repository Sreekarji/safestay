import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-ink text-white dark:bg-white dark:text-ink',
    secondary: 'bg-canvas-soft text-body dark:bg-[#1a1a1a] dark:text-[#888888] border border-hairline dark:border-[#333333]',
    destructive: 'bg-error-soft text-error-deep dark:bg-[rgba(238,0,0,0.15)] dark:text-error',
    outline: 'border border-hairline dark:border-[#333333] text-body dark:text-[#888888]',
    success: 'bg-link-bg-soft text-link dark:bg-[rgba(0,112,243,0.15)] dark:text-link',
    warning: 'bg-warning-soft text-warning-deep dark:bg-[rgba(245,166,35,0.15)] dark:text-warning',
    info: 'bg-link-bg-soft text-link dark:bg-[rgba(0,112,243,0.15)] dark:text-link',
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
