import { useRef, useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { CalendarDays, Wallet, Download, Lock, X, CheckCircle, Croissant, Flame, History, ArrowRight, BadgeCheck, Smartphone } from 'lucide-react'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short', day: '2-digit', month: 'short'
  })
}

const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function Historique() {
  const daily_cash_register = useStore(state => state.daily_cash_register)
  const expenses = useStore(state => state.expenses)
  const bread_logs = useStore(state => state.bread_logs)
  const gas_logs = useStore(state => state.gas_logs)
  const credit_logs = useStore(state => state.credit_logs || [])
  const suppliers = useStore(state => state.suppliers)
  const closeCashRegister = useStore(state => state.closeCashRegister)
  const logAction = useStore(state => state.logAction)
  const payBreadLog = useStore(state => state.payBreadLog)
  const payGasLog = useStore(state => state.payGasLog)
  const payCreditLog = useStore(state => state.payCreditLog)
  const fintech_transactions = useStore(state => state.fintech_transactions || [])
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const activeUser = useStore(state => state.users.find(u => u.id === state.activeUserId))

  const [activeTab, setActiveTab] = useState('caisse') // 'caisse', 'stock' or 'fintech'
  const [closingRegister, setClosingRegister] = useState(null)
  const [selectedDetailRegister, setSelectedDetailRegister] = useState(null)
  const [closingAmount, setClosingAmount] = useState('')
  const [managerName, setManagerName] = useState(activeUser?.name || '')

  useEffect(() => {
    if (activeUser?.name && !managerName) {
      setManagerName(activeUser.name)
    }
  }, [activeUser?.name, managerName])
  
  const sortedRegisters = daily_cash_register
    .filter(reg => (reg.boutiqueId || 'b1') === activeBoutiqueId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Fusion des logs pain, gaz et crédit pour l'historique stock
  const allStockLogs = [
    ...bread_logs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId).map(l => ({ ...l, logType: 'pain' })),
    ...gas_logs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId).map(l => ({ ...l, logType: 'gaz' })),
    ...credit_logs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId).map(l => ({ ...l, logType: 'credit' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const parentRef = useRef()

  const rowVirtualizer = useVirtualizer({
    count: activeTab === 'caisse' ? sortedRegisters.length : 
           activeTab === 'stock' ? allStockLogs.length : 
           fintech_transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  })

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Onglet Caisses
    const wsCaisseData = sortedRegisters.map(reg => ({
      'Date': new Date(reg.date).toLocaleDateString(),
      'Statut': reg.closing_balance !== null ? 'Clôturé' : 'En cours',
      'Fond initial': reg.opening_balance,
      'Caisse finale': reg.closing_balance || 'N/A',
      'Ventes': reg.calculated_sales || 'N/A'
    }));
    const wsCaisse = XLSX.utils.json_to_sheet(wsCaisseData);
    XLSX.utils.book_append_sheet(wb, wsCaisse, "Caisses");

    // Onglet Stock
    const wsStockData = allStockLogs.map(l => {
      const supplier = suppliers.find(s => s.id === l.supplier_id)?.name || 'Inconnu'
      return {
        'Date': new Date(l.date).toLocaleDateString(),
        'Heure': formatTime(l.date),
        'Type': l.logType === 'pain' ? 'PAIN' : l.logType === 'gaz' ? 'GAZ' : 'CRÉDIT',
        'Fournisseur': supplier,
        'Détails': l.logType === 'pain' 
          ? `${l.received_quantity} miches` 
          : l.logType === 'gaz' 
            ? `${l.b6_qty||0}B6, ${l.b9_qty||0}B9, ${l.b12_qty||0}B12`
            : Object.entries(l.breakdown || {}).map(([p, v]) => `${p}: ${v}`).join(', '),
        'Total (F)': l.total_to_pay,
        'Statut': l.paid ? 'Payé' : 'Non payé'
      }
    })
    const wsStock = XLSX.utils.json_to_sheet(wsStockData);
    XLSX.utils.book_append_sheet(wb, wsStock, "Mouvements_Stock");
    
    // Onglet Fintech
    const wsFintechData = fintech_transactions.map(tx => ({
      'Date': new Date(tx.date).toLocaleDateString(),
      'Heure': formatTime(tx.date),
      'Opérateur': tx.provider.toUpperCase(),
      'Type': tx.type === 'payment' ? 'ENCAISSEMENT' : tx.type === 'expense' ? 'DÉPENSE' : 'RETRAIT CAISSE',
      'Montant': tx.amount,
      'Client/Source': tx.clientName || tx.source || '--',
      'Statut': tx.status === 'confirmed' ? 'Confirmé' : 'En attente'
    }));
    const wsFintech = XLSX.utils.json_to_sheet(wsFintechData);
    XLSX.utils.book_append_sheet(wb, wsFintech, "Fintech");

    XLSX.writeFile(wb, `Butiki_Historique_Complet_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  const handleCloseRegister = (e) => {
    e.preventDefault()
    if (!closingRegister || !closingAmount) return

    const regDate = closingRegister.date ? new Date(closingRegister.date).toLocaleDateString() : ''
    const dayExpenses = expenses.filter(exp => exp.date && new Date(exp.date).toLocaleDateString() === regDate)
    const expensesTotal = dayExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)

    closeCashRegister(closingRegister.id, { cash: Number(closingAmount) }, expensesTotal, 0, managerName)
    logAction('Clôture Caisse (Historique)', `Caisse du ${regDate} clôturée par ${managerName} avec ${closingAmount} F (Dépenses: ${expensesTotal} F)`)
    
    setClosingRegister(null)
    setClosingAmount('')
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto w-full pb-20 will-change-[opacity]">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Historique</h1>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">Archives & Exports</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-2">
          <div className="flex bg-muted/40 p-1 rounded-xl border border-border shadow-inner w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('caisse')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'caisse' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Wallet size={14} /> Caisses
            </button>
            <button 
              onClick={() => setActiveTab('stock')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'stock' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <History size={14} /> Stock
            </button>
            <button 
              onClick={() => setActiveTab('fintech')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === 'fintech' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Smartphone size={14} /> Fintech
            </button>
          </div>
          
          <button 
            onClick={exportToExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Download size={14} /> Export XLS
          </button>
        </div>
      </header>

      <div className="bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden">
        <div 
          ref={parentRef} 
          className="h-[calc(100vh-220px)] sm:h-[65vh] overflow-auto w-full p-2 custom-scrollbar"
          style={{ contain: 'strict' }}
        >
          <div 
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              if (activeTab === 'caisse') {
                const reg = sortedRegisters[virtualItem.index]
                const isClosed = reg.closing_balance !== null
                const dateStr = new Date(reg.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%',
                      height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)`,
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`card-ultra-compact flex flex-col sm:flex-row justify-between items-center gap-2 transition-all ${isClosed ? 'border-border/50' : 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50'}`}
                    >
                      <div className="flex items-center gap-3 flex-1 w-full">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${isClosed ? 'bg-primary/10 text-primary' : 'bg-orange-500/20 text-orange-600'}`}>
                          <CalendarDays size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-xs sm:text-sm capitalize truncate">{dateStr}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${isClosed ? 'bg-muted/50 text-muted-foreground border-border/50' : 'bg-orange-500/20 text-orange-600 border-orange-500/30'}`}>
                              {isClosed ? 'Clôturé' : 'Session Ouverte'}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-bold truncate tracking-widest uppercase">{isClosed ? reg.closing_manager_name || reg.manager_name : reg.manager_name}</span>
                            {isClosed && reg.fintech_discrepancies && Object.values(reg.fintech_discrepancies).some(v => v !== 0) && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/10 text-red-600 border border-red-500/20">
                                Écart Fintech
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mobile-dashboard-grid sm:flex sm:items-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border/40 pt-2 sm:pt-0 sm:pl-4">
                        <div className="p-1.5 sm:p-0">
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5 sm:hidden">Caisse</p>
                          <p className="font-black text-[11px] sm:text-sm">{isClosed ? `${reg.closing_balance.toLocaleString()} F` : '--'}</p>
                        </div>
                        <div className="p-1.5 sm:p-0">
                          <p className="text-[8px] font-black uppercase tracking-widest text-primary/60 mb-0.5 sm:hidden">Ventes</p>
                          <p className="font-black text-[11px] sm:text-sm text-primary">{isClosed ? `${reg.calculated_sales.toLocaleString()} F` : '--'}</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {isClosed ? (
                            <button
                              onClick={() => setSelectedDetailRegister(reg)}
                              className="flex-1 sm:flex-none btn-ultra-compact bg-muted hover:bg-secondary text-foreground border border-border/50 shadow-sm active:scale-95 transition-all"
                            >
                              Détails
                            </button>
                          ) : (
                            <button
                              onClick={() => setClosingRegister(reg)}
                              className="flex-1 sm:flex-none btn-ultra-compact bg-orange-500 hover:bg-orange-600 text-white shadow-md active:scale-95"
                            >
                              Clôturer
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              } else if (activeTab === 'stock') {
                const log = allStockLogs[virtualItem.index]
                const supplier = suppliers.find(s => s.id === log.supplier_id)?.name || 'Inconnu'
                const isPain = log.logType === 'pain'
                
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%',
                      height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)`,
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`card-ultra-compact flex flex-col sm:flex-row justify-between items-center gap-2 transition-all ${log.paid ? 'border-border/50 bg-card' : 'border-primary/20 bg-primary/5 hover:border-primary/40'}`}
                    >
                      <div className="flex items-center gap-3 flex-1 w-full">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${isPain ? 'bg-amber-500/10 text-amber-600' : log.logType === 'gaz' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}`}>
                          {isPain ? <Croissant size={18} /> : log.logType === 'gaz' ? <Flame size={18} /> : <Smartphone size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{formatDate(log.date)} à {formatTime(log.date)}</p>
                          <h4 className="font-black text-xs sm:text-sm truncate">{supplier}</h4>
                          <p className="text-[9px] text-muted-foreground truncate font-bold uppercase tracking-widest">
                            {isPain ? (
                              `${log.received_quantity || 0} reçues — ${Number(Math.max(0, (log.total_to_pay || 0) / (log.unit_price || 135)).toFixed(2))} vendues`
                            ) : log.logType === 'gaz' ? (
                              `${log.b6_qty||0}B6, ${log.b9_qty||0}B9, ${log.b12_qty||0}B12`
                            ) : (
                              Object.entries(log.breakdown || {}).map(([p, v]) => {
                                const providerName = p ? p[0].toUpperCase() : '?'
                                return `${providerName}: ${(v || 0).toLocaleString()}F`
                              }).join(', ')
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mobile-dashboard-grid sm:flex sm:items-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border/40 pt-2 sm:pt-0 sm:pl-4">
                        <div className="p-1.5 sm:p-0">
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5 sm:hidden">Montant</p>
                          <p className="font-black text-[11px] sm:text-sm">{(log.total_to_pay || 0).toLocaleString()} F</p>
                        </div>
                        <div className="p-1.5 sm:p-0 col-span-2 sm:col-span-1">
                          {log.paid ? (
                            <div className="flex items-center justify-center sm:justify-end gap-1 text-green-600 font-black text-[9px] uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                              <BadgeCheck size={12} /> Payé
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (isPain) payBreadLog(log.id, supplier)
                                else if (log.logType === 'gaz') payGasLog(log.id, supplier)
                                else payCreditLog(log.id, supplier)
                              }}
                              className="w-full btn-ultra-compact bg-green-600 hover:bg-green-700 text-white shadow-md active:scale-95"
                            >
                              Payer
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              } else {
                const tx = fintech_transactions[virtualItem.index]
                if (!tx) return null
                const isWave = tx.provider === 'wave'
                const isPayment = tx.type === 'payment'
                const isTransfer = tx.type === 'transfer_to_cash'
                
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%',
                      height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)`,
                      padding: '0.25rem 0.5rem'
                    }}
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="card-ultra-compact flex flex-col sm:flex-row justify-between items-center gap-2"
                    >
                      <div className="flex items-center gap-3 flex-1 w-full">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 font-black text-white ${isWave ? 'bg-blue-500' : 'bg-orange-500'}`}>
                          {isWave ? 'W' : 'O'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{formatDate(tx.date)} à {formatTime(tx.date)}</p>
                          <h4 className="font-black text-xs sm:text-sm truncate">
                             {isPayment ? `Paiement ${tx.clientName}` : isTransfer ? 'Vers Caisse (Retrait)' : `Dépense ${tx.source || ''}`}
                          </h4>
                          <div className="flex items-center gap-2">
                             <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isPayment ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                               {isPayment ? '+ Entrée' : '- Sortie'}
                             </span>
                             {tx.status === 'confirmed' && <BadgeCheck size={12} className="text-emerald-500" />}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border/40 pt-2 sm:pt-0 sm:pl-4">
                        <div className="text-right">
                          <p className={`font-black text-sm ${isPayment ? 'text-emerald-600' : 'text-red-600'}`}>
                             {isPayment ? '+' : '-'} {Number(tx.amount).toLocaleString()} F
                          </p>
                          <p className="text-[8px] font-black uppercase text-muted-foreground/60">{tx.provider.toUpperCase()}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )
              }
            })}
          </div>
        </div>
      </div>

      {/* DRAWER DE DÉTAILS CAISSE */}
      <ResponsiveDialog open={!!selectedDetailRegister} onOpenChange={(open) => !open && setSelectedDetailRegister(null)}>
        <ResponsiveDialogContent className="max-w-2xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Détails de la Session</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Analyse complète du {selectedDetailRegister ? new Date(selectedDetailRegister.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {selectedDetailRegister && (() => {
            const reg = selectedDetailRegister
            const regDate = new Date(reg.date).toLocaleDateString()
            const dayExpenses = expenses.filter(exp => exp.date && new Date(exp.date).toLocaleDateString() === regDate)
            const dayInflows = (useStore.getState().inflows || []).filter(inf => inf.date && new Date(inf.date).toLocaleDateString() === regDate)
            
            const totalExpenses = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
            const totalInflows = dayInflows.reduce((sum, i) => sum + Number(i.amount), 0)
            
            return (
              <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Résumé Flux */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-muted/20 rounded-2xl border border-border/50">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Fond Initial</p>
                    <p className="font-black text-sm">{reg.opening_balance.toLocaleString()} F</p>
                  </div>
                  <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <p className="text-[8px] font-black uppercase text-emerald-600 mb-1">Entrées extra</p>
                    <p className="font-black text-sm text-emerald-600">+{totalInflows.toLocaleString()} F</p>
                  </div>
                  <div className="p-3 bg-red-500/5 rounded-2xl border border-red-500/10">
                    <p className="text-[8px] font-black uppercase text-red-600 mb-1">Dépenses (OPEX)</p>
                    <p className="font-black text-sm text-red-600">-{totalExpenses.toLocaleString()} F</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Caisse Finale</p>
                    <p className="font-black text-sm">{reg.closing_balance?.toLocaleString() || '--'} F</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 col-span-2">
                    <p className="text-[8px] font-black uppercase text-primary mb-1">Ventes nettes calculées</p>
                    <p className="font-black text-lg text-primary">{reg.calculated_sales?.toLocaleString() || '--'} F</p>
                  </div>
                </div>

                {/* Fintech & Écarts */}
                {reg.fintech_snapshots && (
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Réconciliation Fintech</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(reg.fintech_snapshots).map(([provider, systemValue]) => {
                        const realValue = reg.closing_fintech?.[provider] || 0
                        const discrepancy = (reg.fintech_discrepancies?.[provider] || 0)
                        const isWave = provider === 'wave'
                        
                        return (
                          <div key={provider} className={`p-3 rounded-2xl border ${discrepancy !== 0 ? 'border-red-500/20 bg-red-500/5' : 'border-border/50 bg-card'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${isWave ? 'bg-blue-500' : 'bg-orange-500'}`}>{provider}</span>
                              {discrepancy !== 0 && <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">Écart: {discrepancy > 0 ? '+' : ''}{discrepancy.toLocaleString()} F</span>}
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                              <span>Système: {Number(systemValue).toLocaleString()} F</span>
                              <span>Réel: {Number(realValue).toLocaleString()} F</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Listes de Transactions */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Dépenses */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-red-500 px-1">Dépenses Détaillées</h5>
                    <div className="space-y-1.5">
                      {dayExpenses.length === 0 ? (
                        <p className="text-[9px] font-bold text-muted-foreground italic p-2">Aucune dépense</p>
                      ) : (
                        dayExpenses.map(exp => (
                          <div key={exp.id} className="flex justify-between items-center p-2 bg-muted/10 rounded-xl border border-border/50">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black truncate">{exp.description}</p>
                              <p className="text-[8px] text-muted-foreground font-bold">{formatTime(exp.date)} • {exp.category}</p>
                            </div>
                            <span className="text-[10px] font-black text-red-500 shrink-0">-{Number(exp.amount).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Entrées */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 px-1">Entrées Détaillées</h5>
                    <div className="space-y-1.5">
                      {dayInflows.length === 0 ? (
                        <p className="text-[9px] font-bold text-muted-foreground italic p-2">Aucune entrée</p>
                      ) : (
                        dayInflows.map(inf => (
                          <div key={inf.id} className="flex justify-between items-center p-2 bg-muted/10 rounded-xl border border-border/50">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black truncate">{inf.description}</p>
                              <p className="text-[8px] text-muted-foreground font-bold">{formatTime(inf.date)}</p>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 shrink-0">+{Number(inf.amount).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <BadgeCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground">Responsable Clôture</p>
                      <p className="text-[10px] font-black">{reg.closing_manager_name || reg.manager_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDetailRegister(null)}
                    className="px-6 py-2 bg-muted font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-secondary transition-all"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )
          })()}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* DRAWER DE CLÔTURE */}
      <ResponsiveDialog open={!!closingRegister} onOpenChange={(open) => !open && setClosingRegister(null)}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Clôture Rétroactive</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Session du {closingRegister ? new Date(closingRegister.date).toLocaleDateString() : ''}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {closingRegister && (
            <form onSubmit={handleCloseRegister} className="space-y-4 mt-2">
              <div className="p-3 bg-muted/10 rounded-xl border border-border/50 flex justify-between items-center text-sm">
                <span className="font-black text-[10px] text-muted-foreground uppercase tracking-widest">Fond initial</span>
                <span className="font-black text-base">{closingRegister.opening_balance.toLocaleString()} F</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Responsable</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full p-3 border-2 border-border/50 rounded-xl bg-background text-sm font-bold focus:border-primary outline-none transition-all"
                  placeholder="Nom du responsable"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Espèces dans le tiroir</label>
                <input
                  type="number"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0"
                  className="w-full p-4 border-2 border-border/50 rounded-xl bg-background text-2xl font-black text-center focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all"
                  required
                />
                <div className="bg-primary/5 border border-primary/20 p-2.5 rounded-lg mt-2">
                  <p className="text-[9px] text-primary font-bold text-center uppercase tracking-widest">
                    Ventes nettes calculées automatiquement.
                  </p>
                </div>
              </div>

              <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all mt-2">
                Valider la Clôture <CheckCircle size={18} />
              </button>
            </form>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
