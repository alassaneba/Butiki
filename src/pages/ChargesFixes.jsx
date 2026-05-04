import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { useSearchParams } from 'react-router-dom'
import { 
  Home, Zap, Droplets, ShieldCheck, Plus, X, 
  Calendar, DollarSign, TrendingUp, AlertCircle, 
  CheckCircle2, Clock, Trash2, Receipt
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'

const CHARGE_TYPES = [
  { value: 'loyer', label: 'Loyer', icon: Home, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { value: 'elec', label: 'Électricité', icon: Zap, color: 'text-amber-500 bg-amber-500/10 border-amber-400/20' },
  { value: 'eau', label: 'Eau', icon: Droplets, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
  { value: 'securite', label: 'Sécurité', icon: ShieldCheck, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
  { value: 'autre', label: 'Autre Charge', icon: DollarSign, color: 'text-muted-foreground bg-muted border-border' },
]

export default function ChargesFixes() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allFixedCharges = useStore(state => state.fixed_charges || [])
  const fixed_charges = useMemo(() => allFixedCharges.filter(c => c.boutiqueId === activeBoutiqueId), [allFixedCharges, activeBoutiqueId])
  const addFixedCharge = useStore(state => state.addFixedCharge)
  const payFixedCharge = useStore(state => state.payFixedCharge)
  const [searchParams, setSearchParams] = useSearchParams()
  const filterType = searchParams.get('filter')
  
  const [ui, setUi] = useState({ showAdd: false })
  const [form, setForm] = useState({
    label: '',
    amount: '',
    type: 'loyer',
    recurrence: 'mensuel'
  })

  const updateForm = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.label || !form.amount) return
    addFixedCharge({ 
      label: form.label, 
      amount: Number(form.amount), 
      type: form.type, 
      recurrence: form.recurrence, 
      status: 'pending' 
    })
    setForm({ label: '', amount: '', type: 'loyer', recurrence: 'mensuel' })
    setUi({ showAdd: false })
  }

  const totalMonthly = useMemo(() => {
    return fixed_charges.reduce((acc, c) => acc + (c.recurrence === 'mensuel' ? c.amount : c.amount / 12), 0)
  }, [fixed_charges])

  const displayedCharges = useMemo(() => {
    if (filterType === 'pending') {
      return fixed_charges.filter(c => c.status === 'pending')
    }
    return fixed_charges
  }, [fixed_charges, filterType])

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Charges Fixes & OPEX</h1>
          <p className="text-muted-foreground font-bold mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
             <Calendar size={14} className="text-primary"/> Planification financière ERP
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="bg-card border border-border px-3 py-1.5 rounded-xl flex flex-col items-end shadow-sm">
             <span className="text-[8px] font-black text-muted-foreground uppercase">Est. Mensuelle</span>
             <span className="text-base font-black tracking-tighter text-primary">{totalMonthly.toLocaleString()} F</span>
          </div>
          <button 
            onClick={() => setUi({ showAdd: true })}
            className="bg-primary text-white p-3 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center shrink-0"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {filterType === 'pending' && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex justify-between items-center shadow-sm">
          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14} /> Charges en attente uniquement
          </p>
          <button onClick={() => setSearchParams({})} className="text-[9px] font-black bg-amber-500 text-white px-2 py-1 rounded-md active:scale-95 transition-transform">VOIR TOUT</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {displayedCharges.map((charge, idx) => {
            const config = CHARGE_TYPES.find(t => t.value === charge.type) || CHARGE_TYPES[4]
            const Icon = config.icon
            
            return (
              <motion.div 
                key={charge.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`card-ultra-compact flex flex-col gap-3 relative overflow-hidden ${charge.status === 'pending' ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/50 bg-card hover:border-primary/30'}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${config.color} border`}>
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black uppercase tracking-tight truncate">{charge.label}</h3>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">{charge.recurrence}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-base font-black tracking-tighter ${charge.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {Number(charge.amount).toLocaleString()} F
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                     <Clock size={10} />
                     {charge.lastPaidDate ? `Payé le ${new Date(charge.lastPaidDate).toLocaleDateString()}` : 'Jamais payé'}
                   </div>
                   
                   {charge.status === 'pending' ? (
                      <button 
                       onClick={() => payFixedCharge(charge.id, charge.amount)}
                       className="btn-ultra-compact bg-amber-500 text-white shadow-sm flex items-center gap-1 hover:bg-amber-600"
                      >
                        <Receipt size={12} /> PAYER
                      </button>
                   ) : (
                      <div className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={10} /> À Jour
                      </div>
                   )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {fixed_charges.length === 0 && (
          <div className="col-span-full py-10 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
             <TrendingUp className="mx-auto text-muted-foreground/20 mb-2" size={32} />
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Aucune charge fixe planifiée</p>
          </div>
        )}
      </div>

      {/* DRAWER AJOUT */}
      <ResponsiveDialog open={ui.showAdd} onOpenChange={(o) => setUi({ showAdd: o })}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Nouvelle Charge Fixe</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Planification d'une dépense OPEX</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Désignation</label>
              <input type="text" value={form.label} onChange={e => updateForm({ label: e.target.value })} placeholder="ex: Loyer Boutique..." className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" required />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Type</label>
                <select value={form.type} onChange={e => updateForm({ type: e.target.value })} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-xs font-black uppercase outline-none focus:border-primary transition-all">
                  {CHARGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Fréquence</label>
                <select value={form.recurrence} onChange={e => updateForm({ recurrence: e.target.value })} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-xs font-black uppercase outline-none focus:border-primary transition-all">
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-primary ml-1">Montant Prévu (F)</label>
              <input type="number" value={form.amount} onChange={e => updateForm({ amount: e.target.value })} className="w-full p-4 bg-primary/5 border-2 border-primary/20 rounded-xl text-2xl font-black focus:border-primary outline-none transition-all" placeholder="0" required />
            </div>

            <button type="submit" className="w-full py-3.5 rounded-xl bg-primary text-white font-black text-sm uppercase shadow-md active:scale-95 transition-all mt-2">
              Ajouter au Budget
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
