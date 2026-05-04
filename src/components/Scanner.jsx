import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function Scanner({ onScanSuccess }) {
  const scannerRef = useRef(null)

  useEffect(() => {
    // Création de l'instance scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      },
      false
    )
    
    scannerRef.current = scanner

    scanner.render(
      (decodedText) => {
        // Succès
        onScanSuccess(decodedText)
        // Autoclose après un scan réussi pour éviter la lecture multiple
        scanner.clear()
      },
      (error) => {
        // Ignorer les erreurs frame par frame (pas de Qr code détecté)
      }
    )

    return () => {
      // Nettoyage à la destruction du composant
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [onScanSuccess])

  return (
    <div className="w-full bg-card rounded-xl p-4 shadow-sm border border-border">
      <h3 className="font-semibold text-center mb-4 text-primary">Scanner un Produit</h3>
      <div id="reader" className="w-full mx-auto overflow-hidden rounded-lg"></div>
      <p className="text-xs text-muted-foreground text-center mt-4">Placez le code-barre dans le cadre.</p>
    </div>
  )
}
