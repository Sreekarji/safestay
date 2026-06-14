import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm text-ink ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-mute focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/10 focus-visible:border-ink/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111111] dark:text-[#ededed] dark:border-[#333333] dark:placeholder:text-[#666666] dark:focus-visible:ring-white/10 dark:focus-visible:border-[#555555] transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
