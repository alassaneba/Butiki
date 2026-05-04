import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Plus, Save, CheckCircle, BadgeCheck, History, ChevronDown, ChevronUp, PackageOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'

export default function Pain() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const suppliers = useStore(state => state.suppliers)
  const allBreadLogs = useStore(state => state.bread_logs || [])
  const bread_logs = useMemo(() => allBreadLogs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId), [allBreadLogs, activeBoutiqueId])
  const addOrUpdateBreadLog = useStore(state => state.addOrUpdateBreadLog)
  const updateBreadLogReturn = useStore(state => state.updateBreadLogReturn)
  const payBreadLog = useStore(state => state.payBreadLog)
  const addSupplier = useStore(state => state.addSupplier)
  const config = useStore(state => state.config)
  const pM = config?.prices?.pain?.miche ?? 135;
  const p23 = config?.prices?.pain?.deuxTiers ?? 90;
  const p12 = config?.prices?.pain?.demi ?? 65;
  const p13 = config?.prices?.pain?.unTiers ?? 45;
  
  const breadSuppliers = suppliers.filter(s => s.category === 'pain' || !s.category)
  
  const today = new Date()
  const todayDateString = today.toLocaleDateString()
  
  const todayLogs = bread_logs
    .filter((log) => new Date(log.date).toLocaleDateString() === todayDateString)
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Logs des 7 jours précédents
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)
  sevenDaysAgo.setHours(0,0,0,0)

  const previousLogs = bread_logs
    .filter((log) => {
      const logDate = new Date(log.date)
      return logDate < new Date(today.setHours(0,0,0,0)) && logDate >= sevenDaysAgo
    })
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Groupement par jour pour l'historique
  const groupedPreviousLogs = previousLogs.reduce((acc, log) => {
    const dateKey = new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(log)
    return acc
  }, {})

  const [supplierId, setSupplierId] = useState('')
  const [quart, setQuart] = useState('1er Quart')
  const [receivedQty, setReceivedQty] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddLog = (e) => {
    e.preventDefault()
    if (!supplierId || !receivedQty) return
    addOrUpdateBreadLog(supplierId, quart, Number(receivedQty))
    setReceivedQty('')
    setShowAddModal(false)
  }

  const handleUpdateReturn = (id, received, price, retObj) => {
    const returnVal = 
      (Number(retObj.miche || 0) * pM) + 
      (Number(retObj.deuxTiers || 0) * p23) + 
      (Number(retObj.demi || 0) * p12) + 
      (Number(retObj.unTiers || 0) * p13);
    
    const total_to_pay = (received * price) - returnVal;
    updateBreadLogReturn(id, retObj, total_to_pay);
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Dépôt de Pain</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-widest">{todayDateString}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95"
        >
          <PackageOpen size={16} /> Enregistrer Arrivage
        </button>
      </header>

      {/* Liste du Jour */}
      <div className="space-y-3">
         <div className="flex items-center gap-2 px-1">
           <CheckCircle size={14} className="text-primary" /> 
           <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Arrivages du Jour</h3>
         </div>
         
         <div className="space-y-3">
           <AnimatePresence>
             {todayLogs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 bg-muted/10 rounded-2xl border border-dashed border-border/50 gap-2"
                >
                  <PackageOpen size={24} className="text-muted-foreground/30" />
                  <p className="text-[10px] font-black uppercase tracking-widest italic text-muted-foreground/50">Aucun arrivage enregistré</p>
                </motion.div>
             ) : (
               todayLogs.map(log => {
                 const supplier = suppliers.find(s => s.id === log.supplier_id)?.name || 'Inconnu'
                 const ret = log.returned_quantity;
                 const retObj = (typeof ret === 'object' && ret !== null) 
                   ? ret 
                   : { miche: ret || 0, deuxTiers: 0, demi: 0, unTiers: 0 };

                 const q1 = log.received_quarts?.q1 || 0;
                 const q2 = log.received_quarts?.q2 || 0;
                 const q3 = log.received_quarts?.q3 || 0;
                 const q4 = log.received_quarts?.q4 || 0;

                 const logDate = new Date(log.date);
                 const timeLabel = logDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                 return (
                   <motion.div 
                     key={log.id} 
                     layout
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className={`card-ultra-compact flex flex-col gap-2 transition-all ${log.paid ? 'border-green-500/20 bg-green-500/5 hover:border-green-500/30' : 'border-border/50 bg-card hover:border-primary/30'}`}
                   >
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-border/40 pb-2">
                       <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                           <p className="font-black text-sm">{supplier}</p>
                           {log.paid && (
                             <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                               <BadgeCheck size={10} /> Payé
                             </span>
                           )}
                           <p className="text-[8px] text-muted-foreground font-bold ml-auto sm:ml-0 tracking-widest">{timeLabel}</p>
                         </div>
                         <p className="text-[8px] font-black text-primary/80 tracking-widest uppercase mt-0.5">
                           { log.received_quantity } Recues - { Number(Math.max(0, log.received_quantity - ((log.total_to_pay || 0) / (log.unit_price || 135))).toFixed(2)) } Retours = { Number(Math.max(0, (log.total_to_pay || 0) / (log.unit_price || 135)).toFixed(2)) } Vendues
                         </p>
                       </div>
                       <div className="flex flex-wrap gap-1">
                         {q1 > 0 && <span className="bg-amber-500/10 text-amber-600 text-[8px] font-black border border-amber-500/20 px-1.5 py-0.5 rounded">Q1: {q1}</span>}
                         {q2 > 0 && <span className="bg-amber-500/10 text-amber-600 text-[8px] font-black border border-amber-500/20 px-1.5 py-0.5 rounded">Q2: {q2}</span>}
                         {q3 > 0 && <span className="bg-amber-500/10 text-amber-600 text-[8px] font-black border border-amber-500/20 px-1.5 py-0.5 rounded">Q3: {q3}</span>}
                         {q4 > 0 && <span className="bg-amber-500/10 text-amber-600 text-[8px] font-black border border-amber-500/20 px-1.5 py-0.5 rounded">Q4: {q4}</span>}
                       </div>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-3 pt-1 items-center">
                       <div className="flex-1 w-full">
                         <p className="text-[8px] uppercase font-black text-muted-foreground/60 mb-1">Saisie des Retours (Invendus)</p>
                         <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { label: 'Entier (1)', key: 'miche' },
                              { label: '2/3', key: 'deuxTiers' },
                              { label: '1/2', key: 'demi' },
                              { label: '1/3', key: 'unTiers' }
                            ].map(item => (
                              <div key={item.key}>
                                 <label className="block text-[8px] text-muted-foreground/60 text-center mb-0.5 font-bold">{item.label}</label>
                                 <input type="number" min="0" value={retObj[item.key] === 0 ? '' : retObj[item.key]} placeholder="0" disabled={log.paid}
                                     onChange={(e) => handleUpdateReturn(log.id, log.received_quantity, log.unit_price, { ...retObj, [item.key]: e.target.value })}
                                     className="w-full p-2 border border-border/50 rounded-lg bg-muted/20 text-center text-xs font-black focus:ring-2 ring-primary/20 outline-none disabled:opacity-50 transition-all" />
                              </div>
                            ))}
                         </div>
                       </div>
                       
                       <div className="w-full sm:w-auto flex justify-between items-center sm:justify-end sm:gap-4 sm:border-l border-border/40 sm:pl-4">
                         <div className="text-left sm:text-right">
                           <p className="text-[8px] text-muted-foreground/60 uppercase font-black mb-0.5">Montant à Régler</p>
                           <p className={`font-black text-lg ${log.paid ? 'text-green-600' : 'text-primary'}`}>{Math.max(0, log.total_to_pay).toLocaleString()} F</p>
                         </div>
                         {!log.paid && (
                           <button
                             onClick={() => payBreadLog(log.id, supplier)}
                             className="btn-ultra-compact bg-green-600 hover:bg-green-700 text-white shadow-md active:scale-95"
                           >
                             Valider
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

      {/* Arrivages Précédents */}
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
                 <p className="text-center py-6 text-[10px] font-black uppercase tracking-widest italic text-muted-foreground/40 bg-muted/10 rounded-xl border border-dashed border-border/50">Aucun historique récent</p>
               ) : (
                 Object.entries(groupedPreviousLogs).map(([date, logs]) => (
                   <div key={date} className="space-y-2">
                     <h4 className="text-[9px] font-black text-primary/60 uppercase tracking-widest pl-1 border-b border-border/30 pb-1">{date}</h4>
                     <div className="space-y-1.5">
                       {logs.map(log => {
                         const supplier = suppliers.find(s => s.id === log.supplier_id)?.name || 'Inconnu'
                         return (
                           <div key={log.id} className="p-2 bg-muted/10 border border-border/30 rounded-lg flex items-center justify-between">
                             <div className="flex flex-col">
                               <span className="font-bold text-xs">{supplier}</span>
                               <p className="text-[8px] font-black text-primary/60 tracking-widest uppercase mt-0.5">
                                 { log.received_quantity } Recues - { Number(Math.max(0, log.received_quantity - ((log.total_to_pay || 0) / (log.unit_price || 135))).toFixed(2)) } Retours = { Number(Math.max(0, (log.total_to_pay || 0) / (log.unit_price || 135)).toFixed(2)) } Vendues
                               </p>
                             </div>
                             <div className="flex items-center gap-2">
                               <span className={`font-black text-sm ${log.paid ? 'text-green-600' : 'text-orange-500'}`}>
                                 {log.total_to_pay.toLocaleString()} F
                               </span>
                               {log.paid ? <BadgeCheck size={12} className="text-green-600" /> : <div className="w-3 h-3 rounded-full border border-orange-500/50" />}
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

      {/* DRAWER AJOUT ARRIVAGE */}
      <ResponsiveDialog open={showAddModal} onOpenChange={setShowAddModal}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Nouvel Arrivage</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Enregistrez la réception de pains d'un fournisseur.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="mt-2">
            {breadSuppliers.length === 0 ? (
              <div className="text-xs font-bold text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                <p className="mb-3">Aucun fournisseur de pain trouvé.</p>
                <button 
                  onClick={() => addSupplier({ name: 'Boulangerie Centrale', category: 'pain' })}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                >
                  Créer un fournisseur démo
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
                    {breadSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Période (Quart)</label>
                    <select 
                      value={quart}
                      onChange={e => setQuart(e.target.value)}
                      className="w-full p-3 border-2 border-border/50 rounded-xl bg-muted/10 font-bold text-sm focus:border-primary outline-none transition-all"
                    >
                      <option value="1er Quart">1er (Matin)</option>
                      <option value="2e Quart">2e (Midi)</option>
                      <option value="3e Quart">3e (Après-midi)</option>
                      <option value="4e Quart">4e (Soir)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-primary ml-1">Qté (Miches)</label>
                    <input 
                      type="number" 
                      value={receivedQty}
                      onChange={(e) => setReceivedQty(e.target.value)}
                      className="w-full p-3 border-2 border-primary/20 rounded-xl bg-primary/5 font-black text-lg focus:border-primary outline-none transition-all"
                      placeholder="0"
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 mt-2 shadow-md active:scale-95 transition-all">
                  <Plus size={18} /> Valider l'arrivage
                </button>
              </form>
            )}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

    </div>
  )
}
