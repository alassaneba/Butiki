import { get, set as idbSet } from 'idb-keyval'
import { useStore } from './useStore'

const HEAVY_KEYS = ['sales', 'expenses', 'daily_cash_register', 'inflows', 'transfers']

let isSubscribed = false

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
          idbSet(`butik-${key}`, state[key]).catch(err => {
            console.error(`Failed to save ${key} to IDB`, err)
          })
        }
      })
      prevState = state
    })
    
    isSubscribed = true
  }
}
