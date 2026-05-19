import { useMemo, useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { ShoppingCart, Send, Phone, Package, Trash2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ProcurementWizard({ items, onClose }) {
  const suppliers = useStore(state => state.suppliers)
  const createPurchaseOrder = useStore(state => state.createPurchaseOrder)
  const [quantities, setQuantities] = useState({}) // { stockId: qty }

  // Groupement par fournisseur
  const suggestedOrders = useMemo(() => {
    const groups = {}
    items.forEach(item => {
      const sId = item.supplierId || 'unknown'
      if (!groups[sId]) {
        const supplier = suppliers.find(s => s.id === sId)
        groups[sId] = {
          supplierId: sId,
          supplierName: supplier?.name || 'Fournisseur Inconnu',
          phone: supplier?.phone || '',
          items: []
        }
      }
      
      const suggestedQty = Math.max(0, (item.alert_threshold || 10) * 2 - item.current_stock)
      groups[sId].items.push({
        ...item,
        suggestedQty: suggestedQty > 0 ? suggestedQty : 10
      })
    })
    return Object.values(groups)
  }, [items, suppliers])

  // Initialiser les quantités au montage ou quand les items changent
  useEffect(() => {
    const initial = {}
    suggestedOrders.forEach(group => {
      group.items.forEach(item => {
        initial[item.id] = item.suggestedQty
      })
    })
    setQuantities(initial)
  }, [suggestedOrders])

  const handleCreateOrder = (order) => {
    const orderItems = order.items.map(i => ({
      stockId: i.id,
      name: i.name,
      quantity: Number(quantities[i.id]) || 0,
      unitPrice: i.price_buy,
      totalUnits: Number(quantities[i.id]) || 0,
    })).filter(i => i.quantity > 0)

    if (orderItems.length === 0) {
      toast.error("Veuillez saisir au moins une quantité supérieure à 0.")
      return
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    
    const newOrder = {
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      items: orderItems,
      totalAmount,
      status: 'waiting',
      date: new Date().toISOString()
    }

    createPurchaseOrder(newOrder)
    
    // Générer message WhatsApp
    const message = `*COMMANDE BUTIK PRO*\nFournisseur: ${order.supplierName}\n\nArticles demandés:\n${orderItems.map(i => `- ${i.name} : ${i.quantity} unités`).join('\n')}\n\nMerci de confirmer la disponibilité et le prix total.`
    
    if (order.phone) {
      const waUrl = `https://wa.me/${order.phone.replace(/\s/g, '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      window.open(waUrl, '_blank')
    } else {
      toast.info("Commande enregistrée, mais aucun numéro WhatsApp trouvé pour ce fournisseur.")
    }
    
    onClose()
  }

  return (
    <div className="p-6 bg-card sm:rounded-2xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="text-primary" size={18} /> Assistant Commande
          </h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
            {suggestedOrders.length} commandes suggérées
          </p>
        </div>
      </header>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
        {suggestedOrders.map((order, idx) => (
          <div key={idx} className="border border-border/40 rounded-2xl p-4 bg-muted/5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-black text-xs uppercase tracking-tight">{order.supplierName}</h4>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 mt-1">
                  <Phone size={10} /> {order.phone || 'Pas de numéro'}
                </div>
              </div>
              <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                {order.items.length} Articles
              </span>
            </div>

            <div className="space-y-1.5">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-card p-2 rounded-xl border border-border/20">
                  <div className="min-w-0 pr-4">
                    <p className="text-[11px] font-black uppercase truncate">{item.name}</p>
                    <p className="text-[9px] font-bold text-orange-500 uppercase">Stock: {item.current_stock} U (Seuil: {item.alert_threshold})</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black text-muted-foreground uppercase">Qté:</span>
                    <input 
                      type="number" 
                      value={quantities[item.id] || ''}
                      onChange={e => setQuantities({ ...quantities, [item.id]: e.target.value })}
                      className="w-16 bg-muted/30 border-none rounded-lg p-2 text-[11px] font-black text-right outline-none focus:ring-2 ring-primary/20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleCreateOrder(order)}
              className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-md active:scale-95"
            >
              <Send size={14} /> Envoyer la commande WhatsApp
            </button>
          </div>
        ))}

        {suggestedOrders.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={32} />
            <p className="text-[10px] font-black uppercase">Tout est en ordre ! Aucun réappro requis.</p>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border/40">
        <button 
          onClick={onClose}
          className="w-full p-3 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Fermer l'assistant
        </button>
      </div>
    </div>
  )
}
