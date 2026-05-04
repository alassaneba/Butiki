import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Plus, CheckCircle, BadgeCheck, History, ChevronDown, ChevronUp, Smartphone, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'

export default function CreditTelephonique() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const suppliers = useStore(state => state.suppliers)
  const allCreditLogs = useStore(state => state.credit_logs || [])
  const credit_logs = useMemo(() => allCreditLogs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId), [allCreditLogs, activeBoutiqueId])
  const addCreditLog = useStore(state => state.addCreditLog)
  const payCreditLog = useStore(state => state.payCreditLog)
  const addSupplier = useStore(state => state.addSupplier)
  const config = useStore(state => state.config)
  const phone_providers = config?.phone_credit_providers || []
  
  // Filtrer les fournisseurs de crédit
  const creditSuppliers = suppliers.filter(s => s.category === 'credit' || s.category === 'general')
  
  const today = new Date()
  const todayDateString = today.toLocaleDateString()
  
  const todayLogs = credit_logs
    .filter((log) => new Date(log.date).toLocaleDateString() === todayDateString)
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Logs des 7 jours précédents
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)
  sevenDaysAgo.setHours(0,0,0,0)

  const previousLogs = credit_logs
    .filter((log) => {
      const logDate = new Date(log.date)
      return logDate < new Date(today.setHours(0,0,0,0)) && logDate >= sevenDaysAgo
    })
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Groupement par jour
  const groupedPreviousLogs = previousLogs.reduce((acc, log) => {
    const dateKey = new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(log)
    return acc
  }, {})

  const [supplierId, setSupplierId] = useState('')
  const [amounts, setAmounts] = useState({}) // { provider_value: amount }
  const [showHistory, setShowHistory] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddLog = (e) => {
    e.preventDefault()
    const totalToPay = Object.values(amounts).reduce((acc, val) => acc + (Number(val) || 0), 0)

    if (!supplierId || totalToPay === 0) return
    
    addCreditLog({
      supplier_id: supplierId,
      breakdown: amounts,
      total_to_pay: totalToPay,
      paid: false
    })
    
    setAmounts({})
    setSupplierId('')
    setShowAddModal(false)
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Transfert Crédit</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-widest">{todayDateString}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95"
        >
          <Send size={16} /> Nouveau Transfert
        </button>
      </header>

      {/* Historique du Jour */}
      <div className="space-y-3">
         <div className="flex items-center gap-2 px-1">
           <CheckCircle size={14} className="text-primary" /> 
           <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Transferts du Jour</h3>
         </div>
         
         <div className="space-y-3">
           <AnimatePresence>
             {todayLogs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 bg-muted/10 rounded-2xl border border-dashed border-border/50 gap-2"
                >
                  <Smartphone size={24} className="text-muted-foreground/30" />
                  <p className="text-[10px] font-black uppercase tracking-widest italic text-muted-foreground/50">Aucun transfert enregistré</p>
                </motion.div>
             ) : (
               todayLogs.map(log => {
                 const supplier = suppliers.find(s => s.id === log.supplier_id)?.name || 'Inconnu'
                 const logDate = new Date(log.date);
                 const timeLabel = logDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                 return (
                   <motion.div 
                     key={log.id} 
                     layout
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className={`card-ultra-compact flex flex-col gap-2 transition-all ${log.paid ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30' : 'border-primary/20 bg-primary/5 hover:border-primary/30'}`}
                   >
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-border/40 pb-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-black text-sm truncate">{supplier}</span>
                          {log.paid ? (
                            <span className="shrink-0 inline-flex items-center gap-0.5 text-[7px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              <BadgeCheck size={10} /> Payé
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-0.5 text-[7px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                              En attente
                            </span>
                          )}
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest ml-auto sm:ml-0">{timeLabel}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {phone_providers.map(p => {
                            const amt = log.breakdown?.[p.value] || 0
                            if (!amt) return null
                            return (
                              <span key={p.value} className="bg-muted/50 text-muted-foreground border border-border/30 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                                {p.name[0]}: {amt.toLocaleString()}
                              </span>
                            )
                          })}
                        </div>
                     </div>

                     <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-lg mt-1 w-full ${log.paid ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-background border border-border/40'}`}>
                       <div className="flex items-center justify-between w-full">
                         <div className="text-left">
                           <p className={`text-[8px] uppercase font-black mb-0.5 tracking-widest ${log.paid ? 'text-emerald-600' : 'text-muted-foreground/60'}`}>
                             {log.paid ? 'Réglé' : 'À Payer au Fournisseur'}
                           </p>
                           <p className={`font-black text-lg ${log.paid ? 'text-emerald-600' : 'text-primary'}`}>{log.total_to_pay.toLocaleString()} F</p>
                         </div>
                         {!log.paid && (
                           <button
                             onClick={() => payCreditLog(log.id, supplier)}
                             className="btn-ultra-compact bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95"
                           >
                             Valider Paiement
                           </button>
                         )}
                       </div>
                     </div>
                   </motion.div>
                 )
               })
             )}
           </AnimatePresence>
         </div>
      </div>

      {/* Historique Précédent */}
      <div className="p-3 bg-card rounded-2xl border border-border/50 shadow-sm mt-4">
       <button 
         onClick={() => setShowHistory(!showHistory)}
         className="w-full flex items-center justify-between font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
       >
         <div className="flex items-center gap-2">
           <History size={14} /> Historique (7 jours)
         </div>
         {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
       </button>
       
       <AnimatePresence>
         {showHistory && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }}
             animate={{ height: 'auto', opacity: 1 }}
             exit={{ height: 0, opacity: 0 }}
             className="overflow-hidden"
           >
             <div className="space-y-4 pt-3">
               {Object.keys(groupedPreviousLogs).length === 0 ? (
                 <p className="text-center py-6 text-[10px] font-black uppercase tracking-widest italic text-muted-foreground/40 bg-muted/10 rounded-xl border border-dashed border-border/50">Aucun historique récent.</p>
               ) : (
                 Object.entries(groupedPreviousLogs).map(([date, logs]) => (
                   <div key={date} className="space-y-2">
                     <h4 className="text-[9px] font-black text-primary/60 uppercase tracking-widest pl-1 border-b border-border/30 pb-1">{date}</h4>
                     <div className="space-y-1.5">
                       {logs.map(log => {
                         const supplier = suppliers.find(s => s.id === log.supplier_id)?.name || 'Inconnu'
                         return (
                           <div key={log.id} className="p-2 bg-muted/10 border border-border/30 rounded-lg flex flex-col gap-1.5 text-sm">
                             <div className="flex justify-between items-center">
                               <span className="font-bold text-xs">{supplier}</span>
                               <div className="flex items-center gap-2">
                                 <span className={`font-black text-sm ${log.paid ? 'text-emerald-600' : 'text-primary'}`}>
                                   {log.total_to_pay.toLocaleString()} F
                                 </span>
                                 {log.paid ? <BadgeCheck size={12} className="text-emerald-600" /> : <div className="w-3 h-3 rounded-full border border-primary/50" />}
                               </div>
                             </div>
                             <div className="flex flex-wrap gap-1">
                               {phone_providers.map(p => {
                                 const amt = log.breakdown?.[p.value] || 0
                                 if (!amt) return null
                                 return (
                                   <span key={p.value} className="bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-border/50">
                                     {p.name[0]}: {amt.toLocaleString()}
                                   </span>
                                 )
                               })}
                             </div>
                           </div>
                         )
                       })}
                     </div>
                   </div>
                 ))
               )}
             </div>
           </motion.div>
         )}
       </AnimatePresence>
      </div>

      {/* DRAWER NOUVEAU TRANSFERT */}
      <ResponsiveDialog open={showAddModal} onOpenChange={setShowAddModal}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Nouveau Transfert Crédit</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Enregistrez la réception de crédit depuis un compte fournisseur (Puce mère).</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="mt-2">
            {creditSuppliers.length === 0 ? (
              <div className="text-xs font-bold text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                <p className="mb-3">Aucun fournisseur de crédit.</p>
                <button 
                  onClick={() => addSupplier({ name: 'Fournisseur Crédit Demo', category: 'credit' })}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                >
                  Créer un fournisseur
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Fournisseur</label>
                  <select 
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full p-3 border-2 border-border/50 rounded-xl bg-muted/10 font-bold text-sm focus:border-primary outline-none transition-all"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {creditSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div className="border-2 border-border/50 rounded-xl p-3 space-y-3 bg-muted/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">Montants Transférés (F CFA)</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {phone_providers.map(p => (
                      <div key={p.value} className="relative">
                        <label className={`absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-primary opacity-80`}>
                          {p.name}
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          value={amounts[p.value] || ''}
                          placeholder="0"
                          onChange={(e) => setAmounts(prev => ({ ...prev, [p.value]: e.target.value }))}
                          className={`w-full pl-[70px] pr-3 py-3 border-2 border-border/50 rounded-xl bg-background text-sm font-black text-right focus:border-primary outline-none transition-all`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase text-primary tracking-widest">Total à régler</span>
                   <span className="text-lg font-black text-primary">
                     {Object.values(amounts).reduce((acc, val) => acc + (Number(val) || 0), 0).toLocaleString()} F
                   </span>
                </div>

                <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 mt-2 shadow-md active:scale-95 transition-all">
                  <Send size={18} /> Valider le transfert
                </button>
              </form>
            )}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

    </div>
  )
}
