import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStore } from './useStore'

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}))

describe('Zustand Store - Logique Métier', () => {
  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    useStore.setState({
      daily_cash_register: [],
      expenses: [],
      inflows: [],
      bread_logs: [],
      gas_logs: [],
      credit_logs: [],
      fintech_balances: {},
      config: {
        fintech_providers: [],
        phone_credit_providers: []
      }
    })
  })

  it('devrait ouvrir une caisse correctement', () => {
    useStore.getState().openCashRegister({ opening_balance: 50000 })
    const state = useStore.getState()
    
    expect(state.daily_cash_register.length).toBe(1)
    expect(state.daily_cash_register[0].opening_balance).toBe(50000)
    expect(state.daily_cash_register[0].closing_balance).toBeNull()
  })

  it('devrait calculer correctement les ventes nettes à la clôture', () => {
    // 1. Ouverture
    useStore.getState().openCashRegister({ opening_balance: 10000 })
    
    const activeRegister = useStore.getState().daily_cash_register[0]
    
    // 2. Clôturer avec 50000 en espèces, et 5000 de dépenses
    // Formule: (Cash_Arrêt + Dépenses) - (Fond_Initial + Entrées)
    // = (50000 + 5000) - (10000 + 0) = 45000
    useStore.getState().closeCashRegister(activeRegister.id, { cash: 50000 }, 5000, 0)
    
    const state = useStore.getState()
    const closedRegister = state.daily_cash_register[0]
    
    expect(closedRegister.closing_balance).toBe(50000)
    expect(closedRegister.calculated_sales).toBe(45000)
  })

  it('devrait ajouter une dépense correctement', () => {
    useStore.getState().addExpense({ amount: 1500, description: 'Achat de balais', category: 'fourniture' })
    const state = useStore.getState()
    
    expect(state.expenses.length).toBe(1)
    expect(state.expenses[0].amount).toBe(1500)
    expect(state.expenses[0].description).toBe('Achat de balais')
  })

  it('devrait calculer le total à payer pour le gaz', () => {
    useStore.getState().addGasLog({
      supplier_id: 'supplier-1',
      b6_qty: 2, // 2800 * 2 = 5600
      b9_qty: 1, // 4175 * 1 = 4175
      b12_qty: 0, // 6000 * 0 = 0
      total_to_pay: 5600 + 4175
    })
    const state = useStore.getState()
    
    expect(state.gas_logs.length).toBe(1)
    expect(state.gas_logs[0].total_to_pay).toBe(9775)
    expect(state.gas_logs[0].paid).toBeFalsy()
  })

  it('devrait marquer un log de crédit comme payé', () => {
    useStore.getState().addCreditLog({
      supplier_id: 'supplier-2',
      operator_breakdown: { wave: 10000 },
      total_to_pay: 10000,
      paid: false
    })
    
    const logId = useStore.getState().credit_logs[0].id
    
    useStore.getState().payCreditLog(logId, 'Fournisseur')
    const state = useStore.getState()
    
    expect(state.credit_logs[0].paid).toBe(true)
  })
})
