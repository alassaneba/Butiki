/**
 * Module d'interface avec imprimantes thermiques Bluetooth (Protocole ESC/POS)
 * Nécessite Google Chrome ou Edge M56+
 */

export const printReceipt = async (receiptData) => {
  if (!navigator.bluetooth) {
    throw new Error("Le Bluetooth Web n'est pas supporté par ce navigateur (Utilisez Chrome/Edge sur Android ou PC).")
  }

  try {
    // 1. Demande d'appareil à l'utilisateur
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2'  // Autre UUID fréquent
      ]
    })

    if (!device.gatt) throw new Error("Cet appareil ne supporte pas la connexion GATT.")

    // 2. Connexion GATT
    const server = await device.gatt.connect()
    
    // 3. Recherche du service (on tente le premier connu)
    const services = await server.getPrimaryServices()
    if (services.length === 0) {
       await server.disconnect()
       throw new Error("Aucun service d'impression trouvé sur ce périphérique.")
    }
    const service = services[0] 

    // 4. Recherche de la caractéristique d'écriture
    const characteristics = await service.getCharacteristics()
    const writeCharacteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse)
    
    if (!writeCharacteristic) {
       await server.disconnect()
       throw new Error("Impossible d'envoyer des données à cette imprimante.")
    }

    // 5. Encodage du texte et des commandes ESC/POS en ArrayBuffer
    const encoder = new TextEncoder()
    
    // Commandes basiques ESC/POS
    const INIT = new Uint8Array([0x1B, 0x40]) // Reset ESP/POS
    const ALIGN_CENTER = new Uint8Array([0x1B, 0x61, 0x01])
    const ALIGN_LEFT = new Uint8Array([0x1B, 0x61, 0x00])
    const FEED_AND_CUT = new Uint8Array([0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x41, 0x10])
    
    const textData = encoder.encode(receiptData)

    // Fusion de toutes les commandes
    const buffer = new Uint8Array(INIT.length + ALIGN_CENTER.length + textData.length + FEED_AND_CUT.length)
    buffer.set(INIT, 0)
    buffer.set(ALIGN_CENTER, INIT.length)
    buffer.set(textData, INIT.length + ALIGN_CENTER.length)
    buffer.set(FEED_AND_CUT, INIT.length + ALIGN_CENTER.length + textData.length)

    // 6. Envoi par paquets de 512 octets (Limitation Bluetooth LE courante)
    const CHUNK_SIZE = 512
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      const chunk = buffer.slice(i, i + CHUNK_SIZE)
      if (writeCharacteristic.properties.writeWithoutResponse) {
         await writeCharacteristic.writeValueWithoutResponse(chunk)
      } else {
         await writeCharacteristic.writeValue(chunk)
      }
    }

    // Déconnexion propre
    await server.disconnect()
    return true

  } catch (error) {
    console.error("Erreur Impression Bluetooth :", error)
    throw error // Propager à l'UI
  }
}

// Fonction utilitaire pour formater un ticket de clôture Butiki
export const formatClosingReceipt = (register, expenses) => {
    let receiptText = "==============================\n"
    receiptText += "     BUTIKI - CLOTURE \n"
    receiptText += "==============================\n\n"
    receiptText += `Date: ${new Date(register.date).toLocaleDateString()}\n`
    receiptText += `Gerant: ${register.manager_name || 'Non specifie'}\n`
    receiptText += `Fond de caisse: ${register.opening_balance} FCFA\n`
    
    if (expenses.length > 0) {
      receiptText += `\nDEPENSES DU JOUR:\n`
      expenses.forEach(e => {
        receiptText += `- ${(e.description || e.reason || 'Depense').substring(0, 15)}: ${e.amount} FCFA\n`
      })
    }

    const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0)
    receiptText += `\n------------------------------\n`
    receiptText += `Caisse Finale: ${register.closing_balance} FCFA\n`
    
    if (register.fintech_snapshots) {
      receiptText += `\nRECONCILIATION FINTECH:\n`
      const diffW = register.fintech_discrepancies?.wave || 0
      const diffO = register.fintech_discrepancies?.orange || 0
      
      receiptText += `Wave: ${register.closing_wave || 0} F (${diffW >= 0 ? '+' : ''}${diffW})\n`
      receiptText += `Orange Money: ${register.closing_orange || 0} F (${diffO >= 0 ? '+' : ''}${diffO})\n`
      
      if (diffW !== 0 || diffO !== 0) {
        receiptText += `!! ECART DETECTE !!\n`
      } else {
        receiptText += `ETAT FINTECH: OK\n`
      }
    }

    receiptText += `\n------------------------------\n`
    receiptText += `Total Depenses: ${expensesTotal} FCFA\n`
    receiptText += `VENTES NETTES : ${register.calculated_sales} FCFA\n`
    receiptText += "==============================\n"
    receiptText += "      Merci et a demain! \n\n\n"
    
    // On remplace les caractères spéciaux pour l'imprimante ASCII classique
    return receiptText.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// Fonction pour formater un ticket de vente POS
export const formatSaleReceipt = (sale, boutiqueInfo = {}) => {
    let receiptText = "==============================\n"
    receiptText += `   ${(boutiqueInfo.boutiqueName || "BUTIKI").toUpperCase()}   \n`
    if (boutiqueInfo.boutiqueAddress) receiptText += `${boutiqueInfo.boutiqueAddress}\n`
    receiptText += "==============================\n\n"
    
    receiptText += `TICKET #${sale.id.substring(0, 8).toUpperCase()}\n`
    receiptText += `Date: ${new Date(sale.date).toLocaleString('fr-FR')}\n`
    
    if (sale.payments && sale.payments.length > 1) {
      receiptText += "Paiement: COMBINE\n"
      sale.payments.forEach(p => {
        receiptText += `- ${p.method.toUpperCase()}: ${p.amount} F\n`
      })
    } else {
      const method = sale.payments?.[0]?.method || sale.paymentMethod || 'CASH'
      receiptText += `Paiement: ${method.toUpperCase()}\n`
    }
    
    receiptText += "------------------------------\n"
    
    sale.items.forEach(item => {
      receiptText += `${item.name.substring(0, 20)}\n`
      receiptText += `${item.quantity} x ${item.unitPrice} F = ${item.quantity * item.unitPrice} F\n`
    })
    
    receiptText += "------------------------------\n"
    const subTotal = sale.items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0)
    if (sale.discountAmount > 0) {
      receiptText += `Sous-Total: ${subTotal.toLocaleString()} F\n`
      receiptText += `Remise: -${sale.discountAmount.toLocaleString()} F\n`
    }
    receiptText += `TOTAL A PAYER: ${sale.totalAmount.toLocaleString()} F\n`
    receiptText += "==============================\n"
    receiptText += "   Merci de votre visite ! \n\n\n"
    
    return receiptText.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}
