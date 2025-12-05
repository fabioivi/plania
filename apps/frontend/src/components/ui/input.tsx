import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-light bg-white px-3 py-2 text-sm text-black ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-medium focus-visible:outline-none focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-dark disabled:opacity-60 transition-colors",
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
