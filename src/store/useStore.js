import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set as idbSet, del } from 'idb-keyval'

import { createCoreSlice } from './slices/coreSlice'
import { createStockSlice } from './slices/stockSlice'
import { createFinanceSlice } from './slices/financeSlice'
import { createPeopleSlice } from './slices/peopleSlice'
import { createModulesSlice } from './slices/modulesSlice'
import { createHRSlice } from './slices/hrSlice'

// Storage personnalisé pour Zustand via idb-keyval
const idbStorage = {
  getItem: async (name) => {
    return (await get(name)) || null
  },
  setItem: async (name, value) => {
    await idbSet(name, value)
  },
  removeItem: async (name) => {
    await del(name)
  },
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...createCoreSlice(set, get),
      ...createStockSlice(set, get),
      ...createFinanceSlice(set, get),
      ...createPeopleSlice(set, get),
      ...createModulesSlice(set, get),
      ...createHRSlice(set, get),

      applySenegalSeed: async () => {
        const { SENEGAL_PRODUCTS, SENEGAL_SUPPLIERS } = await import('./seedData');
        get().seedStock(SENEGAL_PRODUCTS);
        get().seedSuppliers(SENEGAL_SUPPLIERS);
      }
    }),
    {
      name: 'butik-storage',
      storage: createJSONStorage(() => idbStorage),
      // 🚀 P3b — Exclure audit_log et notifications de la persistence IDB
      // Ces données sont re-générées en session et n'ont pas besoin d'alourdir
      // le payload de sérialisation (audit_log = jusqu'à 500 entrées JSON)
      partialize: (state) => {
        // eslint-disable-next-line no-unused-vars
        const { audit_log, notifications, ...persistedState } = state
        return persistedState
      },
    }
  )
)
