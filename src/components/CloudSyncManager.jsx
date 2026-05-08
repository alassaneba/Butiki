import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { get } from 'idb-keyval'
import { uploadToDrive } from '../lib/google-sync'

/**
 * 🚀 CloudSyncManager
 * Gère la synchronisation automatique en arrière-plan vers Google Drive.
 * Se déclenche toutes les 15 minutes si un token est présent.
 */
export default function CloudSyncManager() {
  const cloudToken = useStore(state => state.cloudToken)
  const setLastBackupDate = useStore(state => state.setLastBackupDate)

  useEffect(() => {
    if (!cloudToken) return

    const performSync = async () => {
      try {
        console.log('[CloudSync] Tentative de sauvegarde automatique...')
        const dataStr = await get('butik-storage')
        if (dataStr) {
          await uploadToDrive(cloudToken, dataStr)
          const now = new Date().toLocaleString()
          setLastBackupDate(now)
          console.log(`[CloudSync] Sauvegarde réussie à ${now}`)
        }
      } catch (err) {
        console.warn('[CloudSync] Échec de la sauvegarde auto:', err.message)
      }
    }

    // Sauvegarde initiale après 30s de chargement
    const initialTimer = setTimeout(performSync, 30000)

    // Intervalle toutes les 15 minutes
    const interval = setInterval(performSync, 15 * 60 * 1000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [cloudToken, setLastBackupDate])

  return null // Composant invisible
}
