import { toast } from 'sonner'

export const createFinanceSlice = (set, get) => ({
  expenses: [],
  daily_cash_register: [],
  debt_payments: [],
  inflows: [],
  fixed_charges: [], // Loyer, Électricité, etc.
  fintech_balances: {}, // Dynamique: { wave: 0, orange: 0, free: 0, ... }
  vault_balance: 0,
  vault_transactions: [],
  vault_audits: [],

  addFixedCharge: (charge) => {
    set((state) => ({
      fixed_charges: [
        { ...charge, id: crypto.randomUUID(), createdAt: new Date().toISOString(), boutiqueId: get().activeBoutiqueId },
        ...(state.fixed_charges || [])
      ]
    }))
    toast.success('Nouvelle charge ajoutée')
  },

  payFixedCharge: (chargeId, amount) => {
    const charge = get().fixed_charges.find(c => c.id === chargeId)
    if (!charge) return

    const newExpense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: `Paiement Charge : ${charge.label}`,
      amount: Number(amount),
      category: 'charge_fixe',
      boutiqueId: get().activeBoutiqueId
    }

    set((state) => ({
      fixed_charges: state.fixed_charges.map(c => 
        c.id === chargeId ? { ...c, lastPaidDate: new Date().toISOString(), status: 'paid' } : c
      ),
      expenses: [...state.expenses, newExpense]
    }))
    
    get().logAction('Paiement Charge', `${charge.label} : ${amount} F`)
    toast.success(`Paiement de la charge enregistré : ${charge.label}`)
  },

  addExpense: (expense, skipFintechUpdate = false) => {
    const { amount, paymentMethod = 'cash' } = expense
    set((state) => {
      const newState = {
        expenses: [...state.expenses, { ...expense, id: crypto.randomUUID(), date: new Date().toISOString(), boutiqueId: get().activeBoutiqueId }]
      }
      if (paymentMethod !== 'cash' && !skipFintechUpdate) {
        const providerKey = paymentMethod
        newState.fintech_balances = {
          ...state.fintech_balances,
          [providerKey]: (state.fintech_balances[providerKey] || 0) - Number(amount)
        }
      }
      return newState
    })
    get().logAction('Dépense', `${expense.description} : ${amount} F`)
    toast.success('Dépense enregistrée')
  },

  addInflow: (inflow, skipFintechUpdate = false) => {
    const { amount, paymentMethod = 'cash' } = inflow
    set((state) => {
      const newState = {
        inflows: [{ ...inflow, id: crypto.randomUUID(), date: new Date().toISOString(), boutiqueId: get().activeBoutiqueId }, ...state.inflows]
      }
      if (paymentMethod !== 'cash' && !skipFintechUpdate) {
        const providerKey = paymentMethod
        newState.fintech_balances = {
          ...state.fintech_balances,
          [providerKey]: (state.fintech_balances[providerKey] || 0) + Number(amount)
        }
      }
      return newState
    })
    get().logAction('Entrée', `${inflow.description} : ${amount} F`)
    toast.success('Entrée enregistrée')
  },

  transferFintechToCash: (provider, amount) => {
    set((state) => ({
      fintech_balances: {
        ...state.fintech_balances,
        [provider]: (state.fintech_balances[provider] || 0) - Number(amount)
      },
      inflows: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        amount: Number(amount),
        description: `Retrait ${provider.toUpperCase()} vers Caisse`,
        paymentMethod: 'cash',
        boutiqueId: get().activeBoutiqueId
      }, ...state.inflows]
    }))
    toast.success(`Transfert de ${amount} F effectué vers la caisse physique`)
  },

  openCashRegister: (data) => {
    set((state) => {
      const newBalances = { ...state.fintech_balances }
      Object.keys(data).forEach(key => {
        if (key.startsWith('opening_')) {
          const provider = key.replace('opening_', '')
          if (provider !== 'balance') {
            newBalances[provider] = Number(data[key])
          }
        }
      })

      return {
        daily_cash_register: [...state.daily_cash_register, { ...data, id: crypto.randomUUID(), date: new Date().toISOString(), boutiqueId: get().activeBoutiqueId, closing_balance: null, calculated_sales: null }],
        fintech_balances: newBalances
      }
    })
    get().logAction('Ouverture Caisse', `Ouverture par ${data.manager_name} (Fonds: ${data.opening_balance} F)`)
    toast.success('Caisse ouverte avec succès')
  },

  closeCashRegister: (id, closing_input, expenses_total, inflows_total = 0, closing_manager_name = '') => {
    const { cash, ...fintech_closing } = closing_input
    
    set((state) => ({
      daily_cash_register: state.daily_cash_register.map(register => {
        if (register.id === id) {
          const discrepancies = {}
          Object.keys(state.fintech_balances).forEach(provider => {
            const systemValue = state.fintech_balances[provider] || 0
            const realValue = Number(fintech_closing[provider]) || 0
            discrepancies[provider] = realValue - systemValue
          })
          
          return {
            ...register,
            closing_balance: Number(cash),
            closing_fintech: fintech_closing,
            closing_manager_name: closing_manager_name || register.manager_name,
            calculated_sales: (Number(cash) + Number(expenses_total)) - (Number(register.opening_balance) + Number(inflows_total)),
            fintech_snapshots: { ...state.fintech_balances },
            fintech_discrepancies: discrepancies
          }
        }
        return register
      })
    }))
    get().logAction('Clôture Caisse', `Clôture par ${closing_manager_name} (CA: ${((Number(cash) + Number(expenses_total)) - (Number(get().daily_cash_register.find(r => r.id === id)?.opening_balance) + Number(inflows_total)))} F)`)
    toast.success('Caisse clôturée avec succès')
  },

  transferToVault: (amount, source = 'caisse', deductFromCash = false, category = 'Dépôt Sécurité') => {
    const numAmount = Number(amount)
    set((state) => {
      const newState = {
        vault_balance: (state.vault_balance || 0) + numAmount,
        vault_transactions: [{
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          type: 'in',
          amount: numAmount,
          source,
          category,
          boutiqueId: get().activeBoutiqueId,
          description: category === 'Dépôt Sécurité' ? `Dépôt venant de : ${source.toUpperCase()}` : category
        }, ...(state.vault_transactions || [])]
      }

      if (deductFromCash) {
        newState.expenses = [
          ...(state.expenses || []),
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            description: `Transfert vers COFFRE`,
            amount: numAmount,
            category: 'transfert_coffre',
            boutiqueId: get().activeBoutiqueId
          }
        ]
      }

      return newState
    })
    get().logAction('Dépôt Coffre', `${category} : ${numAmount} F (Source: ${source})`)
    toast.success(`Montant de ${numAmount.toLocaleString()} F transféré au dépôt`)
  },

  withdrawFromVault: (amount, reason, category = 'Retrait Gérant') => {
    const numAmount = Number(amount)
    if (get().vault_balance < numAmount) {
      toast.error('Solde du dépôt insuffisant')
      return false
    }
    set((state) => ({
      vault_balance: state.vault_balance - numAmount,
      vault_transactions: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'out',
        amount: numAmount,
        category,
        description: reason,
        boutiqueId: get().activeBoutiqueId
      }, ...(state.vault_transactions || [])]
    }))
    get().logAction('Retrait Coffre', `${category} : ${numAmount} F (Raison: ${reason})`)
    toast.success('Retrait du dépôt effectué')
    return true
  },

  performVaultAudit: (physicalAmount) => {
    const theoretical = get().vault_balance || 0
    const difference = Number(physicalAmount) - theoretical
    
    const audit = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      theoretical,
      physical: Number(physicalAmount),
      difference,
      boutiqueId: get().activeBoutiqueId
    }

    set((state) => ({
      vault_audits: [audit, ...(state.vault_audits || [])],
      vault_balance: Number(physicalAmount)
    }))

    if (difference === 0) {
      toast.success('Audit du coffre : Solde parfait !')
    } else {
      toast.warning(`Audit du coffre : Écart de ${difference.toLocaleString()} F détecté`)
    }
    
    get().logAction('Audit Coffre', `Inventaire physique : ${physicalAmount} F (Écart: ${difference} F)`)
    return audit
  },

  transferVaultToFintech: (amount, provider) => {
    const numAmount = Number(amount)
    if (get().vault_balance < numAmount) {
      toast.error('Solde du coffre insuffisant pour ce transfert')
      return false
    }

    set((state) => ({
      vault_balance: state.vault_balance - numAmount,
      vault_transactions: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'out',
        amount: numAmount,
        category: 'Dépôt Bancaire/Fintech',
        description: `Transfert vers ${provider.toUpperCase()}`,
        boutiqueId: get().activeBoutiqueId
      }, ...(state.vault_transactions || [])],
      fintech_balances: {
        ...state.fintech_balances,
        [provider]: (state.fintech_balances[provider] || 0) + numAmount
      }
    }))

    toast.success(`Transfert de ${numAmount.toLocaleString()} F vers ${provider.toUpperCase()} effectué`)
    get().logAction('Trésorerie', `Coffre -> ${provider.toUpperCase()} : ${numAmount} F`)
    return true
  },

  transferVaultToCash: (amount) => {
    const numAmount = Number(amount)
    if (get().vault_balance < numAmount) {
      toast.error('Solde du coffre insuffisant')
      return false
    }

    set((state) => ({
      vault_balance: state.vault_balance - numAmount,
      vault_transactions: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'out',
        amount: numAmount,
        category: 'Alimentation Caisse',
        description: `Sortie coffre pour fond de caisse`
      }, ...(state.vault_transactions || [])],
      inflows: [{
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        amount: numAmount,
        description: `Alimentation depuis COFFRE`,
        paymentMethod: 'cash',
        boutiqueId: get().activeBoutiqueId
      }, ...(state.inflows || [])]
    }))

    toast.success(`Caisse alimentée de ${numAmount.toLocaleString()} F depuis le coffre`)
    get().logAction('Trésorerie', `Coffre -> Caisse : ${numAmount} F`)
    return true
  }

});
