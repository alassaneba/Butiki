import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { 
  Store, Plus, MapPin, Phone, 
  TrendingUp, Package, Users, Wallet,
  ChevronRight, Building2, Globe, LayoutDashboard,
  ArrowLeftRight, ArrowRightLeft, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription } from '../components/ui/responsive-dialog'

const formatF = (val) => `${Math.round(val || 0).toLocaleString()} F`

export default function Boutiques() {
  const boutiques = useStore(state => state.boutiques)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const switchBoutique = useStore(state => state.switchBoutique)
  const addBoutique = useStore(state => state.addBoutique)
  
  const boutiqueList = boutiques || []
  
  // Data for aggregation
  const sales = useStore(state => state.sales)
  const stock = useStore(state => state.stock)
  const clients = useStore(state => state.clients)

  const saleList = sales || []
  const stockList = stock || []
  const clientList = clients || []
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newBoutique, setNewBoutique] = useState({ name: '', location: '', phone: '' })

  const globalStats = useMemo(() => ({
    totalSales: saleList.reduce((acc, s) => acc + (s.totalAmount || 0), 0),
    totalStockValue: stockList.reduce((acc, i) => acc + (i.current_stock * i.price_buy), 0),
    totalClients: clientList.length,
    boutiqueCount: boutiqueList.length
  }), [saleList, stockList, clientList, boutiqueList])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newBoutique.name) return
    addBoutique(newBoutique)
    setNewBoutique({ name: '', location: '', phone: '' })
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

      {/* Boutique Selection Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 ml-1">
          <Store size={18} className="text-primary" /> Vos Points de Vente
        </h2>
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
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${activeBoutiqueId === boutique.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Store size={28} />
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
                      <p className="text-[8px] font-black uppercase text-muted-foreground/60 mb-0.5">Statut</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase">En Ligne</span>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground/60 mb-0.5">ID Boutique</p>
                      <p className="text-[9px] font-mono font-bold opacity-30 truncate">#{boutique.id.slice(0, 8)}</p>
                    </div>
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
             <p className="text-[10px] font-bold text-muted-foreground mt-1">Déplacez du stock entre vos différents points de vente.</p>
          </div>
          <button className="bg-muted text-foreground px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
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
              <button className="bg-primary text-white py-3 px-6 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-95 transition-all mx-auto">
                 Initier un transfert
              </button>
           </div>
        </div>
      </div>

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
              <input type="text" value={newBoutique.name} onChange={e => setNewBoutique({...newBoutique, name: e.target.value})} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="ex: Butiki - Plateau" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Emplacement / Ville</label>
              <input type="text" value={newBoutique.location} onChange={e => setNewBoutique({...newBoutique, location: e.target.value})} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="ex: Dakar, Sénégal" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contact Téléphonique</label>
              <input type="text" value={newBoutique.phone} onChange={e => setNewBoutique({...newBoutique, phone: e.target.value})} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="77 000 00 00" />
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
