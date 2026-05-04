import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { 
  Truck, Package, MapPin, User, Phone, 
  Clock, CheckCircle2, AlertCircle, Plus, 
  Search, Filter, Navigation, Bike, Car,
  PhoneCall, MessageSquare, History, MoreVertical,
  Check, X, ChevronRight, DollarSign
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import clsx from 'clsx'

const sendWhatsApp = (phone, message) => {
  if (!phone) return
  const cleanPhone = phone.replace(/\D/g, '')
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

const STATUS_UI = {
  pending: { label: 'En attente', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  processing: { label: 'Préparation', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Package },
  shipped: { label: 'En route', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Bike },
  delivered: { label: 'Livré', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: X },
}

const formatF = (val) => `${Math.round(val || 0).toLocaleString('fr-FR')} F`

export default function Logistics() {

  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  
  // Sélecteurs de base stables
  const allDeliveries = useStore(state => state.deliveries || [])
  const allStaff = useStore(state => state.delivery_staff || [])
  
  // Filtrage mémoïsé par boutique
  const deliveries = useMemo(() => 
    allDeliveries.filter(d => (d.boutiqueId || 'b1') === activeBoutiqueId),
    [allDeliveries, activeBoutiqueId]
  )
  
  const delivery_staff = useMemo(() => 
    allStaff.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId),
    [allStaff, activeBoutiqueId]
  )

  const addDeliveryStaff = useStore(state => state.addDeliveryStaff)
  const addDeliveryOrder = useStore(state => state.addDeliveryOrder)
  const updateDeliveryStatus = useStore(state => state.updateDeliveryStatus)
  const sales = useStore(state => state.sales || [])

  const location = useLocation()
  const saleFromState = location.state?.sale

  const [activeTab, setActiveTab] = useState('orders') // 'orders', 'staff', 'tracking'
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [showNewOrder, setShowNewOrder] = useState(saleFromState ? true : false)
  const [search, setSearch] = useState('')

  const stats = {
    pending: deliveries.filter(d => d.status === 'pending' || d.status === 'processing').length,
    active: deliveries.filter(d => d.status === 'shipped').length,
    completed: deliveries.filter(d => d.status === 'delivered').length,
    totalRevenue: deliveries.filter(d => d.status === 'delivered').reduce((acc, d) => acc + (Number(d.fee) || 0), 0)
  }

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => 
      (d.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.address || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [deliveries, search])

  const handleAddStaff = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    addDeliveryStaff({
      name: formData.get('name'),
      phone: formData.get('phone'),
      vehicle: formData.get('vehicle'),
      status: 'active'
    })
    setShowAddStaff(false)
  }

  const handleAddOrder = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    addDeliveryOrder({
      customerName: formData.get('customer'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      fee: Number(formData.get('fee')),
      staffId: formData.get('staffId'),
      saleId: formData.get('saleId'),
      status: 'pending'
    })
    setShowNewOrder(false)
  }

  return (
    <div className="space-y-8 pb-24 px-4 max-w-6xl mx-auto">
      {/* Header Premium */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <Truck className="text-primary" size={32} />
            Logistique & Livraisons
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Gestion du Dernier Kilomètre & Expéditions</p>
        </div>
        
        <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
           <button onClick={() => setActiveTab('orders')} className={clsx("px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase", activeTab === 'orders' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted")}>Livraisons</button>
           <button onClick={() => setActiveTab('staff')} className={clsx("px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase", activeTab === 'staff' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted")}>Livreurs</button>
        </div>
      </header>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'En attente', val: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/5' },
           { label: 'En cours', val: stats.active, icon: Bike, color: 'text-indigo-500', bg: 'bg-indigo-500/5' },
           { label: 'Terminées', val: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
           { label: 'Recettes Liv.', val: formatF(stats.totalRevenue), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5' },
         ].map((s, i) => (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className={clsx("p-4 rounded-3xl border border-border/50 flex flex-col gap-1", s.bg)}>
              <s.icon size={18} className={s.color} />
              <p className="text-lg font-black tracking-tighter mt-1">{s.val}</p>
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</p>
           </motion.div>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
             <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                   <input 
                     type="text" placeholder="Client, adresse, téléphone..." 
                     value={search} onChange={e => setSearch(e.target.value)}
                     className="w-full pl-10 p-3.5 bg-card border border-border/50 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-primary/5"
                   />
                </div>
                <button onClick={() => setShowNewOrder(true)} className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                   <Plus size={18}/> Nouvelle Livraison
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDeliveries.map((delivery, i) => {
                  const UI = STATUS_UI[delivery.status] || STATUS_UI.pending
                  const staff = delivery_staff.find(s => s.id === delivery.staffId)
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      key={delivery.id} 
                      className="bg-card border border-border/50 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
                    >
                       <div className={clsx("absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest border-l border-b border-border/50 flex items-center gap-2", UI.color)}>
                          <UI.icon size={12}/> {UI.label}
                       </div>

                       <div className="mb-6 mt-4">
                          <h3 className="font-black text-lg tracking-tight mb-1">{delivery.customerName}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground">
                             <Phone size={12} className="text-primary"/>
                             <span className="text-[11px] font-bold">{delivery.phone || 'Non défini'}</span>
                          </div>
                       </div>

                       <div className="space-y-3 mb-6">
                          <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
                             <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                             <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">{delivery.address || 'Pas d\'adresse spécifiée'}</p>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl border border-border/50">
                             <div className="flex items-center gap-2">
                                <Bike size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Livreur</span>
                             </div>
                             <span className="text-[11px] font-black">{staff?.name || 'Non assigné'}</span>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div>
                             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Frais de livraison</p>
                             <p className="text-lg font-black text-primary">{formatF(delivery.fee)}</p>
                          </div>
                          <div className="flex gap-2">
                             {delivery.status === 'pending' && (
                               <button 
                                 onClick={() => {
                                   updateDeliveryStatus(delivery.id, 'processing')
                                   sendWhatsApp(delivery.phone, `Bonjour ${delivery.customerName}, votre commande Butiki est en cours de préparation ! 📦`)
                                 }} 
                                 className="p-3 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20"
                               >
                                 <Package size={18}/>
                               </button>
                             )}
                             {delivery.status === 'processing' && (
                               <button 
                                 onClick={() => {
                                   updateDeliveryStatus(delivery.id, 'shipped')
                                   const msg = `Bonjour ${delivery.customerName}, votre colis est en route ! 🛵 Livreur: ${staff?.name || 'Butiki'}.`
                                   sendWhatsApp(delivery.phone, msg)
                                 }} 
                                 className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20"
                               >
                                 <Navigation size={18}/>
                               </button>
                             )}
                             {delivery.status === 'shipped' && (
                               <button 
                                 onClick={() => {
                                   updateDeliveryStatus(delivery.id, 'delivered')
                                   sendWhatsApp(delivery.phone, `Votre colis Butiki a été livré avec succès ! Merci de votre confiance. ⭐⭐⭐⭐⭐`)
                                 }} 
                                 className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                               >
                                 <Check size={18}/>
                               </button>
                             )}
                             <button onClick={() => sendWhatsApp(delivery.phone, `Bonjour ${delivery.customerName}, nous vous contactons au sujet de votre livraison Butiki.`)} className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                                <MessageSquare size={18}/>
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  )
                })}
             </div>
          </motion.div>
        )}

        {activeTab === 'staff' && (
          <motion.div key="staff" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
             <div className="flex justify-between items-center px-2">
                <h2 className="font-black text-xl tracking-tight uppercase">Nos Partenaires Livreurs</h2>
                <button onClick={() => setShowAddStaff(true)} className="p-3 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20"><Plus size={20}/></button>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {delivery_staff.map(staff => (
                  <div key={staff.id} className="bg-card border border-border/50 p-6 rounded-[2rem] shadow-sm flex flex-col items-center text-center group transition-all hover:border-primary/20">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-4">
                        {staff.vehicle === 'moto' ? <Bike size={32}/> : <Car size={32}/>}
                     </div>
                     <h3 className="font-black text-lg mb-1">{staff.name}</h3>
                     <p className="text-[11px] font-bold text-muted-foreground mb-4">{staff.phone}</p>
                     
                     <div className="flex gap-2 w-full mt-auto">
                        <button className="flex-1 py-2 bg-secondary text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">Historique</button>
                        <button className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl"><PhoneCall size={16}/></button>
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Add Staff */}
      <AnimatePresence>
        {showAddStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddStaff(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-card border border-border rounded-[3rem] shadow-2xl p-8">
               <h2 className="text-xl font-black mb-6 uppercase">Nouveau Livreur</h2>
               <form onSubmit={handleAddStaff} className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nom Complet</label>
                     <input name="name" type="text" required className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Téléphone</label>
                     <input name="phone" type="text" required className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Véhicule</label>
                     <select name="vehicle" className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold outline-none">
                        <option value="moto">Moto / Scooter</option>
                        <option value="car">Voiture / Van</option>
                        <option value="bike">Vélo</option>
                     </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowAddStaff(false)} className="flex-1 py-4 bg-secondary text-muted-foreground rounded-2xl font-black text-xs uppercase">Annuler</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-primary/20">Enregistrer</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {showNewOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNewOrder(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] shadow-2xl p-8">
               <h2 className="text-xl font-black mb-6 uppercase">Programmer une Livraison</h2>
               <form onSubmit={handleAddOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Client</label>
                        <input name="customer" type="text" defaultValue={saleFromState?.customerName || ''} required className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Téléphone</label>
                        <input name="phone" type="text" defaultValue={saleFromState?.customerPhone || ''} required className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Adresse complète</label>
                     <textarea name="address" required className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold h-24 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Frais de livraison</label>
                        <input name="fee" type="number" defaultValue={1000} className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Assigner à</label>
                        <input type="hidden" name="saleId" value={saleFromState?.id || ''} />
                        <select name="staffId" className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold outline-none">
                           <option value="">-- Choisir un livreur --</option>
                           {delivery_staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.vehicle})</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowNewOrder(false)} className="flex-1 py-4 bg-secondary text-muted-foreground rounded-2xl font-black text-xs uppercase">Annuler</button>
                    <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-primary/20">Créer</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
