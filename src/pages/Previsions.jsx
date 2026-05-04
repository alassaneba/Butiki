import React, { useMemo, useState, memo } from 'react'
import { useStore } from '../store/useStore'
import { shallow } from 'zustand/shallow'
import { 
  TrendingUp, Croissant, Share2, 
  AlertTriangle, Flame, ArrowRight,
  TrendingDown, Zap, Target, DollarSign, Sparkles,
  PieChart as PieIcon, BarChart3 as BarIcon,
  CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CustomAreaChart, CustomPieChart, CustomBarChart } from '../components/ui/Charts'

const formatF = (v) => `${Number(v || 0).toLocaleString('fr-FR')} F`

const KPIPro = memo(({ title, value, sub, icon: Icon, color, trend, trendValue, delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }}
      className="bg-card border border-border/50 p-6 rounded-[32px] shadow-premium hover:shadow-xl transition-all relative overflow-hidden group"
    >
      <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 group-hover:rotate-0 transition-transform duration-500">
        <Icon size={120} strokeWidth={3} />
      </div>
      
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2.5">{title}</p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
          {trend && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {trend === 'up' ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {trendValue}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
           <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
           <p className="text-xs text-muted-foreground font-bold">{sub}</p>
        </div>
      </div>
    </motion.div>
  )
})

