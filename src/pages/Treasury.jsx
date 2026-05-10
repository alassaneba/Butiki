import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { 
  PiggyBank, Wallet, Smartphone, Users, Truck, 
  Landmark, Activity, BarChart3, 
  Diamond, PieChart as PieChartIcon, Package
} from 'lucide-react'
import { motion } from 'framer-motion'
import { CustomPieChart, CustomBarChart } from '../components/ui/Charts'
import * as XLSX from 'xlsx'

const formatF = (val) => {
  const num = Number(val) || 0
  return `${Math.round(num).toLocaleString('fr-FR')} F`
}

export default function Treasury() {
  const [isConsolidated, setIsConsolidated] = useState(false)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allSales = useStore(state => state.sales) || []
  const allExpenses = useStore(state => state.expenses) || []
  const allStock = useStore(state => state.stock) || []
  const allClients = useStore(state => state.clients) || []
  const allFournisseurs = useStore(state => state.fournisseurs) || []
  const vault_balances = useStore(state => state.vault_balances) || {}
  const fintech_balances = useStore(state => state.fintech_balances) || {}
  
  const saleList = useMemo(() => isConsolidated ? allSales : allSales.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allSales, activeBoutiqueId, isConsolidated])
  const expenseList = useMemo(() => isConsolidated ? allExpenses : allExpenses.filter(e => (e.boutiqueId || 'b1') === activeBoutiqueId), [allExpenses, activeBoutiqueId, isConsolidated])
  const stockList = useMemo(() => isConsolidated ? allStock : allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId, isConsolidated])
  const clientList = useMemo(() => isConsolidated ? allClients : allClients.filter(c => (c.boutiqueId || 'b1') === activeBoutiqueId), [allClients, activeBoutiqueId, isConsolidated])
  const fournisseurList = useMemo(() => isConsolidated ? allFournisseurs : allFournisseurs.filter(f => (f.boutiqueId || 'b1') === activeBoutiqueId), [allFournisseurs, activeBoutiqueId, isConsolidated])

  const vault_balance = useMemo(() => {
    if (isConsolidated) return Object.values(vault_balances).reduce((acc, v) => acc + (v || 0), 0)
    return vault_balances[activeBoutiqueId] || 0
  }, [vault_balances, activeBoutiqueId, isConsolidated])

  const totalFintech = useMemo(() => {
    if (isConsolidated) {
      return Object.values(fintech_balances).reduce((acc, b) => acc + (b.wave || 0) + (b.orange || 0), 0)
    }
    const currentFintech = fintech_balances[activeBoutiqueId] || { wave: 0, orange: 0 }
    return (currentFintech.wave || 0) + (currentFintech.orange || 0)
  }, [fintech_balances, activeBoutiqueId, isConsolidated])
  
  // Note: cashInRegister logic depends on daily_cash_register which is filtered in other components
  // For Treasury, we might want to sum current active registers if any, but usually it's vault + fintech + assets
  const daily_cash_register = useStore(state => state.daily_cash_register) || []
  const cashInRegister = useMemo(() => {
    if (isConsolidated) {
       return daily_cash_register
         .filter(r => r.closing_balance === null)
         .reduce((acc, r) => acc + (r.opening_balance + (r.calculated_sales || 0)), 0)
    }
    const activeReg = daily_cash_register.find(r => (r.boutiqueId || 'b1') === activeBoutiqueId && r.closing_balance === null)
    return activeReg ? (activeReg.opening_balance + (activeReg.calculated_sales || 0)) : 0
  }, [daily_cash_register, activeBoutiqueId, isConsolidated])

  const totalStockValue = useMemo(() => stockList.reduce((acc, item) => acc + (Number(item.current_stock) * Number(item.price_buy)), 0), [stockList])
  const totalClientDebts = useMemo(() => clientList.reduce((acc, c) => acc + (Number(c.total_debt) || 0), 0), [clientList])
  const totalSupplierDebts = useMemo(() => fournisseurList.reduce((acc, f) => acc + (Number(f.total_debt) || 0), 0), [fournisseurList])

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

  const boutiques = useStore(state => state.boutiques) || []
  const boutiqueStats = useMemo(() => {
    if (!isConsolidated) return []
    return boutiques.map(b => {
      const bSales = allSales.filter(s => (s.boutiqueId || 'b1') === b.id && s.status !== 'cancelled')
      const bExpenses = allExpenses.filter(e => (e.boutiqueId || 'b1') === b.id)
      const bStock = allStock.filter(s => (s.boutiqueId || 'b1') === b.id)
      
      const revenue = bSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0)
      const expenses = bExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0)
      const stockValue = bStock.reduce((acc, s) => acc + (Number(s.current_stock) * Number(s.price_buy)), 0)
      
      const cogs = bSales.reduce((acc, s) => {
        const saleCost = (s.items || []).reduce((iAcc, item) => {
          const product = bStock.find(p => p.id === item.productId)
          return iAcc + (item.quantity * (product?.price_buy || 0))
        }, 0)
        return acc + saleCost
      }, 0)

      const gross = revenue - cogs
      const net = gross - expenses

      return {
        id: b.id,
        name: b.name,
        color: b.color || 'blue',
        revenue,
        expenses,
        net,
        stockValue,
        margin: revenue > 0 ? (gross / revenue) * 100 : 0
      }
    })
  }, [isConsolidated, boutiques, allSales, allExpenses, allStock])

  const exportTreasuryReport = () => {
    const wb = XLSX.utils.book_new()
    
    // Résumé Global
    const globalData = [
      { 'Poste financier': 'Liquidités Totales', 'Montant (F)': totalLiquidAssets },
      { 'Poste financier': 'Valeur du Stock', 'Montant (F)': totalStockValue },
      { 'Poste financier': 'Créances Clients', 'Montant (F)': totalClientDebts },
      { 'Poste financier': 'Dettes Fournisseurs', 'Montant (F)': -totalSupplierDebts },
      { 'Poste financier': 'VALEUR NETTE', 'Montant (F)': netWorth },
    ]
    const wsGlobal = XLSX.utils.json_to_sheet(globalData)
    XLSX.utils.book_append_sheet(wb, wsGlobal, "Résumé_Patrimoine")

    // Détail P&L
    const plSheetData = [
      { 'Indicateur': `Revenu Mensuel (${now.toLocaleDateString('fr-FR', { month: 'long' })})`, 'Valeur': monthlyRevenue },
      { 'Indicateur': 'Coût des Ventes (COGS)', 'Valeur': -monthlyCOGS },
      { 'Indicateur': 'Charges Mensuelles', 'Valeur': -monthlyExpenses },
      { 'Indicateur': 'BÉNÉFICE NET', 'Valeur': netProfit }
    ]
    const wsPL = XLSX.utils.json_to_sheet(plSheetData)
    XLSX.utils.book_append_sheet(wb, wsPL, "Performance_PL")

    // Breakdown par boutique si consolidé
    if (isConsolidated) {
      const wsBoutiques = XLSX.utils.json_to_sheet(boutiqueStats.map(b => ({
        'Boutique': b.name,
        'Chiffre d\'Affaires': b.revenue,
        'Dépenses': b.expenses,
        'Bénéfice Net': b.net,
        'Valeur Stock': b.stockValue,
        'Marge (%)': Math.round(b.margin)
      })))
      XLSX.utils.book_append_sheet(wb, wsBoutiques, "Détail_Par_Boutique")
    }

    XLSX.writeFile(wb, `Rapport_Tresorerie_Butik_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`)
  }

  return (
    <div className="space-y-8 pb-24 px-4 overflow-y-auto max-w-5xl mx-auto">
      {/* Header Premium */}
      <header className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Landmark className="text-primary" size={24} />
            Finance Pro <span className="text-primary/40">v2.0</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <Activity size={12} className="text-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase text-primary tracking-tighter">Diagnostic Haute Précision</span>
          </div>
          
          {/* Toggle Consolidation */}
          <div 
            onClick={() => setIsConsolidated(!isConsolidated)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${isConsolidated ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-card border-border text-muted-foreground hover:border-primary/50'}`}
          >
            <BarChart3 size={12} className={isConsolidated ? 'text-white' : 'text-primary'} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Mode Consolidé</span>
          </div>
          <button onClick={exportTreasuryReport} className="hidden sm:flex bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest items-center gap-1 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 ml-2 border border-emerald-500/20">
            Excel
          </button>
        </div>
      </header>

      {/* Hero Card : Patrimoine */}
      <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
        <Diamond size={150} className="absolute -top-10 -right-10 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{isConsolidated ? 'Patrimoine Net Global' : 'Valeur Nette Boutique'}</p>
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

      {/* Performance par Boutique (Mode Consolidé uniquement) */}
      {isConsolidated && (
        <section className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-premium overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <Store size={18} className="text-primary" /> Performance par Boutique
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="pb-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest">Boutique</th>
                  <th className="pb-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest text-right">CA Total</th>
                  <th className="pb-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest text-right">Charges</th>
                  <th className="pb-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest text-right">Marge</th>
                  <th className="pb-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest text-right">Bénéfice Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {boutiqueStats.map((b) => (
                  <tr key={b.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-8 rounded-full bg-${b.color}-500`} />
                        <span className="font-black text-xs uppercase tracking-tighter">{b.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-black text-xs">{formatF(b.revenue)}</td>
                    <td className="py-4 text-right font-black text-xs text-red-500">{formatF(b.expenses)}</td>
                    <td className="py-4 text-right font-black text-xs text-primary">{Math.round(b.margin)}%</td>
                    <td className={`py-4 text-right font-black text-xs ${b.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatF(b.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
