import React from 'react'
import clsx from 'clsx'

const badgeVariants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-red-500 text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  outline: "text-foreground border border-border bg-transparent",
  softSuccess: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
  softWarning: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  softDestructive: "bg-red-500/10 text-red-600 border border-red-500/20",
  softPrimary: "bg-primary/10 text-primary border border-primary/20",
}

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span 
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
