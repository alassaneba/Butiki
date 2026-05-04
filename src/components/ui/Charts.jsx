import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Custom Area Chart Component
 */
export function CustomAreaChart({ data, height = 300, color = "#3b82f6" }) {
  const [hovered, setHovered] = useState(null)
  
  const maxValue = Math.max(...data.map(d => d.value || d.ca || 0), 1)
  const width = 1000
  const paddingX = 40
  const paddingY = 20
  
  const points = data.map((d, i) => {
    const val = d.value || d.ca || 0
    const x = (i / (data.length - 1)) * (width - 2 * paddingX) + paddingX
    const y = height - paddingY - (val / maxValue) * (height - 2 * paddingY)
    return { x, y, ...d, val }
  })
  
  const pathData = points.reduce((acc, p, i) => {
    return acc + (i === 0 ? `M ${p.x},${p.y}` : ` L ${p.x},${p.y}`)
  }, "")
  
  const areaData = points.length > 0 
    ? `${pathData} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`
    : ""
    
  return (
    <div className="w-full h-full relative group/chart flex flex-col">
      <div className="flex-1 relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`areaGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {[0, 0.25, 0.5, 0.75, 1].map(tick => {
            const y = height - paddingY - tick * (height - 2 * paddingY)
            return (
              <line key={tick} x1={paddingX} y1={y} x2={width-paddingX} y2={y} stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4 4" />
            )
          })}

          <motion.path 
            d={areaData} 
            fill={`url(#areaGradient-${color.replace('#', '')})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
          
          <motion.path 
            d={pathData} 
            fill="none" 
            stroke={color} 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setHovered(p)} onMouseLeave={() => setHovered(null)}>
              <motion.circle 
                cx={p.x} cy={p.y} r="6" 
                fill={color}
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="cursor-pointer"
              />
              <rect x={p.x-20} y={0} width={40} height={height} fill="transparent" className="cursor-pointer" />
            </g>
          ))}
        </svg>

        <AnimatePresence>
          {hovered && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute z-50 bg-gray-900/95 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl pointer-events-none"
              style={{ 
                left: `${(hovered.x / width) * 100}%`, 
                top: `${(hovered.y / height) * 100}%`,
                transform: 'translate(-50%, -120%)'
              }}
            >
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{hovered.name || hovered.fullDate}</p>
              <p className="text-sm font-black text-white">{hovered.val.toLocaleString()} F</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between px-[2%] mt-4">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter opacity-40">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Custom Pie Chart (Donut)
 */
export function CustomPieChart({ data, size = 200, hole = 60 }) {
  const [hovered, setHovered] = useState(null)
  const total = data.reduce((acc, d) => acc + (d.value || 0), 0)
  let currentAngle = 0

  const items = data.map((d, i) => {
    const angle = (d.value / total) * 360
    const start = currentAngle
    currentAngle += angle
    return { ...d, start, angle }
  })

  return (
    <div className="flex items-center gap-8">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {items.map((item, i) => {
            const x1 = 50 + 50 * Math.cos((item.start * Math.PI) / 180)
            const y1 = 50 + 50 * Math.sin((item.start * Math.PI) / 180)
            const x2 = 50 + 50 * Math.cos(((item.start + item.angle) * Math.PI) / 180)
            const y2 = 50 + 50 * Math.sin(((item.start + item.angle) * Math.PI) / 180)
            const largeArc = item.angle > 180 ? 1 : 0

            return (
              <motion.path
                key={i}
                d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={item.color || `hsl(${i * 45}, 70%, 50%)`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: hovered && hovered.name !== item.name ? 0.3 : 1,
                  scale: hovered && hovered.name === item.name ? 1.05 : 1
                }}
                onMouseEnter={() => setHovered(item)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              />
            )
          })}
          <circle cx="50" cy="50" r={hole / 2} fill="hsl(var(--card))" />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">Total</p>
          <p className="text-xl font-black tracking-tighter">{total.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {items.map((item, i) => (
          <div 
            key={i} 
            className={`flex items-center justify-between p-2 rounded-xl transition-all ${hovered?.name === item.name ? 'bg-muted/50 scale-105' : ''}`}
            onMouseEnter={() => setHovered(item)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[100px]">{item.name}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black">{item.value.toLocaleString()} F</p>
              <p className="text-[8px] font-bold text-muted-foreground">{Math.round((item.value / total) * 100)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Custom Bar Chart
 */
export function CustomBarChart({ data, height = 200, color = "#3b82f6" }) {
  const [hovered, setHovered] = useState(null)
  const maxValue = Math.max(...data.map(d => d.value || 0), 1)

  return (
    <div className="w-full flex items-end gap-2 px-2" style={{ height }}>
      {data.map((item, i) => {
        const h = (item.value / maxValue) * 100
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
            <div className="w-full relative flex flex-col justify-end h-full">
              <AnimatePresence>
                {hovered === i && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded-lg z-10 whitespace-nowrap"
                  >
                    {item.value.toLocaleString()} F
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="w-full rounded-t-xl transition-all cursor-pointer"
                style={{ backgroundColor: item.color || color, opacity: hovered === i ? 1 : 0.8 }}
              />
            </div>
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter truncate w-full text-center">{item.name}</span>
          </div>
        )
      })}
    </div>
  )
}
