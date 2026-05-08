import { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { clsx } from 'clsx'
import { useStore } from '../store/useStore'
import { 
  Plus, Search, AlertTriangle, PackageSearch, ScanBarcode, X, 
  Package, DollarSign, Download, History, Edit3, Trash2, CheckCircle2, LayoutGrid, List
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
    <span className="inline-flex items-center gap-1.5 border border-border/40 bg-secondary/20 text-muted-foreground/70 rounded-full font-black px-1.5 py-0.5 text-[6.5px] uppercase tracking-wider">
      {category}
    </span>
  )
}

function StatCard({ title, value, sub, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-2xl p-3 flex items-center justify-between group hover:border-primary/30 transition-all min-w-0">
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest mb-0.5 truncate">{title}</p>
        <div className="flex items-baseline gap-1 flex-wrap">
          <h3 className="text-sm sm:text-base font-black tracking-tight truncate">{value}</h3>
          <span className="text-[8px] font-bold text-muted-foreground/40 truncate">{sub}</span>
        </div>
      </div>
      <div className={`p-1.5 sm:p-2 rounded-xl ${color} bg-opacity-10 shrink-0 group-hover:scale-110 transition-transform ml-2`}>
        <Icon size={14} className={color.replace('bg-', 'text-')} />
      </div>
    </motion.div>
  )
}

