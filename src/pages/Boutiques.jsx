import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { 
  Store, Plus, MapPin, Phone, 
  TrendingUp, Package, Users, Wallet,
  ChevronRight, Building2, Globe, LayoutDashboard,
  ArrowLeftRight, ArrowRightLeft, CheckCircle2,
  Activity, History, AlertTriangle, Search as SearchIcon, LayoutGrid, List
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription } from '../components/ui/responsive-dialog'
import TransferStockModal from '../components/stock/TransferStockModal'
import { CustomBarChart } from '../components/ui/Charts'

const formatF = (val) => `${Math.round(val || 0).toLocaleString()} F`

export default function Boutiques() {
  const boutiques = useStore(state => state.boutiques) || []
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const switchBoutique = useStore(state => state.switchBoutique)
  const addBoutique = useStore(state => state.addBoutique)
  
  const boutiqueList = boutiques || []
  
  // Data for aggregation
  const sales = useStore(state => state.sales) || []
  const stock = useStore(state => state.stock) || []
  const clients = useStore(state => state.clients) || []
  const registers = useStore(state => state.daily_cash_register) || []
  const users = useStore(state => state.users) || []

  const todayStr = new Date().toLocaleDateString('fr-FR')
  
  // Stats par boutique pour affichage sur les cartes
  const boutiquePerformance = useMemo(() => {
    return boutiqueList.reduce((acc, b) => {
      const bSales = sales.filter(s => (s.boutiqueId || 'b1') === b.id)
      const todaySales = bSales
        .filter(s => new Date(s.date).toLocaleDateString('fr-FR') === todayStr)
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      
      const bStock = stock.filter(i => (i.boutiqueId || 'b1') === b.id)
      const lowStockCount = bStock.filter(i => i.current_stock <= (i.alert_threshold || 10)).length
      
      const openSession = registers.find(r => 
        (r.boutiqueId || 'b1') === b.id && 
        new Date(r.date).toLocaleDateString('fr-FR') === todayStr && 
        !r.closing_balance
      )

      const manager = openSession ? users.find(u => u.id === openSession.userId)?.name : null

      acc[b.id] = { todaySales, lowStockCount, openSession, manager }
      return acc
    }, {})
  }, [boutiqueList, sales, stock, registers, users, todayStr])

  const globalStats = useMemo(() => ({
    totalSales: sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0),
    totalStockValue: stock.reduce((acc, i) => acc + (i.current_stock * i.price_buy), 0),
    totalClients: clients.length,
    boutiqueCount: boutiqueList.length
  }), [sales, stock, clients, boutiqueList])

  const comparisonData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toLocaleDateString('fr-FR')
    })

    return boutiqueList.map((b, idx) => {
      const bSales = sales.filter(s => (s.boutiqueId || 'b1') === b.id)
      const total = bSales
        .filter(s => {
          const sDate = new Date(s.date).toLocaleDateString('fr-FR')
          return last7Days.includes(sDate)
        })
        .reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6']
      return { 
        name: b.name, 
        value: total,
        color: colors[idx % colors.length]
      }
    })
  }, [boutiqueList, sales])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [newBoutique, setNewBoutique] = useState({ name: '', location: '', phone: '', color: 'blue', emoji: '🏪' })
  
  const transfers = useStore(state => state.transfers) || []

  const [searchQuery, setSearchQuery] = useState('')
  const allStock = useStore(state => state.stock) || []

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return []
    const query = searchQuery.toLowerCase()
    
    // On regroupe par nom de produit pour voir les stocks partout
    const matches = allStock.filter(s => s.name.toLowerCase().includes(query))
    
    const grouped = {}
    matches.forEach(m => {
      if (!grouped[m.name]) grouped[m.name] = []
      grouped[m.name].push({
        boutiqueId: m.boutiqueId || 'b1',
        boutiqueName: boutiques.find(b => b.id === (m.boutiqueId || 'b1'))?.name || 'Inconnue',
        stock: m.current_stock,
        color: boutiques.find(b => b.id === (m.boutiqueId || 'b1'))?.color || 'blue'
      })
    })

    return Object.entries(grouped).map(([name, locations]) => ({
      name,
      locations: locations.sort((a, b) => b.stock - a.stock)
    }))
  }, [searchQuery, allStock, boutiques])

  const globalAlerts = useMemo(() => {
    return allStock.filter(s => s.current_stock <= (s.alert_threshold || 10)).map(s => ({
      ...s,
      boutiqueName: boutiques.find(b => b.id === (s.boutiqueId || 'b1'))?.name || 'Inconnue'
    })).sort((a, b) => a.current_stock - b.current_stock)
  }, [allStock, boutiques])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newBoutique.name) return
    addBoutique(newBoutique)
    setNewBoutique({ name: '', location: '', phone: '', color: 'blue', emoji: '🏪' })
    setIsAddModalOpen(false)
  }

  return (
    <div className="space-y-8 pb-24 px-4 max-w-6xl mx-auto overflow-y-auto">
      {/* Header Premium */}
      <header className="flex justify-between items-center py-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <Building2 className="text-primary" size={32} />
            Multi-Boutiques <span className="text-primary/40 text-sm">PRO</span>
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Gestion Centralisée & Logistique</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={16} /> Ajouter une Boutique
        </button>
      </header>

      {/* Global Performance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Réseau de Boutiques', val: globalStats.boutiqueCount, icon: Globe, color: 'blue' },
           { label: 'Ventes Globales', val: formatF(globalStats.totalSales), icon: TrendingUp, color: 'emerald' },
           { label: 'Valeur Stock Réseau', val: formatF(globalStats.totalStockValue), icon: Package, color: 'orange' },
           { label: 'Base Clients Globale', val: globalStats.totalClients, icon: Users, color: 'indigo' },
         ].map((stat, i) => (
           <div key={i} className="bg-card border border-border/50 p-6 rounded-[2rem] flex items-center gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${stat.color}-500/10 text-${stat.color}-500`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">{stat.label}</p>
                <p className="text-lg font-black tracking-tight">{stat.val}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Analytics: Performance Comparée */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <Activity size={20} className="text-primary" /> Performance du Réseau (7j)
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Comparaison du chiffre d'affaires consolidé</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full border border-border">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Données en Temps Réel</span>
            </div>
          </div>
        </div>

        <div className="h-[250px] w-full flex items-end">
          <CustomBarChart data={comparisonData} height={200} />
        </div>
      </motion.div>

      {/* Command Center: Recherche & Alertes Globales */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recherche de Stock Cross-Boutique */}
        <div className="lg:col-span-2 bg-card border border-border/50 rounded-[2rem] p-6 shadow-premium relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-40" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit dans tout le réseau..."
                className="w-full pl-12 pr-4 py-4 bg-muted/20 border border-border/50 rounded-2xl font-bold text-sm focus:ring-4 ring-primary/5 outline-none transition-all placeholder:opacity-40"
              />
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {searchQuery.length >= 2 ? (
              searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className="p-4 bg-background border border-border/40 rounded-2xl space-y-3"
                  >
                    <h4 className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                      <Package size={14} className="text-primary" /> {item.name}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {item.locations.map((loc, lIdx) => (
                        <div key={lIdx} className="p-2 rounded-xl border border-border/30 bg-muted/10 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full bg-${loc.color}-500`} />
                            <span className="text-[9px] font-black uppercase truncate">{loc.boutiqueName}</span>
                          </div>
                          <p className={`text-sm font-black ${loc.stock < 5 ? 'text-red-500' : 'text-foreground'}`}>{loc.stock} Unités</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-10 text-center opacity-40">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aucun résultat trouvé pour "{searchQuery}"</p>
                </div>
              )
            ) : (
              <div className="py-8 text-center opacity-40">
                 <Package size={30} className="mx-auto mb-2 opacity-10" />
                 <p className="text-[9px] font-black uppercase tracking-[0.2em]">Entrez au moins 2 caractères pour localiser un produit</p>
              </div>
            )}
          </div>
          
          <div className="absolute -right-10 -bottom-10 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
            <SearchIcon size={200} />
          </div>
        </div>

        {/* Centre d'Alertes Stock Global */}
        <div className="bg-card border border-border/50 rounded-[2rem] p-6 shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" /> Alertes Réseau
            </h3>
            <span className="text-[9px] font-black px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-full border border-orange-500/20">{globalAlerts.length}</span>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {globalAlerts.length > 0 ? (
              globalAlerts.slice(0, 10).map((alert, idx) => (
                <div key={idx} className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-center justify-between group">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase truncate">{alert.name}</p>
                    <p className="text-[8px] font-bold text-orange-600/60 uppercase">{alert.boutiqueName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-orange-600">{alert.current_stock}</p>
                    <p className="text-[7px] font-black uppercase opacity-40">Restant</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center opacity-40 space-y-2">
                 <CheckCircle2 size={30} className="mx-auto text-emerald-500 opacity-20" />
                 <p className="text-[9px] font-black uppercase tracking-widest">Stock réseau optimal</p>
              </div>
            )}
          </div>
          
          {globalAlerts.length > 10 && (
            <button className="w-full mt-4 py-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border-t border-border/30 pt-4">
              Voir toutes les alertes ({globalAlerts.length})
            </button>
          )}
        </div>
      </div>

      {/* Boutique Selection Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between ml-1">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Store size={18} className="text-primary" /> Vos Points de Vente
          </h2>
          <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40">{boutiques.length} BOUTIQUES ACTIVES</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {boutiqueList.map((boutique) => (
              <motion.div
                layout
                key={boutique.id}
                onClick={() => switchBoutique(boutique.id)}
                className={`relative p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all overflow-hidden group ${
                  activeBoutiqueId === boutique.id 
                  ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' 
                  : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                {activeBoutiqueId === boutique.id && (
                  <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full shadow-lg">
                    <CheckCircle2 size={16} />
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg ${
                      activeBoutiqueId === boutique.id 
                      ? (boutique.color === 'blue' ? 'bg-blue-500 shadow-blue-500/20' : 
                         boutique.color === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/20' :
                         boutique.color === 'amber' ? 'bg-amber-500 shadow-amber-500/20' :
                         boutique.color === 'rose' ? 'bg-rose-500 shadow-rose-500/20' :
                         boutique.color === 'indigo' ? 'bg-indigo-500 shadow-indigo-500/20' :
                         'bg-primary shadow-primary/20')
                      : 'bg-muted text-muted-foreground'
                    } text-white`}>
                      <span className="text-2xl">{boutique.emoji || '🏪'}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">{boutique.name}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <MapPin size={10} /> {boutique.location || 'Emplacement non défini'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                    <div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground/60 mb-0.5">Statut Session</p>
                      {boutiquePerformance[boutique.id]?.openSession ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase whitespace-nowrap overflow-hidden">
                          <span className="animate-pulse mr-1">●</span> OUVERTE ({boutiquePerformance[boutique.id].manager})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 text-[8px] font-black uppercase">FERMÉE</span>
                      )}
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground/60 mb-0.5">Ventes (Jour)</p>
                      <p className="text-[10px] font-black tracking-tight">{formatF(boutiquePerformance[boutique.id]?.todaySales)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl border border-border/50 group-hover:bg-primary/5 transition-colors">
                     <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Performance</span>
                     </div>
                     {boutiquePerformance[boutique.id]?.lowStockCount > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-600 rounded-full border border-red-500/20">
                           <Package size={10} />
                           <span className="text-[8px] font-black">{boutiquePerformance[boutique.id].lowStockCount} ALERTES</span>
                        </div>
                     )}
                  </div>

                  <button className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    activeBoutiqueId === boutique.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}>
                    {activeBoutiqueId === boutique.id ? 'Boutique Actuelle' : 'Basculer Ici'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Boutique Management Section: Inter-Boutique Transfers */}
      <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
             <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
               <ArrowLeftRight size={20} className="text-primary" /> Transferts Inter-Boutiques
             </h2>
             <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Déplacez du stock entre vos différents points de vente.</p>
          </div>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="bg-muted text-foreground px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-border/50"
          >
             Historique des transferts
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">De la boutique</label>
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border text-sm font-bold opacity-60">Boutique Principale</div>
                 </div>
                 <div className="flex items-center justify-center pt-6">
                    <ArrowRightLeft className="text-primary/40 animate-pulse" />
                 </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Boutique de destination</label>
                 <select className="w-full p-4 bg-muted/20 border border-border rounded-2xl text-sm font-black uppercase focus:border-primary outline-none transition-all cursor-pointer">
                    <option>Sélectionner une boutique...</option>
                    {boutiqueList.filter(b => b.id !== activeBoutiqueId).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                 </select>
              </div>
           </div>

           <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl flex flex-col justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                 <Package size={24} />
              </div>
              <p className="text-xs font-bold text-primary/80 px-4 leading-relaxed italic">
                 "Le transfert inter-boutique permet de rééquilibrer vos stocks sans passer par une commande fournisseur."
              </p>
              <button 
                onClick={() => setIsTransferModalOpen(true)}
                className="bg-primary text-white py-3 px-6 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-95 transition-all mx-auto"
              >
                 Initier un transfert
              </button>
           </div>
        </div>
      </div>

      {/* Modal de Transfert */}
      <ResponsiveDialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader className="hidden">
            <ResponsiveDialogTitle>Transfert Inter-Boutique</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <div className="-mx-6 -my-6 sm:m-0">
            <TransferStockModal onSuccess={() => setIsTransferModalOpen(false)} />
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* History Modal */}
      <ResponsiveDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <ResponsiveDialogContent className="sm:max-w-xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Historique des Transferts</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Mouvements de stock inter-boutiques récents.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {transfers.length === 0 ? (
              <div className="py-12 text-center space-y-3 opacity-40">
                <History size={40} className="mx-auto" />
                <p className="text-xs font-black uppercase tracking-widest">Aucun transfert enregistré</p>
              </div>
            ) : (
              transfers.map((t, i) => (
                <div key={t.id} className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tight">{t.productName}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(t.date).toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[10px] font-black">
                      {t.quantity} UNITÉS
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 py-2 px-3 bg-card rounded-xl border border-border/30">
                    <div className="text-center flex-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Source</p>
                      <p className="text-[10px] font-black truncate">{t.sourceBoutiqueName}</p>
                    </div>
                    <ArrowRightLeft size={12} className="text-primary/40" />
                    <div className="text-center flex-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Destination</p>
                      <p className="text-[10px] font-black truncate">{t.destBoutiqueName}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Par: {t.userName}</span>
                    <span className="opacity-40">#{t.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Add Boutique Modal */}
      <ResponsiveDialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Nouvelle Boutique</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Étendez votre réseau de points de vente.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom du point de vente</label>
              <input type="text" value={newBoutique.name} onChange={e => setNewBoutique({...newBoutique, name: e.target.value})} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="ex: Butik - Plateau" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Emplacement / Ville</label>
              <input type="text" value={newBoutique.location} onChange={e => setNewBoutique({...newBoutique, location: e.target.value})} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="ex: Dakar, Sénégal" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contact Téléphonique</label>
              <input type="text" value={newBoutique.phone} onChange={e => setNewBoutique({...newBoutique, phone: e.target.value})} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="77 000 00 00" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Couleur</label>
                <div className="flex gap-2 p-2 bg-muted/20 border border-border rounded-xl overflow-x-auto">
                  {['blue', 'emerald', 'amber', 'rose', 'indigo'].map(c => (
                    <button 
                      key={c}
                      type="button"
                      onClick={() => setNewBoutique({...newBoutique, color: c})}
                      className={`w-6 h-6 rounded-full border-2 shrink-0 ${newBoutique.color === c ? 'border-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: `var(--${c}-500, ${c})` }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Emoji</label>
                <div className="flex gap-2 p-2 bg-muted/20 border border-border rounded-xl overflow-x-auto">
                  {['🏪', '🏬', '🛍️', '🛒', '📦'].map(e => (
                    <button 
                      key={e}
                      type="button"
                      onClick={() => setNewBoutique({...newBoutique, emoji: e})}
                      className={`text-lg p-1 rounded-lg transition-all ${newBoutique.emoji === e ? 'bg-primary/20 scale-110' : 'opacity-40'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all mt-4">
              Créer la boutique
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
