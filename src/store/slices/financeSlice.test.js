import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create } from 'zustand'
import { createFinanceSlice } from './financeSlice'

// Store temporaire pour les tests
const useTestStore = create((set, get) => ({
  logAction: vi.fn(),
  config: {
    fintech_providers: [
      { name: 'Wave', value: 'wave', color: '#3b82f6' },
      { name: 'Orange Money', value: 'orange', color: '#f97316' }
    ],
    vault_categories_in: ['Dépôt Sécurité'],
    vault_categories_out: ['Retrait Gérant']
  },
  ...createFinanceSlice(set, get)
}))

describe('financeSlice - Caisse et Dépenses', () => {
  beforeEach(() => {
    useTestStore.setState({
      expenses: [],
      daily_cash_register: [],
      inflows: [],
      fixed_charges: [],
      fintech_balances: { wave: 0, orange: 0 }
    })
  })

  it('devrait calculer les ventes correctement lors de la clôture (Calcul Métier)', () => {
    // 1. Ouvrir la caisse
    useTestStore.getState().openCashRegister({ 
      opening_balance: 10000,
      opening_wave: 5000,
      opening_orange: 2000
    })
    
    const registers = useTestStore.getState().daily_cash_register
    expect(registers.length).toBe(1)
    expect(useTestStore.getState().fintech_balances.wave).toBe(5000)
    
    const caisseId = registers[0].id
    
    // 2. Clôturer avec : 
    // Cash: 15000, Dépenses: 2000, Entrées: 1000
    // Fintech: Wave 6000 (réel), Orange 2000 (réel)
    // Calcul Cash attendu : (15000 + 2000) - (10000 + 1000) = 6000 F de ventes
    useTestStore.getState().closeCashRegister(
      caisseId, 
      { cash: 15000, wave: 6000, orange: 2000 }, 
      2000, 
      1000
    )
    
    const updatedRegister = useTestStore.getState().daily_cash_register.find(r => r.id === caisseId)
    expect(updatedRegister.calculated_sales).toBe(6000)
    expect(updatedRegister.closing_balance).toBe(15000)
    
    // Vérifier les écarts Fintech
    // Wave: Système (5000) vs Réel (6000) -> Ecart +1000
    expect(updatedRegister.fintech_discrepancies.wave).toBe(1000)
    expect(updatedRegister.fintech_discrepancies.orange).toBe(0)
  })

  it('devrait gérer les dépenses via Fintech', () => {
    useTestStore.setState({ fintech_balances: { wave: 5000 } })
    
    useTestStore.getState().addExpense({
      amount: 1000,
      description: 'Achat Fournitures',
      paymentMethod: 'wave'
    })
    
    expect(useTestStore.getState().fintech_balances.wave).toBe(4000)
    expect(useTestStore.getState().expenses.length).toBe(1)
  })

  it('devrait gérer les entrées via Fintech', () => {
    useTestStore.setState({ fintech_balances: { orange: 2000 } })
    
    useTestStore.getState().addInflow({
      amount: 3000,
      description: 'Remboursement Client',
      paymentMethod: 'orange'
    })
    
    expect(useTestStore.getState().fintech_balances.orange).toBe(5000)
    expect(useTestStore.getState().inflows.length).toBe(1)
  })
})

describe('financeSlice - Gestion du Coffre (Vault)', () => {
  beforeEach(() => {
    useTestStore.setState({
      vault_balance: 0,
      vault_transactions: [],
      vault_audits: [],
      daily_cash_register: [],
      expenses: [],
      fintech_balances: { wave: 0, orange: 0 }
    })
  })

  it('devrait transférer de la caisse vers le coffre avec déduction automatique', () => {
    // 1. Ouvrir la caisse avec 50k
    useTestStore.getState().openCashRegister({ opening_balance: 50000 })
    
    // 2. Transférer 10k vers le coffre
    useTestStore.getState().transferToVault(10000, 'caisse', true, 'Dépôt Sécurité')
    
    // Vérifications
    expect(useTestStore.getState().vault_balance).toBe(10000)
    expect(useTestStore.getState().expenses.length).toBe(1)
    expect(useTestStore.getState().expenses[0].amount).toBe(10000)
    expect(useTestStore.getState().expenses[0].category).toBe('transfert_coffre')
  })

  it('devrait calculer correctement les écarts d\'audit physique du coffre', () => {
    // 1. Solde théorique de 10k
    useTestStore.setState({ vault_balance: 10000 })
    
    // 2. Audit physique de 9800 (Ecart -200)
    useTestStore.getState().performVaultAudit(9800)
    
    const audits = useTestStore.getState().vault_audits
    expect(audits.length).toBe(1)
    expect(audits[0].theoretical).toBe(10000)
    expect(audits[0].physical).toBe(9800)
    expect(audits[0].difference).toBe(-200) // Note: j'ai renommé diff en difference dans le code plus tôt
    
    // Le solde du coffre doit être mis à jour sur la base physique
    expect(useTestStore.getState().vault_balance).toBe(9800)
  })

  it('devrait transférer du coffre vers Fintech', () => {
    useTestStore.setState({ vault_balance: 20000, fintech_balances: { wave: 0, orange: 0 } })
    
    useTestStore.getState().transferVaultToFintech(5000, 'wave')
    
    expect(useTestStore.getState().vault_balance).toBe(15000)
    expect(useTestStore.getState().fintech_balances.wave).toBe(5000)
  })
})
