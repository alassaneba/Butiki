import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Smartphone, ShieldCheck, X, ArrowRight, Clipboard, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function FintechModule({ onComplete, type = 'payment' }) {
  const logFintechTransaction = useStore(state => state.logFintechTransaction)
  const addExpense = useStore(state => state.addExpense)
  const config = useStore(state => state.config)
  const providers = config?.fintech_providers || []
  
  const [step, setStep] = useState(1)
  const [provider, setProvider] = useState(null)
  const [smsData, setSmsData] = useState('')
  const [amount, setAmount] = useState('')
  const [txId, setTxId] = useState('')

  const handleParseSMS = () => {
    // Simulation simple de parsing de texte SMS
    const amountMatch = smsData.match(/(\d+)\s*F/i)
    const idMatch = smsData.match(/ID\s*:\s*(\w+)/i) || smsData.match(/Ref\s*:\s*(\w+)/i)

    if (amountMatch) setAmount(amountMatch[1])
    if (idMatch) setTxId(idMatch[1])
    
    setStep(3)
  }

  const handleConfirm = () => {
    const transaction = {
      provider: provider.value,
      amount: Number(amount),
      txId,
      type,
      status: 'confirmed'
    }
    
    logFintechTransaction(transaction)
    
    if (type === 'expense') {
      addExpense({
        amount: Number(amount),
        description: `[${provider.name.toUpperCase()}] Ref:${txId}`,
        category: 'fintech',
        paymentMethod: provider.value
      })
    }
    
    onComplete(transaction)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Smartphone size={20} />
        </div>
        <div>
          <h3 className="font-black uppercase text-sm tracking-tight">Fintech Butik</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Intégration Mobile Money</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1" 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-2 gap-4"
          >
            {providers.map(p => (
              <button 
                key={p.value}
                onClick={() => { setProvider(p); setStep(2) }}
                className="p-6 rounded-3xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-3 group"
              >
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: p.color || 'hsl(var(--primary))', boxShadow: `0 10px 15px -3px ${p.color}33` }}
                >
                  {p.name[0]}
                </div>
                <span className="font-black text-xs uppercase">{p.name}</span>
              </button>
            ))}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2" 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-muted/30 p-4 rounded-2xl border border-dashed border-border flex gap-3">
              <Clipboard size={16} className="text-muted-foreground shrink-0 mt-1" />
              <p className="text-[10px] font-medium leading-relaxed text-muted-foreground uppercase tracking-wider">
                Copiez le SMS de confirmation {provider?.name} reçu et collez-le ci-dessous pour une extraction automatique.
              </p>
            </div>
            <textarea 
              value={smsData}
              onChange={(e) => setSmsData(e.target.value)}
              placeholder="Collez le SMS ici..."
              className="w-full p-4 bg-muted/20 border border-border rounded-2xl text-sm font-medium h-32 focus:border-primary outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-border font-bold text-xs">RETOUR</button>
              <button onClick={handleParseSMS} className="flex-[2] py-3 rounded-xl bg-primary text-white font-black text-xs uppercase flex items-center justify-center gap-2">
                ANALYSER <Zap size={14} />
              </button>
            </div>
            <button onClick={() => setStep(3)} className="w-full text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors py-2">Saisie Manuelle</button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3" 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Montant Détecté (F)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="w-full p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl text-2xl font-black focus:border-primary outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">ID Transaction / Référence</label>
                <input 
                  type="text" 
                  value={txId} 
                  onChange={(e) => setTxId(e.target.value)} 
                  className="w-full p-4 bg-muted/20 border border-border rounded-2xl text-sm font-black focus:border-primary outline-none"
                />
              </div>
            </div>
            <button 
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              CONFIRMER LA RÉCEPTION <ShieldCheck size={20} />
            </button>
            <button onClick={() => setStep(2)} className="w-full text-[10px] font-black uppercase text-muted-foreground hover:text-primary py-2">Corriger</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