function StockList({ 
  filteredItems, search, setSearch, isScanning, setIsScanning, 
  exportToExcel, getExpiryAlert, handleQuickAdjust, setHistoryFilter, 
  setActiveTab, deleteStockItem, categories, selectedCategory, setSelectedCategory,
  viewMode, setViewMode
}) {

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Barre de recherche style Fournisseurs */}
      <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
        <div className="flex bg-card p-2 rounded-2xl border border-border shadow-sm flex-1 w-full">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Rechercher un produit..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-9 p-2.5 bg-muted/30 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
           <div className="flex bg-muted/30 p-1 rounded-xl border border-border flex-1 sm:flex-none">
             <button 
               onClick={() => setViewMode('grid')}
               className={`flex-1 p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
             >
               <LayoutGrid size={16} />
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`flex-1 p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
             >
               <List size={16} />
             </button>
           </div>
           
           <button 
             onClick={() => setIsScanning(!isScanning)} 
             className={`p-2.5 rounded-xl transition-all border shadow-sm ${isScanning ? 'bg-destructive text-white border-destructive' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
           >
             {isScanning ? <X size={16}/> : <ScanBarcode size={16}/>}
           </button>

           <button 
             onClick={exportToExcel} 
             className="p-2.5 rounded-xl bg-card text-muted-foreground border border-border hover:bg-emerald-500/50 transition-all shadow-sm"
           >
             <Download size={16} />
           </button>
        </div>
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Scanner onScanSuccess={(t) => { setSearch(t); setIsScanning(false) }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sélecteur de Catégorie Style Fournisseurs (mais garde scroll) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0 ${
              selectedCategory === cat 
                ? 'bg-primary text-white border-primary shadow-md' 
                : 'bg-card text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {cat === 'all' ? 'Tous les produits' : cat}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
          <PackageSearch className="mx-auto text-muted-foreground opacity-10 mb-3" size={48} />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className={clsx(
          "print:hidden",
          viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" : "flex flex-col gap-1.5"
        )}>
          <AnimatePresence initial={false}>
            {filteredItems.map((item) => {
              const isAlert = item.current_stock <= (item.alert_threshold || 10)
              const alert = item.expiry_date ? getExpiryAlert(item.expiry_date) : null
              
              if (viewMode === 'list') {
                return (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-2xl transition-all group hover:shadow-md"
                  >
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border border-border/20",
                      isAlert ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
                    )}>
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm uppercase truncate tracking-tight">{item.name}</h4>
                        <CategoryBadge category={item.category} />
                      </div>
                      <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tighter truncate mt-0.5">
                        Dernier flux : {item.lastActionLabel}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                      <div className="text-right hidden xs:block">
                        <p className="text-[8px] font-black uppercase text-muted-foreground/60 leading-none mb-1">Prix Vente</p>
                        <p className="text-sm font-black text-emerald-600 tracking-tighter">{item.price_sell.toLocaleString()} F</p>
                      </div>

                      <div className="flex flex-col items-end min-w-[70px]">
                        <p className="text-[8px] font-black uppercase text-muted-foreground/60 leading-none mb-1">Stock</p>
                        <div className="flex items-center gap-1.5 bg-muted/20 px-2 py-1 rounded-lg">
                           <input 
                             type="number" 
                             defaultValue={item.current_stock} 
                             onBlur={(e) => handleQuickAdjust(item.id, e.target.value)} 
                             className={clsx(
                               "w-10 text-right font-black text-xs bg-transparent outline-none",
                               isAlert ? "text-orange-500" : "text-foreground"
                             )}
                           />
                           <span className="text-[8px] font-black uppercase text-muted-foreground/30">U</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setHistoryFilter(item.name); setActiveTab('history') }} 
                          className="p-2 bg-muted/40 text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <History size={14} />
                        </button>
                        <button 
                          onClick={() => { if (window.confirm(`Supprimer ${item.name} ?`)) deleteStockItem(item.id) }} 
                          className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive hover:text-white transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              }

              return (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={clsx(
                    "card-ultra-compact flex flex-col gap-2 relative overflow-hidden transition-all group",
                    isAlert ? 'border-orange-500/30 bg-orange-500/5' : 'border-border/50 bg-card hover:shadow-md'
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border border-border/20",
                        isAlert ? "bg-orange-500/20 text-orange-600" : "bg-primary/10 text-primary"
                      )}>
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-sm tracking-tight truncate uppercase">{item.name}</h4>
                          <CategoryBadge category={item.category} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                           {isAlert && <span className="text-[7px] font-black uppercase px-1 rounded-sm bg-orange-500 text-white animate-pulse">STOCK BAS</span>}
                           <span className="text-[9px] font-bold text-muted-foreground/40 italic truncate">{item.lastActionLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[8px] font-black uppercase text-muted-foreground/60 mb-0.5">Disponibilité</p>
                      <p className={`text-sm font-black tracking-tighter ${isAlert ? 'text-orange-500' : 'text-primary'}`}>
                        {item.current_stock.toLocaleString()} Unités
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1">
                    <button 
                      onClick={() => { setHistoryFilter(item.name); setActiveTab('history') }} 
                      className="flex items-center gap-1.5 p-1.5 bg-muted/40 text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-[9px] font-bold uppercase"
                    >
                      <History size={12} /> Historique
                    </button>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1.5 bg-muted/20 px-2 py-0.5 rounded-lg border border-border/40">
                         <input 
                           type="number" 
                           defaultValue={item.current_stock} 
                           onBlur={(e) => handleQuickAdjust(item.id, e.target.value)} 
                           className={clsx(
                             "w-8 text-right font-black text-[11px] bg-transparent outline-none",
                             isAlert ? "text-orange-500" : "text-primary"
                           )}
                         />
                         <span className="text-[8px] font-black uppercase text-muted-foreground/30">U</span>
                      </div>
                      
                      <button 
                        onClick={() => { if (window.confirm(`Supprimer ${item.name} ?`)) deleteStockItem(item.id) }} 
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
  const allStock = useStore(state => state.stock) || []
  const allStockLogs = useStore(state => state.stock_logs) || []
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const stock_logs = useMemo(() => allStockLogs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId), [allStockLogs, activeBoutiqueId])
  const updateStockQty = useStore(state => state.updateStockQty)
  const deleteStockItem = useStore(state => state.deleteStockItem)

  const [activeTab, setActiveTab] = useState('list')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
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
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Inventaire'); XLSX.writeFile(wb, `Inventaire_Butik_${new Date().toLocaleDateString()}.xlsx`)
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 px-3 sm:px-4 md:px-6 overflow-x-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase leading-none">Stock Total</h1>
          <p className="text-muted-foreground font-bold mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <Package className="text-primary" size={14}/> Catalogue & Inventaire
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 items-stretch sm:items-center">
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border flex-1 sm:flex-none">
            <button 
              onClick={() => setActiveTab('list')} 
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Package size={14} /> <span className="inline">Catalogue</span>
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <History size={14} /> <span className="inline">Flux</span>
            </button>
          </div>
          <button 
            onClick={() => setIsNewProductOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95 whitespace-nowrap w-full sm:w-auto justify-center h-[38px]"
          >
            <Plus size={16} strokeWidth={3} /> Nouveau Produit
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard title="Valeur Stock" value={`${stats.totalValue.toLocaleString()} F`} sub="Base Achat" icon={DollarSign} color="bg-emerald-500" />
        <StatCard title="En Alerte" value={stats.lowStockItems} sub="À commander" icon={AlertTriangle} color="bg-orange-500" />
        <StatCard title="Catalogue" value={stats.totalItems} sub="Articles" icon={PackageSearch} color="bg-blue-500" className="hidden sm:flex" />
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
          viewMode={viewMode}
          setViewMode={setViewMode}
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
           <div className="-mx-6 -my-6 sm:m-0">
             <ProductForm onSuccess={() => setIsNewProductOpen(false)} />
           </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
