import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-gray-light bg-white px-3 py-2 text-sm text-black ring-offset-background placeholder:text-gray-medium focus-visible:outline-none focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-dark disabled:opacity-60 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
