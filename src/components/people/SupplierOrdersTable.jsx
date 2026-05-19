import { useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import { Package, Clock, CheckCircle2, ChevronRight, ShoppingCart, MessageCircle, Truck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SupplierOrdersTable() {
  const purchaseOrders = useStore(state => state.purchase_orders)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const updatePurchaseOrderStatus = useStore(state => state.updatePurchaseOrderStatus)
  const suppliers = useStore(state => state.suppliers)
  const [expandedOrder, setExpandedOrder] = useState(null)

  const orders = useMemo(() => {
    return (purchaseOrders || [])
      .filter(o => o.boutiqueId === activeBoutiqueId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [purchaseOrders, activeBoutiqueId])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'received': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'waiting': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'paid': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'debt': return 'bg-red-500/10 text-red-600 border-red-500/20'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'received': return 'Réceptionné'
      case 'waiting': return 'En attente'
      case 'paid': return 'Payé'
      case 'debt': return 'En Dette'
      default: return status
    }
  }

  const handleReceiveOrder = (order) => {
    if (window.confirm("Confirmer la réception de cette commande ? Le stock sera mis à jour.")) {
      const type = window.confirm("Avez-vous payé cette commande immédiatement ? (OK = Oui, Annuler = Non, mettre en dette)") 
        ? 'received' 
        : 'debt'
      updatePurchaseOrderStatus(order.id, type, "Réception via Assistant")
    }
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {orders.map((order) => {
          const isExpanded = expandedOrder === order.id
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`card-ultra-compact flex flex-col gap-3 transition-all cursor-pointer ${isExpanded ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusStyle(order.status)}`}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">{order.supplierName}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5 mt-0.5">
                      <Clock size={12} /> {new Date(order.date).toLocaleDateString()} · {order.items.length} articles
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60 mb-1">Montant</p>
                  <p className="text-sm font-black tracking-tighter text-primary">
                    {order.totalAmount.toLocaleString()} F
                  </p>
                </div>
              </div>

              {!isExpanded ? (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="bg-muted/30 px-2 py-1 rounded-lg border border-border/40 whitespace-nowrap">
                      <span className="text-[9px] font-black uppercase text-muted-foreground">{item.name}</span>
                      <span className="ml-1 text-[9px] font-black text-primary">x{item.quantity}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-[9px] font-black text-muted-foreground/40 shrink-0">+{order.items.length - 3}</span>
                  )}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2 py-2 border-t border-primary/10"
                >
                  <p className="text-[9px] font-black uppercase text-primary/60">Détail de la commande</p>
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/50 p-2 rounded-xl border border-primary/5">
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase truncate">{item.name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground">{item.unitPrice?.toLocaleString()} F / unité</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black text-primary">x{item.quantity}</p>
                        <p className="text-[9px] font-bold text-muted-foreground">{(item.unitPrice * item.quantity).toLocaleString()} F</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1" onClick={e => e.stopPropagation()}>
                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${getStatusStyle(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
                
                <div className="flex gap-2">
                  {order.status === 'waiting' && (
                    <>
                      <button 
                        onClick={() => {
                          const s = suppliers.find(sup => sup.id === order.supplierId)
                          if (s?.phone) {
                             window.open(`https://wa.me/${s.phone.replace(/\s/g, '').replace(/\D/g, '')}`, '_blank')
                          }
                        }}
                        className="btn-ultra-compact bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                      >
                        <MessageCircle size={14} /> RELANCER
                      </button>
                      <button 
                        onClick={() => handleReceiveOrder(order)}
                        className="btn-ultra-compact bg-primary text-white shadow-sm hover:scale-105"
                      >
                        <Truck size={14} /> RÉCEPTIONNER
                      </button>
                    </>
                  )}
                  {order.status === 'received' && (
                    <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Stock mis à jour
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {orders.length === 0 && (
        <div className="py-20 text-center opacity-20">
          <ShoppingCart className="mx-auto mb-4" size={48} />
          <p className="text-xs font-black uppercase tracking-widest">Aucune commande enregistrée</p>
        </div>
      )}
    </div>
  )
}
