import React from 'react'
import clsx from 'clsx'

export function Card({ children, className, interactive, onClick, ...props }) {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "bg-card border border-border rounded-3xl shadow-sm overflow-hidden",
        interactive && "hover:border-primary/50 transition-all cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={clsx("p-4 border-b border-border/50 flex flex-col gap-1", className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={clsx("text-sm font-black uppercase tracking-widest", className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={clsx("p-4", className)} {...props}>
      {children}
    </div>
  )
}
