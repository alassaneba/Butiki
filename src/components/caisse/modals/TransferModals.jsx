import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useStore } from '../../../store/useStore'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '../../ui/responsive-dialog'

export function VaultTransferModal({ open, onClose }) {
  const transferToVault = useStore(state => state.transferToVault)
  const [vault, setVault] = useState({ amount: '' })

  const handleVaultTransfer = (e) => {
    e.preventDefault()
    if (!vault.amount) return
    transferToVault(Number(vault.amount), 'caisse', true, 'Dépôt Sécurité')
    setVault({ amount: '' })
    onClose()
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onClose}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Transfert vers Dépôt</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>L'argent sera retiré de la caisse physique et ajouté au coffre sécurisé.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form onSubmit={handleVaultTransfer} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Montant à sécuriser (F)</label>
            <input 
              type="number" 
              value={vault.amount} 
              onChange={e => setVault({ amount: e.target.value })} 
              className="w-full p-4 bg-muted/20 border-2 border-border/50 rounded-xl text-2xl font-black focus:border-primary outline-none transition-all" 
              placeholder="0"
              autoFocus
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all mt-4">
            Confirmer le transfert
          </button>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export function FintechTransferModal({ open, onClose }) {
  const transferFintechToCash = useStore(state => state.transferFintechToCash)
  const config = useStore(state => state.config)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const fintech_balances = useStore(state => state.fintech_balances[activeBoutiqueId || 'b1']) || {}
  const fintech_providers = config?.fintech_providers || []

  const [transfer, setTransfer] = useState({ amount: '', provider: fintech_providers[0]?.value || 'wave' })

  const handleTransfer = (e) => {
    e.preventDefault()
    if (!transfer.amount || !transfer.provider) return
    transferFintechToCash(transfer.provider, transfer.amount)
    setTransfer(p => ({ ...p, amount: '' }))
    onClose()
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onClose}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Retrait (Cash-out)</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Transférer de l'argent digital vers la caisse physique.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleTransfer} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Source du retrait</label>
            <div className="grid grid-cols-2 gap-2">
              {fintech_providers.map(p => (
                <button 
                  key={p.value}
                  type="button" 
                  onClick={() => setTransfer(prev => ({...prev, provider: p.value}))} 
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${transfer.provider === p.value ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 text-muted-foreground'}`}
                >
                   <div 
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-lg ${transfer.provider === p.value ? '' : 'opacity-40 grayscale'}`}
                      style={{ backgroundColor: transfer.provider === p.value ? (p.color || 'hsl(var(--primary))') : 'hsl(var(--muted-foreground))' }}
                   >
                     {p.name[0]}
                   </div>
                   <span className="text-[10px] font-black uppercase">{p.name}</span>
                   <span className="text-[9px] font-bold">{(fintech_balances?.[p.value] || 0).toLocaleString()} F</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-emerald-500 ml-1">Montant retiré</label>
            <input type="number" value={transfer.amount} onChange={(e) => setTransfer(prev => ({...prev, amount: e.target.value}))} className="w-full p-4 border-2 border-emerald-500/20 rounded-xl bg-background text-2xl font-black text-emerald-500 focus:border-emerald-500 outline-none" placeholder="0" required />
          </div>

          <button type="submit" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
            Confirmer le Retrait <ArrowRight size={18} />
          </button>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
