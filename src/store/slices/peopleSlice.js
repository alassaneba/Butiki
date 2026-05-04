import { toast } from 'sonner'

export const createPeopleSlice = (set, get) => ({
  suppliers: [],
  clients: [],
  supplier_evaluations: [],

  addSupplierEvaluation: (evalData) => set((state) => {
    const supplier = state.suppliers.find(s => s.id === evalData.supplierId)
    
    // Alerte automatique si note < 3
    if (evalData.rating < 3 && supplier) {
      get().addNotification({
        type: 'warning',
        title: 'Performance Fournisseur Faible',
        message: `Le fournisseur ${supplier.name} a été noté ${evalData.rating}/5. Pensez à revoir votre partenariat.`,
        refId: supplier.id
      })
    }

    return {
      supplier_evaluations: [
        { ...evalData, id: crypto.randomUUID(), date: new Date().toISOString() },
        ...state.supplier_evaluations
      ],
      suppliers: state.suppliers.map(s => s.id === evalData.supplierId ? { ...s, rating: evalData.rating } : s)
    }
  }),

  addSupplier: (supplier) => {
    set((state) => {
      const initialDebt = supplier.total_debt || 0;
      const firstTransaction = initialDebt > 0 ? [{
        id: crypto.randomUUID(),
        type: 'dette',
        libelle: supplier.libelle_initial || 'Dette initiale',
        amount: initialDebt,
        balance: initialDebt,
        date: new Date().toISOString()
      }] : [];
      return {
        suppliers: [...state.suppliers, {
          ...supplier,
          id: crypto.randomUUID(),
          total_debt: initialDebt,
          transactions: firstTransaction,
          rating: 0,
          createdAt: new Date().toISOString()
        }]
      };
    })
    get().logAction('Nouveau Fournisseur', `${supplier.name} ajouté`)
    toast.success(`Fournisseur ajouté : ${supplier.name}`)
  },

  addSupplierDebt: (supplierId, amount, libelle) => {
    const supplier = get().suppliers.find(s => s.id === supplierId)
    get().logAction('Dette Fournisseur', `+${amount} F pour ${supplier?.name} (${libelle})`)
    set((state) => ({
      suppliers: state.suppliers.map(s => {
        if (s.id !== supplierId) return s;
        const newDebt = (s.total_debt || 0) + Number(amount);
        const tx = {
          id: crypto.randomUUID(),
          type: 'dette',
          libelle: libelle || 'Nouvelle dette',
          amount: Number(amount),
          balance: newDebt,
          date: new Date().toISOString()
        };
        return { ...s, total_debt: newDebt, transactions: [...(s.transactions || []), tx] };
      })
    }))
    toast.success(`Nouvelle dette ajoutée pour le fournisseur`)
  },

  paySupplierDebt: (supplierId, amount, libelle, paymentMethod = 'cash') => {
    const supplier = get().suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    get().logAction('Paiement Fournisseur', `-${amount} F pour ${supplier.name} (${libelle}) [${paymentMethod}]`)
    
    const newDebt = Math.max(0, (supplier.total_debt || 0) - Number(amount));
    const tx = {
      id: crypto.randomUUID(),
      type: 'paiement',
      libelle: libelle || 'Remboursement',
      amount: Number(amount),
      balance: newDebt,
      date: new Date().toISOString()
    };

    const newExpense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: `Remboursement Dette : ${supplier.name} (${libelle || 'Paiement'})`,
      amount: Number(amount),
      category: 'achat_fournisseur',
      paymentMethod
    };

    set((state) => {
      const newState = {
        suppliers: state.suppliers.map(s => s.id === supplierId ? { ...s, total_debt: newDebt, transactions: [...(s.transactions || []), tx] } : s),
        expenses: [...state.expenses, newExpense]
      }
      if (paymentMethod !== 'cash') {
        newState.fintech_balances = {
          ...state.fintech_balances,
          [paymentMethod]: (state.fintech_balances?.[paymentMethod] || 0) - Number(amount)
        }
      }
      return newState
    })
    toast.success(`Paiement de ${amount} F enregistré pour le fournisseur`)
  },
  
  addClient: (client) => {
    set((state) => {
      const initialDebt = client.total_debt || 0;
      const firstTransaction = initialDebt !== 0 ? [{
        id: crypto.randomUUID(),
        type: initialDebt > 0 ? 'dette' : 'paiement',
        libelle: client.libelle_initial || 'Solde initial',
        amount: Math.abs(initialDebt),
        balance: initialDebt,
        date: new Date().toISOString()
      }] : [];
      return {
        clients: [...state.clients, {
          ...client,
          id: crypto.randomUUID(),
          total_debt: initialDebt,
          pending_items: client.pending_items || '',
          loyalty_points: 0,
          loyalty_logs: [],
          transactions: firstTransaction
        }]
      };
    })
    get().logAction('Nouveau Client', `${client.name} ajouté`)
    toast.success(`Client ajouté : ${client.name}`)
  },

  awardLoyaltyPoints: (clientId, points, reason) => {
    set((state) => ({
      clients: state.clients.map(c => c.id === clientId ? { 
        ...c, 
        loyalty_points: (c.loyalty_points || 0) + Number(points),
        loyalty_logs: [
          { id: crypto.randomUUID(), date: new Date().toISOString(), points: Number(points), reason },
          ...(c.loyalty_logs || [])
        ].slice(0, 50)
      } : c)
    }))
  },

  useLoyaltyPoints: (clientId, points, amountReduced) => {
    set((state) => ({
      clients: state.clients.map(c => c.id === clientId ? { 
        ...c, 
        loyalty_points: Math.max(0, (c.loyalty_points || 0) - Number(points)),
        loyalty_logs: [
          { id: crypto.randomUUID(), date: new Date().toISOString(), points: -Number(points), reason: `Réduction de ${amountReduced} F` },
          ...(c.loyalty_logs || [])
        ].slice(0, 50)
      } : c)
    }))
    get().logAction('Fidélité', `${points} points utilisés pour ${get().clients.find(c => c.id === clientId)?.name}`)
  },

  addDebt: (clientId, amount, libelle) => {
    set((state) => ({
      clients: state.clients.map(c => {
        if (c.id !== clientId) return c;
        const newDebt = (c.total_debt || 0) + Number(amount);
        const tx = {
          id: crypto.randomUUID(),
          type: 'dette',
          libelle: libelle || 'Nouvelle dette',
          amount: Number(amount),
          balance: newDebt,
          date: new Date().toISOString()
        };
        return { ...c, total_debt: newDebt, transactions: [...(c.transactions || []), tx] };
      })
    }))
    get().logAction('Dette Client', `+${amount} F pour ${get().clients.find(c => c.id === clientId)?.name} (${libelle})`)
    toast.success('Nouvelle dette ajoutée pour le client')
  },

  payDebt: (clientId, amount, libelle, paymentMethod = 'cash') => {
    set((state) => {
      const client = state.clients.find(c => c.id === clientId);
      const inflow = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        description: `Remboursement : ${client?.name || 'Client'}`,
        amount: Number(amount),
        category: 'remboursement',
        clientId: clientId,
        paymentMethod
      };
  
      const newState = {
        clients: state.clients.map(c => {
          if (c.id !== clientId) return c;
          const newDebt = (c.total_debt || 0) - Number(amount);
          const tx = {
            id: crypto.randomUUID(),
            type: 'paiement',
            libelle: libelle || 'Remboursement',
            amount: Number(amount),
            balance: newDebt,
            date: new Date().toISOString()
          };
          return { ...c, total_debt: newDebt, transactions: [...(c.transactions || []), tx] };
        }),
        debt_payments: [...state.debt_payments, { id: crypto.randomUUID(), client_id: clientId, amount: Number(amount), date: new Date().toISOString() }],
        inflows: [inflow, ...state.inflows]
      };

      if (paymentMethod !== 'cash') {
        newState.fintech_balances = {
          ...state.fintech_balances,
          [paymentMethod]: (state.fintech_balances?.[paymentMethod] || 0) + Number(amount)
        }
      }

      return newState
    })
    get().logAction('Paiement Client', `-${amount} F de ${get().clients.find(c => c.id === clientId)?.name} (${libelle})`)
    toast.success(`Paiement de ${amount} F enregistré`)
  },

  updateClient: (clientId, updates) => set((state) => ({
    clients: state.clients.map(c => c.id === clientId ? { ...c, ...updates } : c)
  })),

  updateClientTag: (clientId, tag) => get().updateClient(clientId, { tag }),

  deleteClient: (clientId) => {
    const client = get().clients.find(c => c.id === clientId)
    get().logAction('Suppression Client', `Client ${client?.name} supprimé`)
    set((state) => ({
      clients: state.clients.filter(c => c.id !== clientId)
    }))
    toast.success('Client supprimé avec succès')
  }
});
