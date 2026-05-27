import React, { useState, useEffect } from 'react'
import { motion as Motion } from 'framer-motion'
import { ArrowRight, Clock } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function OpenRegisterCard() {
  const openCashRegister = useStore(state => state.openCashRegister)
  const config = useStore(state => state.config)
  const activeUser = useStore(state => state.users.find(u => u.id === state.activeUserId))
  const fintech_providers = config?.fintech_providers || []

  const [opening, setOpening] = useState({ amount: '', manager: activeUser?.name || '' })

  useEffect(() => {
    if (activeUser?.name) {
      setOpening(p => p.manager === activeUser.name ? p : { ...p, manager: activeUser.name })
    }
  }, [activeUser?.name])

  const setOpeningField = (field, value) => setOpening(p => ({ ...p, [field]: value }))

  const handleOpen = (e) => {
    e.preventDefault()
    if (!opening.amount) return
    
    const openData = {
      opening_balance: Number(opening.amount),
      manager_name: opening.manager
    }
    fintech_providers.forEach(p => {
      openData[`opening_${p.value}`] = Number(opening[p.value] || 0)
    })

    openCashRegister(openData)
    // No need to reset state here as the component unmounts immediately
  }

  return (
    <Motion.div 
      key="open-caisse"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-6 bg-card rounded-3xl border border-border/50 shadow-sm text-center max-w-sm mx-auto space-y-4 mt-10"
    >
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
         <Clock size={32} />
      </div>
      <div>
        <h2 className="text-xl font-black tracking-tighter uppercase">Caisse Fermée</h2>
        <p className="text-muted-foreground font-medium text-xs">Déclarez le fond de caisse.</p>
      </div>
      
      <form onSubmit={handleOpen} className="space-y-4 text-left pt-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Responsable</label>
          <input 
            type="text" 
             value={opening.manager}
            onChange={(e) => setOpeningField('manager', e.target.value)}
            className="w-full p-3 border-2 border-border/50 rounded-xl bg-background text-sm font-bold focus:border-primary outline-none transition-all"
            placeholder="Nom du responsable"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fond de roulement (Espèces)</label>
          <input 
            type="number" 
             value={opening.amount}
            onChange={(e) => setOpeningField('amount', e.target.value)}
            className="w-full p-3 border-2 border-border/50 rounded-xl bg-background text-xl font-black focus:border-primary outline-none transition-all placeholder:text-muted/30"
            placeholder="0"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {fintech_providers.map(provider => (
            <div key={provider.value} className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: provider.color || 'hsl(var(--primary))' }}>Fond {provider.name}</label>
              <input 
                type="number" 
                value={opening[provider.value] || ''}
                onChange={(e) => setOpeningField(provider.value, e.target.value)}
                className="w-full p-3 border-2 border-border/50 rounded-xl bg-background font-black outline-none transition-all"
                style={{ borderColor: `${provider.color}22` }}
                placeholder="0"
                required
              />
            </div>
          ))}
        </div>
        <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-black text-sm uppercase hover:opacity-90 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
          Ouvrir la Caisse <ArrowRight size={18} />
        </button>
      </form>
    </Motion.div>
  )
}
