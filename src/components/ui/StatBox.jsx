import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { Card } from './Card'

export function StatBox({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "bg-primary", 
  delay = 0 
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-3 sm:p-5 flex items-center justify-between group overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 ${color} opacity-5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110`} />
        
        <div className="flex flex-col gap-1 sm:gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h3>
            {trend !== undefined && (
              <span className={clsx(
                "text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full",
                trend >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              )}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          <span className="text-xl sm:text-3xl font-black tracking-tight">{value}</span>
        </div>
        
        <div className={clsx(`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-opacity-10 shrink-0 group-hover:scale-110 transition-transform relative z-10`, color)}>
          {Icon && <Icon size={20} className={color.replace('bg-', 'text-')} />}
        </div>
      </Card>
    </motion.div>
  )
}
