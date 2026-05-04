import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Lightbulb, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * SmartAdvisor — IA contextuelle premium
 * Génère des conseils personnalisés basés sur les données réelles.
 */
export default function SmartAdvisor() {
  const clients = useStore(state => state.clients)
  const stock = useStore(state => state.stock)
  const daily_cash_register = useStore(state => state.daily_cash_register)
  const bread_logs = useStore(state => state.bread_logs)
  const config = useStore(state => state.config)
  const navigate = useNavigate()

  const advice = useMemo(() => {
    const items = []
    const now = new Date()

    // ── Analyse CA 7j ────────────────────────────────────────────────
    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const ds = d.toLocaleDateString()
      const reg = daily_cash_register.find(r =>
        r?.date && new Date(r.date).toLocaleDateString() === ds && r.closing_balance !== null
      )
      return reg
    }).filter(Boolean)

    if (last7.length >= 3) {
      const sales = last7.map(r => Math.max(0, r.calculated_sales || 0))
      const avgSales = sales.reduce((a,b) => a+b, 0) / sales.length
      const recent2avg = (sales[0] + (sales[1] || 0)) / Math.min(2, sales.length)
      const trend = ((recent2avg - avgSales) / (avgSales || 1)) * 100

      if (trend < -20) {
        items.push({
          type: 'warning',
          icon: TrendingDown,
          title: 'Baisse de CA détectée',
          msg: `Ventes récentes : ${Math.abs(trend).toFixed(0)}% sous la moyenne (${Math.round(avgSales).toLocaleString()} F).`,
          action: 'Voir Prévisions', path: '/previsions'
        })
      } else if (trend > 15) {
        items.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Ventes en hausse !',
          msg: `Performance record : +${trend.toFixed(0)}% au-dessus de la moyenne. Félicitations !`,
          action: null
        })
      }
    }

    // ── Stock critique ───────────────────────────────────────────────
    const criticalStock = stock.filter(s => s.current_stock <= s.alert_threshold && s.alert_threshold > 0)
    if (criticalStock.length > 0) {
      items.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Rupture imminente',
        msg: `${criticalStock.length} produit${criticalStock.length > 1 ? 's' : ''} : ${criticalStock.slice(0, 2).map(s => s.name).join(', ')}...`,
        action: 'Réapprovisionner', path: '/stock'
      })
    }

    // ── Dettes clients élevées ───────────────────────────────────────
    const totalDebt = clients.reduce((a, c) => a + Number(c.total_debt || 0), 0)
    if (totalDebt > 50000) {
      items.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Trésorerie dehors',
        msg: `${totalDebt.toLocaleString()} FCFA à recouvrer. Priorisez les relances clients.`,
        action: 'Relancer', path: '/clients'
      })
    }

    // ── Pain : commande sous-optimale ─────────────────────────────────
    if (bread_logs.length >= 10) {
      const last7bread = bread_logs.slice(-7)
      const received = last7bread.reduce((a, l) => a + (l.received_quantity || 0), 0)
      const sold = last7bread.reduce((a, l) => {
        const price = l.unit_price || 135
        const qtySold = (l.total_to_pay || 0) / (price > 0 ? price : 135)
        return a + Math.max(0, qtySold)
      }, 0)
      const wasteRate = received > 0 ? ((received - sold) / received) * 100 : 0
      if (wasteRate > 20) {
        items.push({
          type: 'info',
          icon: Sparkles,
          title: 'Optimisation Pain',
          msg: `Pertes de ${wasteRate.toFixed(0)}% (${Math.round(received - sold)} miches). Réduisez la commande.`,
          action: 'Ajuster', path: '/procurement'
        })
      }
    }

    if (items.length === 0) {
      items.push({
        type: 'success',
        icon: CheckCircle2,
        title: 'Excellente gestion',
        msg: 'Tout est sous contrôle. Votre boutique est parfaitement optimisée !',
        action: null
      })
    }

    return items.slice(0, 3)
  }, [clients, stock, daily_cash_register, bread_logs, config])

  const styleMap = {
    warning: {
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/[0.03]',
      icon: 'text-orange-500',
      accent: 'bg-orange-500/10'
    },
    success: {
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/[0.03]',
      icon: 'text-emerald-500',
      accent: 'bg-emerald-500/10'
    },
    info: {
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/[0.03]',
      icon: 'text-blue-500',
      accent: 'bg-blue-500/10'
    }
  }

  return (
    <div className="bg-card border border-border rounded-3xl shadow-premium overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Lightbulb size={18} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="font-black text-xs uppercase tracking-tighter">Conseiller Pro Max</h2>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">Intelligence Contextuelle</p>
          </div>
        </div>
        <span className="text-[9px] font-black px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-1.5">
          <Sparkles size={10} className="animate-pulse" /> IA ACTIVE
        </span>
      </div>

      <div className="p-3 space-y-2">
        {advice.map((item, i) => {
          const Icon = item.icon
          const style = styleMap[item.type]
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-[22px] border ${style.border} ${style.bg} relative overflow-hidden group`}
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${style.accent} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={style.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-black uppercase tracking-tight leading-none mb-1.5">{item.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">{item.msg}</p>
                  {item.action && (
                    <button
                      onClick={() => navigate(item.path)}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
                    >
                      {item.action} <ChevronRight size={10} />
                    </button>
                  )}
                </div>
              </div>
              <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
                 <Icon size={80} strokeWidth={3} />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="p-4 bg-muted/10 border-t border-border/30 text-center">
         <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Analyses rafraîchies en temps réel</p>
      </div>
    </div>
  )
}
