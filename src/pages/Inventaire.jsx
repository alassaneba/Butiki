import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { 
  CheckCircle, AlertTriangle, Save, RefreshCcw, Search, 
  ScanBarcode, Filter, History, Package, ChevronRight, 
  ArrowRight, DollarSign, X, Check, BarChart3, Clock, Printer, Plus, Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Scanner from '../components/Scanner'
import { printAuditReport } from '../lib/print-report'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'

// --- Composants UI ---
function StatMini({ label, value, icon: Icon, color }) {
  return (
    <div className="card-ultra-compact border border-border/50 flex items-center gap-3">
      <div className={`p-2 rounded-xl ${color} bg-opacity-10 shrink-0`}>
        <Icon size={16} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
        <p className="text-base font-black leading-none mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export default function Inventaire() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allStock = useStore(state => state.stock || [])
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const allInventoryHistory = useStore(state => state.inventory_history || [])
  const inventory_history = useMemo(() => allInventoryHistory.filter(h => (h.boutiqueId || 'b1') === activeBoutiqueId), [allInventoryHistory, activeBoutiqueId])
  const saveInventorySession = useStore(state => state.saveInventorySession)
  const addStockItem = useStore(state => state.addStockItem)
  const deleteStockItem = useStore(state => state.deleteStockItem)
  const [activeTab, setActiveTab] = useState('active') // 'active', 'general', 'history'
  
  // local state for counting
  const [counts, setCounts] = useState({})
  const [search, setSearch] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showSummary, setShowSummary] = useState(false)

  // New Product Modal States
  const [showNewProductModal, setShowNewProductModal] = useState(false)
  const [name, setName] = useState('')
  const [typeProduit, setTypeProduit] = useState('')
  const [numTypes, setNumTypes] = useState('')
  const [qtyPerType, setQtyPerType] = useState('')
  const [priceBuyPerType, setPriceBuyPerType] = useState('')
  const [thresholdUnit, setThresholdUnit] = useState('10')
  const [priceSellUnit, setPriceSellUnit] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  const totalPriceBuy = useMemo(() => (Number(numTypes) || 0) * (Number(priceBuyPerType) || 0), [numTypes, priceBuyPerType])
  const totalUnits = useMemo(() => (Number(numTypes) || 0) * (Number(qtyPerType) || 0), [numTypes, qtyPerType])
  const priceBuyUnit = useMemo(() => {
    const qty = Number(qtyPerType) || 0
    const pricePerType = Number(priceBuyPerType) || 0
    return qty > 0 ? Math.round(pricePerType / qty) : 0
  }, [priceBuyPerType, qtyPerType])

  const handleAddNewProduct = (e) => {
    e.preventDefault()
    if (!name) return
    const id = addStockItem({ 
      name, 
      category: typeProduit,
      qty_per_type: Number(qtyPerType) || 1,
      current_stock: totalUnits,
      alert_threshold: Number(thresholdUnit) || 10, 
      price_buy: priceBuyUnit,
      price_sell: Number(priceSellUnit) || 0,
      expiry_date: expiryDate
    })
    
    // Auto-comptage
    setCounts(prev => ({ ...prev, [id]: totalUnits }))
    
    setShowNewProductModal(false)
    setName(''); setTypeProduit(''); setNumTypes(''); setQtyPerType(''); setPriceBuyPerType(''); setThresholdUnit('10'); setPriceSellUnit(''); setExpiryDate('')
  }

  // --- Handlers ---
  const handleCountChange = (id, value) => {
    setCounts(prev => ({
      ...prev,
      [id]: value === '' ? '' : Number(value)
    }))
  }

  const handleTypeCountChange = (item, typeVal) => {
    const qtyPerType = item.qty_per_type || 1
    const n = typeVal === '' ? 0 : Number(typeVal)
    // On met à jour le total (Compté) automatiquement
    handleCountChange(item.id, n * qtyPerType)
  }

  const handleScanSuccess = (decodedText) => {
    setSearch(decodedText)
    setIsScanning(false)
  }

  const filteredStock = useMemo(() => {
    return stock.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory
      return matchSearch && matchCat
    })
  }, [stock, search, selectedCategory])

  // --- Stats de la session en cours ---
  const sessionStats = useMemo(() => {
    let countedItems = 0;
    const totalItems = stock.length
    let discrepancyValue = 0
    let totalEcarts = 0

    if (activeTab === 'general') {
       countedItems = Object.entries(counts).filter(([_, v]) => v !== '').length;
       stock.forEach(item => {
         const qty = counts[item.id] !== undefined && counts[item.id] !== '' ? counts[item.id] : 0
         const diff = qty - item.current_stock
         discrepancyValue += diff * item.price_buy
         if (diff !== 0) totalEcarts++
       })
    } else {
       countedItems = Object.entries(counts).filter(([_, v]) => v !== '').length;
       Object.entries(counts).forEach(([id, qty]) => {
         if (qty !== '') {
           const item = stock.find(s => s.id === id)
           if (item) {
             const diff = qty - item.current_stock
             discrepancyValue += diff * item.price_buy
             if (diff !== 0) totalEcarts++
           }
         }
       })
    }
    
    const progress = totalItems > 0 ? (countedItems / totalItems) * 100 : 0

    return { countedItems, totalItems, progress, discrepancyValue, totalEcarts }
  }, [counts, stock, activeTab])

  const handleApply = () => {
    saveInventorySession(counts, sessionStats, activeTab === 'general')
    setCounts({})
    setSearch('')
    setShowSummary(false)
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity]">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Inventaire</h1>
          <p className="text-muted-foreground mt-1 text-[10px] font-black tracking-widest uppercase">Contrôle physique des rayons</p>
        </div>
        
        <div className="flex bg-muted/30 p-1 rounded-xl border border-border shadow-inner w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'active' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <BarChart3 size={14} /> <span className="hidden sm:inline">Périodique</span>
          </button>
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Package size={14} /> <span className="hidden sm:inline">Général</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <History size={14} /> <span className="hidden sm:inline">Archives</span>
          </button>
        </div>
      </div>

      {activeTab === 'active' || activeTab === 'general' ? (
        <div className="space-y-4">
          {/* Progress & Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatMini label="Progression" value={`${sessionStats.countedItems}/${sessionStats.totalItems}`} icon={Check} color="bg-blue-500" />
            <StatMini label="Écartés" value={sessionStats.totalEcarts} icon={AlertTriangle} color="bg-orange-500" />
            <StatMini label="Impact Val." value={`${sessionStats.discrepancyValue.toLocaleString()} F`} icon={DollarSign} color={sessionStats.discrepancyValue < 0 ? "bg-destructive" : "bg-emerald-500"} />
            <div className="card-ultra-compact border border-border/50 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1.5">
                 <span className="text-[8px] font-black uppercase text-muted-foreground">Complétion</span>
                 <span className="text-xs font-bold text-primary">{Math.round(sessionStats.progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${sessionStats.progress}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </div>

          {/* Filtres & Actions */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input 
                  type="text" 
                  placeholder="Code ou Nom..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 p-2 border-none rounded-xl bg-card shadow-sm focus:ring-2 ring-primary/20 outline-none font-bold text-sm"
                />
              </div>
              <button 
                onClick={() => setIsScanning(!isScanning)} 
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${isScanning ? 'bg-destructive text-white' : 'bg-card text-foreground hover:bg-muted border-border'}`}
              >
                {isScanning ? <X size={14}/> : <ScanBarcode size={14}/>}
                <span className="hidden sm:inline">{isScanning ? 'Fermer' : 'Scan'}</span>
              </button>
            </div>

            <div className="flex gap-2">
              {activeTab === 'general' && (
                <button 
                  onClick={() => setShowNewProductModal(true)}
                  className="px-3 py-2 rounded-xl bg-secondary text-foreground font-black text-[10px] uppercase border border-border hover:bg-muted transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14}/> Produit Inconnu
                </button>
              )}
              <button 
                disabled={sessionStats.countedItems === 0 && activeTab !== 'general'}
                onClick={() => setShowSummary(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-[10px] uppercase shadow-md active:scale-95 disabled:opacity-30 transition-all flex items-center gap-1.5"
              >
                <Save size={14}/> Valider ({sessionStats.countedItems})
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isScanning && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <Scanner onScanSuccess={handleScanSuccess} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Liste de Comptage Ultra Compacte */}
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-muted/30 border-b border-border/50">
                  <tr className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                    <th className="px-3 py-2">Article</th>
                    <th className="px-3 py-2 text-center">Théo.</th>
                    <th className="px-3 py-2 text-center">Nb. Type</th>
                    <th className="px-3 py-2 text-center">Compté (Unités)</th>
                    <th className="px-3 py-2 text-right">Écart</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-xs">
                  {filteredStock.map(item => {
                    const counted = counts[item.id] !== undefined ? counts[item.id] : ""
                    const isCounted = counted !== ""
                    const difference = isCounted ? (counted - item.current_stock) : 0
                    
                    return (
                      <tr key={item.id} className={`transition-colors group ${isCounted ? 'bg-primary/[0.03]' : 'hover:bg-muted/10'}`}>
                        <td className="px-3 py-2.5">
                          <p className="font-bold truncate max-w-[150px] sm:max-w-xs">{item.name}</p>
                          <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{item.category || 'Général'}</p>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-block px-2 py-0.5 bg-secondary text-muted-foreground rounded-md font-black">{item.current_stock}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                           <div className="flex flex-col items-center gap-1">
                             <input 
                               type="number"
                               placeholder="0"
                               onChange={(e) => handleTypeCountChange(item, e.target.value)}
                               className="w-14 p-1.5 text-center font-black rounded-lg border border-border/50 bg-secondary/20 focus:border-primary outline-none transition-all text-[10px]"
                             />
                             <span className="text-[7px] font-black text-muted-foreground uppercase opacity-40">x{item.qty_per_type || 1}</span>
                           </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                           <input 
                             type="number"
                             value={counted}
                             placeholder="-"
                             onChange={(e) => handleCountChange(item.id, e.target.value)}
                             className={`w-16 p-1.5 text-center font-black rounded-lg border-2 transition-all outline-none focus:ring-2 ring-primary/20 ${isCounted ? 'border-primary text-primary bg-background shadow-inner' : 'border-border/50 bg-muted/10 focus:border-primary'}`}
                           />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                           {isCounted ? (
                             <div className="flex flex-col items-end">
                                <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                                  difference === 0 ? 'bg-muted text-muted-foreground' : 
                                  difference > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'
                                }`}>
                                  {difference > 0 ? '+' : ''}{difference}
                                </span>
                                <span className="text-[8px] font-bold text-muted-foreground mt-0.5">
                                  {(difference * item.price_buy).toLocaleString()} F
                                </span>
                             </div>
                           ) : (
                             <span className="text-muted-foreground/30 font-black">-</span>
                           )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                           <button 
                             onClick={() => { if (window.confirm(`Supprimer ${item.name} ?`)) deleteStockItem(item.id) }} 
                             className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-95"
                           >
                             <Trash2 size={12} />
                           </button>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredStock.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-10 text-center text-muted-foreground">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Aucun produit</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Vue Archives */
        <div className="grid gap-3">
          {inventory_history.length === 0 ? (
            <div className="text-center py-10 bg-muted/10 border border-dashed border-border/50 rounded-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Aucun historique</p>
            </div>
          ) : (
            inventory_history.map(session => (
              <div key={session.id} className="card-ultra-compact flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-secondary flex flex-col items-center justify-center border border-border/50 shrink-0">
                      <span className="text-[8px] font-black text-muted-foreground uppercase">{new Date(session.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                      <span className="text-sm font-black leading-none">{new Date(session.date).getDate()}</span>
                   </div>
                   <div>
                      <h4 className="font-black text-sm tracking-tight">Inv. {session.userName}</h4>
                      <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1.5 mt-0.5"><Clock size={10}/> {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {session.details.length} art.</p>
                   </div>
                </div>

                <div className="flex gap-4 border-t sm:border-t-0 sm:border-l border-border/40 pt-2 sm:pt-0 sm:pl-4 w-full sm:w-auto items-center justify-between sm:justify-end">
                   <div className="text-left sm:text-right">
                      <span className="text-[8px] font-black uppercase text-muted-foreground block tracking-widest">Impact</span>
                      <span className={`text-sm font-black ${session.stats.discrepancyValue < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {session.stats.discrepancyValue > 0 ? '+' : ''}{session.stats.discrepancyValue.toLocaleString()} F
                      </span>
                   </div>
                   <button 
                      onClick={() => printAuditReport(session)}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shrink-0"
                   >
                      <Printer size={16} />
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- DRAWERS --- */}

      {/* Validation Inventaire */}
      <ResponsiveDialog open={showSummary} onOpenChange={setShowSummary}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Validation Inventaire</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Vérifiez les écarts avant d'appliquer.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
                <span className="text-[9px] font-black uppercase text-muted-foreground block mb-0.5">Articles Ajustés</span>
                <span className="text-xl font-black">{sessionStats.totalEcarts}</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-center">
                <span className="text-[9px] font-black uppercase text-muted-foreground block mb-0.5">Impact Valeur</span>
                <span className={`text-xl font-black tracking-tighter ${sessionStats.discrepancyValue < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                  {sessionStats.discrepancyValue.toLocaleString()} F
                </span>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex gap-3 items-start">
               <AlertTriangle size={16} className="text-orange-600 shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold text-orange-900 dark:text-orange-200 leading-relaxed">
                 {activeTab === 'general' ? 
                   "En mode Général, les articles non comptés seront mis à ZÉRO." :
                   "Les quantités saisies écraseront les valeurs actuelles du système."
                 }
               </p>
            </div>

            <button onClick={handleApply} className="w-full py-3 rounded-xl bg-primary text-white font-black text-sm uppercase shadow-md active:scale-95 transition-all mt-2">
              Confirmer l'Ajustement
            </button>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Nouveau Produit (Drawer) */}
      <ResponsiveDialog open={showNewProductModal} onOpenChange={setShowNewProductModal}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Produit Inconnu</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Créer l'article et l'ajouter au comptage.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form onSubmit={handleAddNewProduct} className="space-y-3 mt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nom</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 border border-border rounded-lg bg-background text-sm font-bold outline-none" required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Type</label>
                <input type="text" value={typeProduit} onChange={e => setTypeProduit(e.target.value)} placeholder="Carton..." className="w-full p-2.5 border border-border rounded-lg bg-background text-sm font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nb. Types</label>
                <input type="number" value={numTypes} onChange={e => setNumTypes(e.target.value)} className="w-full p-2.5 border border-border rounded-lg bg-background text-sm font-black outline-none" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Qté / Type</label>
                <input type="number" value={qtyPerType} onChange={e => setQtyPerType(e.target.value)} className="w-full p-2.5 border border-border rounded-lg bg-background text-sm font-black outline-none" required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Achat / Type</label>
                <input type="number" value={priceBuyPerType} onChange={e => setPriceBuyPerType(e.target.value)} className="w-full p-2.5 border border-border rounded-lg bg-background text-sm font-black outline-none" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-green-500 ml-1">Vente Unit.</label>
                <input type="number" value={priceSellUnit} onChange={e => setPriceSellUnit(e.target.value)} className="w-full p-2.5 border border-border rounded-lg bg-background text-sm font-black outline-none" required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-orange-500 ml-1">Alerte</label>
                <input type="number" value={thresholdUnit} onChange={e => setThresholdUnit(e.target.value)} className="w-full p-2.5 border border-border rounded-lg bg-background text-sm font-black outline-none" required />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-black text-xs uppercase shadow-md active:scale-95 transition-all mt-4">
              Créer & Ajouter
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

    </div>
  )
}
