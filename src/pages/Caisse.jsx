import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { 
  Plus, Clock, Printer, ArrowRight, FileText, 
  Wallet, TrendingDown, History,
  ShieldCheck, AlertCircle, ShoppingBag, Smartphone
} from 'lucide-react'
import { printReceipt, formatClosingReceipt } from '../lib/bluetooth'
import { printDailyReport } from '../lib/print-report'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import FintechModule from '../components/FintechModule'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from '../components/ui/responsive-dialog'

import OpenRegisterCard from '../components/caisse/OpenRegisterCard'
import AddExpenseModal from '../components/caisse/modals/AddExpenseModal'
import AddInflowModal from '../components/caisse/modals/AddInflowModal'
import CloseRegisterModal from '../components/caisse/modals/CloseRegisterModal'
import { VaultTransferModal, FintechTransferModal } from '../components/caisse/modals/TransferModals'

export default function Caisse() {
  const daily_cash_register = useStore(state => state.daily_cash_register)
  const expenses = useStore(state => state.expenses)
  const inflows = useStore(state => state.inflows)
  const fintech_balances = useStore(state => state.fintech_balances[state.activeBoutiqueId || 'b1']) || { wave: 0, orange: 0 }
  const config = useStore(state => state.config)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  
  const expense_categories = config?.expense_categories || []
  
  const todayDateString = new Date().toLocaleDateString()
  const todayRegister = daily_cash_register.find(
    (reg) => new Date(reg.date).toLocaleDateString() === todayDateString && (reg.boutiqueId || 'b1') === activeBoutiqueId
  )

  const [dialogs, setDialogs] = useState({ vault: false, close: false, fintech: false, expenseD: false, inflow: false, transfer: false })
  const [isPrinting, setIsPrinting] = useState(false)

  const todayExpenses = useMemo(() => {
    return expenses.filter(
      (exp) => new Date(exp.date).toLocaleDateString() === todayDateString && (exp.boutiqueId || 'b1') === activeBoutiqueId
    )
  }, [expenses, todayDateString, activeBoutiqueId])

  const totalExpenses = useMemo(() => {
    return todayExpenses.reduce((acc, val) => acc + Number(val.amount), 0)
  }, [todayExpenses])

  const todayInflows = useMemo(() => {
    return (inflows || []).filter(
      (inf) => new Date(inf.date).toLocaleDateString() === todayDateString && (inf.boutiqueId || 'b1') === activeBoutiqueId
    )
  }, [inflows, todayDateString, activeBoutiqueId])

  const totalInflows = useMemo(() => {
    return todayInflows.reduce((acc, val) => acc + Number(val.amount), 0)
  }, [todayInflows])

  const expectedCash = React.useMemo(() => {
    if (!todayRegister) return 0
    const cashInflows = todayInflows.filter(i => i.paymentMethod === 'cash').reduce((acc, val) => acc + Number(val.amount || 0), 0)
    const cashExpenses = todayExpenses.filter(e => e.paymentMethod === 'cash').reduce((acc, val) => acc + Number(val.amount || 0), 0)
    return (todayRegister.opening_balance || 0) + cashInflows - cashExpenses
  }, [todayRegister, todayInflows, todayExpenses])

  const openDialog = useCallback((key) => setDialogs(p => ({ ...p, [key]: true })), [])
  const closeDialog = useCallback((key) => setDialogs(p => ({ ...p, [key]: false })), [])

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
       <ResponsiveDialog open={dialogs.fintech} onOpenChange={(v) => setDialogs(p => p.fintech === v ? p : ({ ...p, fintech: v }))}>
        <ResponsiveDialogContent>
           <ResponsiveDialogHeader>
             <ResponsiveDialogTitle>Paiement Fintech</ResponsiveDialogTitle>
             <ResponsiveDialogDescription>Traitement des paiements digitaux via Mobile Money.</ResponsiveDialogDescription>
           </ResponsiveDialogHeader>
           <div className="mt-2 relative">
             <FintechModule 
                onComplete={() => closeDialog('fintech')} 
             />
           </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <AnimatePresence>
        {!todayRegister ? (
          <OpenRegisterCard />
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

      {/* DRAWERS & MODALS EXPORTED */}
      <CloseRegisterModal 
        open={dialogs.close} 
        onClose={() => closeDialog('close')} 
        expectedCash={expectedCash}
        totalExpenses={totalExpenses}
        totalInflows={totalInflows}
      />
      <VaultTransferModal 
        open={dialogs.vault} 
        onClose={() => closeDialog('vault')} 
      />
      <AddExpenseModal 
        open={dialogs.expenseD} 
        onClose={() => closeDialog('expenseD')} 
      />
      <AddInflowModal 
        open={dialogs.inflow} 
        onClose={() => closeDialog('inflow')} 
      />
      <FintechTransferModal 
        open={dialogs.transfer} 
        onClose={() => closeDialog('transfer')} 
      />
    </div>
  )
}



