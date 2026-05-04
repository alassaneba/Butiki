import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Plus, CheckCircle, BadgeCheck, History, ChevronDown, ChevronUp, Truck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'

export default function Gaz() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const suppliers = useStore(state => state.suppliers)
  const allGasLogs = useStore(state => state.gas_logs || [])
  const gas_logs = useMemo(() => allGasLogs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId), [allGasLogs, activeBoutiqueId])
  const addGasLog = useStore(state => state.addGasLog)
  const payGasLog = useStore(state => state.payGasLog)
  const addSupplier = useStore(state => state.addSupplier)
  const config = useStore(state => state.config)
  const priceB6 = config?.prices?.gaz?.b6 ?? 2800;
  const priceB9 = config?.prices?.gaz?.b9 ?? 4175;
  const priceB12 = config?.prices?.gaz?.b12 ?? 6000;
  
  const gasSuppliers = suppliers.filter(s => s.category === 'gaz' || !s.category)
  
  const today = new Date()
  const todayDateString = today.toLocaleDateString()
  
  const todayLogs = gas_logs
    .filter((log) => new Date(log.date).toLocaleDateString() === todayDateString)
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Logs des 7 jours précédents
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 7)
  sevenDaysAgo.setHours(0,0,0,0)

  const previousLogs = gas_logs
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
  const [b6Qty, setB6Qty] = useState('')
  const [b9Qty, setB9Qty] = useState('')
  const [b12Qty, setB12Qty] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddLog = (e) => {
    e.preventDefault()
    const q6 = Number(b6Qty) || 0;
    const q9 = Number(b9Qty) || 0;
    const q12 = Number(b12Qty) || 0;

    if (!supplierId || (q6 === 0 && q9 === 0 && q12 === 0)) return
    
    const totalToPay = (q6 * priceB6) + (q9 * priceB9) + (q12 * priceB12);

    addGasLog({
      supplier_id: supplierId,
      b6_qty: q6,
      b9_qty: q9,
      b12_qty: q12,
      total_to_pay: totalToPay
    })
    
    setB6Qty('')
    setB9Qty('')
    setB12Qty('')
    setShowAddModal(false)
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Dépôt de Gaz</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-widest">{todayDateString}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95"
        >
          <Truck size={16} /> Enregistrer Livraison
        </button>
      </header>

      {/* Liste du Jour */}
      <div className="space-y-3">
         <div className="flex items-center gap-2 px-1">
           <CheckCircle size={14} className="text-primary" /> 
           <h3 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Livraisons du Jour</h3>
         </div>
         
         <div className="space-y-3">
           <AnimatePresence>
             {todayLogs.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-10 bg-muted/10 rounded-2xl border border-dashed border-border/50 gap-2"
                >
                  <Truck size={24} className="text-muted-foreground/30" />
                  <p className="text-[10px] font-black uppercase tracking-widest italic text-muted-foreground/50">Aucune livraison enregistrée</p>
                </motion.div>
             ) : (
               todayLogs.map(log => {
                 const supplier = suppliers.find(s => s.id === log.supplier_id)?.name || 'Inconnu'
                 const isLegacy = log.bottle_type !== undefined;
                 const logDate = new Date(log.date);
                 const timeLabel = logDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                 return (
                   <motion.div 
                     key={log.id} 
                     layout
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className={`card-ultra-compact flex flex-col gap-2 transition-all ${log.paid ? 'border-green-500/20 bg-green-500/5 hover:border-green-500/30' : 'border-blue-500/20 bg-blue-500/5 hover:border-blue-500/30'}`}
                   >
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-border/40 pb-2">
                       <div className="flex items-center gap-2">
                          <span className="font-black text-sm">{supplier}</span>
                          {log.paid && (
                            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                              <BadgeCheck size={10} /> Payé
                            </span>
                          )}
                          <p className="text-[8px] text-muted-foreground font-bold ml-auto sm:ml-0 tracking-widest">{timeLabel}</p>
                       </div>
                       
                       <div className="flex flex-wrap gap-1">
                         {isLegacy ? (
                           <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded uppercase">{log.bottleType || log.bottle_type}: {log.received_quantity}</span>
                         ) : (
                           <>
                             {(log.b6_qty > 0) && <span className="bg-blue-600/10 text-blue-600 border border-blue-600/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">B6: {log.b6_qty}</span>}
                             {(log.b9_qty > 0) && <span className="bg-blue-600/10 text-blue-600 border border-blue-600/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">B9: {log.b9_qty}</span>}
                             {(log.b12_qty > 0) && <span className="bg-blue-600/10 text-blue-600 border border-blue-600/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">B12: {log.b12_qty}</span>}
                           </>
                         )}
                       </div>
                     </div>

                     <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-lg mt-1 w-full ${log.paid ? 'bg-green-500/5 border border-green-500/10' : 'bg-background border border-border/40'}`}>
                       <div className="flex items-center justify-between w-full">
                         <div className="text-left">
                           <p className={`text-[8px] uppercase font-black mb-0.5 tracking-widest ${log.paid ? 'text-green-600' : 'text-muted-foreground/60'}`}>
                             {log.paid ? 'Réglé' : 'À Régler au Livreur'}
                           </p>
                           <p className={`font-black text-lg ${log.paid ? 'text-green-600' : 'text-primary'}`}>{log.total_to_pay.toLocaleString()} F</p>
                         </div>
                         {!log.paid && (
                           <button
                             onClick={() => payGasLog(log.id, supplier)}
                             className="btn-ultra-compact bg-green-600 hover:bg-green-700 text-white shadow-md active:scale-95"
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

      {/* Livraisons Précédentes */}
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
                                 <span className={`font-black text-sm ${log.paid ? 'text-green-600' : 'text-orange-500'}`}>
                                   {log.total_to_pay.toLocaleString()} F
                                 </span>
                                 {log.paid ? <BadgeCheck size={12} className="text-green-600" /> : <div className="w-3 h-3 rounded-full border border-orange-500/50" />}
                               </div>
                             </div>
                             <div className="flex flex-wrap gap-1">
                               {(log.b6_qty > 0) && <span className="bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-border/50">B6: {log.b6_qty}</span>}
                               {(log.b9_qty > 0) && <span className="bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-border/50">B9: {log.b9_qty}</span>}
                               {(log.b12_qty > 0) && <span className="bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-border/50">B12: {log.b12_qty}</span>}
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

      {/* DRAWER AJOUT LIVRAISON */}
      <ResponsiveDialog open={showAddModal} onOpenChange={setShowAddModal}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Nouvelle Livraison Gaz</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Échange de bouteilles (Pleines contre Vides).</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="mt-2">
            {gasSuppliers.length === 0 ? (
              <div className="text-xs font-bold text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50 text-center">
                <p className="mb-3">Aucun fournisseur de gaz trouvé.</p>
                <button 
                  onClick={() => addSupplier({ name: 'Dépôt Gaz Central', category: 'gaz' })}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                >
                  Créer un fournisseur démo
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Livreur / Dépôt</label>
                  <select 
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full p-3 border-2 border-border/50 rounded-xl bg-muted/10 font-bold text-sm focus:border-primary outline-none transition-all"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {gasSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div className="border-2 border-border/50 rounded-xl p-3 space-y-3 bg-muted/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center">Quantités Livrées</p>
                  <div className="space-y-2">
                    {[
                      { label: 'B6kg', val: b6Qty, set: setB6Qty, price: priceB6 },
                      { label: 'B9kg', val: b9Qty, set: setB9Qty, price: priceB9 },
                      { label: 'B12kg', val: b12Qty, set: setB12Qty, price: priceB12 }
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border/40">
                        <label className="text-[10px] font-black text-primary uppercase w-12 text-center">{item.label}</label>
                        <input 
                          type="number" 
                          min="0"
                          value={item.val}
                          placeholder="0"
                          onChange={(e) => item.set(e.target.value)}
                          className="w-full p-2 border-2 border-border/50 rounded-lg bg-background text-sm font-black focus:border-primary outline-none text-center transition-all"
                        />
                        <span className="text-[9px] text-muted-foreground w-16 text-right font-black">{item.price} F</span>
                      </div>
                    ))}
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
