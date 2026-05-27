import { get, set as idbSet } from 'idb-keyval'
import { useStore } from './useStore'

const HEAVY_KEYS = ['sales', 'expenses', 'daily_cash_register', 'inflows', 'transfers', 'audit_log', 'notifications']

let isSubscribed = false
const saveTimers = {}

export const hydrateHeavyData = async () => {
  const promises = HEAVY_KEYS.map(async (key) => {
    try {
      const data = await get(`butik-${key}`)
      if (data) {
        useStore.setState({ [key]: data })
      }
    } catch (err) {
      console.error(`Failed to hydrate ${key}`, err)
    }
  })

  await Promise.all(promises)

  // Only subscribe once
  if (!isSubscribed) {
    let prevState = useStore.getState()
    
    useStore.subscribe((state) => {
      HEAVY_KEYS.forEach(key => {
        if (state[key] !== prevState[key]) {
          // Debounce the save to IndexedDB to avoid UI freezes
          if (saveTimers[key]) {
            clearTimeout(saveTimers[key])
          }
          saveTimers[key] = setTimeout(() => {
            idbSet(`butik-${key}`, state[key]).catch(err => {
              console.error(`Failed to save ${key} to IDB`, err)
            })
          }, 1000)
        }
      })
      prevState = state
    })
    
    isSubscribed = true
  }
}
