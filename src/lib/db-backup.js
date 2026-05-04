import { get, set } from 'idb-keyval'

/**
 * Exporte toutes les données Butiki sous forme de fichier JSON
 */
export const exportBackup = async () => {
  try {
    const data = await get('butiki-storage')
    if (!data) return alert('Aucune donnée à exporter.')

    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `butiki-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Erreur lors de l'exportation:", error)
    alert("Erreur lors de l'exportation.")
  }
}

/**
 * Importe un fichier de backup JSON et écrase les données actuelles
 */
export const importBackup = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const content = e.target.result
        // Vérification de la validité JSON
        JSON.parse(content)
        
        await set('butiki-storage', content)
        // Rechargement nécessaire pour que Zustand relise la base
        window.location.reload()
        resolve(true)
      } catch (err) {
        console.error("Fichier de backup invalide", err)
        reject(new Error("Le fichier fourni n'est pas un backup valid."))
      }
    }
    
    reader.readAsText(file)
  })
}
