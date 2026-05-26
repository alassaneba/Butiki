import { useStore } from './useStore'
import { useShallow } from 'zustand/react/shallow'

export const useFinancialStats = (boutiqueId, isConsolidated = false) => {
  return useStore(useShallow(state => {
    const allSales = state.sales || []
    const allExpenses = state.expenses || []
    const allRegisters = state.daily_cash_register || []
    const allStock = state.stock || []

    const today = new Date().toLocaleDateString()
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString()
    const now = new Date()

    const sales = isConsolidated ? allSales : allSales.filter(s => (s.boutiqueId || 'b1') === boutiqueId)
    const expenses = isConsolidated ? allExpenses : allExpenses.filter(e => (e.boutiqueId || 'b1') === boutiqueId)
    const registers = isConsolidated ? allRegisters : allRegisters.filter(r => (r.boutiqueId || 'b1') === boutiqueId)

    // Daily Sales (POS)
    const activeSales = sales.filter(s => s.status !== 'cancelled')
    const posSalesToday = activeSales
      .filter(s => new Date(s.date).toLocaleDateString() === today)
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
      
    const posSalesYesterday = activeSales
      .filter(s => new Date(s.date).toLocaleDateString() === yesterday)
      .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)

    // Manual Sales (Cash register difference)
    const todayRegs = registers.filter(r => r.date && new Date(r.date).toLocaleDateString() === today)
    const yesterdayRegs = registers.filter(r => r.date && new Date(r.date).toLocaleDateString() === yesterday)
    
    const manualSales = todayRegs.reduce((sum, r) => sum + (Number(r.calculated_sales) || 0), 0)
    
    const todaySales = posSalesToday + Math.max(0, manualSales)
    const yesterdaySales = posSalesYesterday + Math.max(0, yesterdayRegs.reduce((sum, r) => sum + (Number(r.calculated_sales) || 0), 0))
    
    let salesTrend = 0
    if (yesterdaySales > 0) {
      salesTrend = ((todaySales - yesterdaySales) / yesterdaySales) * 100
    }

    // Monthly Sales
    const currentMonthSales = activeSales.filter(s => {
      const sDate = new Date(s.date)
      return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear()
    })
    const monthlyRevenue = currentMonthSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0)

    const prevMonthSales = activeSales.filter(s => {
      const sDate = new Date(s.date)
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      return sDate.getMonth() === lastMonth && sDate.getFullYear() === year
    })
    const prevMonthlyRevenue = prevMonthSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0)
    
    let monthlyTrend = 0
    if (prevMonthlyRevenue > 0) {
      monthlyTrend = Math.round(((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100)
    }

    // COGS
    const stockMap = {}
    allStock.forEach(p => { stockMap[p.id] = Number(p.price_buy) || 0 })

    const monthlyCOGS = currentMonthSales.reduce((sum, s) => {
      if (!s.items) return sum
      const cogs = s.items.reduce((itemSum, i) => {
        const cost = Number(i.price_buy) || stockMap[i.productId] || 0
        return itemSum + (Number(i.quantity) * cost)
      }, 0)
      return sum + cogs
    }, 0)

    // Monthly Expenses
    const monthlyExpenses = expenses
      .filter(e => {
        const eDate = new Date(e.date)
        return eDate.getMonth() === now.getMonth() && eDate.getFullYear() === now.getFullYear() && e.category !== 'annulation_vente'
      })
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0)

    // Cancellations
    const cancellationsToday = expenses
      .filter(e => e.category === 'annulation_vente' && new Date(e.date).toLocaleDateString() === today)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

    const grossProfit = monthlyRevenue - monthlyCOGS
    const netProfit = grossProfit - monthlyExpenses
    const marginPercent = monthlyRevenue > 0 ? (grossProfit / monthlyRevenue) * 100 : 0

    return {
      todaySales,
      yesterdaySales,
      salesTrend,
      loggedSales: posSalesToday,
      manualSales,
      cancellationsToday,
      monthlyRevenue,
      monthlyTrend,
      monthlyCOGS,
      monthlyExpenses,
      grossProfit,
      netProfit,
      marginPercent
    }
  }))
}

export const useStockStats = (boutiqueId, isConsolidated = false) => {
  return useStore(useShallow(state => {
    const allStock = state.stock || []
    const stock = isConsolidated ? allStock : allStock.filter(s => (s.boutiqueId || 'b1') === boutiqueId)
    
    const totalStockValue = stock.reduce((acc, item) => acc + (Number(item.current_stock) * Number(item.price_buy || 0)), 0)
    const criticalStock = stock.filter(s => Number(s.current_stock) <= (Number(s.alert_threshold) || 10)).length
    const totalItems = stock.length

    return {
      totalStockValue,
      criticalStock,
      totalItems
    }
  }))
}

export const useTreasuryStats = (boutiqueId, isConsolidated = false) => {
  return useStore(useShallow(state => {
    const allRegisters = state.daily_cash_register || []
    const allFintech = state.fintech_balances || {}
    const allClients = state.clients || []
    const allSuppliers = state.suppliers || []
    const allSales = state.sales || []
    const allExpenses = state.expenses || []
    const allInflows = state.inflows || []
    const vaultBalance = state.vault_balance || 0
    
    const registers = isConsolidated ? allRegisters : allRegisters.filter(r => (r.boutiqueId || 'b1') === boutiqueId)
    const clients = isConsolidated ? allClients : allClients.filter(c => (c.boutiqueId || 'b1') === boutiqueId)
    const suppliers = isConsolidated ? allSuppliers : allSuppliers.filter(s => (s.boutiqueId || 'b1') === boutiqueId)
    
    // Total Fintech
    let totalFintech = 0
    if (isConsolidated) {
      totalFintech = Object.values(allFintech).reduce((acc, b) => acc + (Number(b.wave) || 0) + (Number(b.orange) || 0), 0)
    } else {
      const currentFintech = allFintech[boutiqueId] || { wave: 0, orange: 0 }
      totalFintech = (Number(currentFintech.wave) || 0) + (Number(currentFintech.orange) || 0)
    }

    // Cash in Register
    const activeRegisters = registers.filter(r => r.closing_balance === null)
    const cashInRegister = activeRegisters.reduce((total, r) => {
      const rDate = new Date(r.date).toLocaleDateString()
      const rBoutique = r.boutiqueId || 'b1'
      
      const rSales = allSales
        .filter(s => s.status !== 'cancelled' && new Date(s.date).toLocaleDateString() === rDate && (s.boutiqueId || 'b1') === rBoutique)
        .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0)
        
      const rExpenses = allExpenses
        .filter(e => e.paymentMethod === 'cash' && new Date(e.date).toLocaleDateString() === rDate && (e.boutiqueId || 'b1') === rBoutique)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
        
      const rInflows = allInflows
        .filter(i => i.paymentMethod === 'cash' && new Date(i.date).toLocaleDateString() === rDate && (i.boutiqueId || 'b1') === rBoutique)
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
      
      return total + (Number(r.opening_balance) || 0) + rSales + rInflows - rExpenses
    }, 0)

    const totalClientDebts = clients.reduce((acc, c) => acc + (Number(c.total_debt) || 0), 0)
    const totalSupplierDebts = suppliers.reduce((acc, f) => acc + (Number(f.total_debt) || 0), 0)
    const totalLiquidAssets = cashInRegister + vaultBalance + totalFintech

    return {
      cashInRegister,
      totalFintech,
      vaultBalance,
      totalClientDebts,
      totalSupplierDebts,
      totalLiquidAssets
    }
  }))
}
