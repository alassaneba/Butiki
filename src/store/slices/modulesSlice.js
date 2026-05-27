export const createModulesSlice = (set, get) => ({
  bread_logs: [],
  gas_logs: [],
  credit_logs: [],
  fintech_transactions: [],
  sales: [],
  deliveries: [],
  delivery_staff: [],

  // ─── Fintech / Mobile Money ────────────────────────────────────
  logFintechTransaction: (tx) => set((state) => {
    const newState = {
      fintech_transactions: [
        { ...tx, id: crypto.randomUUID(), date: new Date().toISOString(), boutiqueId: get().activeBoutiqueId },
        ...state.fintech_transactions
      ].slice(0, 500)
    };
    
    if (tx.status === 'confirmed') {
      const provider = tx.provider;
      const amount = Number(tx.amount);
      const isPayment = tx.type === 'payment';
      
      newState.fintech_balances = {
        ...state.fintech_balances,
        [provider]: (state.fintech_balances?.[provider] || 0) + (isPayment ? amount : -amount)
      };
    }
    
    return newState;
  }),

  // ─── Ventes Directes (POS) ──────────────────────────────────────
  addSale: (sale) => {
    const { items, totalAmount, paymentMethod, payments, clientId } = sale;
    const saleId = crypto.randomUUID();
    const date = new Date().toISOString();

    // 1. Mettre à jour le stock
    items.forEach(item => {
      const product = get().stock.find(s => s.id === item.productId);
      if (product) {
        const newQty = product.current_stock - item.quantity;
        get().updateStockQty(item.productId, newQty, 'Vente POS');
      }
    });

    // 2. Gérer le flux financier
    const paymentParts = payments || [{ method: paymentMethod || 'cash', amount: totalAmount }];

    paymentParts.forEach(part => {
      const { method, amount } = part;
      if (amount <= 0) return;

      if (method === 'credit' && clientId) {
        get().addDebt(clientId, amount, `Vente #${saleId.slice(0, 8)}`);
      } else {
        const isFintech = ['wave', 'orange'].includes(method);
        
        if (isFintech) {
          get().logFintechTransaction({
            type: 'payment',
            amount: amount,
            provider: method,
            description: `Vente POS #${saleId.slice(0, 8)}`,
            status: 'confirmed'
          });
        }

        get().addInflow({
          amount: amount,
          description: `Vente POS #${saleId.slice(0, 8)}`,
          paymentMethod: method || 'cash',
          category: 'vente'
        }, isFintech);
      }
    });

    // 3. Fidélité CRM
    if (clientId) {
      const ratio = get().config?.prices?.loyalty?.ratio || 100;
      const pointsToAdd = Math.floor(totalAmount / ratio);
      if (pointsToAdd > 0) {
        get().awardLoyaltyPoints(clientId, pointsToAdd, `Vente POS #${saleId.slice(0, 8)}`);
      }
    }

    // 4. Enregistrer la vente
    set((state) => ({
      sales: [{ ...sale, id: saleId, date, payments: paymentParts, boutiqueId: get().activeBoutiqueId }, ...state.sales].slice(0, 1000)
    }));

    get().logAction('Vente POS', `${totalAmount} F (${paymentParts.map(p => p.method).join('+')})`);
    return saleId;
  },

  cancelSale: (saleId) => {
    const sale = get().sales.find(s => s.id === saleId);
    if (!sale) return;

    // 1. Revenir sur le stock
    sale.items.forEach(item => {
      const product = get().stock.find(s => s.id === item.productId);
      if (product) {
        const newQty = product.current_stock + item.quantity;
        get().updateStockQty(item.productId, newQty, `Annulation Vente #${saleId.slice(0, 8)}`);
      }
    });

    // 2. Revenir sur les finances
    if (sale.paymentMethod === 'credit' && sale.clientId) {
      get().addDebt(sale.clientId, -sale.totalAmount, `Annulation Vente #${saleId.slice(0, 8)}`);
    } else {
      const isFintech = ['wave', 'orange'].includes(sale.paymentMethod);
      if (isFintech) {
        get().logFintechTransaction({
          type: 'refund',
          amount: sale.totalAmount,
          provider: sale.paymentMethod,
          description: `Annulation Vente POS #${saleId.slice(0, 8)}`,
          status: 'confirmed'
        });
      }

      get().addExpense({
        amount: sale.totalAmount,
        description: `Annulation Vente POS #${saleId.slice(0, 8)}`,
        paymentMethod: sale.paymentMethod || 'cash',
        category: 'annulation_vente'
      }, isFintech);
    }

    // 3. Marquer comme annulée ou supprimer
    set((state) => ({
      sales: state.sales.map(s => s.id === saleId ? { ...s, status: 'cancelled' } : s)
    }));

    get().logAction('Annulation Vente', `${sale.totalAmount} F (${sale.paymentMethod})`);
  },

  // Actions Bread
  addOrUpdateBreadLog: (supplier_id, quart, quantity) => set((state) => {
    const todayDateString = new Date().toLocaleDateString();
    const existingLogIndex = state.bread_logs.findIndex(log => 
      log.supplier_id === supplier_id && 
      new Date(log.date).toLocaleDateString() === todayDateString
    );

    const newLogs = [...state.bread_logs];
    let qtyDiff = quantity;

    if (existingLogIndex >= 0) {
      const existing = { ...newLogs[existingLogIndex] };
      const quarts = existing.received_quarts ? { ...existing.received_quarts } : { q1: 0, q2: 0, q3: 0, q4: 0 };
      
      let oldQty = 0;
      if (quart === '1er Quart') oldQty = quarts.q1;
      if (quart === '2e Quart') oldQty = quarts.q2;
      if (quart === '3e Quart') oldQty = quarts.q3;
      if (quart === '4e Quart') oldQty = quarts.q4;
      
      qtyDiff = quantity - oldQty;
      
      if (quart === '1er Quart') quarts.q1 = quantity;
      if (quart === '2e Quart') quarts.q2 = quantity;
      if (quart === '3e Quart') quarts.q3 = quantity;
      if (quart === '4e Quart') quarts.q4 = quantity;
      
      const totalReceived = quarts.q1 + quarts.q2 + quarts.q3 + quarts.q4;
      
      const retObj = (typeof existing.returned_quantity === 'object' && existing.returned_quantity !== null) 
        ? existing.returned_quantity 
        : { miche: existing.returned_quantity || 0, deuxTiers: 0, demi: 0, unTiers: 0 };

      const configPrices = get().config?.prices?.pain || { miche: 135, deuxTiers: 90, demi: 65, unTiers: 45 };

      const returnVal = 
        (Number(retObj.miche || 0) * configPrices.miche) + 
        (Number(retObj.deuxTiers || 0) * configPrices.deuxTiers) + 
        (Number(retObj.demi || 0) * configPrices.demi) + 
        (Number(retObj.unTiers || 0) * configPrices.unTiers);
        
      existing.received_quarts = quarts;
      existing.received_quantity = totalReceived;
      existing.unit_price = configPrices.miche;
      existing.total_to_pay = (totalReceived * configPrices.miche) - returnVal;
      
      newLogs[existingLogIndex] = existing;
    } else {
      const quarts = { q1: 0, q2: 0, q3: 0, q4: 0 };
      if (quart === '1er Quart') quarts.q1 = quantity;
      if (quart === '2e Quart') quarts.q2 = quantity;
      if (quart === '3e Quart') quarts.q3 = quantity;
      if (quart === '4e Quart') quarts.q4 = quantity;
      
      const configPrices = get().config?.prices?.pain || { miche: 135, deuxTiers: 90, demi: 65, unTiers: 45 };
      const newLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        supplier_id,
        received_quarts: quarts,
        received_quantity: quantity,
        returned_quantity: { miche: 0, deuxTiers: 0, demi: 0, unTiers: 0 },
        unit_price: configPrices.miche,
        total_to_pay: quantity * configPrices.miche,
        boutiqueId: get().activeBoutiqueId
      };
      newLogs.push(newLog);
    }

    get().logAction('Livraison Pain', `${quantity} miches de ${get().suppliers.find(s => s.id === supplier_id)?.name}`)

    // --- Update Stock ---
    let stock = [...state.stock];
    let stock_logs = [...state.stock_logs];
    
    if (qtyDiff !== 0) {
      let stockBreadIndex = stock.findIndex(s => s.category === 'pain');
      const configPrices = get().config?.prices?.pain || { miche: 135, deuxTiers: 90, demi: 65, unTiers: 45 };
      const configPricesVente = get().config?.prices?.pain_vente || { miche: 150, deuxTiers: 100, demi: 75, unTiers: 50 };
      
      let stockBreadId = null;
      if (stockBreadIndex === -1) {
        stockBreadId = crypto.randomUUID();
        const newBread = {
          id: stockBreadId,
          name: 'Pain (Miches)',
          category: 'pain',
          buying_price: configPrices.miche,
          selling_price: configPricesVente.miche,
          current_stock: qtyDiff,
          boutiqueId: get().activeBoutiqueId,
          barcode: 'PAIN'
        };
        stock.push(newBread);
        stock_logs.unshift({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          productId: stockBreadId,
          productName: newBread.name,
          type: qtyDiff > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(qtyDiff),
          reason: 'Ajustement Livraison Pain',
          boutiqueId: get().activeBoutiqueId
        });
      } else {
        stockBreadId = stock[stockBreadIndex].id;
        const currentQty = stock[stockBreadIndex].current_stock || 0;
        stock[stockBreadIndex] = {
          ...stock[stockBreadIndex],
          current_stock: currentQty + qtyDiff
        };
        stock_logs.unshift({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          productId: stockBreadId,
          productName: stock[stockBreadIndex].name,
          type: qtyDiff > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(qtyDiff),
          reason: 'Ajustement Livraison Pain',
          boutiqueId: get().activeBoutiqueId
        });
      }
    }

    return { bread_logs: newLogs, stock, stock_logs: stock_logs.slice(0, 500) };
  }),
  
  updateBreadLogReturn: (id, returned_quantity, total_to_pay) => set((state) => ({
    bread_logs: state.bread_logs.map(log => log.id === id ? { ...log, returned_quantity, total_to_pay } : log)
  })),

  payBreadLog: (logId, supplierName) => set((state) => {
    const log = state.bread_logs.find(l => l.id === logId);
    if (!log || log.paid) return {};
    const amount = Math.max(0, log.total_to_pay || 0);
    const newExpense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: `Paiement Pain ${supplierName}`,
      amount,
      category: 'pain'
    };
    get().logAction('Paiement Pain', `${supplierName} : ${amount} F`)
    return {
      bread_logs: state.bread_logs.map(l => l.id === logId ? { ...l, paid: true } : l),
      expenses: [...state.expenses, newExpense]
    };
  }),

  // Actions Gas
  addGasLog: (log) => {
    const totalQty = (log.b2_7_qty || 0) + (log.b6_qty || 0) + (log.b9_qty || 0) + (log.b12_qty || 0);
    get().logAction('Livraison Gaz', `${totalQty} bouteilles de ${get().suppliers.find(s => s.id === log.supplier_id)?.name}`);
    
    set((state) => {
      let stock = [...state.stock];
      let stock_logs = [...state.stock_logs];
      
      const configPrices = get().config?.prices?.gaz || { b2_7: 1500, b6: 2800, b9: 4175, b12: 6000 };
      const configPricesVente = get().config?.prices?.gaz_vente || { b2_7: 1500, b6: 2800, b9: 4175, b12: 6000 };

      const updateGasStock = (type, qty, name, bPrice, sPrice) => {
        if (qty > 0) {
          let idx = stock.findIndex(s => s.category === 'gaz' && s.name === name);
          let stockId = null;
          if (idx === -1) {
            stockId = crypto.randomUUID();
            const newGas = {
              id: stockId, name, category: 'gaz',
              buying_price: bPrice, selling_price: sPrice,
              current_stock: qty, boutiqueId: get().activeBoutiqueId, barcode: `GAZ_${type}`
            };
            stock.push(newGas);
          } else {
            stockId = stock[idx].id;
            stock[idx] = { ...stock[idx], current_stock: (stock[idx].current_stock || 0) + qty };
          }
          stock_logs.unshift({
            id: crypto.randomUUID(), date: new Date().toISOString(),
            productId: stockId, productName: name, type: 'IN', quantity: qty,
            reason: 'Livraison Gaz', boutiqueId: get().activeBoutiqueId
          });
        }
      };

      updateGasStock('b2_7', log.b2_7_qty || 0, 'Gaz B2,7kg', configPrices.b2_7, configPricesVente.b2_7);
      updateGasStock('b6', log.b6_qty || 0, 'Gaz B6kg', configPrices.b6, configPricesVente.b6);
      updateGasStock('b9', log.b9_qty || 0, 'Gaz B9kg', configPrices.b9, configPricesVente.b9);
      updateGasStock('b12', log.b12_qty || 0, 'Gaz B12kg', configPrices.b12, configPricesVente.b12);

      return {
        gas_logs: [...state.gas_logs, { ...log, id: crypto.randomUUID(), date: new Date().toISOString(), boutiqueId: get().activeBoutiqueId }],
        stock,
        stock_logs: stock_logs.slice(0, 500)
      };
    })
  },

  payGasLog: (logId, supplierName) => set((state) => {
    const log = state.gas_logs.find(l => l.id === logId);
    if (!log || log.paid) return {};
    const amount = Math.max(0, log.total_to_pay || 0);
    const newExpense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: `Paiement Gaz ${supplierName}`,
      amount,
      category: 'gaz'
    };
    get().logAction('Paiement Gaz', `${supplierName} : ${amount} F`)
    return {
      gas_logs: state.gas_logs.map(l => l.id === logId ? { ...l, paid: true } : l),
      expenses: [...state.expenses, newExpense]
    };
  }),

  // Actions Crédit Téléphonique
  addCreditLog: (log) => {
    const supplier = get().suppliers.find(s => s.id === log.supplier_id)?.name || 'Inconnu';
    const amount = log.total_to_pay || log.amount_sent || 0;
    const label = log.supplier_id ? 'Recharge Crédit' : 'Vente Crédit';
    const details = log.supplier_id 
      ? `Réception de ${amount} F de ${supplier}`
      : `${amount} F ${log.provider?.toUpperCase() || ''} (Bénéfice: ${log.profit || 0} F)`;
      
    get().logAction(label, details);

    set((state) => ({
      credit_logs: [...state.credit_logs, { ...log, id: crypto.randomUUID(), date: new Date().toISOString(), boutiqueId: get().activeBoutiqueId }]
    }));
  },

  payCreditLog: (logId, supplierName) => set((state) => {
    const log = state.credit_logs.find(l => l.id === logId);
    if (!log || log.paid) return {};
    const amount = Math.max(0, log.total_to_pay || 0);
    const newExpense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: `Paiement Crédit ${supplierName}`,
      amount,
      category: 'credit_telephonique'
    };
    get().logAction('Paiement Crédit', `${supplierName} : ${amount} F`)
    return {
      credit_logs: state.credit_logs.map(l => l.id === logId ? { ...l, paid: true } : l),
      expenses: [...state.expenses, newExpense]
    };
  }),

  // ─── Logistique & Livraisons ───────────────────────────────────
  addDeliveryStaff: (staff) => set((state) => ({
    delivery_staff: [...state.delivery_staff, { ...staff, id: crypto.randomUUID(), boutiqueId: get().activeBoutiqueId }]
  })),

  updateDeliveryStatus: (id, status, notes = '') => set((state) => ({
    deliveries: state.deliveries.map(d => d.id === id ? { ...d, status, notes, updatedAt: new Date().toISOString() } : d)
  })),

  addDeliveryOrder: (delivery) => {
    const id = crypto.randomUUID()
    set((state) => ({
      deliveries: [{ ...delivery, id, date: new Date().toISOString(), status: 'pending', boutiqueId: get().activeBoutiqueId }, ...state.deliveries]
    }))
    get().logAction('Nouvelle Livraison', `Livraison pour ${delivery.customerName}`)
    return id
  },

  createDeliveryFromSale: (saleId, deliveryData) => {
    const sale = get().sales.find(s => s.id === saleId);
    if (!sale) return;
    
    return get().addDeliveryOrder({
      ...deliveryData,
      saleId: sale.id,
      customerName: deliveryData.customerName || sale.customerName || 'Client POS',
      phone: deliveryData.phone || sale.customerPhone || '',
      fee: deliveryData.fee || 0,
      status: 'pending'
    });
  }
});
