import { useState, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useStore } from '../store/useStore'
import { 
  Plus, Minus, Info, ArrowRightLeft,
  Smartphone, Wallet, CheckCircle2, AlertTriangle, TrendingUp,
  ShieldCheck, Zap, Vault, History, ArrowDownLeft
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle
} from '../components/ui/responsive-dialog'
import { CustomAreaChart } from '../components/ui/Charts'

export default function Depot() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const vault_balance = useStore(state => state.vault_balance || 0)
  const allVaultTransactions = useStore(state => state.vault_transactions) || []
  const vault_transactions = useMemo(() => allVaultTransactions.filter(tx => tx.boutiqueId === activeBoutiqueId), [allVaultTransactions, activeBoutiqueId])
  const fintech_balances = useStore(state => state.fintech_balances || {})
  
  const transferToVault = useStore(state => state.transferToVault)
  const withdrawFromVault = useStore(state => state.withdrawFromVault)
  const performVaultAudit = useStore(state => state.performVaultAudit)
  const transferVaultToFintech = useStore(state => state.transferVaultToFintech)
  const transferVaultToCash = useStore(state => state.transferVaultToCash)
  
  const config = useStore(state => state.config)
  const vault_categories_in = config?.vault_categories_in || ['Dépôt Sécurité']
  const vault_categories_out = config?.vault_categories_out || ['Retrait Gérant']
  const fintech_providers = config?.fintech_providers || []

  // 🚀 P4 — Consolidation de l'état local pour réduire les re-rendus
  const [ui, setUi] = useState({
    showAddIn: false,
    showAddOut: false,
    showAudit: false,
    showTransfer: false
  })

  const [form, setForm] = useState({
    amount: '',
    category: vault_categories_in[0] || '',
    source: 'Caisse',
    deductFromCash: false,
    outAmount: '',
    outCategory: vault_categories_out[0] || '',
    outReason: '',
    auditPhysical: '',
    transferAmount: '',
    transferTarget: fintech_providers[0]?.value || 'cash'
  })

  const updateUi = (patch) => setUi(prev => ({ ...prev, ...patch }))
  const updateForm = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const chartData = useMemo(() => {
    if (vault_transactions.length === 0) return []
    const sorted = [...vault_transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
    let currentBalance = 0
    return sorted.slice(-15).map(tx => {
      currentBalance += (tx.type === 'in' ? tx.amount : -tx.amount)
      return {
        name: new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        value: currentBalance,
        fullDate: new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      }
    })
  }, [vault_transactions])

  // 🚀 P4 — Virtualisation de la liste des mouvements
  const parentRef = useRef(null)
  const rowVirtualizer = useVirtualizer({
    count: vault_transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65,
    overscan: 5,
  })

  const handleAddIn = (e) => {
    e.preventDefault()
    if (!form.amount) return
    transferToVault(Number(form.amount), form.source, form.deductFromCash, form.category)
    updateForm({ amount: '' })
    updateUi({ showAddIn: false })
  }

  const handleAddOut = (e) => {
    e.preventDefault()
    if (!form.outAmount || !form.outReason) return
    const success = withdrawFromVault(Number(form.outAmount), form.outReason, form.outCategory)
    if (success) {
      updateForm({ outAmount: '', outReason: '' })
      updateUi({ showAddOut: false })
    }
  }

  const handleAudit = (e) => {
    e.preventDefault()
    if (!form.auditPhysical) return
    performVaultAudit(Number(form.auditPhysical))
    updateForm({ auditPhysical: '' })
    updateUi({ showAudit: false })
  }

  const handleTransfer = (e) => {
    e.preventDefault()
    if (!form.transferAmount) return
    let success = false
    if (form.transferTarget === 'cash') {
      success = transferVaultToCash(Number(form.transferAmount))
    } else {
      success = transferVaultToFintech(Number(form.transferAmount), form.transferTarget)
    }
    if (success) {
      updateForm({ transferAmount: '' })
      updateUi({ showTransfer: false })
    }
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Dépôt Liquide</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-widest">Gestion du Coffre & Trésorerie</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => updateUi({ showAudit: true })}
            className="flex-1 sm:flex-none bg-muted/50 text-muted-foreground px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-muted transition-all active:scale-95"
          >
            <ShieldCheck size={16} /> Auditer
          </button>
          <button 
            onClick={() => updateUi({ showAddIn: true })}
            className="flex-1 sm:flex-none bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-md active:scale-95"
          >
            <Plus size={16} /> Entrée
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-primary p-6 rounded-[32px] text-white shadow-xl shadow-primary/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Vault size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Solde Actuel du Coffre</p>
            <h2 className="text-4xl sm:text-5xl font-black tabular-nums">{vault_balance.toLocaleString()} F</h2>
            <div className="flex flex-wrap gap-3 mt-6">
               <button 
                onClick={() => updateUi({ showAddOut: true })}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 backdrop-blur-sm border border-white/10"
               >
                 <Minus size={14} /> Sortie Gérant
               </button>
               <button 
                onClick={() => updateUi({ showTransfer: true })}
                className="bg-white text-primary hover:bg-white/90 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
               >
                 <ArrowRightLeft size={14} /> Transférer
               </button>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="bg-card p-5 rounded-[24px] border border-border/50 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Zap size={20} />
             </div>
             <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Fintech</p>
                <p className="text-xl font-black">
                  {Object.values(fintech_balances).reduce((a, b) => a + b, 0).toLocaleString()} F
                </p>
             </div>
          </div>
          <div className="bg-card p-5 rounded-[24px] border border-border/50 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft size={20} />
             </div>
             <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Dernier Dépôt</p>
                <p className="text-xl font-black">
                  {(vault_transactions.find(t => t.type === 'in')?.amount || 0).toLocaleString()} F
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
         <div className="lg:col-span-2 bg-card rounded-[28px] border border-border/50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" /> Évolution du Trésor
               </h3>
            </div>
            <div className="h-[220px] w-full">
              {chartData.length > 1 ? (
                <CustomAreaChart data={chartData} />
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-[24px]">
                   <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">En attente de transactions...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-[28px] border border-border/50 shadow-sm flex flex-col h-full max-h-[400px]">
            <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card z-10 rounded-t-[28px]">
              <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                <History size={16} className="text-primary" /> Mouvements
              </h3>
            </div>
            <div ref={parentRef} className="flex-1 overflow-y-auto no-scrollbar px-2 relative">
              {vault_transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <Info className="mx-auto text-muted-foreground/20 mb-3" size={30} />
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Vide</p>
                </div>
              ) : (
                <div 
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const tx = vault_transactions[virtualRow.index]
                    return (
                      <div 
                        key={virtualRow.key} 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-xl"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'in' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                            {tx.type === 'in' ? <Plus size={14} /> : <Minus size={14} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-xs tabular-nums">{tx.amount.toLocaleString()} F</h4>
                            <p className="text-[8px] font-black text-muted-foreground uppercase truncate opacity-70">{tx.category}</p>
                          </div>
                        </div>
                        <p className="text-[8px] font-bold text-muted-foreground/50 uppercase">{new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
      </div>

      {/* --- MODALS --- */}
      
      <ResponsiveDialog open={ui.showAddIn} onOpenChange={(o) => updateUi({ showAddIn: o })}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Dépôt de Fonds</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <form onSubmit={handleAddIn} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Montant à déposer</label>
              <input 
                type="number" 
                value={form.amount} 
                onChange={e => updateForm({ amount: e.target.value })}
                className="w-full p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl text-2xl font-black focus:border-primary outline-none"
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Catégorie</label>
              <select 
                value={form.category} 
                onChange={e => updateForm({ category: e.target.value })}
                className="w-full p-3 border-2 border-border/50 rounded-xl bg-muted/10 font-bold text-sm"
              >
                {vault_categories_in.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Source des fonds</label>
              <input 
                type="text" 
                value={form.source} 
                onChange={e => updateForm({ source: e.target.value })}
                className="w-full p-3 border-2 border-border/50 rounded-xl bg-muted/10 font-bold text-sm"
                placeholder="Ex: Caisse Physique"
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl border border-border/50">
               <input 
                type="checkbox" 
                id="deduct" 
                checked={form.deductFromCash} 
                onChange={e => updateForm({ deductFromCash: e.target.checked })}
                className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
               />
               <label htmlFor="deduct" className="text-[10px] font-black uppercase cursor-pointer">Déduire de la caisse physique</label>
            </div>
            <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl shadow-primary/20 active:scale-95 transition-all">
              Valider le dépôt
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={ui.showAddOut} onOpenChange={(o) => updateUi({ showAddOut: o })}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Retrait du Coffre</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <form onSubmit={handleAddOut} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Montant à retirer</label>
              <input 
                type="number" 
                value={form.outAmount} 
                onChange={e => updateForm({ outAmount: e.target.value })}
                className="w-full p-4 bg-red-500/5 border-2 border-red-500/20 rounded-2xl text-2xl font-black focus:border-red-500 outline-none"
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Catégorie</label>
              <select 
                value={form.outCategory} 
                onChange={e => updateForm({ outCategory: e.target.value })}
                className="w-full p-3 border-2 border-border/50 rounded-xl bg-muted/10 font-bold text-sm"
              >
                {vault_categories_out.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Motif / Description</label>
              <input 
                type="text" 
                value={form.outReason} 
                onChange={e => updateForm({ outReason: e.target.value })}
                className="w-full p-3 border-2 border-border/50 rounded-xl bg-muted/10 font-bold text-sm"
                placeholder="Ex: Paiement Facture"
                required
              />
            </div>
            <button type="submit" className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl shadow-red-500/20 active:scale-95 transition-all">
              Confirmer le retrait
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={ui.showTransfer} onOpenChange={(o) => updateUi({ showTransfer: o })}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Transfert de Trésorerie</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {fintech_providers.map(p => (
                  <button 
                    key={p.value}
                    type="button" 
                    onClick={() => updateForm({ transferTarget: p.value })} 
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${form.transferTarget === p.value ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 text-muted-foreground'}`}
                  >
                     <div 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-lg ${form.transferTarget === p.value ? '' : 'opacity-40 grayscale'}`}
                        style={{ backgroundColor: form.transferTarget === p.value ? (p.color || 'hsl(var(--primary))') : 'hsl(var(--muted-foreground))' }}
                     >
                       {p.name[0]}
                     </div>
                     <span className="text-[10px] font-black uppercase">{p.name}</span>
                  </button>
                ))}
                <button 
                  type="button" 
                  onClick={() => updateForm({ transferTarget: 'cash' })} 
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${form.transferTarget === 'cash' ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 text-muted-foreground'}`}
                >
                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-lg ${form.transferTarget === 'cash' ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                     <Wallet size={18} />
                   </div>
                   <span className="text-[10px] font-black uppercase">Caisse</span>
                </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Montant à transférer</label>
              <input 
                type="number" 
                value={form.transferAmount} 
                onChange={e => updateForm({ transferAmount: e.target.value })}
                className="w-full p-4 bg-muted/20 border-2 border-border/50 rounded-xl text-2xl font-black focus:border-primary outline-none"
                placeholder="0"
                required
              />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl shadow-primary/20 active:scale-95 transition-all">
              Confirmer le transfert
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={ui.showAudit} onOpenChange={(o) => updateUi({ showAudit: o })}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Audit Physique</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <form onSubmit={handleAudit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Montant Réel Compté (Cash)</label>
              <input 
                type="number" 
                value={form.auditPhysical} 
                onChange={e => updateForm({ auditPhysical: e.target.value })}
                className="w-full p-4 bg-amber-500/5 border-2 border-amber-500/20 rounded-2xl text-2xl font-black focus:border-amber-500 outline-none"
                placeholder="0"
                required
              />
            </div>
            <button type="submit" className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-sm uppercase shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
              Valider l'audit
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
