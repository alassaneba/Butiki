import React, { useState, useCallback } from 'react'
import { Plus, Mic, MicOff } from 'lucide-react'
import { useStore } from '../../../store/useStore'
import { useVoiceInput } from '../../../lib/useVoiceInput'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '../../ui/responsive-dialog'

export default function AddExpenseModal({ open, onClose }) {
  const addExpense = useStore(state => state.addExpense)
  const config = useStore(state => state.config)
  const expense_categories = config?.expense_categories || []
  const fintech_providers = config?.fintech_providers || []

  const [expense, setExpense] = useState({ amount: '', desc: '', category: 'general', paymentMethod: 'cash' })
  const setExpenseField = useCallback((field, value) => setExpense(p => ({ ...p, [field]: value })), [])

  const { listening, startListening, stopListening, supported: voiceSupported } = useVoiceInput({
    onResult: (text) => setExpenseField('desc', text)
  })

  const handleAddExpense = useCallback((e) => {
    e.preventDefault()
    if (!expense.amount || !expense.desc) return
    addExpense({ amount: Number(expense.amount), description: expense.desc, category: expense.category, paymentMethod: expense.paymentMethod })
    setExpense({ amount: '', desc: '', category: 'general', paymentMethod: 'cash' })
    onClose()
  }, [expense, addExpense, onClose])

  return (
    <ResponsiveDialog open={open} onOpenChange={onClose}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nouvelle Dépense</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Saisissez une sortie d'argent de la caisse.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleAddExpense} className="space-y-3 mt-2">
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Motif</label>
            <input
              type="text"
              value={expense.desc}
              onChange={(e) => setExpenseField('desc', e.target.value)}
              className="w-full p-3 bg-background border-2 border-border/50 rounded-xl text-sm font-bold focus:border-red-500 outline-none pr-10"
              placeholder="Ex: Achat fournitures..."
              required
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                className={`absolute right-2 top-[28px] p-1.5 rounded-lg transition-all ${
                  listening ? 'bg-red-500 text-white animate-pulse' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Catégorie</label>
            <div className="grid grid-cols-2 gap-2">
              {expense_categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setExpenseField('category', cat.value)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${expense.category === cat.value ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-background text-muted-foreground border-border/50 hover:border-red-500/30'}`}
                >
                  <span className="text-sm">{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mode de règlement</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button type="button" onClick={() => setExpenseField('paymentMethod', 'cash')} className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${expense.paymentMethod === 'cash' ? 'bg-red-500 text-white border-red-500' : 'bg-background text-muted-foreground border-border/50 hover:border-red-500/30'}`}>Espèces</button>
              {fintech_providers.map(p => (
                <button 
                  key={p.value} 
                  type="button" 
                  onClick={() => setExpenseField('paymentMethod', p.value)} 
                  className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase border transition-all truncate ${expense.paymentMethod === p.value ? 'bg-blue-500 text-white border-blue-500' : 'bg-background text-muted-foreground border-border/50 hover:border-blue-500/30'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-red-500 ml-1">Montant à déduire</label>
            <input
              type="number"
              value={expense.amount}
              onChange={(e) => setExpenseField('amount', e.target.value)}
              className="w-full p-4 bg-background border-2 border-red-500/20 rounded-xl text-xl font-black text-red-500 focus:border-red-500 outline-none"
              placeholder="0"
              required
            />
          </div>

          <button type="submit" className="w-full bg-red-500 text-white py-3.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all mt-2">
            <Plus size={16} /> Enregistrer la Sortie
          </button>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
