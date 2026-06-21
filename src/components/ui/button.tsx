import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "premium"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    let baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]"
    
    let variantStyles = ""
    switch (variant) {
      case "default":
        variantStyles = "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 dark:shadow-emerald-500/10"
        break
      case "destructive":
        variantStyles = "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
        break
      case "outline":
        variantStyles = "border border-neutral-800 dark:border-neutral-700 bg-transparent text-neutral-300 hover:bg-neutral-800 hover:text-white dark:text-neutral-400 dark:hover:text-white"
        break
      case "secondary":
        variantStyles = "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
        break
      case "ghost":
        variantStyles = "hover:bg-neutral-100 hover:text-neutral-900 text-neutral-500 dark:hover:bg-white/[0.06] dark:hover:text-white dark:text-neutral-450"
        break
      case "premium":
        variantStyles = "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 dark:shadow-emerald-500/15"
        break
      case "link":
        variantStyles = "text-emerald-500 underline-offset-4 hover:underline dark:text-emerald-400"
        break
    }

    let sizeStyles = ""
    switch (size) {
      case "default":
        sizeStyles = "h-11 px-5 py-2"
        break
      case "sm":
        sizeStyles = "h-9 px-3 rounded-lg text-xs"
        break
      case "lg":
        sizeStyles = "h-13 px-8 text-base rounded-2xl"
        break
      case "icon":
        sizeStyles = "h-11 w-11"
        break
    }

    return (
      <button
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }