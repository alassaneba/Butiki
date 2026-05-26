import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { LayoutGrid, History, ShoppingCart, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { toast } from 'sonner'
import { formatSaleReceipt, printReceipt } from '../lib/bluetooth'
import { useVoiceInput } from '../lib/useVoiceInput'

import VentesTerminal from './ventes/VentesTerminal'
import VentesHistory from './ventes/VentesHistory'
import VentesCart from './ventes/VentesCart'
import { SuccessModal, NewClientModal, SaleDetailsModal } from './ventes/VentesModals'

const formatF = (val) => `${Number(val || 0).toLocaleString('fr-FR')} F`

export default function Ventes() {
  const navigate = useNavigate()
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allStock = useStore(state => state.stock) || []
  const allSales = useStore(state => state.sales) || []
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const sales = useMemo(() => allSales.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allSales, activeBoutiqueId])
  const allClients = useStore(state => state.clients) || []
  const clients = useMemo(() => allClients.filter(c => (c.boutiqueId || 'b1') === activeBoutiqueId), [allClients, activeBoutiqueId])
  const config = useStore(state => state.config)
  const addSale = useStore(state => state.addSale)
  const cancelSale = useStore(state => state.cancelSale)
  const addClient = useStore(state => state.addClient)
  const useLoyaltyPoints = useStore(state => state.useLoyaltyPoints)

  // États globaux partagés
  const [ui, setUi] = useState({ 
    activeTab: 'terminal', 
    viewMode: 'list', 
    showCartDrawer: false, 
    showSuccess: false,
    showNewClientDialog: false,
    isScanning: false,
    historySearch: '',
    allowLoss: false
  })
  const [terminal, setTerminal] = useState({
    searchTerm: '',
    paymentMethod: 'cash',
    isSplitMode: false,
    selectedClientId: '',
    discountAmount: 0,
    pointsUsed: 0,
    autoPrint: true
  })
  const [splitPayments, setSplitPayments] = useState({ cash: 0, wave: 0, orange: 0, credit: 0 })
  const [cart, setCart] = useState([])
  const [cartPulse, setCartPulse] = useState(false)
  const [status, setStatus] = useState({ isProcessing: false, isPrinting: false })
  const [history, setHistory] = useState({ selectedSaleDetails: null })
  const [newClient, setNewClient] = useState({ name: '', phone: '' })

  const updateUi = useCallback((update) => setUi(p => ({ ...p, ...update })), [])
  const updateTerminal = useCallback((update) => setTerminal(p => ({ ...p, ...update })), [])
  const updateStatus = useCallback((update) => setStatus(p => ({ ...p, ...update })), [])
  const updateHistory = useCallback((update) => setHistory(p => ({ ...p, ...update })), [])
  const updateNewClient = useCallback((update) => setNewClient(p => ({ ...p, ...update })), [])

  const { listening, startListening, stopListening, supported: voiceSupported } = useVoiceInput({
    onResult: (text) => {
      const cmd = text.toLowerCase()
      const found = stock.find(p => cmd.includes((p.name || '').toLowerCase()))
      if (found) { addToCart(found); toast.success(`Ajouté : ${found.name}`) }
    }
  })

  const filteredSales = useMemo(() => {
    const sList = sales || []
    return sList.filter(s => {
      const client = clients.find(c => c.id === s.clientId)?.name || ''
      const search = (ui.historySearch || '').toLowerCase()
      return client.toLowerCase().includes(search) || (s.id || '').includes(search) || (s.paymentMethod || '').includes(search)
    })
  }, [sales, ui.historySearch, clients])

  const addToCart = (product) => {
    if (product.current_stock <= 0) return toast.error(`Stock épuisé`)
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.price_sell, unitCost: product.unit_cost || 0, quantity: 1 }]
    })
    setCartPulse(true)
    setTimeout(() => setCartPulse(false), 300)
  }

  const updateCartQty = (id, delta) => setCart(prev => prev.map(item => item.productId === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.productId !== id))
  const totalCart = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)
  const totalCost = cart.reduce((acc, item) => acc + ((item.unitCost || 0) * item.quantity), 0)
  const totalAmount = Math.max(0, totalCart - terminal.discountAmount)

  useEffect(() => {
    if (totalAmount >= totalCost && ui.allowLoss) updateUi({ allowLoss: false })
  }, [totalAmount, totalCost, ui.allowLoss, updateUi])

  useEffect(() => {
    if (!terminal.isSplitMode) {
      setSplitPayments({ cash: 0, wave: 0, orange: 0, credit: 0, [terminal.paymentMethod]: totalAmount })
    } else {
      const activeMethods = Object.entries(splitPayments).filter(([_, v]) => v > 0)
      if (activeMethods.length === 1) {
        setSplitPayments(prev => ({ ...prev, [activeMethods[0][0]]: totalAmount }))
      } else if (activeMethods.length === 0) {
        setSplitPayments({ cash: totalAmount, wave: 0, orange: 0, credit: 0 })
      }
    }
  }, [terminal.paymentMethod, totalAmount, terminal.isSplitMode])

  const totalSplit = Object.values(splitPayments).reduce((a, b) => a + b, 0)
  const isPaymentValid = terminal.isSplitMode ? Math.abs(totalSplit - totalAmount) < 1 : true
  const isLossSale = totalAmount < totalCost
  const canValidate = isPaymentValid && (!isLossSale || ui.allowLoss)

  const handleValidateSale = async () => {
    if (cart.length === 0) return
    if (totalAmount < totalCost && !ui.allowLoss) return toast.error("Vente à perte bloquée. Cochez l'autorisation pour forcer.")

    try {
      updateStatus({ isProcessing: true })
      const paymentsArray = terminal.isSplitMode 
        ? Object.entries(splitPayments).filter(([_, amt]) => amt > 0).map(([method, amount]) => ({ method, amount }))
        : [{ method: terminal.paymentMethod, amount: totalAmount }]

      if (paymentsArray.some(p => p.method === 'credit')) {
        if (!terminal.selectedClientId) { updateStatus({ isProcessing: false }); return toast.error("Client requis pour le paiement à crédit") }
        const client = clients.find(c => c.id === terminal.selectedClientId)
        if (client) {
          const creditAmount = paymentsArray.find(p => p.method === 'credit')?.amount || 0
          const limit = client.credit_limit || 0
          const currentDebt = client.total_debt || 0
          if (limit > 0 && (currentDebt + creditAmount) > limit) { updateStatus({ isProcessing: false }); return toast.error(`⚠️ Plafond dépassé. Reste disponible: ${Math.max(0, limit - currentDebt).toLocaleString()} F`) }
        }
      }

      const saleData = { items: cart, discountAmount: terminal.discountAmount, totalAmount, payments: paymentsArray, clientId: terminal.selectedClientId || null, date: new Date().toISOString(), boutiqueId: activeBoutiqueId }
      const saleId = await addSale(saleData)
      if (terminal.pointsUsed > 0 && terminal.selectedClientId) useLoyaltyPoints(terminal.selectedClientId, terminal.pointsUsed, terminal.pointsUsed)
      
      setCart([]); 
      updateTerminal({ discountAmount: 0, pointsUsed: 0, paymentMethod: 'cash', selectedClientId: '', isSplitMode: false });
      setSplitPayments({ cash: 0, wave: 0, orange: 0, credit: 0 });
      updateUi({ showCartDrawer: false, allowLoss: false });

      if (terminal.autoPrint) {
        try { 
          updateStatus({ isPrinting: true })
          const receipt = formatSaleReceipt({ ...saleData, id: saleId }, config)
          await printReceipt(receipt) 
        } catch (err) { toast.error("Vente enregistrée mais erreur imprimante") }
        finally { updateStatus({ isPrinting: false }) }
      }
      
      updateUi({ showSuccess: true })
      setTimeout(() => updateUi({ showSuccess: false }), 3000)
    } catch (error) { toast.error(`Erreur: ${error.message}`) }
    finally { updateStatus({ isProcessing: false }) }
  }

  const handleCreateQuickClient = (e) => {
    e.preventDefault(); if (!newClient.name) return
    addClient({ name: newClient.name, phone: newClient.phone, total_debt: 0, boutiqueId: activeBoutiqueId })
    updateNewClient({ name: '', phone: '' }); updateUi({ showNewClientDialog: false })
  }

  const handleScanSuccess = (decodedText) => {
    const found = stock.find(p => (p.name || '').toLowerCase() === decodedText.toLowerCase() || (p.barcode && p.barcode === decodedText))
    if (found) { addToCart(found); toast.success(`Ajouté : ${found.name}`) }
  }

  const handleReprintSale = async (sale) => {
    try {
      updateStatus({ isPrinting: true }); toast.info("Impression de la copie...")
      const receipt = formatSaleReceipt(sale, config, true)
      await printReceipt(receipt); toast.success("Impression terminée")
    } catch (error) { toast.error("L'imprimante n'est pas connectée") }
    finally { updateStatus({ isPrinting: false }) }
  }

  return (
    <div className="relative h-[calc(100vh-120px)] flex flex-col gap-4 overflow-hidden">
      <div className="bg-card border border-border rounded-3xl p-2 shadow-sm flex gap-2 shrink-0">
        <button onClick={() => updateUi({ activeTab: 'terminal' })} className={clsx("flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all", ui.activeTab === 'terminal' ? "bg-primary text-white shadow-lg" : "hover:bg-muted text-muted-foreground")}><LayoutGrid size={14} /> Terminal</button>
        <button onClick={() => updateUi({ activeTab: 'history' })} className={clsx("flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all", ui.activeTab === 'history' ? "bg-primary text-white shadow-lg" : "hover:bg-muted text-muted-foreground")}><History size={14} /> Historique</button>
      </div>

      <AnimatePresence mode="wait">
        {ui.activeTab === 'terminal' ? (
          <VentesTerminal key="terminal" stockList={stock} terminal={terminal} updateTerminal={updateTerminal} ui={ui} updateUi={updateUi} voiceSupported={voiceSupported} listening={listening} startListening={startListening} stopListening={stopListening} sales={sales} handleReprintSale={handleReprintSale} handleScanSuccess={handleScanSuccess} addToCart={addToCart} />
        ) : (
          <VentesHistory key="history" ui={ui} updateUi={updateUi} filteredSales={filteredSales} clients={clients} updateHistory={updateHistory} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ui.activeTab === 'terminal' && cart.length > 0 && (
          <motion.button initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 50 }} onClick={() => updateUi({ showCartDrawer: true })} className="fixed bottom-24 right-6 left-6 md:left-auto md:w-80 h-20 bg-primary text-white rounded-[2.5rem] shadow-2xl flex items-center justify-between px-8 z-40">
            <div className="flex items-center gap-4">
              <div className={clsx("relative transition-transform duration-300", cartPulse ? "scale-125" : "scale-100")}>
                <ShoppingCart size={28} />
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-white text-primary rounded-full flex items-center justify-center text-xs font-black shadow-lg">{cart.length}</span>
              </div>
              <div className="text-left"><p className="text-[10px] font-black uppercase opacity-70 leading-none mb-1">Total Panier</p><p className="text-xl font-black leading-none">{totalCart.toLocaleString()} F</p></div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl"><ArrowRight size={24} /></div>
          </motion.button>
        )}
      </AnimatePresence>

      <VentesCart ui={ui} updateUi={updateUi} cart={cart} updateCartQty={updateCartQty} removeFromCart={removeFromCart} terminal={terminal} updateTerminal={updateTerminal} splitPayments={splitPayments} setSplitPayments={setSplitPayments} totalSplit={totalSplit} totalAmount={totalAmount} totalCart={totalCart} totalCost={totalCost} clients={clients} config={config} status={status} isLossSale={isLossSale} canValidate={canValidate} handleValidateSale={handleValidateSale} />

      <SuccessModal ui={ui} updateUi={updateUi} />
      <NewClientModal ui={ui} updateUi={updateUi} newClient={newClient} updateNewClient={updateNewClient} handleCreateQuickClient={handleCreateQuickClient} />
      <SaleDetailsModal history={history} updateHistory={updateHistory} formatF={formatF} cancelSale={cancelSale} />
    </div>
  )
}
