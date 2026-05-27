import React, { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../../../store/useStore'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '../../ui/responsive-dialog'

export default function AddInflowModal({ open, onClose }) {
  const addInflow = useStore(state => state.addInflow)
  const [inflow, setInflow] = useState({ amount: '', desc: '', paymentMethod: 'cash' })

  const handleAddInflow = useCallback((e) => {
    e.preventDefault()
    if (!inflow.amount || !inflow.desc) return
    addInflow({ amount: Number(inflow.amount), description: inflow.desc, paymentMethod: inflow.paymentMethod })
    setInflow({ amount: '', desc: '', paymentMethod: 'cash' })
    onClose()
  }, [inflow, addInflow, onClose])

  return (
    <ResponsiveDialog open={open} onOpenChange={onClose}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nouvelle Entrée</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Saisissez une entrée d'argent extra.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleAddInflow} className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</label>
            <input type="text" value={inflow.desc} onChange={(e) => setInflow(p => ({...p, desc: e.target.value}))} className="w-full p-3 bg-background border-2 border-border/50 rounded-xl text-sm font-bold focus:border-emerald-500 outline-none" placeholder="Ex: Apport personnel..." required />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mode de règlement</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setInflow(p => ({ ...p, paymentMethod: 'cash' }))} className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${inflow.paymentMethod === 'cash' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-background text-muted-foreground border-border/50 hover:border-emerald-500/30'}`}>Espèces</button>
              <button type="button" onClick={() => setInflow(p => ({ ...p, paymentMethod: 'wave' }))} className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${inflow.paymentMethod === 'wave' ? 'bg-blue-500 text-white border-blue-500' : 'bg-background text-muted-foreground border-border/50 hover:border-blue-500/30'}`}>Wave</button>
              <button type="button" onClick={() => setInflow(p => ({ ...p, paymentMethod: 'orange' }))} className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${inflow.paymentMethod === 'orange' ? 'bg-orange-500 text-white border-orange-500' : 'bg-background text-muted-foreground border-border/50 hover:border-orange-500/30'}`}>Orange Money</button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-emerald-500 ml-1">Montant</label>
            <input type="number" value={inflow.amount} onChange={(e) => setInflow(p => ({...p, amount: e.target.value}))} className="w-full p-4 bg-background border-2 border-emerald-500/20 rounded-xl text-xl font-black text-emerald-500 focus:border-emerald-500 outline-none" placeholder="0" required />
          </div>

          <button type="submit" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all mt-2">
            <Plus size={16} /> Enregistrer l'Entrée
          </button>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
