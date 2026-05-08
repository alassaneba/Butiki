import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { 
  TrendingUp, Users, Package, ShoppingCart, 
  ArrowUpRight, ArrowDownRight, Calendar,
  ChevronRight, Activity, Database, Cloud
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import SmartAdvisor from '../components/SmartAdvisor'
import { CustomAreaChart } from '../components/ui/Charts'
import clsx from 'clsx'

function StatCard({ title, value, sub, icon: Icon, color, trend, trendValue, delay = 0, extra }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-ultra-compact group border border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden p-3 sm:p-4"
    >
      <div className="absolute top-0 right-0 p-3 sm:p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Icon size={40} sm:size={70} strokeWidth={3} />
      </div>
      
      <div className="flex justify-between items-start relative z-10">
        <div className="w-full">
          <p className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">{title}</p>
          <h3 className="text-lg sm:text-2xl font-black tracking-tighter">{value}</h3>
          
          <div className="flex items-center gap-1.5 mt-1 sm:mt-2">
            {trend && (
              <div className={clsx(
                "flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black",
                trend === 'up' ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
              )}>
                {trend === 'up' ? <ArrowUpRight size={8} sm:size={10} /> : <ArrowDownRight size={8} sm:size={10} />}
                {trendValue}
              </div>
            )}
            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground">{sub}</p>
          </div>

          {extra && (
            <div className="mt-2 pt-2 border-t border-border/50">
              {extra}
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${color} bg-opacity-10 shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon size={16} sm:size={20} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
    </motion.div>
  )
}

function SystemHealth() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allStock = useStore(state => state.stock) || []
  const allInventoryHistory = useStore(state => state.inventory_history) || []
  
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const inventory_history = useMemo(() => allInventoryHistory.filter(h => (h.boutiqueId || 'b1') === activeBoutiqueId), [allInventoryHistory, activeBoutiqueId])
  
  const lastInventory = inventory_history[0] ? new Date(inventory_history[0].date).toLocaleDateString() : 'Jamais'
  
  return (
    <div className="card-ultra-compact border border-border/50 bg-card shadow-premium">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Activity size={18} />
        </div>
        <h2 className="font-black text-xs uppercase tracking-widest">Santé du Système</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Cloud size={14} className="text-emerald-500" />
            Synchronisation Cloud
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20">ACTIF</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Database size={14} className="text-blue-500" />
            Stockage Local
          </div>
          <span className="text-[10px] font-black uppercase">Optimisé</span>
        </div>
        
        <div className="pt-2 border-t border-border/50">
           <div className="flex justify-between items-end">
              <div>
                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Dernier Inventaire</p>
                 <p className="text-xs font-black">{lastInventory}</p>
              </div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{stock.length} Articles</p>
           </div>
        </div>
      </div>
    </div>
  )
}

function ModuleSyncStatus() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const breadLogs = useStore(state => state.bread_logs) || []
  const gasLogs = useStore(state => state.gas_logs) || []
  const creditLogs = useStore(state => state.credit_logs) || []
  
  const today = new Date().toLocaleDateString()
  
  const modules = [
    { id: 'pain', label: 'Pain', active: breadLogs.some(l => new Date(l.date).toLocaleDateString() === today && (l.boutiqueId || 'b1') === activeBoutiqueId) },
    { id: 'gaz', label: 'Gaz', active: gasLogs.some(l => new Date(l.date).toLocaleDateString() === today && (l.boutiqueId || 'b1') === activeBoutiqueId) },
    { id: 'credit', label: 'Crédit', active: creditLogs.some(l => new Date(l.date).toLocaleDateString() === today && (l.boutiqueId || 'b1') === activeBoutiqueId) },
  ]

  return (
    <div className="card-ultra-compact border border-border/50 bg-card/30 backdrop-blur-md">
      <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Activité des Modules</h3>
      <div className="grid grid-cols-3 gap-2">
        {modules.map(m => (
          <div key={m.id} className="flex flex-col items-center gap-1">
            <div className={clsx(
              "w-2 h-2 rounded-full",
              m.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/20"
            )} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const all_daily_cash_register = useStore(state => state.daily_cash_register) || []
  const allSales = useStore(state => state.sales) || []
  const allExpenses = useStore(state => state.expenses) || []
  const allStock = useStore(state => state.stock) || []
  const clients = useStore(state => state.clients) 
  const config = useStore(state => state.config)

  const daily_cash_register = useMemo(() => all_daily_cash_register.filter(r => (r.boutiqueId || 'b1') === activeBoutiqueId), [all_daily_cash_register, activeBoutiqueId])
  const sales = useMemo(() => allSales.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allSales, activeBoutiqueId])
  const expenses = useMemo(() => allExpenses.filter(e => (e.boutiqueId || 'b1') === activeBoutiqueId), [allExpenses, activeBoutiqueId])
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])

  // -- Calculs Stat --
  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString()
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()

    // Somme des ventes POS pour aujourd'hui (Exclure les annulées)
    const activeSales = sales.filter(s => s.status !== 'cancelled')
    
    const posSalesToday = activeSales
      .filter(s => new Date(s.date).toLocaleDateString() === today)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0)

    const posSalesYesterday = activeSales
      .filter(s => new Date(s.date).toLocaleDateString() === yesterday)
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0)

    const todayReg = daily_cash_register.find(r => r.date && new Date(r.date).toLocaleDateString() === today)
    const yesterdayReg = daily_cash_register.find(r => r.date && new Date(r.date).toLocaleDateString() === yesterday)

    // Calcul du montant des annulations pour aujourd'hui dans les dépenses
    const cancellationsToday = expenses
      .filter(e => e.category === 'annulation_vente' && new Date(e.date).toLocaleDateString() === today)
      .reduce((sum, e) => sum + (e.amount || 0), 0)

    // CA Loggué = Toutes les ventes POS
    const loggedSales = posSalesToday
    
    // CA Manuel (Caisse) = Écart positif ou ventes déclarées manuellement
    // Si calculated_sales est positif, c'est du CA additionnel (ventes hors POS)
    // Si c'est négatif, c'est un manquant de caisse
    const manualSales = todayReg?.calculated_sales || 0
    
    const todaySales = loggedSales + Math.max(0, manualSales)
    const yesterdaySales = posSalesYesterday + Math.max(0, yesterdayReg?.calculated_sales || 0)
    
    let salesTrend = 0
    if (yesterdaySales > 0) {
      salesTrend = ((todaySales - yesterdaySales) / yesterdaySales) * 100
    }

    const totalDebt = (clients || []).reduce((acc, c) => acc + (c.total_debt || 0), 0)
    const criticalStock = stock.filter(s => s.current_stock <= (s.alert_threshold || 10)).length

    return { 
      todaySales, 
      salesTrend, 
      totalDebt, 
      criticalStock, 
      loggedSales, 
      manualSales,
      hasDiscrepancy: manualSales < 0 
    }
  }, [daily_cash_register, sales, stock, clients, expenses])

  // -- Données Graphique --
  const chartData = useMemo(() => {
    // On récupère les 7 derniers jours (y compris aujourd'hui) de manière robuste
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      days.push(d)
    }

    const activeSales = sales.filter(s => s.status !== 'cancelled')

    return days.map(dateObj => {
      const dayIso = dateObj.toISOString().split('T')[0]
      
      const posSales = activeSales
        .filter(s => {
          try {
            return new Date(s.date).toISOString().split('T')[0] === dayIso
          } catch { return false }
        })
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      
      const reg = daily_cash_register.find(r => {
        try {
          return r.date && new Date(r.date).toISOString().split('T')[0] === dayIso
        } catch { return false }
      })
      const caValue = posSales + (reg?.calculated_sales || 0)

      return {
        name: dateObj.toLocaleDateString('fr-FR', { weekday: 'short' }),
        value: caValue,
        fullDate: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      }
    })
  }, [daily_cash_register, sales])

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-6 max-w-6xl mx-auto pb-6 sm:pb-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic flex items-center gap-2">
             {config?.boutiqueName || 'Butik'} <span className="text-primary italic opacity-20">Pro Max</span>
          </h1>
          <p className="text-muted-foreground mt-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Tableau de Pilotage Stratégique</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl shadow-sm">
           <Calendar size={12} className="text-primary" />
           <span className="text-[10px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="Ventes Jour" 
          value={`${stats.todaySales.toLocaleString()} F`} 
          sub="CA du jour" 
          icon={ShoppingCart} 
          color="bg-primary"
          trend={stats.salesTrend !== 0 ? (stats.salesTrend > 0 ? 'up' : 'down') : null}
          trendValue={`${Math.abs(stats.salesTrend).toFixed(1)}%`}
          delay={0.1}
          extra={(
            <div className="space-y-1.5">
               <div className="flex justify-between items-center text-[9px] font-black uppercase">
                  <span className="text-muted-foreground">Logguées (POS)</span>
                  <span className="text-primary">{stats.loggedSales.toLocaleString()} F</span>
               </div>
               <div className="w-full h-1 bg-muted rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(stats.loggedSales / (stats.todaySales || 1)) * 100}%` }} 
                  />
                  <div 
                    className={clsx("h-full opacity-50", stats.manualSales >= 0 ? "bg-orange-500" : "bg-destructive")} 
                    style={{ width: `${(Math.abs(stats.manualSales) / (stats.todaySales || 1)) * 100}%` }} 
                  />
               </div>
               <div className="flex justify-between items-center text-[9px] font-black uppercase">
                  <span className="text-muted-foreground">{stats.manualSales >= 0 ? 'Hors POS / Surplus' : 'Manquant Caisse'}</span>
                  <span className={stats.manualSales >= 0 ? 'text-orange-500' : 'text-destructive'}>
                    {Math.abs(stats.manualSales).toLocaleString()} F
                  </span>
               </div>
            </div>
          )}
        />
        <StatCard 
          title="Stock Critique" 
          value={stats.criticalStock} 
          sub="Produits à réappro" 
          icon={Package} 
          color="bg-orange-500"
          delay={0.2}
        />
        <StatCard 
          title="Encours Clients" 
          value={`${stats.totalDebt.toLocaleString()} F`} 
          sub="Dettes à recouvrer" 
          icon={Users} 
          color="bg-destructive"
          delay={0.3}
        />
        <StatCard 
          title="Trafic" 
          value="-- %" 
          sub="Vs hier" 
          icon={TrendingUp} 
          color="bg-emerald-500"
          delay={0.4}
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Graphique de performance */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-premium relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                <h2 className="text-base font-black tracking-tight flex items-center gap-2 uppercase">
                   <Activity size={18} className="text-primary" /> Courbe de Croissance
                </h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Évolution du CA (7 derniers jours)</p>
              </div>
              <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 <div className="w-2 h-2 rounded-full bg-primary/20" />
              </div>
            </div>
            
            <div className="h-[300px] w-full relative z-10">
               <CustomAreaChart data={chartData} />
            </div>
            
            <div className="absolute -left-10 -bottom-10 opacity-[0.02] group-hover:opacity-[0.05] transition-all">
               <TrendingUp size={240} />
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
             <div className="card-ultra-compact bg-primary/5 border-primary/20 flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => navigate('/caisse')}>
                <div>
                   <p className="text-[9px] font-black text-primary uppercase tracking-widest">Action Rapide</p>
                   <h4 className="font-black text-sm">Ouvrir la Caisse</h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                   <ChevronRight size={16} />
                </div>
             </div>
             <div className="card-ultra-compact bg-orange-500/5 border-orange-500/20 flex items-center justify-between group cursor-pointer hover:bg-orange-500/10 transition-colors" onClick={() => navigate('/procurement')}>
                <div>
                   <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">Optimisation</p>
                   <h4 className="font-black text-sm">Réappro Assistant</h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                   <ChevronRight size={16} />
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <ModuleSyncStatus />
          <SmartAdvisor />
          <SystemHealth />
        </div>
      </div>
    </motion.div>
  )
}