export default function Previsions() {
  const bread_logs = useStore(state => state.bread_logs)
  const suppliers = useStore(state => state.suppliers)
  const daily_cash_register = useStore(state => state.daily_cash_register)
  const expenses = useStore(state => state.expenses)
  const clients = useStore(state => state.clients)
  const stock = useStore(state => state.stock)
  const stock_logs = useStore(state => state.stock_logs)
  const gas_logs = useStore(state => state.gas_logs)
  const sales = useStore(state => state.sales)
  const audit_log = useStore(state => state.audit_log)

  const breadList = bread_logs || []
  const supplierList = suppliers || []
  const registerList = daily_cash_register || []
  const expenseList = expenses || []
  const clientList = clients || []
  const stockList = stock || []
  const stockLogList = stock_logs || []
  const gasLogList = gas_logs || []
  const saleList = sales || []
  const auditLogList = audit_log || []

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const currentDay = now.getDate()
  const remainingDays = daysInMonth - currentDay

  // --- IA 2.0 : Évènements Prédictifs ---
  const isEndMonth = currentDay >= 25 || currentDay <= 5 // Période de paie
  const upcomingEvents = useMemo(() => {
    const events = []
    if (isEndMonth) events.push({ name: 'Période de Paie', impact: '+25% CA attendu', type: 'positive' })
    if (now.getDay() === 0 || now.getDay() === 6) events.push({ name: 'Week-end', impact: 'Volume stable', type: 'neutral' })
    return events
  }, [isEndMonth, now])

  const monthRegisters = useMemo(() => {
    return registerList.filter(r => {
      const d = new Date(r.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && r.closing_balance !== null
    })
  }, [registerList, now])

  const monthCA = monthRegisters.reduce((acc, r) => acc + Math.max(0, r.calculated_sales || 0), 0)
  const avgDailyCA = monthRegisters.length > 0 ? monthCA / monthRegisters.length : 0
  
  // IA 2.0 : Projection Pondérée par les évènements
  const projectedCA = useMemo(() => {
    let base = monthCA
    for (let i = 1; i <= remainingDays; i++) {
      const targetDate = new Date(now); targetDate.setDate(now.getDate() + i)
      const isPayDay = targetDate.getDate() >= 25 || targetDate.getDate() <= 5
      const factor = isPayDay ? 1.25 : 1.0
      base += avgDailyCA * factor
    }
    return base
  }, [monthCA, avgDailyCA, remainingDays, now])

  // --- IA 2.0 : Détection d'Anomalies ---
  const anomalies = useMemo(() => {
    const list = []
    
    // 1. Annulations suspectes
    const recentSales = saleList.filter(s => {
      const d = new Date(s.date); return (now - d) / (1000 * 60 * 60 * 24) <= 7
    })
    const cancelled = recentSales.filter(s => s.status === 'cancelled')
    if (cancelled.length > 3) {
      list.push({ 
        title: 'Taux d\'annulation élevé', 
        details: `${cancelled.length} ventes annulées cette semaine`,
        severity: 'high',
        icon: AlertTriangle
      })
    }

    // 2. Écarts de caisse récurrents
    const recentRegisters = monthRegisters.slice(-5)
    const hasGaps = recentRegisters.some(r => {
      const fintechGaps = Object.values(r.fintech_discrepancies || {}).some(v => Math.abs(v) > 500)
      return fintechGaps
    })
    if (hasGaps) {
      list.push({ 
        title: 'Écarts Fintech détectés', 
        details: 'Divergences entre soldes réels et théoriques (Wave/Orange)',
        severity: 'medium',
        icon: Zap
      })
    }

    // 3. Activité hors horaires
    const nightActions = auditLogList.filter(log => {
      const h = new Date(log.date).getHours()
      return (h >= 22 || h <= 6) && log.action !== 'Cloud Sync'
    }).slice(0, 3)
    if (nightActions.length > 0) {
      list.push({
        title: 'Activité nocturne',
        details: `${nightActions.length} actions enregistrées entre 22h et 06h`,
        severity: 'low',
        icon: Flame
      })
    }

    return list
  }, [saleList, monthRegisters, auditLogList, now])

  const stockPredictions = useMemo(() => {
    const cutoff7 = new Date(now); cutoff7.setDate(cutoff7.getDate() - 7)
    return stockList.map(item => {
      const logs = stockLogList.filter(l => l.productId === item.id && l.type === 'sortie' && new Date(l.date) >= cutoff7)
      const totalOut = logs.reduce((acc, l) => acc + l.quantity, 0)
      const dailyAvg = totalOut / 7
      const daysLeft = dailyAvg > 0 ? Math.floor(item.current_stock / dailyAvg) : Infinity
      
      const neededFor15d = Math.ceil(dailyAvg * 15)
      const orderSuggestion = Math.max(0, neededFor15d - item.current_stock)

      return { ...item, dailyAvg, daysLeft, orderSuggestion }
    }).filter(p => p.daysLeft !== Infinity && p.daysLeft < 15).sort((a, b) => a.daysLeft - b.daysLeft)
  }, [stockList, stockLogList, now])

  const gasAnalysis = useMemo(() => {
    const logs = gasLogList.filter(l => l.type === 'recharge').slice(-5)
    if (logs.length < 2) return null
    let intervals = []
    for(let i = 1; i < logs.length; i++) {
       const diff = new Date(logs[i].date) - new Date(logs[i-1].date)
       intervals.push(diff / (1000 * 60 * 60 * 24))
    }
    return { avgInterval: Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) }
  }, [gasLogList])

  const breadSuggestions = useMemo(() => {
    const cutoff30 = new Date(now); cutoff30.setDate(cutoff30.getDate() - 30)
    const recentLogs = breadList.filter(l => new Date(l.date) >= cutoff30)
    return (supplierList || []).filter(s => s.category === 'pain' || !s.category).map(supplier => {
      const logs = recentLogs.filter(l => l.supplier_id === supplier.id)
      if (logs.length === 0) return null
      const daily = logs.map(l => l.received_quantity || 0)
      const avg = daily.reduce((a, b) => a + b, 0) / daily.length
      const recent5 = daily.slice(-5)
      const avgRecent = recent5.reduce((a, b) => a + b, 0) / (recent5.length || 1)
      const trend = avgRecent > avg ? 1 : avgRecent < avg ? -1 : 0
      
      // IA 2.0 : Boost week-end et paie
      const isSpecial = isEndMonth || now.getDay() === 0 || now.getDay() === 6
      const multiplier = isSpecial ? 1.15 : 1.05

      return { name: supplier.name, avg: Math.round(avg), suggestion: Math.ceil(avg * (trend === 1 ? multiplier : 1)), trend }
    }).filter(Boolean)
  }, [breadList, supplierList, now, isEndMonth])

  const last15Data = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (14 - i)); 
      const dateStr = d.toLocaleDateString()
      const reg = registerList.find(r => new Date(r.date).toLocaleDateString() === dateStr)
      return { 
        name: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), 
        ca: reg?.calculated_sales ? Math.max(0, reg.calculated_sales) : 0,
        fullDate: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      }
    })
  }, [registerList, now])

  const globalDebts = (clientList || []).reduce((acc, c) => acc + Number(c.total_debt || 0), 0)
  const monthExpTotal = expenseList.filter(e => {
    const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((acc, e) => acc + Number(e.amount), 0)
  const monthMarge = monthCA - monthExpTotal

  // Analyses Additionnelles
  const categoryPerformance = useMemo(() => {
    const data = {}
    saleList.forEach(sale => {
      (sale.items || []).forEach(item => {
        const cat = item.category || 'Général'
        data[cat] = (data[cat] || 0) + (item.price * item.quantity)
      })
    })
    const entries = Object.entries(data)
    if (entries.length === 0) return []
    return entries
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [saleList])

  const paymentMethods = useMemo(() => {
    const data = {
      'Espèces': 0,
      'Wave': 0,
      'Orange': 0
    }
    saleList.forEach(sale => {
      const method = sale.paymentMethod === 'wave' ? 'Wave' : sale.paymentMethod === 'orange' ? 'Orange' : 'Espèces'
      data[method] += (sale.totalAmount || 0)
    })
    return Object.entries(data).map(([name, value]) => ({ 
      name, 
      value, 
      color: name === 'Wave' ? '#3b82f6' : name === 'Orange' ? '#f97316' : '#10b981'
    })).filter(d => d.value > 0)
  }, [saleList])

  const generateWAReport = () => {
    const text = `🌟 *Bilan IA 2.0 Butiki* 🌟\n📅 _${now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}_\n\n💰 *PRÉVISIONS*\n• CA Actuel : *${formatF(monthCA)}*\n• Projection IA (Pondérée) : *${formatF(projectedCA)}*\n\n🚨 *ANOMALIES*\n${anomalies.map(a => `• ${a.title}`).join('\n') || 'Aucune anomalie détectée'}\n\n📦 *LOGISTIQUE*\n${stockPredictions.slice(0, 3).map(p => `• ${p.name} : Commander ${p.orderSuggestion} unités`).join('\n')}\n\n_Généré par Butiki Intelligence 2.0_ 🚀`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic flex items-center gap-4">
             Intelligence <span className="text-primary opacity-50">2.0</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-[10px] font-black uppercase tracking-[0.3em]">IA Prédictive & Détection d'Anomalies</p>
        </div>
        <div className="flex gap-3">
          {upcomingEvents.map((e, i) => (
            <div key={i} className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase flex items-center gap-2 ${e.type === 'positive' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-muted border-border text-muted-foreground'}`}>
               <Sparkles size={12} /> {e.name} ({e.impact})
            </div>
          ))}
          <button 
            onClick={generateWAReport} 
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[20px] font-black text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 uppercase tracking-widest"
          >
            <Share2 size={16} /> Bilan IA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPIPro title="Chiffre d'Affaires" value={formatF(monthCA)} sub={`${monthRegisters.length} clôtures effectuées`} icon={DollarSign} color="bg-blue-500" delay={0.1} />
        <KPIPro title="Projection IA" value={formatF(projectedCA)} sub="Basé sur cycle de paie & historique" icon={Sparkles} color="bg-primary" trend="up" trendValue="Pondérée" delay={0.2} />
        <KPIPro title="Indice de Risque" value={anomalies.length > 0 ? `${anomalies.length} Alertes` : 'Sain'} sub="Audit & Détection anomalies" icon={AlertTriangle} color={anomalies.length > 0 ? 'bg-destructive' : 'bg-emerald-500'} delay={0.3} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Anomalies & Audit IA */}
        <div className="lg:col-span-1 bg-card border border-border/50 p-6 rounded-[32px] shadow-premium flex flex-col">
          <h2 className="text-base font-black tracking-tight mb-8 flex items-center gap-3 uppercase">
            <AlertTriangle size={18} className="text-destructive" /> Détection Anomalies
          </h2>
          <div className="space-y-4 flex-1">
            {anomalies.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <CheckCircle2 size={40} className="text-emerald-500 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Aucune anomalie détectée</p>
                <p className="text-[9px] font-bold mt-1">Système sous contrôle</p>
              </div>
            ) : (
              anomalies.map((a, i) => (
                <div key={i} className={`p-4 rounded-[22px] border flex gap-4 ${a.severity === 'high' ? 'bg-destructive/5 border-destructive/10' : 'bg-muted/30 border-border/50'}`}>
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      <a.icon size={20} />
                   </div>
                   <div className="min-w-0">
                      <p className="font-black text-xs uppercase tracking-tight truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{a.details}</p>
                   </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-border/50">
             <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40 italic">L'IA analyse les 7 derniers jours d'activité</p>
          </div>
        </div>

        {/* Graphique de Stabilité */}
        <div className="lg:col-span-2 bg-card border border-border/50 p-6 rounded-[32px] shadow-premium relative overflow-hidden group">
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h2 className="text-base font-black tracking-tight flex items-center gap-3 uppercase">
              <Zap size={18} className="text-yellow-500" /> Stabilité & Cycles IA
            </h2>
          </div>
          <div className="h-[340px] relative z-10">
            <CustomAreaChart data={last15Data} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Proactive Order Suggestions */}
        <div className="bg-card border border-border/50 p-6 rounded-[32px] shadow-premium">
          <h2 className="text-base font-black tracking-tight mb-8 flex items-center gap-3 uppercase">
            <Target size={18} className="text-primary" /> Suggestions de Commande IA
          </h2>
          <div className="space-y-4">
            {stockPredictions.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-[24px] border border-dashed border-border/50">
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-40">Stock optimal</p>
              </div>
            ) : (
              stockPredictions.slice(0, 4).map((item, i) => (
                <div key={item.id} className="p-4 rounded-[22px] bg-muted/30 border border-border/50 flex justify-between items-center group">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate uppercase tracking-tight">{item.name}</p>
                    <p className="text-[9px] text-muted-foreground font-black uppercase mt-1">S'épuise dans <span className="text-destructive">{item.daysLeft} jours</span></p>
                  </div>
                  <div className="text-right ml-4 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-[8px] font-black text-primary uppercase mb-1">Commander</p>
                    <p className="text-xl font-black text-primary">{item.orderSuggestion}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mix de Paiement */}
        <div className="bg-card border border-border/50 p-6 rounded-[32px] shadow-premium">
          <h2 className="text-base font-black tracking-tight mb-8 flex items-center gap-3 uppercase">
            <PieIcon size={18} className="text-emerald-500" /> Mix de Paiement (IA Insight)
          </h2>
          <div className="h-[250px]">
            {paymentMethods.length > 0 ? (
              <CustomPieChart data={paymentMethods} />
            ) : (
              <div className="h-full flex items-center justify-center text-[10px] font-black uppercase text-muted-foreground opacity-20 italic">Aucune donnée de paiement</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border/50 p-6 rounded-[32px] shadow-premium relative overflow-hidden group">
          <h2 className="text-base font-black tracking-tight mb-8 flex items-center gap-3 uppercase">
            <Croissant size={18} className="text-amber-500" /> Optimisation Boulangerie
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {(breadSuggestions || []).map((s, i) => (
              <div key={i} className="p-5 rounded-[24px] bg-amber-500/[0.03] border border-amber-500/10 hover:bg-amber-500/[0.06] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <p className="font-black text-[13px] truncate uppercase tracking-tight">{s.name}</p>
                  {s.trend === 1 ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-destructive" />}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Cible IA</span>
                    <span className="text-3xl font-black tracking-tighter text-amber-600">{s.suggestion}</span>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground/20" />
                  <div className="text-right">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Moyenne</span>
                    <span className="text-lg font-bold opacity-30">{s.avg}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute -right-6 -bottom-6 opacity-[0.02] group-hover:opacity-[0.05] transition-all rotate-12">
             <Croissant size={160} />
          </div>
        </div>

        <div className="bg-card border border-border/50 p-6 rounded-[32px] shadow-premium">
          <h2 className="text-base font-black tracking-tight mb-8 flex items-center gap-3 uppercase">
            <Flame size={18} className="text-blue-500" /> Cycle Logistique Gaz
          </h2>
          <div className="space-y-6">
            {gasAnalysis ? (
              <div className="p-5 rounded-[24px] bg-blue-500/5 border border-blue-500/10 flex items-center gap-5">
                <div className="w-14 h-14 rounded-[20px] bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                  <Flame size={28} />
                </div>
                <div>
                  <p className="font-black text-sm uppercase tracking-tight">Fréquence de Réappro</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
                    Vos bouteilles se vident en moyenne tous les <span className="font-black text-blue-500 text-base">{gasAnalysis.avgInterval} jours</span>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground italic border border-dashed border-border/50 rounded-[24px] opacity-40">
                Données insuffisantes
              </div>
            )}
            
            <div className="grid sm:grid-cols-2 gap-4">
               <div className={`p-5 rounded-[24px] border transition-all ${monthMarge >= 0 ? 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/[0.08]' : 'bg-destructive/5 border-destructive/10 hover:bg-destructive/[0.08]'}`}>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2">Santé des Marges</p>
                  <div className="flex items-center gap-2">
                     <Sparkles size={14} className={monthMarge >= 0 ? 'text-emerald-500' : 'text-destructive'} />
                     <p className={`font-black text-sm uppercase tracking-tight ${monthMarge >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        {monthMarge >= 0 ? 'Performance Stable' : 'Point de vigilance'}
                     </p>
                  </div>
               </div>
               <div className="p-5 rounded-[24px] bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2">Assiduité Clôture</p>
                  <p className="font-black text-sm uppercase tracking-tight text-foreground">
                    {Math.round(((monthRegisters?.length || 0) / (currentDay || 1)) * 100)}% de rigueur
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
