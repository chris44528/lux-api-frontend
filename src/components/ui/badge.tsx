import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-gray-900",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-700/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-900/80",
        outline: "text-foreground dark:border-gray-600 dark:text-gray-200",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 