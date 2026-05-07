import { useStore } from '../store/useStore'
import { 
  PiggyBank, Wallet, Smartphone, Users, Truck, 
  Landmark, Activity, BarChart3, 
  Diamond, PieChart as PieChartIcon, Package
} from 'lucide-react'
import { motion } from 'framer-motion'
import { CustomPieChart, CustomBarChart } from '../components/ui/Charts'

const formatF = (val) => {
  const num = Number(val) || 0
  return `${Math.round(num).toLocaleString('fr-FR')} F`
}

export default function Treasury() {
  const sales = useStore(state => state.sales)
  const expenses = useStore(state => state.expenses)
  const stock = useStore(state => state.stock)
  const clients = useStore(state => state.clients)
  const finance = useStore(state => state.finance)
  const config = useStore(state => state.config)
  const fournisseurs = useStore(state => state.fournisseurs)

  const saleList = sales || []
  const expenseList = expenses || []
  const stockList = stock || []
  const clientList = clients || []
  const financeState = finance || { cashInRegister: 0, vault_balance: 0 }
  const configState = config || {}
  const fournisseurList = fournisseurs || []

  const cashInRegister = financeState.cashInRegister || 0
  const vault_balance = financeState.vault_balance || 0
  
  const totalFintech = (configState.fintech_providers || []).reduce((acc, p) => acc + (p.balance || 0), 0)
  const totalStockValue = stockList.reduce((acc, item) => acc + (Number(item.current_stock) * Number(item.price_buy)), 0)
  const totalClientDebts = clientList.reduce((acc, c) => acc + (Number(c.total_debt) || 0), 0)
  const totalSupplierDebts = fournisseurList.reduce((acc, f) => acc + (Number(f.total_debt) || 0), 0)

  const totalAssets = cashInRegister + vault_balance + totalFintech + totalStockValue + totalClientDebts
  const totalLiquidAssets = cashInRegister + vault_balance + totalFintech
  const netWorth = totalAssets - totalSupplierDebts

  // ─── Rapport Mensuel P&L IA ────────────────────────────────────
  const now = new Date()
  const currentMonthSales = saleList.filter(s => {
    const d = new Date(s.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && s.status !== 'cancelled'
  })

  const monthlyRevenue = currentMonthSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0)
  
  // Création d'un dictionnaire de produits pour accélération O(1) au lieu de O(N) dans les boucles
  const productMap = useMemo(() => {
    const map = {}
    stockList.forEach(p => { map[p.id] = Number(p.price_buy) || 0 })
    return map
  }, [stockList])

  // COGS : Coût d'achat réel des produits vendus (optimisé avec productMap)
  const monthlyCOGS = useMemo(() => {
    return currentMonthSales.reduce((acc, s) => {
      const saleCost = (s.items || []).reduce((iAcc, item) => {
        const unitCost = productMap[item.productId] || 0
        return iAcc + (item.quantity * unitCost)
      }, 0)
      return acc + saleCost
    }, 0)
  }, [currentMonthSales, productMap])

  const monthlyExpenses = expenseList.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((acc, e) => acc + (Number(e.amount) || 0), 0)

  const grossProfit = monthlyRevenue - monthlyCOGS
  const netProfit = grossProfit - monthlyExpenses
  const marginPercent = monthlyRevenue > 0 ? (grossProfit / monthlyRevenue) * 100 : 0

  // Données Graphiques
  const assetData = [
    { name: 'Espèces', value: Number(cashInRegister) + Number(vault_balance), color: '#3b82f6' },
    { name: 'Fintech', value: Number(totalFintech), color: '#8b5cf6' },
    { name: 'Stock', value: Number(totalStockValue), color: '#10b981' },
    { name: 'Créances', value: Number(totalClientDebts), color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const balanceData = [
    { name: 'Actifs Total', value: Number(totalAssets), color: '#3b82f6' },
    { name: 'Passifs Total', value: Number(totalSupplierDebts), color: '#ef4444' },
    { name: 'Valeur Nette', value: Number(netWorth), color: '#10b981' },
  ]

  const plData = [
    { name: 'Revenu', value: monthlyRevenue, color: '#3b82f6' },
    { name: 'Coût Ventes', value: monthlyCOGS, color: '#94a3b8' },
    { name: 'Charges', value: monthlyExpenses, color: '#ef4444' },
    { name: 'Bénéfice Net', value: netProfit, color: '#10b981' },
  ]

  return (
    <div className="space-y-8 pb-24 px-4 overflow-y-auto max-w-5xl mx-auto">
      {/* Header Premium */}
      <header className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Landmark className="text-primary" size={24} />
            Finance Pro <span className="text-primary/40">v2.0</span>
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Consolidation & Rapports P&L</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
          <Activity size={12} className="text-primary animate-pulse" />
          <span className="text-[9px] font-black uppercase text-primary tracking-tighter">Diagnostic Haute Précision</span>
        </div>
      </header>

      {/* Hero Card : Patrimoine */}
      <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
        <Diamond size={150} className="absolute -top-10 -right-10 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Valeur Nette Entreprise</p>
                <h2 className="text-5xl font-black tracking-tighter">{formatF(netWorth)}</h2>
             </div>
             <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                <p className="text-[9px] font-black uppercase opacity-60 mb-1">Marge Brute (Mois)</p>
                <p className="text-xl font-black">{Math.round(marginPercent)}%</p>
             </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/10">
             <div><p className="text-[9px] font-black uppercase opacity-60 mb-1">Liquidités</p><p className="font-black text-lg">{formatF(totalLiquidAssets)}</p></div>
             <div><p className="text-[9px] font-black uppercase opacity-60 mb-1">Stock (Achat)</p><p className="font-black text-lg">{formatF(totalStockValue)}</p></div>
             <div><p className="text-[9px] font-black uppercase opacity-60 mb-1">Créances</p><p className="font-black text-lg text-emerald-300">{formatF(totalClientDebts)}</p></div>
             <div><p className="text-[9px] font-black uppercase opacity-60 mb-1">Dettes Out</p><p className="font-black text-lg text-red-300">{formatF(totalSupplierDebts)}</p></div>
          </div>
        </div>
      </div>

      {/* Rapport Mensuel P&L */}
      <section className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-premium relative overflow-hidden">
         <div className="flex justify-between items-center mb-10">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
               <BarChart3 size={18} className="text-primary" /> Rapport de Performance (P&L)
            </h2>
            <p className="text-[9px] font-black uppercase text-muted-foreground opacity-50">{now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <div className="p-5 bg-blue-500/5 rounded-3xl border border-blue-500/10">
               <p className="text-[9px] font-black uppercase text-blue-600 mb-1">Revenu Total</p>
               <p className="text-xl font-black">{formatF(monthlyRevenue)}</p>
            </div>
            <div className="p-5 bg-muted/30 rounded-3xl border border-border/50">
               <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Coût d'Achat (COGS)</p>
               <p className="text-xl font-black">{formatF(monthlyCOGS)}</p>
            </div>
            <div className="p-5 bg-red-500/5 rounded-3xl border border-red-500/10">
               <p className="text-[9px] font-black uppercase text-red-600 mb-1">Charges du Mois</p>
               <p className="text-xl font-black">{formatF(monthlyExpenses)}</p>
            </div>
            <div className={`p-5 rounded-3xl border ${netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
               <p className={`text-[9px] font-black uppercase mb-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>Bénéfice Net</p>
               <p className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{formatF(netProfit)}</p>
            </div>
         </div>

         <div className="h-[250px] w-full">
            <CustomBarChart data={plData} height={200} />
         </div>
      </section>

      {/* Graphiques Patrimoine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
            <PieChartIcon size={18} className="text-primary" /> Composition du Patrimoine
          </h3>
          <div className="h-[280px]">
            <CustomPieChart data={assetData} size={200} />
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
            <Users size={18} className="text-primary" /> Bilan Actifs / Dettes
          </h3>
          <div className="h-[280px] flex items-center justify-center">
            <CustomBarChart data={balanceData} height={200} />
          </div>
        </div>
      </div>

      {/* Postes de Trésorerie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {[
           { label: 'Caisse de Jour', val: cashInRegister, icon: Wallet, color: 'blue' },
           { label: 'Coffre-Fort', val: vault_balance, icon: PiggyBank, color: 'emerald' },
           { label: 'Mobile Money', val: totalFintech, icon: Smartphone, color: 'indigo' },
           { label: 'Valeur Stock', val: totalStockValue, icon: Package, color: 'cyan' },
           { label: 'Créances Clients', val: totalClientDebts, icon: Users, color: 'orange' },
           { label: 'Dettes Fournisseurs', val: totalSupplierDebts, icon: Truck, color: 'red' },
         ].map((row, i) => (
           <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i} 
            className="bg-card border border-border/50 p-5 rounded-3xl flex items-center gap-4 hover:border-primary/30 transition-all group"
           >
              <div className={clsx(
                "p-3 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform",
                row.color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                row.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                row.color === 'indigo' ? "bg-indigo-500/10 text-indigo-500" :
                row.color === 'cyan' ? "bg-cyan-500/10 text-cyan-500" :
                row.color === 'orange' ? "bg-orange-500/10 text-orange-500" : "bg-red-500/10 text-red-500"
              )}>
                <row.icon size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{row.label}</p>
                <p className="text-lg font-black">{formatF(row.val)}</p>
              </div>
           </motion.div>
         ))}
      </div>

      {/* Diagnostic IA */}
      <div className="p-8 bg-primary/5 border border-primary/10 rounded-[2.5rem] flex items-center gap-6 relative overflow-hidden group">
         <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20 transition-transform group-hover:rotate-12">
            <Activity size={32} />
         </div>
         <div className="space-y-1">
            <p className="text-xs font-black text-primary uppercase tracking-widest">Diagnostic IA de Santé Financière</p>
            <p className="text-[11px] font-bold text-primary/70 leading-relaxed max-w-2xl">
               {netProfit > 0 ? 
                 `Performance Exceptionnelle : Votre marge brute est de ${Math.round(marginPercent)}%. Vous avez généré ${formatF(netProfit)} de profit net ce mois-ci. Continuez à optimiser vos charges pour maximiser ce résultat.` : 
                 "Alerte Rentabilité : Vos charges et coûts d'achat dépassent vos revenus. Un audit des dépenses non essentielles est recommandé pour redresser la marge nette."}
            </p>
         </div>
         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Landmark size={100} />
         </div>
      </div>
    </div>
  )
}

function clsx(...classes) {
  return classes.filter(Boolean).join(' ')
}
