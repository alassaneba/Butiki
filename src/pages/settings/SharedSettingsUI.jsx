import React, { useState } from 'react'
import clsx from 'clsx'
import { Trash2, Plus } from 'lucide-react'

export const Label = ({ children, className }) => (
  <label className={clsx("text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 block", className)}>
    {children}
  </label>
)

export const Input = ({ className, ...props }) => (
  <input 
    {...props} 
    className={clsx(
      "w-full p-2.5 bg-background/50 border border-border/50 rounded-xl text-sm font-bold focus:ring-4 ring-primary/5 focus:border-primary outline-none transition-all placeholder:opacity-30",
      className
    )} 
  />
)

export const Card = ({ children, className, title, icon: Icon, action }) => (
  <div className={clsx("bg-card/30 backdrop-blur-sm border border-border/50 rounded-[24px] p-5 shadow-premium overflow-hidden relative", className)}>
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
          {Icon && <Icon size={14} className="text-primary" />} {title}
        </h3>
        {action}
      </div>
    )}
    {children}
  </div>
)

export const ListEditor = ({ title, icon: Icon, items = [], onUpdate, type = 'text' }) => {
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState(type === 'phone' ? '📱' : '📦')
  const [newColor, setNewColor] = useState('#3b82f6')

  const handleAdd = () => {
    if (!newLabel) return
    const val = newLabel.toLowerCase().replace(/\s+/g, '_')
    if (type === 'category') {
      onUpdate([...items, { value: val, label: newLabel, emoji: newEmoji }])
    } else if (type === 'fintech') {
      onUpdate([...items, { name: newLabel, value: val, color: newColor }])
    } else if (type === 'phone') {
      onUpdate([...items, { name: newLabel, value: val, emoji: newEmoji }])
    } else {
      onUpdate([...items, newLabel])
    }
    setNewLabel('')
  }

  const removeItem = (idx) => {
    if (window.confirm("Supprimer cet élément ?")) {
      onUpdate(items.filter((_, i) => i !== idx))
    }
  }

  return (
    <Card title={title} icon={Icon}>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 no-scrollbar mb-4">
        {items.length === 0 && <p className="text-[10px] font-bold text-muted-foreground opacity-30 italic py-2 text-center">Aucun élément</p>}
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-muted/20 border border-border/30 rounded-xl group hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2.5">
              {type === 'category' ? (
                <>
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                </>
              ) : type === 'fintech' ? (
                <>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-black uppercase tracking-tight">{item.name}</span>
                </>
              ) : type === 'phone' ? (
                <>
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-[11px] font-black uppercase tracking-tight">{item.name}</span>
                </>
              ) : (
                <span className="text-[11px] font-black uppercase tracking-tight">{item}</span>
              )}
            </div>
            <button onClick={() => removeItem(i)} className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 items-center">
        {(type === 'category' || type === 'phone') && (
          <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} className="w-9 h-9 p-0 bg-background/50 border border-border/50 rounded-xl text-center text-sm outline-none focus:border-primary transition-all" />
        )}
        {type === 'fintech' && (
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-9 h-9 p-1 bg-background/50 border border-border/50 rounded-xl cursor-pointer outline-none" />
        )}
        <input 
          value={newLabel} 
          onChange={e => setNewLabel(e.target.value)} 
          className="flex-1 h-9 px-3 bg-background/50 border border-border/50 rounded-xl text-[11px] font-black uppercase outline-none focus:border-primary transition-all" 
          placeholder="Ajouter..." 
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} className="w-9 h-9 shrink-0 flex items-center justify-center bg-primary text-white rounded-xl active:scale-90 transition-all shadow-lg shadow-primary/20">
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </Card>
  )
}
