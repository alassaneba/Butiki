import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Plus, X, ShoppingCart, Clock, Package, Receipt, CheckCircle, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORY_LABELS = {
  pain:    { label: 'Pain',    color: 'bg-amber-500/10 text-amber-600 border-amber-400/20' },
  gaz:     { label: 'Gaz',     color: 'bg-blue-500/10 text-blue-600 border-blue-400/20' },
  general: { label: 'Général', color: 'bg-muted text-muted-foreground border-border' },
}

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function PurchaseOrderModule() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const suppliers = useStore(state => state.suppliers)
  const allStock = useStore(state => state.stock) || []
  const allPurchaseOrders = useStore(state => state.purchase_orders) || []
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const purchase_orders = useMemo(() => allPurchaseOrders.filter(o => (o.boutiqueId || 'b1') === activeBoutiqueId), [allPurchaseOrders, activeBoutiqueId])
  const createPurchaseOrder = useStore(state => state.createPurchaseOrder)
  const updatePurchaseOrderStatus = useStore(state => state.updatePurchaseOrderStatus)
  const deletePurchaseOrder = useStore(state => state.deletePurchaseOrder)
  const procurement_cart = useStore(state => state.procurement_cart) || []
  const clearProcurementCart = useStore(state => state.clearProcurementCart)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [items, setItems] = useState([])
  
  const handleAddItem = (isNew = false) => {
    setItems([...items, { 
      isNewProduct: isNew,
      stockId: '', 
      name: '',
      category: 'Général',
      numTypes: 1,
      qtyPerType: 1,
      priceBuyPerType: 0,
      unitPrice: 0,
      totalUnits: 0,
      totalPrice: 0,
      alert_threshold: 10,
      price_sell: 0,
      expiry_date: ''
    }])
  }

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items]
    const item = { ...newItems[index], [field]: value }
    
    // Recalculate based on the field updated
    if (field === 'stockId' && !item.isNewProduct) {
      const s = stock.find(i => i.id === value)
      if (s) {
        item.name = s.name
        item.category = s.category
        item.qtyPerType = s.qty_per_type || 1
        item.priceBuyPerType = s.price_buy * item.qtyPerType
        item.unitPrice = s.price_buy
        item.price_sell = s.price_sell
      }
    }

    // Logic for automated calculations (similar to Stock.jsx)
    if (['numTypes', 'qtyPerType', 'priceBuyPerType'].includes(field)) {
      const n = Number(item.numTypes) || 0
      const q = Number(item.qtyPerType) || 0
      const p = Number(item.priceBuyPerType) || 0

      item.totalPrice = n * p
      item.unitPrice = q > 0 ? Math.round(p / q) : 0
      item.totalUnits = n * q
    }

    newItems[index] = item
    setItems(newItems)
  }

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSmartFill = () => {
    if (!selectedSupplier) {
      alert("Veuillez d'abord sélectionner un fournisseur pour le remplissage intelligent.")
      return
    }

    const lowStockItems = stock.filter(s => 
      s.current_stock <= (s.alert_threshold || 10) && 
      s.supplierId === selectedSupplier
    )

    if (lowStockItems.length === 0) {
      alert("Aucun article de ce fournisseur n'est actuellement en stock bas.")
      return
    }

    // On évite les doublons si certains sont déjà dans la liste
    const existingIds = new Set(items.map(it => it.stockId))
    const toAdd = lowStockItems.filter(s => !existingIds.has(s.id))

    if (toAdd.length === 0) {
      alert("Tous les articles en stock bas sont déjà dans la commande.")
      return
    }
    
    const newItems = toAdd.map(s => ({
      isNewProduct: false,
      stockId: s.id,
      name: s.name,
      category: s.category,
      numTypes: 1,
      qtyPerType: s.qty_per_type || 1,
      priceBuyPerType: (s.price_buy || 0) * (s.qty_per_type || 1),
      unitPrice: s.price_buy || 0,
      totalUnits: s.qty_per_type || 1,
      totalPrice: (s.price_buy || 0) * (s.qty_per_type || 1),
      alert_threshold: s.alert_threshold || 10,
      price_sell: s.price_sell || 0,
      expiry_date: ''
    }))
    
    setItems([...items, ...newItems])
  }

  const handleImportFromCart = () => {
    if (procurement_cart.length === 0) return

    const existingIds = new Set(items.map(it => it.stockId))
    const toAdd = procurement_cart.filter(s => !existingIds.has(s.id))

    if (toAdd.length === 0) {
      alert("Tous les articles du panier sont déjà dans la commande.")
      return
    }

    const newItems = toAdd.map(s => {
      const qtyPerType = s.qty_per_type || 1;
      const suggestedUnits = s.suggestion || 0;
      // On calcule le nombre de types (ex: cartons) nécessaires pour atteindre la suggestion
      const numTypes = suggestedUnits > 0 ? Math.ceil(suggestedUnits / qtyPerType) : 1;
      
      return {
        isNewProduct: false,
        stockId: s.id,
        name: s.name,
        category: s.category,
        numTypes: numTypes,
        qtyPerType: qtyPerType,
        priceBuyPerType: (s.price_buy || 0) * qtyPerType,
        unitPrice: s.price_buy || 0,
        totalUnits: numTypes * qtyPerType,
        totalPrice: (s.price_buy || 0) * (numTypes * qtyPerType),
        alert_threshold: s.alert_threshold || 10,
        price_sell: s.price_sell || 0,
        expiry_date: ''
      };
    })

    setItems([...items, ...newItems])
    clearProcurementCart()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedSupplier || items.length === 0) return
    
    const invalidItem = items.find(item => !item.isNewProduct && !item.stockId)
    if (invalidItem) return
 

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0)
    
    createPurchaseOrder({
      supplierId: selectedSupplier,
      supplierName: suppliers.find(s => s.id === selectedSupplier)?.name || 'Inconnu',
      items: items.map(item => ({
        ...item,
        stockName: item.isNewProduct ? item.name : (stock.find(s => s.id === item.stockId)?.name || 'Inconnu')
      })),
      totalAmount,
      status: 'waiting'
    })

    setIsCreating(false)
    setSelectedSupplier('')
    setItems([])
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-black tracking-tighter flex items-center gap-3 uppercase"><ShoppingCart size={20} className="text-primary" /> Commandes</h3>
        <button 
          onClick={() => {
            setIsCreating(true)
            setItems([])
          }}
          className="w-full sm:w-auto flex justify-center items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus size={18} /> Nouvelle Commande
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-6 bg-card border-2 border-primary/20 rounded-3xl shadow-2xl space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h4 className="text-2xl font-black tracking-tight">Nouvelle Commande d'Achat</h4>
                <p className="text-xs text-muted-foreground font-medium">Enregistrez vos achats fournisseurs et mettez à jour votre stock</p>
              </div>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Fournisseur Partenaire</label>
                  <select 
                    value={selectedSupplier}
                    onChange={e => setSelectedSupplier(e.target.value)}
                    className="w-full p-4 border-2 border-border rounded-2xl bg-background text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
                    required
                  >
                    <option value="">Sélectionner un fournisseur...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({CATEGORY_LABELS[s.category]?.label || 'Général'})</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Lignes de commande</label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleSmartFill} className="text-[9px] font-black uppercase px-3 py-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-500/20 rounded-lg transition-all flex items-center gap-1.5 shadow-sm">
                      <Sparkles size={12} /> Remplissage Intelligent
                    </button>
                    {procurement_cart.length > 0 && (
                      <button type="button" onClick={handleImportFromCart} className="text-[9px] font-black uppercase px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-lg transition-all flex items-center gap-1.5 shadow-sm">
                        <ShoppingCart size={12} /> Importer du Panier ({procurement_cart.length})
                      </button>
                    )}
                    <button type="button" onClick={() => handleAddItem(false)} className="text-[9px] font-black uppercase px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-all flex items-center gap-1.5">
                      <Package size={12} /> Produit Existant
                    </button>
                    <button type="button" onClick={() => handleAddItem(true)} className="text-[9px] font-black uppercase px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all flex items-center gap-1.5">
                      <Plus size={12} /> Nouveau Produit
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, scale: 0.98 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative p-6 rounded-2xl border-2 transition-all ${item.isNewProduct ? 'border-primary/20 bg-primary/5' : 'border-border bg-muted/20'}`}
                    >
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(index)} 
                        className="absolute top-4 right-4 p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      >
                        <X size={18} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Column 1: Product Selection or Name */}
                        <div className="space-y-4">
                          {item.isNewProduct ? (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">Nom du nouveau produit</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Coca Cola 33cl"
                                  value={item.name} 
                                  onChange={e => handleUpdateItem(index, 'name', e.target.value)}
                                  className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-bold outline-none focus:border-primary shadow-sm"
                                  required
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">Catégorie / Type</label>
                                <input 
                                  type="text" 
                                  placeholder="Ex: Boisson"
                                  value={item.category} 
                                  onChange={e => handleUpdateItem(index, 'category', e.target.value)}
                                  className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-bold outline-none focus:border-primary shadow-sm"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">Sélectionner l'article</label>
                              <select 
                                value={item.stockId}
                                onChange={e => handleUpdateItem(index, 'stockId', e.target.value)}
                                className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-bold outline-none focus:border-primary shadow-sm"
                                required
                              >
                                <option value="">Choisir un produit...</option>
                                <optgroup label="Produits du fournisseur">
                                  {stock.filter(s => s.supplierId === selectedSupplier).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </optgroup>
                                <optgroup label="Autres produits">
                                  {stock.filter(s => s.supplierId !== selectedSupplier).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </optgroup>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Column 2: Quantities & Pricing */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">Nb de Type (ex: Cartons)</label>
                            <input 
                              type="number" 
                              value={item.numTypes} 
                              onChange={e => handleUpdateItem(index, 'numTypes', e.target.value)}
                              className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-black text-center outline-none focus:border-primary shadow-sm"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">Qté par Type (ex: 12 pces)</label>
                            <input 
                              type="number" 
                              value={item.qtyPerType} 
                              onChange={e => handleUpdateItem(index, 'qtyPerType', e.target.value)}
                              className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-black text-center outline-none focus:border-primary shadow-sm"
                              required
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-muted-foreground/60 ml-1">Prix Achat par Type</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                value={item.priceBuyPerType} 
                                onChange={e => handleUpdateItem(index, 'priceBuyPerType', e.target.value)}
                                className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm font-black text-right pr-10 outline-none focus:border-primary shadow-sm"
                                required
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-xs">F</span>
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Summary & Sales (for new products) */}
                        <div className="bg-background/50 rounded-xl p-4 space-y-3 border border-border/50">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-muted-foreground">
                            <span>Récapitulatif</span>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">Automatique</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase">Total Units:</span>
                              <span className="text-sm font-black">{item.totalUnits}</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase">Achat Unitaire:</span>
                              <span className="text-sm font-black text-blue-600">{item.unitPrice.toLocaleString()} F</span>
                            </div>
                            <div className="flex justify-between items-end pt-2 border-t border-border">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase">Achat TOTAL:</span>
                              <span className="text-lg font-black text-primary">{(item.totalPrice).toLocaleString()} F</span>
                            </div>
                          </div>
                          
                          {item.isNewProduct && (
                            <div className="pt-3 border-t border-border space-y-3">
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Prix de Vente Unitaire</label>
                                <input 
                                  type="number" 
                                  value={item.price_sell} 
                                  onChange={e => handleUpdateItem(index, 'price_sell', e.target.value)}
                                  className="w-full p-2 bg-background border border-border rounded-lg text-[10px] font-black text-right outline-none focus:border-green-500 shadow-sm"
                                  placeholder="Prix de vente..."
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Date de Validité</label>
                                <input 
                                  type="date" 
                                  value={item.expiry_date} 
                                  onChange={e => handleUpdateItem(index, 'expiry_date', e.target.value)}
                                  className="w-full p-2 bg-background border border-border rounded-lg text-[10px] font-black outline-none focus:border-primary shadow-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {items.length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed border-border rounded-3xl bg-muted/5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ajoutez des articles pour commencer</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-border">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Montant Total Commande</p>
                  <p className="text-3xl font-black text-primary tracking-tighter">
                    {items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0).toLocaleString()} F
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 sm:flex-none px-8 py-4 rounded-2xl font-black text-sm bg-muted hover:bg-muted/80 transition-all">Annuler</button>
                  <button 
                    type="submit" 
                    disabled={items.length === 0 || !selectedSupplier}
                    className="flex-[2] sm:flex-none px-10 py-4 rounded-2xl font-black text-sm bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Valider la commande
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6">
        {purchase_orders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border border-dashed space-y-3">
            <Clock size={48} className="mx-auto text-muted-foreground opacity-10" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-30">Aucune commande en cours</p>
          </div>
        ) : (
          [...purchase_orders].reverse().map(order => (
            <motion.div 
              layout
              key={order.id} 
              className="card-ultra-compact mb-2 flex flex-col gap-3 group"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs sm:text-sm tracking-tight">{order.supplierName}</h4>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest ${
                    order.status === 'waiting' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                    order.status === 'received' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                    order.status === 'debt' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  }`}>
                    {order.status === 'waiting' ? 'Attente' : 
                     order.status === 'received' ? 'Reçu' : 
                     order.status === 'debt' ? 'Dette' : 'Payé'}
                  </span>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter"><Clock size={10} className="inline mr-1" /> {formatDate(order.date)}</p>
                  <p className="text-sm sm:text-lg font-black text-primary tracking-tighter">{order.totalAmount.toLocaleString()} F</p>
                </div>
              </div>

              <div className="bg-muted/10 rounded-2xl p-3 sm:p-5 border border-border/50">
                <div className="hidden sm:grid grid-cols-4 gap-4 text-[9px] font-black uppercase text-muted-foreground/40 border-b border-border/10 pb-2 mb-2">
                  <span>Article</span>
                  <span className="text-center">Quantité Totale</span>
                  <span className="text-right">Unit.</span>
                  <span className="text-right">Total</span>
                </div>
                
                <div className="space-y-3 sm:space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:grid sm:grid-cols-4 sm:gap-4 group/row sm:items-center">
                      <div className="flex items-center justify-between sm:block">
                        <div className="flex flex-col">
                          <span className="font-black text-xs sm:text-sm">{item.stockName}</span>
                          {item.isNewProduct && <span className="text-[7px] font-black text-primary uppercase">Nouveau</span>}
                        </div>
                        <span className="sm:hidden text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded">x{item.totalUnits || item.quantity}</span>
                      </div>
                      <div className="hidden sm:block text-center font-black text-muted-foreground text-sm">x{item.totalUnits || item.quantity}</div>
                      <div className="flex items-center justify-between sm:justify-end text-[10px] sm:text-xs text-muted-foreground">
                        <span className="sm:hidden font-bold">Prix unit:</span>
                        <span className="font-bold">{item.unitPrice.toLocaleString()} F</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end text-xs sm:text-sm">
                        <span className="sm:hidden font-black text-primary">Sous-total:</span>
                        <span className="font-black">{(item.totalPrice || (item.quantity * item.unitPrice)).toLocaleString()} F</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button 
                  onClick={() => deletePurchaseOrder(order.id)}
                  className="text-[8px] font-black text-red-500/50 uppercase hover:text-red-500 tracking-widest transition-colors"
                >
                  Annuler
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {order.status === 'waiting' && (
                    <button 
                      onClick={() => updatePurchaseOrderStatus(order.id, 'received')}
                      className="btn-ultra-compact bg-blue-600 text-white"
                    >
                      Réceptionner & Stocker
                    </button>
                  )}
                  {(order.status === 'waiting' || order.status === 'received') && (
                    <button 
                      onClick={() => updatePurchaseOrderStatus(order.id, 'debt')}
                      className="btn-ultra-compact bg-red-500 text-white"
                    >
                      Dette
                    </button>
                  )}
                  {(order.status === 'waiting' || order.status || order.status === 'debt') && order.status !== 'paid' && (
                    <button 
                      onClick={() => updatePurchaseOrderStatus(order.id, 'paid')}
                      className="btn-ultra-compact bg-emerald-500 text-white"
                    >
                      Payer {order.status === 'waiting' ? '& Stocker' : ''}
                    </button>
                  )}
                  {order.status === 'paid' && (
                    <div className="flex items-center gap-1 text-emerald-500 font-black text-[8px] uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">
                      <CheckCircle size={10} /> Clôturé & Stocké
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
