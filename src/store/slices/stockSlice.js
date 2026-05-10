import { toast } from 'sonner'

export const createStockSlice = (set, get) => ({
  stock: [],
  stock_logs: [],
  transfers: [],
  inventory_history: [],
  purchase_orders: [],
  procurement_cart: [],

  addStockItem: (item) => {
    const id = crypto.randomUUID()
    get().logAction('Nouveau Produit', `${item.name} ajouté au stock`)
    
    // Log mouvement stock
    const stockLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      productId: id,
      productName: item.name,
      type: 'initial',
      quantity: item.current_stock,
      boutiqueId: get().activeBoutiqueId,
      userId: get().activeUserId,
      userName: get().users.find(u => u.id === get().activeUserId)?.name || 'Système'
    }

    set((state) => ({
      stock: [...state.stock, { ...item, id, boutiqueId: get().activeBoutiqueId, barcode: item.barcode || '' }],
      stock_logs: [stockLog, ...state.stock_logs].slice(0, 500)
    }))

    toast.success(`Produit ajouté : ${item.name}`)
    return id;
  },

  updateStockQty: (id, new_qty, reason = 'ajustement') => {
    const item = get().stock.find(s => s.id === id)
    if (!item) return
    
    const diff = new_qty - item.current_stock
    if (diff === 0) return

    get().logAction('Ajustement Stock', `${item.name} : ${new_qty} unités (${reason})`)
    
    const stockLog = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      productId: id,
      productName: item.name,
      type: diff > 0 ? 'entree' : 'sortie',
      quantity: Math.abs(diff),
      reason: reason,
      boutiqueId: get().activeBoutiqueId,
      userId: get().activeUserId,
      userName: get().users.find(u => u.id === get().activeUserId)?.name || 'Système'
    }

    set((state) => ({
      stock: state.stock.map(s => 
        s.id === id ? { ...s, current_stock: Math.max(0, new_qty) } : s
      ),
      stock_logs: [stockLog, ...state.stock_logs].slice(0, 500)
    }))
  },

  deleteStockItem: (id) => {
    const item = get().stock.find(s => s.id === id)
    if (!item) return
    get().logAction('Suppression Produit', `${item.name} supprimé du stock`)
    set((state) => ({
      stock: state.stock.filter(s => s.id !== id)
    }))
    toast.success(`Produit supprimé : ${item.name}`)
  },

  linkProductToSupplier: (productId, supplierId) => {
    set((state) => ({
      stock: state.stock.map(s => s.id === productId ? { ...s, supplierId } : s)
    }))
  },

  updateStockItem: (id, updates) => {
    const item = get().stock.find(s => s.id === id)
    if (!item) return
    set((state) => ({
      stock: state.stock.map(s => s.id === id ? { ...s, ...updates } : s)
    }))
    get().logAction('Modification Produit', `${item.name} mis à jour`)
    toast.success(`Produit mis à jour : ${item.name}`)
  },

  // ── Commandes Fournisseurs ──────────────────────────────────────
  createPurchaseOrder: (order) => {
    get().logAction('Nouvelle Commande', `Commande de ${order.totalAmount} F créée pour ${order.supplierName}`)
    set((state) => ({
      purchase_orders: [...state.purchase_orders, {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        status: order.status || 'waiting', 
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        items: order.items || [],          
        totalAmount: order.totalAmount || 0,
        notes: order.notes || '',
        expected_delivery: order.expected_delivery || null,
        received_date: null,
        received_notes: '',
        paid_date: null,
        created_by: get().activeUserId,
        boutiqueId: get().activeBoutiqueId,
      }]
    }))
    toast.success('Commande créée avec succès')
  },

  updatePurchaseOrderStatus: (orderId, status, notes = '') => {
    const order = get().purchase_orders.find(o => o.id === orderId);
    if (!order) return;

    const updates = { status };
    if (status === 'received' || status === 'debt') {
      updates.received_date = new Date().toISOString();
      updates.received_notes = notes;
    }
    if (status === 'paid') {
      updates.paid_date = new Date().toISOString();
    }

    // Si passage en reçu ou payé, on met à jour le stock
    if ((status === 'received' || status === 'paid') && (order.status !== 'received' && order.status !== 'paid' && order.status !== 'debt')) {
      order.items.forEach(item => {
        if (item.isNewProduct) {
          const newProductId = crypto.randomUUID();
          const stockItem = {
            id: newProductId,
            name: item.name,
            category: item.category,
            qty_per_type: item.qty_per_type || 1,
            current_stock: item.totalUnits,
            alert_threshold: item.alert_threshold || 10,
            price_buy: item.unitPrice,
            price_sell: item.price_sell || 0,
            expiry_date: item.expiry_date || null,
            boutiqueId: get().activeBoutiqueId
          };
          
          const stockLog = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            productId: newProductId,
            productName: item.name,
            type: 'initial',
            quantity: item.totalUnits,
            boutiqueId: get().activeBoutiqueId,
            userId: get().activeUserId,
            userName: get().users.find(u => u.id === get().activeUserId)?.name || 'Système'
          };

          set((state) => ({
            stock: [...state.stock, stockItem],
            stock_logs: [stockLog, ...state.stock_logs].slice(0, 500)
          }));
        } else if (item.stockId) {
          const stockItem = get().stock.find(s => s.id === item.stockId);
          if (stockItem) {
            const qtyToAdd = item.totalUnits || item.quantity;
            const newQty = stockItem.current_stock + qtyToAdd;
            
            const stockLog = {
              id: crypto.randomUUID(),
              date: new Date().toISOString(),
              productId: item.stockId,
              productName: stockItem.name,
              type: 'entree',
              quantity: qtyToAdd,
              reason: `Commande #${order.id.slice(0,8)}`,
              boutiqueId: get().activeBoutiqueId,
              userId: get().activeUserId,
              userName: get().users.find(u => u.id === get().activeUserId)?.name || 'Système'
            };

            set((state) => ({
              stock: state.stock.map(s => s.id === item.stockId ? { ...s, current_stock: newQty } : s),
              stock_logs: [stockLog, ...state.stock_logs].slice(0, 500)
            }));
          }
        }
      });
    }

    // Si passage en dette
    if (status === 'debt' && order.status !== 'debt') {
      get().addSupplierDebt(order.supplierId, order.totalAmount, `Commande du ${new Date(order.date).toLocaleDateString()}`)
    }

    // Si payé, on crée une dépense
    if (status === 'paid' && order.status !== 'paid') {
      if (order.status === 'debt') {
        get().paySupplierDebt(order.supplierId, order.totalAmount, `Paiement Commande #${order.id.slice(0,8)}`)
      } else {
        const newExpense = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          description: `Paiement Commande ${order.supplierName}`,
          amount: order.totalAmount,
          category: 'achat_fournisseur'
        };
        
        set((state) => ({
          expenses: [...state.expenses, newExpense]
        }))
      }
    }

    set((state) => ({
      purchase_orders: state.purchase_orders.map(o => 
        o.id === orderId ? { ...o, ...updates } : o
      )
    }))
    toast.success(`Statut de la commande mis à jour`)
  },

  deletePurchaseOrder: (orderId) => set((state) => ({
    purchase_orders: state.purchase_orders.filter(o => o.id !== orderId)
  })),

  saveInventorySession: (counts, stats, isGeneral = false) => {
    const id = crypto.randomUUID()
    
    let details = [];
    if (isGeneral) {
      details = get().stock.map(s => {
        const counted = counts[s.id] !== undefined && counts[s.id] !== '' ? counts[s.id] : 0;
        return {
          productId: s.id,
          name: s.name,
          theoretical: s.current_stock,
          counted: counted
        }
      });
    } else {
      details = Object.entries(counts).map(([productId, qty]) => ({
        productId,
        name: get().stock.find(s => s.id === productId)?.name,
        theoretical: get().stock.find(s => s.id === productId)?.current_stock,
        counted: qty
      })).filter(d => d.counted !== '');
    }

    const session = {
      id,
      date: new Date().toISOString(),
      stats,
      details,
      isGeneral,
      boutiqueId: get().activeBoutiqueId,
      userId: get().activeUserId,
      userName: get().users.find(u => u.id === get().activeUserId)?.name || 'Système'
    }

    // Appliquer les changements et logger
    session.details.forEach(detail => {
      get().updateStockQty(detail.productId, detail.counted, isGeneral ? 'Inventaire Général' : 'Inventaire Périodique')
    })

    set((state) => ({
      inventory_history: [session, ...state.inventory_history].slice(0, 100)
    }))
    
    get().logAction(isGeneral ? 'Inventaire Général Terminé' : 'Inventaire Périodique Terminé', `Correction de ${stats.discrepancyValue} F sur ${session.details.length} articles`)
    toast.success(isGeneral ? 'Inventaire général enregistré' : 'Inventaire partiel enregistré')
  },

  addToProcurementCart: (item) => {
    const alreadyIn = get().procurement_cart.find(i => i.id === item.id)
    if (alreadyIn) {
      toast.info(`${item.name} est déjà dans le panier`)
      return
    }
    set((state) => ({
      procurement_cart: [...state.procurement_cart, item]
    }))
    toast.success(`${item.name} ajouté au panier de réappro`)
  },

  removeFromProcurementCart: (id) => set((state) => ({
    procurement_cart: state.procurement_cart.filter(i => i.id !== id)
  })),

  clearProcurementCart: () => set({ procurement_cart: [] }),

  seedStock: (products) => {
    const boutiqueId = get().activeBoutiqueId;
    const newItems = products.map(p => ({
      ...p,
      id: crypto.randomUUID(),
      boutiqueId,
      qty_per_type: 1
    }));

    set((state) => ({
      stock: [...state.stock, ...newItems]
    }));
    
    get().logAction('Seed Stock', `${newItems.length} produits ajoutés`);
  },

  transferStock: (sourceBoutiqueId, destBoutiqueId, productId, quantity, reason = 'Transfert inter-boutique') => {
    const qty = Number(quantity)
    if (qty <= 0) return

    const sourceItem = get().stock.find(s => s.id === productId && (s.boutiqueId || 'b1') === sourceBoutiqueId)
    if (!sourceItem || sourceItem.current_stock < qty) {
      toast.error('Stock insuffisant pour le transfert')
      return
    }

    const destBoutique = get().boutiques.find(b => b.id === destBoutiqueId)
    if (!destBoutique) return

    // Chercher le produit correspondant dans la destination (par barcode ou nom)
    let destItem = get().stock.find(s => 
      (s.boutiqueId || 'b1') === destBoutiqueId && 
      ((sourceItem.barcode && s.barcode === sourceItem.barcode) || (s.name === sourceItem.name))
    )

    const now = new Date().toISOString()
    const transferId = crypto.randomUUID().slice(0, 8)

    // Logs
    const outLog = {
      id: crypto.randomUUID(),
      date: now,
      productId: sourceItem.id,
      productName: sourceItem.name,
      type: 'sortie',
      quantity: qty,
      reason: `${reason} vers ${destBoutique.name} (#${transferId})`,
      boutiqueId: sourceBoutiqueId,
      userId: get().activeUserId
    }

    set((state) => {
      let newStock = state.stock.map(s => 
        s.id === sourceItem.id ? { ...s, current_stock: s.current_stock - qty } : s
      )

      let destLog;
      if (destItem) {
        newStock = newStock.map(s => 
          s.id === destItem.id ? { ...s, current_stock: s.current_stock + qty } : s
        )
        destLog = {
          id: crypto.randomUUID(),
          date: now,
          productId: destItem.id,
          productName: destItem.name,
          type: 'entree',
          quantity: qty,
          reason: `${reason} depuis ${get().boutiques.find(b => b.id === sourceBoutiqueId)?.name || 'Source'} (#${transferId})`,
          boutiqueId: destBoutiqueId,
          userId: get().activeUserId
        }
      } else {
        const newDestId = crypto.randomUUID()
        const newItem = {
          ...sourceItem,
          id: newDestId,
          boutiqueId: destBoutiqueId,
          current_stock: qty,
          barcode: sourceItem.barcode || ''
        }
        newStock.push(newItem)
        destLog = {
          id: crypto.randomUUID(),
          date: now,
          productId: newDestId,
          productName: newItem.name,
          type: 'initial',
          quantity: qty,
          reason: `${reason} depuis ${get().boutiques.find(b => b.id === sourceBoutiqueId)?.name || 'Source'} (#${transferId})`,
          boutiqueId: destBoutiqueId,
          userId: get().activeUserId
        }
      }

      const transferRecord = {
        id: transferId,
        date: now,
        productId: sourceItem.id,
        productName: sourceItem.name,
        quantity: qty,
        sourceBoutiqueId,
        sourceBoutiqueName: get().boutiques.find(b => b.id === sourceBoutiqueId)?.name || 'Source',
        destBoutiqueId,
        destBoutiqueName: destBoutique.name,
        userName: get().users.find(u => u.id === get().activeUserId)?.name || 'Système',
        reason
      }

      return {
        stock: newStock,
        stock_logs: [outLog, destLog, ...state.stock_logs].slice(0, 1000),
        transfers: [transferRecord, ...(state.transfers || [])].slice(0, 500)
      }
    })

    get().logAction('Transfert Stock', `${sourceItem.name} : ${qty} unités de ${sourceBoutiqueId} vers ${destBoutiqueId}`)
    toast.success(`Transfert de ${qty} unités effectué avec succès`)
  }
});
