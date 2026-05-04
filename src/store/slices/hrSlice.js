import { toast } from 'sonner'

export const createHRSlice = (set, get) => ({
  staff_profiles: [], // { userId, base_salary, position, hire_date }
  attendance_logs: [], // { id, userId, date, status, checkIn, checkOut }
  salary_advances: [], // { id, userId, amount, date, reason, status }
  payroll_history: [], // { id, userId, month, year, net_salary, date }

  updateStaffProfile: (userId, data) => set((state) => {
    const exists = state.staff_profiles.find(p => p.userId === userId)
    if (exists) {
      return {
        staff_profiles: state.staff_profiles.map(p => p.userId === userId ? { ...p, ...data } : p)
      }
    }
    return {
      staff_profiles: [...state.staff_profiles, { userId, ...data, boutiqueId: get().activeBoutiqueId }]
    }
  }),

  logAttendance: (entry) => set((state) => ({
    attendance_logs: [{ ...entry, id: crypto.randomUUID(), date: new Date().toISOString(), boutiqueId: get().activeBoutiqueId }, ...state.attendance_logs].slice(0, 500)
  })),

  addSalaryAdvance: (advance) => {
    set((state) => ({
      salary_advances: [{ ...advance, id: crypto.randomUUID(), date: new Date().toISOString(), status: 'pending', boutiqueId: get().activeBoutiqueId }, ...state.salary_advances]
    }))
    get().logAction('Avance Salaire', `Avance de ${advance.amount} F pour un employé`)
    toast.success(`Avance de ${advance.amount} F enregistrée`)
  },

  paySalary: (payment) => {
    const { userId, amount, month, year, paymentMethod = 'cash' } = payment
    const user = get().users.find(u => u.id === userId)
    
    // Create expense in treasury
    const newExpense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      description: `Salaire ${month}/${year} : ${user?.name || 'Employé'}`,
      amount: Number(amount),
      category: 'salaire',
      paymentMethod
    }

    set((state) => {
      const newState = {
        payroll_history: [{ ...payment, id: crypto.randomUUID(), date: new Date().toISOString(), boutiqueId: get().activeBoutiqueId }, ...state.payroll_history],
        expenses: [...state.expenses, newExpense],
      }
      return newState
    })
    
    get().logAction('Paie', `Salaire versé à ${user?.name} pour ${month}/${year}`)
    toast.success(`Salaire de ${amount} F versé à ${user?.name}`)
  }
})
