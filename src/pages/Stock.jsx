import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Plus, Search, Package, History, Trash2, PackageSearch,
  ScanBarcode, FileDown, LayoutGrid, List, AlertTriangle
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

function ImageWithFallback({ src, alt, fallback }) {
  const [error, setError] = useState(false)
  if (!src || error) return <span className="uppercase">{fallback}</span>
  return <img src={src} alt={alt} onError={() => setError(true)} className="w-full h-full object-cover" />
}

// Badge catégorie — même style que CatBadge dans Fournisseurs
function CatBadge({ cat }) {
  if (!cat) return null
  return (
    <span className="inline-flex items-center border border-border/40 bg-secondary/20 text-muted-foreground/70 rounded-full font-black px-1.5 py-0.5 text-[6.5px] uppercase tracking-wider shrink-0">
      {cat}
    </span>
  )
}

export default function Stock() {
  const activeBoutiqueId = useStore(s => s.activeBoutiqueId)
  const allStock       = useStore(s => s.stock)       || []
  const allLogs        = useStore(s => s.stock_logs)  || []
  const updateStockQty = useStore(s => s.updateStockQty)
  const deleteStockItem= useStore(s => s.deleteStockItem)

  const stock = useMemo(
    () => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId),
    [allStock, activeBoutiqueId]
  )
  const logs = useMemo(
    () => allLogs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId),
    [allLogs, activeBoutiqueId]
  )

  const [tab,      setTab]      = useState('list')   // 'list' | 'history'
  const [viewMode, setViewMode] = useState('grid')   // 'grid' | 'list'
  const [search,   setSearch]   = useState('')
  const [cat,      setCat]      = useState('all')
  const [scanning, setScanning] = useState(false)
  const [openForm, setOpenForm] = useState(false)
  const [histFilter, setHistFilter] = useState('')

  const [searchParams] = useSearchParams()
  const filterType = searchParams.get('filter')

  // Catégories uniques
  const categories = useMemo(
    () => ['all', ...new Set(stock.map(s => s.category).filter(Boolean))],
    [stock]
  )

  // Stats
  const stats = useMemo(() => ({
    total:   stock.length,
    alerts:  stock.filter(i => i.current_stock <= (i.alert_threshold || 10)).length,
    value:   stock.reduce((a, i) => a + i.current_stock * (i.price_buy || 0), 0),
  }), [stock])

  // Items filtrés + triés par dernière activité
  const items = useMemo(() => {
    let list = stock.filter(i => {
      const matchQ = i.name.toLowerCase().includes(search.toLowerCase())
      const matchC = cat === 'all' || i.category === cat
      return matchQ && matchC
    })
    if (filterType === 'low') list = list.filter(i => i.current_stock <= (i.alert_threshold || 10))

    return list
      .map(i => {
        const itemLogs = logs.filter(l => l.productId === i.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
        const last = itemLogs[0]
        return {
          ...i,
          lastDate:  last ? last.date : new Date(0).toISOString(),
          lastLabel: last
            ? `${last.type === 'entree' || last.type === 'initial' ? '+' : '-'}${last.quantity} · ${last.reason || 'Saisie'}`
            : 'Initial',
        }
      })
      .sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate))
  }, [stock, logs, search, cat, filterType])

  const handleAdjust = (id, qty) => updateStockQty(id, Number(qty), 'Correction manuelle')

  const exportExcel = () => {
    const data = stock.map(i => ({
      Désignation: i.name, Stock: i.current_stock, Seuil: i.alert_threshold,
      'Px Achat': i.price_buy, 'Px Vente': i.price_sell,
      'Valeur (F)': i.current_stock * i.price_buy,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Stock')
    XLSX.writeFile(wb, `Stock_Butik_${new Date().toLocaleDateString()}.xlsx`)
  }

  // ─────────────────────────────────────────────
  return (
    // MÊME conteneur racine que Fournisseurs
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity] w-full" style={{overflowX: 'hidden'}}>

      {/* ══ HEADER — copie exacte de Fournisseurs, adapté Stock ══ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Stock Total</h1>
          <p className="text-muted-foreground font-bold mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <Package className="text-primary" size={14} /> Catalogue &amp; Inventaire
          </p>
        </div>

        {/* Droite : tabs + bouton primaire — même layout que Fournisseurs */}
        <div className="flex gap-2 w-full sm:w-auto" style={{minWidth: 0}}>
          {/* Tabs Catalogue / Flux */}
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border" style={{flex: '1 1 0%', minWidth: 0}}>
            <button
              onClick={() => setTab('list')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Package size={13} /> <span className="truncate">Catalogue</span>
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'history' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <History size={13} /> <span className="truncate">Flux</span>
            </button>
          </div>
          {/* Bouton primaire — MÊME style que "Nouveau Fournisseur" */}
          <button
            onClick={() => setOpenForm(true)}
            className="bg-primary text-white px-3 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-md active:scale-95 whitespace-nowrap shrink-0"
          >
            <Plus size={14} strokeWidth={3} /> <span className="hidden sm:inline">Nouveau</span><span className="sm:hidden">+</span>
          </button>
        </div>
      </header>

      {/* ══ TAB : CATALOGUE ══ */}
      {tab === 'list' && (
        <>
          {/* Filtres catégories — overflow scroll interne, parent bien contraint */}
          <div style={{width: '100%', overflow: 'hidden'}}>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap shrink-0 border ${
                  cat === c
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-card text-muted-foreground border-border/50 hover:border-border hover:bg-muted/50'
                }`}
              >
                {c === 'all' ? 'Tous' : c}
              </button>
            ))}
            </div>
          </div>

          {/* ── BARRE DE RECHERCHE — copie exacte de Fournisseurs ── */}
          <div className="flex gap-2">
            <div className="flex bg-card p-2 rounded-2xl border border-border shadow-sm flex-1">
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
            </div>
            {/* Actions secondaires — icônes compactes */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  <LayoutGrid size={14} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  <List size={14} />
                </button>
              </div>
              <button
                onClick={() => setScanning(!scanning)}
                className={`p-2 rounded-xl border transition-all ${scanning ? 'bg-primary text-white border-primary' : 'bg-card text-primary border-primary/20 hover:bg-primary/5'}`}
              >
                <ScanBarcode size={14} />
              </button>
              <button onClick={exportExcel} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500/20 transition-all border border-emerald-500/20">
                <FileDown size={14} />
              </button>
            </div>
          </div>

          {/* Scanner */}
          <AnimatePresence>
            {scanning && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Scanner onScanSuccess={t => { setSearch(t); setScanning(false) }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══ GRILLE DE PRODUITS — même structure que Fournisseurs ══ */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : 'flex flex-col gap-1.5'}>
            <AnimatePresence initial={false}>
              {items.map(item => {
                const isAlert = item.current_stock <= (item.alert_threshold || 10)

                if (viewMode === 'list') {
                  // ── VUE LISTE ──
                  return (
                    <motion.div
                      key={item.id} layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="card-ultra-compact flex flex-col gap-2 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 overflow-hidden ${isAlert ? 'bg-orange-500/10 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                            <ImageWithFallback src={item.image} alt={item.name} fallback={item.name.charAt(0).toUpperCase()} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-black text-sm tracking-tight truncate uppercase">{item.name}</h4>
                              <CatBadge cat={item.category} />
                              {isAlert && <span className="text-[7px] font-black uppercase px-1 rounded-sm bg-orange-500 text-white">BAS</span>}
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground/50 truncate mt-0.5">{item.lastLabel}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[8px] font-black uppercase text-muted-foreground/60 mb-0.5">Stock</p>
                          <p className={`text-sm font-black tracking-tighter ${isAlert ? 'text-orange-500' : 'text-primary'}`}>
                            {item.current_stock} U
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1 flex-wrap">
                        <button onClick={() => { setHistFilter(item.name); setTab('history') }} className="flex items-center gap-1.5 p-1.5 bg-muted/40 text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-[9px] font-bold uppercase">
                          <History size={12} /> Détails
                        </button>
                        <div className="flex gap-1.5 shrink-0">
                          <input
                            type="number" defaultValue={item.current_stock}
                            onBlur={e => handleAdjust(item.id, e.target.value)}
                            className={`w-12 text-right font-black text-xs bg-muted/20 border rounded-lg px-1.5 py-1 outline-none ${isAlert ? 'border-orange-500/30 text-orange-500' : 'border-border/40 text-primary'}`}
                          />
                          <button onClick={() => { if (window.confirm(`Supprimer ${item.name} ?`)) deleteStockItem(item.id) }} className="btn-ultra-compact bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                }

                // ── VUE GRILLE — carte identique à Fournisseurs ──
                return (
                  <motion.div
                    key={item.id} layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`card-ultra-compact flex flex-col gap-2 relative overflow-hidden ${isAlert ? 'border-orange-500/30 bg-orange-500/5' : ''}`}
                  >
                    {/* Ligne 1 : avatar + nom + prix (= avatar + nom + solde dans Fournisseurs) */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 overflow-hidden ${isAlert ? 'bg-orange-500/20 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                          <ImageWithFallback src={item.image} alt={item.name} fallback={item.name.charAt(0).toUpperCase()} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-sm tracking-tight truncate uppercase">{item.name}</h4>
                            <CatBadge cat={item.category} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isAlert && <span className="text-[7px] font-black uppercase px-1 rounded-sm bg-orange-500 text-white animate-pulse">STOCK BAS</span>}
                            <span className="text-[9px] font-bold text-muted-foreground/40 italic truncate">{item.lastLabel}</span>
                          </div>
                        </div>
                      </div>
                      {/* Valeur à droite = "Solde Dû" dans Fournisseurs */}
                      <div className="text-right shrink-0">
                        <p className="text-[8px] font-black uppercase text-muted-foreground/60 mb-0.5">Disponible</p>
                        <p className={`text-sm font-black tracking-tighter ${isAlert ? 'text-orange-500' : 'text-emerald-500'}`}>
                          {item.current_stock.toLocaleString()} U
                        </p>
                      </div>
                    </div>

                    {/* Ligne 2 : actions = même structure que Fournisseurs */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1 flex-wrap">
                      <button
                        onClick={() => { setHistFilter(item.name); setTab('history') }}
                        className="flex items-center gap-1.5 p-1.5 bg-muted/40 text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-[9px] font-bold uppercase"
                      >
                        <History size={12} /> Détails
                      </button>
                      <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                        {/* Saisie quantité rapide = "PAYER" dans Fournisseurs */}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${isAlert ? 'bg-orange-500/10 border-orange-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                          <input
                            type="number" defaultValue={item.current_stock}
                            onBlur={e => handleAdjust(item.id, e.target.value)}
                            className={`w-8 text-right font-black text-[11px] bg-transparent outline-none ${isAlert ? 'text-orange-500' : 'text-emerald-600'}`}
                          />
                          <span className="text-[8px] font-black uppercase text-muted-foreground/30">U</span>
                        </div>
                        {/* Supprimer = "+ DETTE" dans Fournisseurs */}
                        <button
                          onClick={() => { if (window.confirm(`Supprimer ${item.name} ?`)) deleteStockItem(item.id) }}
                          className="btn-ultra-compact bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* État vide — même style que Fournisseurs */}
            {items.length === 0 && (
              <div className="col-span-full py-10 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
                <PackageSearch className="mx-auto text-muted-foreground opacity-10 mb-2" size={32} />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Aucun produit trouvé</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ TAB : FLUX / HISTORIQUE ══ */}
      {tab === 'history' && (
        <StockHistoryTable historyFilter={histFilter} setHistoryFilter={setHistFilter} />
      )}

      {/* ══ DRAWER NOUVEAU PRODUIT ══ */}
      <ResponsiveDialog open={openForm} onOpenChange={setOpenForm}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader className="hidden">
            <ResponsiveDialogTitle>Nouveau Produit</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Ajouter un produit au catalogue.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="-mx-6 -my-6 sm:m-0">
            <ProductForm onSuccess={() => setOpenForm(false)} />
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
