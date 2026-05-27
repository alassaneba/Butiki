import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { useStore } from '../../../store/useStore'
import clsx from 'clsx'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '../../ui/responsive-dialog'

export default function CloseRegisterModal({ open, onClose, expectedCash, totalExpenses, totalInflows }) {
  const closeCashRegister = useStore(state => state.closeCashRegister)
  const config = useStore(state => state.config)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const daily_cash_register = useStore(state => state.daily_cash_register)
  const activeUserId = useStore(state => state.activeUserId)
  const activeUser = useStore(state => state.users.find(u => u.id === activeUserId))
  
  const fintech_providers = config?.fintech_providers || []
  const fintech_balances = useStore(state => state.fintech_balances[activeBoutiqueId || 'b1']) || {}
  
  const todayDateString = new Date().toLocaleDateString()
  const todayRegister = daily_cash_register.find(
    (reg) => new Date(reg.date).toLocaleDateString() === todayDateString && (reg.boutiqueId || 'b1') === activeBoutiqueId
  )

  const [closing, setClosing] = useState({ amount: '', wave: '', orange: '', manager: activeUser?.name || '' })
  const setClosingField = useCallback((field, value) => setClosing(p => ({ ...p, [field]: value })), [])

  useEffect(() => {
    if (activeUser?.name) {
      setClosing(p => p.manager === activeUser.name ? p : { ...p, manager: activeUser.name })
    }
  }, [activeUser?.name])

  const handleClose = useCallback((e) => {
    e.preventDefault()
    if (!todayRegister) return

    const closeData = {
      cash: Number(closing.amount)
    }
    fintech_providers.forEach(p => {
      closeData[p.value] = Number(closing[p.value] || 0)
    })

    closeCashRegister(todayRegister.id, closeData, totalExpenses, totalInflows, closing.manager)
    onClose()
    setClosing({ amount: '', wave: '', orange: '', manager: activeUser?.name || '' })
  }, [closing, todayRegister, closeCashRegister, totalExpenses, totalInflows, onClose, fintech_providers, activeUser])

  return (
    <ResponsiveDialog open={open} onOpenChange={onClose}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Clôture de Session</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Comptez l'argent physique présent dans le tiroir-caisse.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleClose} className="space-y-4 mt-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex justify-between">
                <span>Espèces en Caisse (Réel)</span>
                <span className="text-primary opacity-60">Attendu: {expectedCash.toLocaleString()} F</span>
              </label>
              <input 
                type="number" 
                value={closing.amount}
                onChange={(e) => setClosingField('amount', e.target.value)}
                className={clsx(
                  "w-full p-4 border-2 rounded-xl text-2xl font-black outline-none transition-all",
                  Number(closing.amount) === expectedCash ? "border-emerald-500/30 bg-emerald-500/5 focus:border-emerald-500" : "border-border/50 bg-background focus:border-primary"
                )}
                placeholder="0"
                required
              />
              {closing.amount && Number(closing.amount) !== expectedCash && (
                <p className={clsx(
                  "text-[9px] font-black uppercase px-2 py-1 rounded-lg mt-1 inline-block",
                  Number(closing.amount) > expectedCash ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                )}>
                  Écart : {(Number(closing.amount) - expectedCash).toLocaleString()} F {Number(closing.amount) > expectedCash ? '(Surplus)' : '(Manquant)'}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Responsable de Clôture</label>
              <input 
                type="text" 
                value={closing.manager}
                onChange={(e) => setClosingField('manager', e.target.value)}
                className="w-full p-3 border-2 border-border/50 rounded-xl bg-background text-sm font-bold focus:border-primary outline-none transition-all"
                placeholder="Nom du responsable"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {fintech_providers.map(provider => (
                <div key={provider.value} className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase ml-1 flex justify-between gap-2" style={{ color: provider.color || 'hsl(var(--primary))' }}>
                    <span className="truncate">{provider.name}</span>
                    <span className="opacity-50 shrink-0">Exp: {(fintech_balances[provider.value] || 0).toLocaleString()}</span>
                  </label>
                  <input 
                    type="number" 
                    value={closing[provider.value] || ''}
                    onChange={(e) => setClosingField(provider.value, e.target.value)}
                    className="w-full p-3 border rounded-xl bg-muted/5 text-lg font-black outline-none transition-all"
                    style={{ borderColor: `${provider.color}33`, color: provider.color }}
                    placeholder="Solde Réel"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
             <p className="text-[10px] font-bold text-primary flex items-center gap-1.5"><AlertCircle size={14}/> Les ventes de la journée seront calculées automatiquement selon la formule : Arrêt + Dépenses - Entrées - Fond.</p>
          </div>
          <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
            Valider la Clôture <ShieldCheck size={18} />
          </button>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
