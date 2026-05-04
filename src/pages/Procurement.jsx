import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { 
  ShoppingBag, TrendingUp, AlertCircle, CheckCircle2, 
  Package, Croissant, Flame, Info, ChevronRight, ShoppingCart
} from 'lucide-react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const formatF = (val) => `${Number(val || 0).toLocaleString('fr-FR')} F`

export default function Procurement() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allStock = useStore(state => state.stock || [])
  const allBreadLogs = useStore(state => state.bread_logs || [])
  const allGasLogs = useStore(state => state.gas_logs || [])
  
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const bread_logs = useMemo(() => allBreadLogs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId), [allBreadLogs, activeBoutiqueId])
  const gas_logs = useMemo(() => allGasLogs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId), [allGasLogs, activeBoutiqueId])

  // ─── Analyse Pain ──────────────────────────────────────────────────
  const breadAdvice = useMemo(() => {
    const last7 = bread_logs.slice(-7)
    if (last7.length === 0) return null

    const totalSold = last7.reduce((acc, log) => {
      const qtySold = (log.total_to_pay || 0) / (log.unit_price || 135)
      return acc + Math.max(0, qtySold)
    }, 0)
    
    const avgDaily = Math.round(totalSold / (last7.length || 1))
    const suggested = Math.ceil(avgDaily * 1.1) // 10% buffer

    return { avgDaily, suggested }
  }, [bread_logs])

  // ─── Analyse Stock Général ─────────────────────────────────────────
  const restockList = useMemo(() => {
    return stock.filter(item => item.current_stock <= (item.alert_threshold || 10))
      .map(item => {
        // Simple suggestion: triple the alert threshold as a safety stock
        const suggested = Math.max(0, ((item.alert_threshold || 10) * 3) - item.current_stock)
        const estimatedCost = suggested * (item.price_buy || 0)
        return { ...item, suggestion: suggested, estimatedCost }
      })
  }, [stock])

  const totalBudget = useMemo(() => 
    restockList.reduce((acc, item) => acc + item.estimatedCost, 0)
  , [restockList])

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Assistant Réappro</h1>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-1">Planification des Commandes Fournisseurs</p>
        </div>
        <div className="flex items-center gap-4">
          {totalBudget > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Budget Estimé</p>
              <p className="text-sm font-black text-primary">{formatF(totalBudget)}</p>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-wider">
            <TrendingUp size={14} /> Analyse sur 7 jours
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Section Pain */}
        <motion.div variants={item} className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Croissant size={18} className="text-amber-500" />
            <h3 className="text-sm font-black uppercase tracking-widest">Boulangerie</h3>
          </div>
          
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
            {breadAdvice ? (
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Moyenne de vente / jour</p>
                    <h4 className="text-4xl font-black text-foreground">{breadAdvice.avgDaily} <span className="text-sm font-bold text-muted-foreground uppercase">miches</span></h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Suggestion de commande</p>
                    <div className="text-2xl font-black text-primary px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20 inline-block">
                      {breadAdvice.suggested}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 flex items-start gap-3">
                  <Info size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Basé sur vos 7 derniers jours. Nous avons ajouté une marge de sécurité de 10% pour couvrir les pics de vente imprévus.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center py-10 text-xs font-bold text-muted-foreground italic">Pas assez de données pour le pain.</p>
            )}
            <Croissant className="absolute -right-10 -bottom-10 text-muted/10 -rotate-12" size={180} />
          </div>
        </motion.div>

        {/* Section Gaz */}
        <motion.div variants={item} className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Flame size={18} className="text-blue-500" />
            <h3 className="text-sm font-black uppercase tracking-widest">Énergie (Gaz)</h3>
          </div>
          
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                Le gaz étant un produit à rotation fixe, nous recommandons de commander dès que votre stock de pleines descend en dessous de 2 unités par type.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {['B6', 'B9', 'B12'].map(type => {
                  const gasItem = stock.find(s => s.name.toLowerCase().includes('gaz') && s.name.toUpperCase().includes(type));
                  const current = gasItem ? gasItem.current_stock : 0;
                  const needsOrder = current < 2;
                  return (
                    <div key={type} className={clsx(
                      "p-3 rounded-xl text-center border transition-all",
                      needsOrder ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-muted/20 border-border/50 text-muted-foreground"
                    )}>
                      <p className="text-[10px] font-black uppercase">{type}</p>
                      <p className="font-black text-sm">{current} en stock</p>
                      <p className="text-[8px] font-bold mt-1 uppercase">{needsOrder ? '⚠️ Commander' : 'OK'}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <Flame className="absolute -right-10 -bottom-10 text-muted/10 -rotate-12" size={180} />
          </div>
        </motion.div>
      </div>

      {/* Stock Critique & Suggestions */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest">Articles en rupture ou critique</h3>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full">
            {restockList.length} ARTICLES
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {restockList.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4 shadow-sm hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-sm group-hover:text-primary transition-colors">{item.name}</h4>
                  <p className="text-[9px] font-black uppercase text-muted-foreground mt-0.5">{item.category || 'Général'}</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${item.current_stock === 0 ? 'bg-red-500 text-white' : 'bg-orange-500/10 text-orange-600 border border-orange-500/20'}`}>
                  {item.current_stock === 0 ? 'Rupture' : `${item.current_stock} en stock`}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <div className="flex-1">
                  <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Sugg. Commande</p>
                  <p className="font-black text-lg text-primary leading-none">
                    {item.suggestion} <span className="text-[10px] font-bold text-muted-foreground uppercase">unités</span>
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground/60 mt-1 uppercase italic">Estimation: {formatF(item.estimatedCost)}</p>
                </div>
                <button className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shrink-0">
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          ))}
          
          {restockList.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center bg-muted/10 border border-dashed border-border rounded-3xl gap-3">
              <CheckCircle2 size={32} className="text-emerald-500 opacity-50" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Tout votre stock est à un niveau optimal</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
