import React, { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { 
  Plus, Check, Clock, Printer, ArrowRight, FileText, 
  Mic, MicOff, Tag, Wallet, TrendingDown, History,
  ShieldCheck, AlertCircle, ShoppingBag, Smartphone, X
} from 'lucide-react'
import { printReceipt, formatClosingReceipt } from '../lib/bluetooth'
import { printDailyReport } from '../lib/print-report'
import { useVoiceInput } from '../lib/useVoiceInput'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import FintechModule from '../components/FintechModule'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogTrigger
} from '../components/ui/responsive-dialog'

// Catégories dynamiques via le store

export default function Caisse() {
  const daily_cash_register = useStore(state => state.daily_cash_register)
  const expenses = useStore(state => state.expenses)
  const inflows = useStore(state => state.inflows)
  const openCashRegister = useStore(state => state.openCashRegister)
  const closeCashRegister = useStore(state => state.closeCashRegister)
  const addExpense = useStore(state => state.addExpense)
  const addInflow = useStore(state => state.addInflow)
  const transferFintechToCash = useStore(state => state.transferFintechToCash)
  const transferToVault = useStore(state => state.transferToVault)
  const fintech_balances = useStore(state => state.fintech_balances || { wave: 0, orange: 0 })
  const logAction = useStore(state => state.logAction)
  const config = useStore(state => state.config)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const activeUser = useStore(state => state.users.find(u => u.id === state.activeUserId))
  
  const expense_categories = config?.expense_categories || []
  const fintech_providers = config?.fintech_providers || []
  
  const todayDateString = new Date().toLocaleDateString()
  const todayRegister = daily_cash_register.find(
    (reg) => new Date(reg.date).toLocaleDateString() === todayDateString && (reg.boutiqueId || 'b1') === activeBoutiqueId
  )

  // 🚀 P3 — States groupés pour éviter les cascades de re-rendus
  // Avant : 19 useState indépendants. Après : 4 objets thématiques.
  const [opening, setOpening] = useState({ amount: '', wave: '', orange: '', manager: activeUser?.name || '' })
  const [closing, setClosing] = useState({ amount: '', wave: '', orange: '', manager: activeUser?.name || '' })
  const [expense, setExpense] = useState({ amount: '', desc: '', category: 'general', paymentMethod: 'cash' })
  const [dialogs, setDialogs] = useState({ vault: false, close: false, fintech: false, expenseD: false, inflow: false, transfer: false })
  const [vault, setVault] = useState({ amount: '' })
  const [inflow, setInflow] = useState({ amount: '', desc: '', paymentMethod: 'cash' })
  const [transfer, setTransfer] = useState({ amount: '', provider: 'wave' })
  const [isPrinting, setIsPrinting] = useState(false)

  const todayExpenses = expenses.filter(
    (exp) => new Date(exp.date).toLocaleDateString() === todayDateString && (exp.boutiqueId || 'b1') === activeBoutiqueId
  )
  const totalExpenses = todayExpenses.reduce((acc, val) => acc + Number(val.amount), 0)

  const todayInflows = (inflows || []).filter(
    (inf) => new Date(inf.date).toLocaleDateString() === todayDateString && (inf.boutiqueId || 'b1') === activeBoutiqueId
  )
  const totalInflows = todayInflows.reduce((acc, val) => acc + Number(val.amount), 0)

  // 🚀 Calcul des soldes attendus (Réconciliation)
  const expectedCash = React.useMemo(() => {
    if (!todayRegister) return 0
    const cashInflows = todayInflows.filter(i => i.paymentMethod === 'cash').reduce((acc, val) => acc + Number(val.amount || 0), 0)
    const cashExpenses = todayExpenses.filter(e => e.paymentMethod === 'cash').reduce((acc, val) => acc + Number(val.amount || 0), 0)
    return (todayRegister.opening_balance || 0) + cashInflows - cashExpenses
  }, [todayRegister, todayInflows, todayExpenses])

  // Helpers pour mise à jour partielle
  const setOpeningField = useCallback((field, value) => setOpening(p => ({ ...p, [field]: value })), [])
  const setClosingField = useCallback((field, value) => setClosing(p => ({ ...p, [field]: value })), [])
  const setExpenseField = useCallback((field, value) => setExpense(p => ({ ...p, [field]: value })), [])
  const openDialog = useCallback((key) => setDialogs(p => ({ ...p, [key]: true })), [])
  const closeDialog = useCallback((key) => setDialogs(p => ({ ...p, [key]: false })), [])

  useEffect(() => {
    if (activeUser?.name) {
      setOpening(p => {
        if (!p.manager) return { ...p, manager: activeUser.name }
        return p
      })
      setClosing(p => {
        if (!p.manager) return { ...p, manager: activeUser.name }
        return p
      })
    }
  }, [activeUser?.name])

  const { listening, startListening, stopListening, supported: voiceSupported } = useVoiceInput({
    onResult: (text) => setExpenseField('desc', text)
  })

  const handleOpen = useCallback((e) => {
    e.preventDefault()
    if (!opening.amount) return
    
    // Dynamically collect fintech openings
    const openData = {
      opening_balance: Number(opening.amount),
      manager_name: opening.manager
    }
    fintech_providers.forEach(p => {
      openData[`opening_${p.value}`] = Number(opening[p.value] || 0)
    })

    openCashRegister(openData)
    setOpening({ amount: '', wave: '', orange: '', manager: activeUser?.name || '' })
  }, [opening, openCashRegister, fintech_providers, activeUser])

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
    closeDialog('close')
    setClosing({ amount: '', wave: '', orange: '', manager: activeUser?.name || '' })
  }, [closing, todayRegister, closeCashRegister, totalExpenses, totalInflows, closeDialog, fintech_providers, activeUser])

  const handleAddExpense = useCallback((e) => {
    e.preventDefault()
    if (!expense.amount || !expense.desc) return
    addExpense({ amount: Number(expense.amount), description: expense.desc, category: expense.category, paymentMethod: expense.paymentMethod })
    setExpense({ amount: '', desc: '', category: 'general', paymentMethod: 'cash' })
    closeDialog('expenseD')
  }, [expense, addExpense, closeDialog])

  const handleVaultTransfer = useCallback((e) => {
    e.preventDefault()
    if (!vault.amount) return
    transferToVault(Number(vault.amount), 'caisse', true, 'Dépôt Sécurité')
    setVault({ amount: '' })
    closeDialog('vault')
  }, [vault, transferToVault, closeDialog])

  const handleAddInflow = useCallback((e) => {
    e.preventDefault()
    if (!inflow.amount || !inflow.desc) return
    addInflow({ amount: Number(inflow.amount), description: inflow.desc, paymentMethod: inflow.paymentMethod })
    setInflow({ amount: '', desc: '', paymentMethod: 'cash' })
    closeDialog('inflow')
  }, [inflow, addInflow, closeDialog])

  const handleTransfer = useCallback((e) => {
    e.preventDefault()
    if (!transfer.amount) return
    transferFintechToCash(transfer.provider, transfer.amount)
    setTransfer({ amount: '', provider: 'wave' })
    closeDialog('transfer')
  }, [transfer, transferFintechToCash, closeDialog])

  const handlePrint = useCallback(async () => {
    if (!todayRegister) return
    setIsPrinting(true)
    try {
      const receiptData = formatClosingReceipt(todayRegister, todayExpenses)
      await printReceipt(receiptData)
    } catch (err) {
      alert(err.message)
    } finally {
      setIsPrinting(false)
    }
  }, [todayRegister, todayExpenses])


  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Caisse & OPEX</h1>
          <p className="text-muted-foreground font-bold mt-0.5 uppercase text-[10px] tracking-widest flex items-center gap-2">
             <History size={12} className="text-primary"/> {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <button 
           onClick={() => openDialog('transfer')}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
          >
             <ArrowRight size={16} /> Vers Caisse
          </button>
          <button 
             onClick={() => openDialog('fintech')}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl border-2 border-primary/20 bg-primary/5 text-primary font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
          >
             <Smartphone size={16} /> Fintech Pay
          </button>
          {todayRegister && (
            <div className={`px-3 py-2 rounded-xl border font-black text-[10px] uppercase tracking-wider flex items-center justify-center shrink-0 ${todayRegister.closing_balance ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-primary/10 border-primary/20 text-primary animate-pulse'}`}>
               {todayRegister.closing_balance ? '✓ Clôturée' : '● Ouverte'}
            </div>
          )}
        </div>
      </header>

      {/* MODAL FINTECH */}
       <ResponsiveDialog open={dialogs.fintech} onOpenChange={(v) => setDialogs(p => ({ ...p, fintech: v }))}>
        <ResponsiveDialogContent>
           <ResponsiveDialogHeader>
             <ResponsiveDialogTitle>Paiement Fintech</ResponsiveDialogTitle>
             <ResponsiveDialogDescription>Traitement des paiements digitaux via Mobile Money.</ResponsiveDialogDescription>
           </ResponsiveDialogHeader>
           <div className="mt-2 relative">
             <FintechModule 
                onComplete={() => {
                  closeDialog('fintech')
                }} 
             />
           </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <AnimatePresence>
        {!todayRegister ? (
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
        ) : (
          <Motion.div 
            key="register-active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-4 will-change-[transform,opacity]"
          >
            {/* STATUT & CLÔTURE */}
            <div className="space-y-4">
              <div className="p-4 bg-card rounded-2xl border border-border/50 shadow-sm space-y-4 h-full">
                <div className="flex items-center justify-between mb-1">
                   <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Session de Vente</h3>
                   <ShoppingBag size={16} className="text-primary opacity-30" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="card-ultra-compact border-border/50">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">Fond Initial</p>
                    <p className="text-sm sm:text-base font-black">{Number(todayRegister.opening_balance).toLocaleString()} F</p>
                  </div>

                  {todayRegister.closing_balance ? (
                    <>
                      <div className="card-ultra-compact border-red-500/20 bg-red-500/5">
                         <p className="text-[8px] font-black uppercase text-red-500/70 mb-0.5">Dépenses</p>
                         <p className="text-sm sm:text-base font-black text-red-600">-{totalExpenses.toLocaleString()} F</p>
                      </div>
                      <div className="card-ultra-compact border-emerald-500/20 bg-emerald-500/5">
                         <p className="text-[8px] font-black uppercase text-emerald-500/70 mb-0.5">Entrées</p>
                         <p className="text-sm sm:text-base font-black text-emerald-600">+{totalInflows.toLocaleString()} F</p>
                      </div>
                      <div className="card-ultra-compact bg-muted/30">
                         <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">Arrêt Déclaré</p>
                         <p className="text-sm sm:text-base font-black">{Number(todayRegister.closing_balance).toLocaleString()} F</p>
                      </div>
                      <div className="card-ultra-compact border-blue-500/20 bg-blue-500/5 col-span-2 flex justify-between items-center">
                         <div>
                            <p className="text-[9px] font-black uppercase text-blue-500/70 mb-0.5">Ventes nettes</p>
                            <p className="text-lg font-black tracking-tighter text-blue-600">{Number(todayRegister.calculated_sales).toLocaleString()} F</p>
                         </div>
                         <TrendingDown size={24} className="text-blue-500 opacity-20" />
                      </div>
                    </>
                  ) : (
                    <div className="card-ultra-compact border-emerald-500/20 bg-emerald-500/5">
                       <p className="text-[8px] font-black uppercase text-emerald-500/70 mb-0.5">Entrées Diverses</p>
                       <p className="text-sm sm:text-base font-black text-emerald-600">+{totalInflows.toLocaleString()} F</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2">
                   <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-black text-sm">W</div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-blue-500/70">Solde Wave</p>
                        <p className="text-sm font-black text-blue-600">{(fintech_balances?.wave || 0).toLocaleString()} F</p>
                      </div>
                   </div>
                   <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-black text-sm">O</div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-orange-500/70">Solde Orange Money</p>
                        <p className="text-sm font-black text-orange-600">{(fintech_balances?.orange || 0).toLocaleString()} F</p>
                      </div>
                   </div>
                </div>

                {todayRegister.closing_balance && (
                  <Motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 pt-2"
                  >
                    <button
                      onClick={() => printDailyReport(todayRegister, todayExpenses)}
                      className="flex-1 btn-ultra-compact bg-secondary text-foreground flex justify-center items-center gap-1.5"
                    >
                      <FileText size={14}/> Rapport
                    </button>
                    <button
                      onClick={handlePrint}
                      disabled={isPrinting}
                      className="flex-1 btn-ultra-compact bg-primary text-white flex justify-center items-center gap-1.5 disabled:opacity-50"
                    >
                      <Printer size={14}/> {isPrinting ? '...' : 'Ticket Z'}
                    </button>
                  </Motion.div>
                )}

                {!todayRegister.closing_balance && (
                  <div className="pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => openDialog('inflow')}
                         className="btn-ultra-compact bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95"
                       >
                         + ENTRÉE
                       </button>
                       <button 
                         onClick={() => openDialog('vault')}
                         className="btn-ultra-compact bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                       >
                         VERS DÉPÔT <ArrowRight size={12} />
                       </button>
                    </div>
                    <button 
                      onClick={() => openDialog('close')}
                      className="w-full bg-muted text-foreground py-3 rounded-xl font-black text-[10px] uppercase border border-border/50 hover:bg-secondary active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      Clôturer la journée <ShieldCheck size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* GESTION DÉPENSES */}
            <div className="space-y-4">
              <div className="p-4 bg-card rounded-2xl border border-border/50 shadow-sm space-y-3 h-full flex flex-col">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-red-500">Dépenses du Jour</h3>
                  <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-widest">
                     {totalExpenses.toLocaleString()} F
                  </div>
                </div>
                
                {!todayRegister.closing_balance && (
                  <button 
                   onClick={() => openDialog('expenseD')}
                    className="w-full py-2.5 rounded-xl border border-dashed border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus size={14} /> Ajouter une Dépense
                  </button>
                )}

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-[150px]">
                  <AnimatePresence initial={false}>
                    {todayExpenses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/30 gap-2 h-full">
                        <Wallet size={24} />
                        <p className="text-[8px] font-black uppercase tracking-widest italic">Zéro OPEX</p>
                      </div>
                    ) : (
                      todayExpenses.slice().reverse().map((exp) => {
                        const cat = expense_categories.find(c => c.value === (exp.category || 'general'))
                        return (
                          <Motion.div 
                            key={exp.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card-ultra-compact flex justify-between items-center hover:border-red-500/30 transition-all border border-border/50"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center text-sm shrink-0">{cat?.emoji || '📦'}</div>
                              <div className="min-w-0">
                                <p className="font-black text-[11px] truncate">{exp.description}</p>
                                <span className="text-[8px] font-bold text-muted-foreground/60 tracking-widest uppercase">{new Date(exp.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                            <span className="font-black text-red-500 text-sm shrink-0">-{Number(exp.amount).toLocaleString()}</span>
                          </Motion.div>
                        )
                      })
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Entrées */}
            <div className="lg:col-span-2 p-4 bg-card rounded-2xl border border-border/50 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-emerald-500">Entrées de Fonds Extra</h3>
                    {!todayRegister?.closing_balance && (
                      <button 
                        onClick={() => openDialog('inflow')}
                        className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                 </div>

               <div className="flex flex-wrap gap-2">
                  {todayInflows.length === 0 ? (
                    <p className="text-[9px] font-black uppercase tracking-widest italic text-muted-foreground/40 py-2">Aucune entrée</p>
                  ) : (
                    todayInflows.slice().reverse().map((inf) => (
                      <div key={inf.id} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg shrink-0">
                        <span className="text-[10px] font-black">{inf.description}</span>
                        <span className="text-[10px] font-black text-emerald-500">+{Number(inf.amount).toLocaleString()}</span>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* DRAWERS */}

      {/* Clôture Caisse */}
      <ResponsiveDialog open={dialogs.close} onOpenChange={(v) => setDialogs(p => ({ ...p, close: v }))}>
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

      {/* Transfert vers Dépôt */}
      <ResponsiveDialog open={dialogs.vault} onOpenChange={(v) => setDialogs(p => ({ ...p, vault: v }))}>
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

      {/* Ajout Dépense */}
      <ResponsiveDialog open={dialogs.expenseD} onOpenChange={(v) => setDialogs(p => ({ ...p, expenseD: v }))}>
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

      {/* Ajout Entrée */}
      <ResponsiveDialog open={dialogs.inflow} onOpenChange={(v) => setDialogs(p => ({ ...p, inflow: v }))}>
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

      {/* Transfert Fintech -> Cash */}
      <ResponsiveDialog open={dialogs.transfer} onOpenChange={(v) => setDialogs(p => ({ ...p, transfer: v }))}>
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
                    onClick={() => setTransfer(p=>({...p,provider:p.value}))} 
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
              <input type="number" value={transfer.amount} onChange={(e) => setTransfer(p=>({...p, amount: e.target.value}))} className="w-full p-4 border-2 border-emerald-500/20 rounded-xl bg-background text-2xl font-black text-emerald-500 focus:border-emerald-500 outline-none" placeholder="0" required />
            </div>

            <button type="submit" className="w-full bg-emerald-500 text-white py-3.5 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
              Confirmer le Retrait <ArrowRight size={18} />
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}


