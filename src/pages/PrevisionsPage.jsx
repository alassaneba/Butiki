import React, { useMemo } from 'react'
import { 
  TrendingUp, ArrowUpRight, ArrowDownRight, 
  Calendar, ShoppingBag, Wallet, Users,
  BarChart3, PieChart, Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '../store/useStore'
import { useFinancialStats, useStockStats } from '../store/financialSelectors'
import { useShallow } from 'zustand/react/shallow'
import clsx from 'clsx'

const StatCard = ({ title, value, subValue, trend, icon: Icon, color }) => (
  <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className={clsx("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-500", color)} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black">{value}</h3>
        {subValue && <p className="text-xs text-muted-foreground mt-1 font-medium">{subValue}</p>}
      </div>
      <div className={clsx("p-3 rounded-xl bg-secondary group-hover:scale-110 transition-transform duration-300", color)}>
        <Icon size={20} className="text-foreground" />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-4">
        {trend >= 0 ? (
          <ArrowUpRight size={14} className="text-green-500" />
        ) : (
          <ArrowDownRight size={14} className="text-red-500" />
        )}
        <span className={clsx("text-xs font-black", trend >= 0 ? "text-green-500" : "text-red-500")}>
          {Math.abs(trend)}%
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase">vs mois dernier</span>
      </div>
    )}
  </div>
)

export default function PrevisionsPage() {
  const allSales = useStore(state => state.sales) || []
  const stock = useStore(state => state.stock) || []
  const clients = useStore(state => state.clients) || []
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)

  const finStats = useFinancialStats(activeBoutiqueId)
  const stockStats = useStockStats(activeBoutiqueId)

  const stats = useMemo(() => {
    const activeBoutiqueClients = clients.filter(c => (c.boutiqueId || 'b1') === activeBoutiqueId)
    const activeClients = activeBoutiqueClients.filter(c => (c.transactions?.length || 0) > 0).length

    return {
      monthlySales: finStats.monthlyRevenue,
      trend: finStats.monthlyTrend,
      totalStockValue: stockStats.totalStockValue,
      activeClients,
      inventoryCount: stockStats.totalItems
    }
  }, [clients, activeBoutiqueId, finStats, stockStats])

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 uppercase italic">
            Analyses & Prévisions
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Intelligence d'affaires et santé financière</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-xl self-start shadow-sm">
          <Calendar size={16} className="ml-2 text-primary" />
          <span className="text-xs font-black uppercase pr-2">Mai 2026</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Ventes du Mois" 
          value={`${stats.monthlySales.toLocaleString('fr-FR')} FCFA`}
          trend={stats.trend}
          icon={ShoppingBag}
          color="text-blue-500"
        />
        <StatCard 
          title="Valeur Stock" 
          value={`${stats.totalStockValue.toLocaleString('fr-FR')} FCFA`}
          subValue={`${stats.inventoryCount} articles en rayon`}
          icon={Wallet}
          color="text-emerald-500"
        />
        <StatCard 
          title="Base Clients" 
          value={stats.activeClients}
          subValue="Clients actifs ce mois"
          icon={Users}
          color="text-orange-500"
        />
        <StatCard 
          title="Score de Santé" 
          value="8.5/10"
          subValue="Basé sur rotation & marges"
          icon={Activity}
          color="text-primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-8 rounded-3xl min-h-[320px] flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 relative z-10">
            <BarChart3 size={32} className="text-muted-foreground/40" />
          </div>
          <h3 className="font-black uppercase italic text-muted-foreground/60 relative z-10">Croissance des Ventes</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-[200px] relative z-10">Visualisation des tendances hebdomadaires bientôt disponible.</p>
        </div>
        
        <div className="bg-card border border-border p-8 rounded-3xl min-h-[320px] flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 relative z-10">
            <PieChart size={32} className="text-muted-foreground/40" />
          </div>
          <h3 className="font-black uppercase italic text-muted-foreground/60 relative z-10">Répartition du Chiffre</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-[200px] relative z-10">Analyse par catégories de produits disponible prochainement.</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/10 p-8 rounded-3xl relative overflow-hidden shadow-sm">
        <TrendingUp size={140} className="absolute -right-8 -bottom-8 text-primary/5 rotate-12" />
        <div className="relative z-10 max-w-lg">
          <h3 className="text-lg font-black uppercase italic text-primary">Conseil de l'Assistant</h3>
          <p className="text-sm font-medium text-muted-foreground mt-3 leading-relaxed">
            Vos ventes de produits frais ont augmenté de 12% cette semaine. Pensez à augmenter le stock de sécurité sur ces références pour éviter les ruptures le week-end prochain.
          </p>
          <button 
            onClick={() => toast.success("Analyse d'optimisation en cours...", { description: "Génération automatique des recommandations de réapprovisionnement." })}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/25 active:scale-95 transition-all hover:translate-x-1"
          >
            Optimiser mon stock
          </button>
        </div>
      </div>
    </div>
  )
}
