import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Plus, Save, CheckCircle, BadgeCheck, History, ChevronDown, ChevronUp, PackageOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'

export default function Pain() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allSuppliers = useStore(state => state.suppliers) || []
  const suppliers = useMemo(() => allSuppliers.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allSuppliers, activeBoutiqueId])
  const allBreadLogs = useStore(state => state.bread_logs) || []
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
    <div className="space-y-6 max-w-6xl mx-auto pb-24 will-change-[opacity]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2">
            Dépôt <span className="text-primary opacity-30 italic">de Pain</span>
          </h1>
          <p className="text-[9px] text-muted-foreground mt-0.5 font-black uppercase tracking-[0.3em]">{todayDateString}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-premium active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Enregistrer Arrivage
        </button>
      </header>

      {/* Liste du Jour */}
      <div className="space-y-3">
         <div className="flex items-center gap-2 px-1">
           <CheckCircle size={14} className="text-primary" /> 
           <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Arrivages du Jour</h3>
         </div>
         
         <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {todayLogs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="sm:col-span-2 flex flex-col items-center justify-center py-16 bg-card/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-border/50 gap-4"
                >
                  <div className="p-4 bg-muted/20 rounded-2xl">
                    <PackageOpen size={32} className="text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-muted-foreground/40">Aucun arrivage pour le moment</p>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={clsx(
                        "card-ultra-compact group relative overflow-hidden transition-all duration-300 border-2",
                        log.paid ? "bg-emerald-500/5 border-emerald-500/10" : "bg-card/50 backdrop-blur-md border-border/50 hover:border-primary/30"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h4 className="font-black text-base tracking-tight uppercase italic">{supplier}</h4>
                             {log.paid && (
                               <div className="bg-emerald-500 text-white p-1 rounded-full">
                                  <BadgeCheck size={12} />
                               </div>
                             )}
                          </div>
                          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{timeLabel} • {log.received_quantity} miches</p>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                           {[q1, q2, q3, q4].map((q, i) => q > 0 && (
                             <div key={i} className="px-2.5 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-black text-primary shadow-sm whitespace-nowrap">
                               Q{i+1}={q}
                             </div>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                         <div className="grid grid-cols-4 gap-2">
                            {[
                              { label: 'ENTIER', key: 'miche' },
                              { label: '2/3', key: 'deuxTiers' },
                              { label: '1/2', key: 'demi' },
                              { label: '1/3', key: 'unTiers' }
                            ].map(item => (
                              <div key={item.key} className="space-y-1">
                                 <label className="block text-[8px] text-muted-foreground/80 font-black text-center">{item.label}</label>
                                 <input 
                                   type="number" 
                                   min="0" 
                                   value={retObj[item.key] === 0 ? '' : retObj[item.key]} 
                                   placeholder="0" 
                                   disabled={log.paid}
                                   onChange={(e) => handleUpdateReturn(log.id, log.received_quantity, log.unit_price, { ...retObj, [item.key]: e.target.value })}
                                   className="w-full p-2 bg-muted/20 border border-border/50 rounded-xl text-center text-xs font-black focus:ring-2 ring-primary/20 outline-none transition-all disabled:opacity-30" 
                                 />
                              </div>
                            ))}
                         </div>

                         <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                            <div>
                               <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Montant à régler</p>
                               <div className="flex items-baseline gap-1">
                                  <span className={clsx("text-xl font-black tracking-tighter", log.paid ? "text-emerald-500" : "text-primary")}>
                                    {Math.max(0, log.total_to_pay).toLocaleString()}
                                  </span>
                                  <span className="text-[10px] font-black opacity-40 uppercase">F</span>
                               </div>
                            </div>

                            {!log.paid && (
                              <button
                                onClick={() => payBreadLog(log.id, supplier)}
                                className="bg-primary text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-premium active:scale-95 transition-all"
                              >
                                Payer Livreur
                              </button>
                            )}
                         </div>
                      </div>

                      <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <PackageOpen size={80} strokeWidth={3} />
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
                  onClick={() => addSupplier({ name: 'Boulangerie Centrale', category: 'pain', boutiqueId: activeBoutiqueId })}
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
