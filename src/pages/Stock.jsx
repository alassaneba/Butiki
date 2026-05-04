import { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useStore } from '../store/useStore'
import { 
  Plus, Search, AlertTriangle, PackageSearch, ScanBarcode, X, 
  Package, DollarSign, Download, History, Edit3, Trash2, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Scanner from '../components/Scanner'
import * as XLSX from 'xlsx'
import ProductForm from '../components/stock/ProductForm'
import StockHistoryTable from '../components/stock/StockHistoryTable'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'

function CategoryBadge({ category }) {
  if (!category) return null
  return (
    <span className="inline-flex items-center gap-1.5 border border-border/50 bg-secondary/30 text-muted-foreground rounded-full font-black px-2 py-0.5 text-[7px] uppercase tracking-wider">
      {category}
    </span>
  )
}

function StatCard({ title, value, sub, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-ultra-compact group border border-border/50">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">{title}</p>
          <h3 className="text-lg font-black">{value}</h3>
          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{sub}</p>
        </div>
        <div className={`p-2 rounded-xl ${color} bg-opacity-10 shrink-0 group-hover:scale-110 transition-transform`}><Icon size={16} className={color.replace('bg-', 'text-')} /></div>
      </div>
    </motion.div>
  )
}

function StockList({ 
  filteredItems, search, setSearch, isScanning, setIsScanning, 
  exportToExcel, getExpiryAlert, handleQuickAdjust, setHistoryFilter, 
  setActiveTab, deleteStockItem, categories, selectedCategory, setSelectedCategory 
}) {

  return (
    <div className="space-y-4">
      {/* Sélecteur de Catégorie */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              selectedCategory === cat 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                : 'bg-card text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {cat === 'all' ? 'Tous les produits' : cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-2 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Rechercher un produit..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-9 p-2.5 bg-muted/30 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setIsScanning(!isScanning)} 
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border shadow-sm ${isScanning ? 'bg-destructive text-white border-destructive' : 'bg-background text-foreground hover:bg-muted border-border'}`}
          >
            {isScanning ? <X size={16}/> : <ScanBarcode size={16}/>}
            {isScanning ? 'Fermer' : 'Scanner'}
          </button>
          <button 
            onClick={exportToExcel} 
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-background border border-border hover:bg-muted transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
            <Scanner onScanSuccess={(t) => { setSearch(t); setIsScanning(false) }} />
          </motion.div>
        )}
      </AnimatePresence>

      {filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-muted/5 rounded-[2.5rem] border border-dashed border-border/50">
          <PackageSearch className="mx-auto text-muted-foreground opacity-10 mb-4" size={64} />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Aucun produit dans le catalogue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 print:hidden">
          <AnimatePresence initial={false}>
            {filteredItems.map((item) => {
              const isAlert = item.current_stock <= (item.alert_threshold || 10)
              const alert = item.expiry_date ? getExpiryAlert(item.expiry_date) : null
              
              return (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`card-ultra-compact flex flex-col gap-2 relative overflow-hidden transition-all group ${isAlert ? 'border-orange-500/30 bg-orange-500/5' : 'border-border/50 bg-card hover:shadow-md'}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isAlert ? 'bg-orange-500/10 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                        <Package size={16} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-sm tracking-tight truncate uppercase leading-none">{item.name}</h4>
                          <CategoryBadge category={item.category} />
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                           {isAlert && (
                             <span className="inline-flex items-center gap-1 text-[8px] uppercase font-black px-1.5 py-0.5 bg-orange-500 text-white rounded-md animate-pulse">
                               STOCK BAS
                             </span>
                           )}
                           {alert && (
                             <span className={`inline-flex items-center gap-1 text-[8px] uppercase font-black px-1.5 py-0.5 ${alert.color} rounded-md`}>
                               {alert.label}
                             </span>
                           )}
                           {!isAlert && !alert && (
                             <span className="text-[9px] font-bold text-muted-foreground/40 flex items-center gap-1 uppercase tracking-tighter">
                               <CheckCircle2 size={10} className="text-emerald-500" /> Stock Optimal
                             </span>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[8px] font-black uppercase text-muted-foreground/60 mb-0.5">Disponibilité</p>
                      <div className="flex flex-col items-end">
                         <div className="flex items-center gap-1.5 bg-muted/20 px-2 py-0.5 rounded-lg border border-border/40">
                           <input 
                             type="number" 
                             defaultValue={item.current_stock} 
                             onBlur={(e) => handleQuickAdjust(item.id, e.target.value)} 
                           className={`w-10 text-center font-black text-sm bg-transparent outline-none ${isAlert ? 'text-orange-600' : 'text-primary'}`} 
                           />
                           <span className="text-[8px] font-black uppercase text-muted-foreground/30">U</span>
                         </div>
                         <p className="text-sm font-black text-emerald-600 mt-1">{item.price_sell.toLocaleString()} F / u</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1">
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-0.5">Dernier Mouvement</p>
                      <p className="text-[9px] font-bold text-muted-foreground italic truncate">
                        {item.lastActionLabel} — <span className="text-primary/60 not-italic">{new Date(item.lastActionDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button 
                        onClick={() => { setHistoryFilter(item.name); setActiveTab('history') }} 
                        className="flex items-center gap-1.5 p-1.5 bg-muted/40 text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-[9px] font-bold uppercase"
                      >
                        <History size={12} />
                      </button>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Supprimer ${item.name} ?`)) deleteStockItem(item.id) }} 
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all active:scale-95"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}


export default function Stock() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allStock = useStore(state => state.stock || [])
  const allStockLogs = useStore(state => state.stock_logs || [])
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const stock_logs = useMemo(() => allStockLogs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId), [allStockLogs, activeBoutiqueId])
  const updateStockQty = useStore(state => state.updateStockQty)
  const deleteStockItem = useStore(state => state.deleteStockItem)

  const [activeTab, setActiveTab] = useState('list')
  const [search, setSearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)

  // Calculs automatiques
  const stats = useMemo(() => {
    const totalItems = stock.length
    const lowStockItems = stock.filter(i => i.current_stock <= i.alert_threshold).length
    const totalValue = stock.reduce((acc, i) => acc + (i.current_stock * (i.price_buy || 0)), 0)
    return { totalItems, lowStockItems, totalValue }
  }, [stock])

  const handleQuickAdjust = (id, newQty) => updateStockQty(id, Number(newQty), 'Correction manuelle')

  const getExpiryAlert = (date) => {
    if (!date) return null
    const diffDays = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return { label: 'Expiré', color: 'bg-destructive text-white', icon: AlertTriangle }
    if (diffDays <= 10) return { label: 'Urgent (10j)', color: 'bg-red-500 text-white', icon: AlertTriangle }
    if (diffDays <= 51) return { label: 'Alerte (1m 21j)', color: 'bg-orange-500 text-white', icon: AlertTriangle }
    return null
  }

  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    if (stock.length > 0 && selectedCategory === '') {
      setSelectedCategory('all')
    }
  }, [stock.length, selectedCategory])

  const categories = useMemo(() => ['all', ...new Set(stock.map(s => s.category).filter(Boolean))], [stock])

  const [searchParams] = useSearchParams()
  const filterType = searchParams.get('filter')

  const filteredItems = useMemo(() => {
    let list = stock.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory
      return matchSearch && matchCat
    })
    
    if (filterType === 'low') {
      list = list.filter(item => item.current_stock <= (item.alert_threshold || 10))
    }

    // Calcul de la dernière activité pour chaque produit
    const listWithActivity = list.map(item => {
      const logs = stock_logs.filter(l => l.productId === item.id)
      const lastLog = logs.length > 0 
        ? logs.sort((a, b) => {
            const da = new Date(a.date).getTime()
            const db = new Date(b.date).getTime()
            return db - da
          })[0]
        : null
      
      const date = lastLog ? lastLog.date : new Date(0).toISOString()
      
      return { 
        ...item, 
        lastActionDate: date,
        lastActionLabel: lastLog 
          ? `${lastLog.type === 'entree' || lastLog.type === 'initial' ? '+' : '-'}${lastLog.quantity} (${lastLog.reason || 'Saisie'})` 
          : 'Initial'
      }
    })

    return listWithActivity.sort((a, b) => new Date(b.lastActionDate).getTime() - new Date(a.lastActionDate).getTime())
  }, [stock, stock_logs, search, filterType, selectedCategory])

  const handleScanSuccess = (decodedText) => {
    setSearch(decodedText)
    setIsScanning(false)
  }

  const exportToExcel = () => {
    const data = stock.map(i => ({ 'Désignation': i.name, 'Stock Actuel': i.current_stock, 'Seuil Alerte': i.alert_threshold, 'Prix Achat (F)': i.price_buy, 'Prix Vente (F)': i.price_sell, 'Valeur Stock (F)': i.current_stock * i.price_buy }))
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Inventaire'); XLSX.writeFile(wb, `Inventaire_Butiki_${new Date().toLocaleDateString()}.xlsx`)
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity] no-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Gestion du Stock</h1>
          <p className="text-muted-foreground mt-1 text-[10px] font-black uppercase tracking-widest">Catalogue et traçabilité</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border flex-1 sm:flex-none">
            <button onClick={() => setActiveTab('list')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Package size={14} /> <span className="hidden sm:inline">Catalogue</span></button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><History size={14} /> <span className="hidden sm:inline">Mouvements</span></button>
          </div>
          <button 
            onClick={() => setIsNewProductOpen(true)}
            className="bg-primary text-white px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nouveau Produit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard title="Valeur du Stock" value={`${stats.totalValue.toLocaleString()} F`} sub="Base prix d'achat" icon={DollarSign} color="bg-emerald-500" />
        <StatCard title="En Alerte" value={stats.lowStockItems} sub="Nécessitent un réappro" icon={AlertTriangle} color="bg-orange-500" />
        <StatCard title="Total Articles" value={stats.totalItems} sub="Références actives" icon={PackageSearch} color="bg-blue-500" />
      </div>

      {activeTab === 'list' ? (
        <StockList 
          filteredItems={filteredItems} 
          search={search}
          setSearch={setSearch}
          isScanning={isScanning}
          setIsScanning={setIsScanning}
          exportToExcel={exportToExcel}
          getExpiryAlert={getExpiryAlert}
          handleQuickAdjust={handleQuickAdjust}
          setHistoryFilter={setHistoryFilter}
          setActiveTab={setActiveTab}
          deleteStockItem={deleteStockItem}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      ) : (
        <div className="space-y-4">
          <StockHistoryTable historyFilter={historyFilter} setHistoryFilter={setHistoryFilter} />
        </div>
      )}

      {/* Drawer Nouveau Produit */}
      <ResponsiveDialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
           <ResponsiveDialogHeader className="hidden">
             <ResponsiveDialogTitle>Nouveau Produit</ResponsiveDialogTitle>
           </ResponsiveDialogHeader>
           {/* On injecte le formulaire complet sans sa bordure extérieure */}
           <div className="-mx-6 -my-6 sm:m-0">
             <ProductForm />
           </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
