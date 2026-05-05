import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  Search, ShoppingCart, Mic, Printer, List, LayoutGrid, Plus, Minus, X, CheckCircle2,
  Trash2, User, UserPlus, History, CreditCard, Wallet, Smartphone, ArrowRight,
  Eye, RotateCcw, Calendar, Filter, ChevronRight, Package, Info, MoreVertical, Clock, AlertTriangle, ScanLine, Share2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { toast } from 'sonner'
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger, ResponsiveDialogDescription } from '../components/ui/responsive-dialog'
import { formatSaleReceipt, printReceipt } from '../lib/bluetooth'
import { useVoiceInput } from '../lib/useVoiceInput'
import Scanner from '../components/Scanner'

const formatF = (val) => `${Number(val || 0).toLocaleString('fr-FR')} F`
const formatTime = (dateStr) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch (e) { return '--:--' }
}
const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (e) { return '-- --- ----' }
}

export default function Ventes() {
  const navigate = useNavigate()
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allStock = useStore(state => state.stock || [])
  const allSales = useStore(state => state.sales || [])
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const sales = useMemo(() => allSales.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allSales, activeBoutiqueId])
  const clients = useStore(state => state.clients)
  const config = useStore(state => state.config)
  const addSale = useStore(state => state.addSale)
  const cancelSale = useStore(state => state.cancelSale)
  const addClient = useStore(state => state.addClient)
  
  // 🚀 P3 — États groupés pour optimisation des rendus
  const [ui, setUi] = useState({ 
    activeTab: 'terminal', 
    viewMode: 'grid', 
    showCartDrawer: false, 
    showSuccess: false,
    showNewClientDialog: false,
    isScanning: false,
    historySearch: ''
  })
  
  const [terminal, setTerminal] = useState({
    searchTerm: '',
    paymentMethod: 'cash',
    isSplitMode: false,
    selectedClientId: '',
    discountAmount: 0,
    autoPrint: true
  })

  const [splitPayments, setSplitPayments] = useState({ cash: 0, wave: 0, orange: 0, credit: 0 })
  const [cart, setCart] = useState([])
  
  const [status, setStatus] = useState({
    isProcessing: false,
    isPrinting: false
  })

  const [history, setHistory] = useState({
    selectedSaleDetails: null,
    saleIdToCancel: null
  })

  const [newClient, setNewClient] = useState({ name: '', phone: '' })

  // Helpers pour mises à jour partielles
  const updateUi = useCallback((update) => setUi(p => ({ ...p, ...update })), [])
  const updateTerminal = useCallback((update) => setTerminal(p => ({ ...p, ...update })), [])
  const updateStatus = useCallback((update) => setStatus(p => ({ ...p, ...update })), [])
  const updateHistory = useCallback((update) => setHistory(p => ({ ...p, ...update })), [])
  const updateNewClient = useCallback((update) => setNewClient(p => ({ ...p, ...update })), [])

  const { listening, startListening, stopListening, supported: voiceSupported } = useVoiceInput({
    onResult: (text) => {
      const cmd = text.toLowerCase()
      const found = stockList.find(p => cmd.includes((p.name || '').toLowerCase()))
      if (found) { addToCart(found); toast.success(`Ajouté : ${found.name}`) }
    }
  })

  const stockList = stock || []
  const clientList = clients || []
  const saleList = sales || []

  const filteredProducts = useMemo(() => {
    const search = (terminal.searchTerm || '').toLowerCase()
    return stockList.filter(p => 
      (p.name || '').toLowerCase().includes(search) || 
      (p.category || '').toLowerCase().includes(search)
    )
  }, [stockList, terminal.searchTerm])

  const favorites = useMemo(() => [...stockList].sort((a,b) => (b.current_stock > a.current_stock ? 1 : -1)).slice(0, 5), [stockList])

  // 🚀 P2 — Virtualisation de la grille de produits
  const parentRef = useRef(null)
  const columns = ui.viewMode === 'grid' ? 3 : 1
  const rowCount = Math.ceil(filteredProducts.length / columns)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ui.viewMode === 'grid' ? 125 : 80,
    overscan: 5,
  })

  const filteredSales = useMemo(() => {
    const sList = sales || []
    const cList = clients || []
    return sList.filter(s => {
      const client = cList.find(c => c.id === s.clientId)?.name || ''
      const search = (ui.historySearch || '').toLowerCase()
      return client.toLowerCase().includes(search) || (s.id || '').includes(search) || (s.paymentMethod || '').includes(search)
    })
  }, [sales, ui.historySearch, clients])

  // 🚀 P2 — Virtualisation de l'historique des ventes (second onglet)
  const historyRef = useRef(null)
  const salesVirtualizer = useVirtualizer({
    count: filteredSales.length,
    getScrollElement: () => historyRef.current,
    estimateSize: () => 90,
    overscan: 5,
  })

  const addToCart = (product) => {
    if (product.current_stock <= 0) return toast.error(`Stock épuisé`)
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.price_sell, quantity: 1 }]
    })
  }

  const updateCartQty = (id, delta) => setCart(prev => prev.map(item => item.productId === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.productId !== id))
  const totalCart = cart.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)
  const totalAmount = Math.max(0, totalCart - terminal.discountAmount)

  useEffect(() => {
    if (!terminal.isSplitMode) {
      setSplitPayments({ cash: 0, wave: 0, orange: 0, credit: 0, [terminal.paymentMethod]: totalAmount })
    } else {
      // En mode combiné, si le total change (remise), on ajuste le premier montant non nul 
      // ou on met tout sur cash si tout est à zéro pour éviter de bloquer l'utilisateur
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

  const handleValidateSale = async () => {
    if (cart.length === 0) return

    try {
      updateStatus({ isProcessing: true })
      const paymentsArray = terminal.isSplitMode 
        ? Object.entries(splitPayments).filter(([_, amt]) => amt > 0).map(([method, amount]) => ({ method, amount }))
        : [{ method: terminal.paymentMethod, amount: totalAmount }]

      if (paymentsArray.some(p => p.method === 'credit') && !terminal.selectedClientId) {
        return toast.error("Client requis pour le paiement à crédit")
      }

      const saleData = { 
        items: cart, 
        discountAmount: terminal.discountAmount, 
        totalAmount, 
        payments: paymentsArray,
        clientId: terminal.selectedClientId || null, 
        date: new Date().toISOString() 
      }
      
      const saleId = await addSale(saleData)
      
      // Réinitialisation immédiate pour éviter le blocage UI
      setCart([]); 
      updateTerminal({ discountAmount: 0, paymentMethod: 'cash', selectedClientId: '', isSplitMode: false });
      setSplitPayments({ cash: 0, wave: 0, orange: 0, credit: 0 });
      updateUi({ showCartDrawer: false }); 

      if (terminal.autoPrint) {
        try { 
          updateStatus({ isPrinting: true })
          const receipt = formatSaleReceipt({ ...saleData, id: saleId }, config)
          await printReceipt(receipt) 
        } catch (err) { 
          console.error("Erreur Impression:", err)
          toast.error("Vente enregistrée mais erreur imprimante") 
        } finally { 
          updateStatus({ isPrinting: false }) 
        }
      }
      
      updateUi({ showSuccess: true })
      toast.success('Vente enregistrée avec succès')
      setTimeout(() => updateUi({ showSuccess: false }), 3000)
    } catch (error) {
      console.error("Erreur Validation Vente:", error)
      toast.error(`Erreur lors de la validation: ${error.message || 'Inconnue'}`)
    } finally { updateStatus({ isProcessing: false }) }
  }

  const handleCreateQuickClient = (e) => {
    e.preventDefault(); if (!newClient.name) return
    addClient({ name: newClient.name, phone: newClient.phone, total_debt: 0 })
    updateNewClient({ name: '', phone: '' }); updateUi({ showNewClientDialog: false })
  }

  const handleScanSuccess = (decodedText) => {
    const found = stockList.find(p => 
      (p.name || '').toLowerCase() === decodedText.toLowerCase() || 
      (p.barcode && p.barcode === decodedText)
    )
    if (found) {
      addToCart(found)
      toast.success(`Ajouté : ${found.name}`)
      updateUi({ isScanning: false })
    } else {
      updateTerminal({ searchTerm: decodedText })
      updateUi({ isScanning: false })
      toast.error("Produit non trouvé")
    }
  }

  const confirmCancelSale = () => {
    if (!history.saleIdToCancel) return
    cancelSale(history.saleIdToCancel)
    updateHistory({ saleIdToCancel: null, selectedSaleDetails: null })
    toast.success("Vente annulée")
  }

  const handleReprintSale = async (sale) => {
    try { updateStatus({ isPrinting: true }); const receipt = formatSaleReceipt(sale, config); await printReceipt(receipt); toast.success("Ré-impression...") } 
    catch (err) { toast.error("Erreur") } finally { updateStatus({ isPrinting: false }) }
  }

  const handleShareWhatsApp = (sale) => {
    const client = clients.find(c => c.id === sale.clientId)
    const phone = client?.phone || ''
    
    let message = `*REÇU BUTIKI - #${sale.id.slice(0, 8).toUpperCase()}*\n`
    message += `Date: ${formatDate(sale.date)} ${formatTime(sale.date)}\n`
    message += `Client: ${client?.name || 'Vente Comptant'}\n`
    message += `--------------------------\n`
    sale.items.forEach(it => {
      message += `- ${it.name} x${it.quantity}: ${formatF(it.unitPrice * it.quantity)}\n`
    })
    message += `--------------------------\n`
    if (sale.discountAmount > 0) message += `Remise: -${formatF(sale.discountAmount)}\n`
    message += `*TOTAL: ${formatF(sale.totalAmount)}*\n\n`
    message += `_Merci de votre confiance !_\n`
    message += `Butiki ERP - Gestion Intelligente`

    const url = `https://wa.me/${phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const SaleHistoryRow = ({ sale }) => {
    const client = clients.find(c => c.id === sale.clientId)
    const isCancelled = sale.status === 'cancelled'
    return (
      <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => updateHistory({ selectedSaleDetails: sale })} className={clsx("bg-card border border-border p-4 rounded-3xl flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all shadow-sm mb-3", isCancelled && "opacity-60 bg-muted/30")}>
        <div className="flex items-center gap-4">
          <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", isCancelled ? "bg-muted text-muted-foreground" : sale.paymentMethod === 'cash' ? "bg-emerald-500/10 text-emerald-500" : sale.paymentMethod === 'credit' ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary")}>
            {isCancelled ? <RotateCcw size={20} /> : sale.paymentMethod === 'cash' ? <Wallet size={20} /> : sale.paymentMethod === 'credit' ? <CreditCard size={20} /> : <Smartphone size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-tight">{client?.name || 'Vente Comptant'}</p>
              {isCancelled && <span className="text-[8px] font-black uppercase bg-red-500 text-white px-1.5 py-0.5 rounded-full">Annulée</span>}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><Clock size={10} /> {formatTime(sale.date)}</span>
              <span className="text-[10px] font-black text-primary uppercase">
                {sale.payments && sale.payments.length > 1 ? 'MULTIPLE' : (sale.payments?.[0]?.method || sale.paymentMethod)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-black">{formatF(sale.totalAmount)}</p>
          <p className="text-[9px] font-bold text-muted-foreground">{sale.items.length} article(s)</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-120px)] flex flex-col gap-4 overflow-hidden">
      <div className="bg-card border border-border rounded-3xl p-2 shadow-sm flex gap-2 shrink-0">
        <button onClick={() => updateUi({ activeTab: 'terminal' })} className={clsx("flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all", ui.activeTab === 'terminal' ? "bg-primary text-white shadow-lg" : "hover:bg-muted text-muted-foreground")}><LayoutGrid size={14} /> Terminal</button>
        <button onClick={() => updateUi({ activeTab: 'history' })} className={clsx("flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all", ui.activeTab === 'history' ? "bg-primary text-white shadow-lg" : "hover:bg-muted text-muted-foreground")}><History size={14} /> Historique</button>
      </div>

      <AnimatePresence mode="wait">
        {ui.activeTab === 'terminal' ? (
          <motion.div key="pos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="bg-card border border-border rounded-3xl p-4 shadow-sm space-y-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input value={terminal.searchTerm} onChange={e => updateTerminal({ searchTerm: e.target.value })} placeholder="Chercher un article..." className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-2xl text-sm font-bold outline-none" />
                  <button onClick={() => updateUi({ isScanning: true })} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
                    <ScanLine size={18} />
                  </button>
                </div>
                <div className="flex gap-1.5 bg-muted/30 p-1.5 rounded-2xl border border-border">
                  <button 
                    onClick={() => {
                      if (sales.length > 0) handleReprintSale(sales[0])
                      else toast.info("Aucune vente à imprimer")
                    }}
                    onContextMenu={(e) => { e.preventDefault(); updateTerminal({ autoPrint: !terminal.autoPrint }); toast.info(`Auto-print: ${!terminal.autoPrint ? 'Activé' : 'Désactivé'}`) }}
                    className={clsx("p-2 rounded-xl transition-all", terminal.autoPrint ? "text-emerald-500" : "text-muted-foreground")}
                    title="Imprimer dernière vente (Clic-droit pour Auto-print)"
                  >
                    <Printer size={18} />
                  </button>
                  <button onClick={() => updateUi({ viewMode: ui.viewMode === 'grid' ? 'list' : 'grid' })} className="p-2 rounded-xl text-muted-foreground transition-all">{ui.viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}</button>
                </div>
                {voiceSupported && (
                  <button onClick={listening ? stopListening : startListening} className={clsx("p-3 rounded-2xl border transition-all", listening ? "bg-red-500 text-white" : "bg-primary/10 text-primary border-primary/20")}><Mic size={18} /></button>
                )}
              </div>
              
              <AnimatePresence>
                {ui.isScanning && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="p-4 bg-muted/20 border border-dashed border-border rounded-2xl relative">
                      <button onClick={() => updateUi({ isScanning: false })} className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive z-10"><X size={16} /></button>
                      <Scanner onScanSuccess={handleScanSuccess} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div ref={parentRef} className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-20">
              <div 
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const rowIndex = virtualRow.index
                  const rowProducts = filteredProducts.slice(rowIndex * columns, (rowIndex + 1) * columns)
                  
                  return (
                    <div
                      key={virtualRow.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className={clsx("grid gap-4 px-1", ui.viewMode === 'grid' ? "grid-cols-3" : "grid-cols-1")}
                    >
                      {rowProducts.map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => addToCart(p)} 
                          className={clsx(
                            "bg-card border border-border p-2 rounded-[1.5rem] shadow-sm cursor-pointer hover:border-primary transition-all group relative overflow-hidden flex flex-col justify-between", 
                            ui.viewMode === 'list' ? "flex-row items-center gap-3 py-3 h-[70px]" : "h-[115px]"
                          )}
                        >
                          <div className={clsx("w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0", ui.viewMode === 'list' ? "w-8 h-8" : "mb-1")}>
                            <Package size={ui.viewMode === 'list' ? 16 : 20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-tight truncate">{p.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] font-bold text-primary">{p.price_sell.toLocaleString()} F</p>
                              <p className={clsx("text-[8px] font-black uppercase px-2 py-0.5 rounded-full", p.current_stock < 5 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>Stock: {p.current_stock}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col gap-4 min-h-0">
             <div className="bg-card border border-border rounded-3xl p-4 shadow-sm shrink-0">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input value={ui.historySearch} onChange={e => updateUi({ historySearch: e.target.value })} placeholder="Chercher une vente..." className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-2xl text-sm font-bold outline-none" />
                </div>
             </div>
             <div ref={historyRef} className="flex-1 overflow-y-auto no-scrollbar pr-1">
               <div 
                 style={{
                   height: `${salesVirtualizer.getTotalSize()}px`,
                   width: '100%',
                   position: 'relative',
                 }}
               >
                 {filteredSales.length > 0 ? salesVirtualizer.getVirtualItems().map((virtualRow) => {
                   const sale = filteredSales[virtualRow.index]
                   return (
                     <div
                       key={virtualRow.key}
                       style={{
                         position: 'absolute',
                         top: 0,
                         left: 0,
                         width: '100%',
                         height: `${virtualRow.size}px`,
                         transform: `translateY(${virtualRow.start}px)`,
                       }}
                     >
                       <SaleHistoryRow sale={sale} />
                     </div>
                   )
                 }) : (
                   <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-4 pt-20">
                     <History size={64} />
                     <p className="text-xs font-black uppercase">Aucune vente</p>
                   </div>
                 )}
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ui.activeTab === 'terminal' && cart.length > 0 && (
          <motion.button initial={{ scale: 0, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, y: 50 }} onClick={() => updateUi({ showCartDrawer: true })} className="fixed bottom-24 right-6 left-6 md:left-auto md:w-80 h-20 bg-primary text-white rounded-[2.5rem] shadow-2xl flex items-center justify-between px-8 z-40">
            <div className="flex items-center gap-4">
              <div className="relative"><ShoppingCart size={28} /><span className="absolute -top-2 -right-2 w-6 h-6 bg-white text-primary rounded-full flex items-center justify-center text-xs font-black shadow-lg">{cart.length}</span></div>
              <div className="text-left"><p className="text-[10px] font-black uppercase opacity-70 leading-none mb-1">Total Panier</p><p className="text-xl font-black leading-none">{totalCart.toLocaleString()} F</p></div>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl"><ArrowRight size={24} /></div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ui.showSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-500/90 backdrop-blur-md">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto"><CheckCircle2 size={60} /></div>
              <div className="space-y-2"><h3 className="text-2xl font-black uppercase tracking-tight">Vente OK !</h3></div>
              <button onClick={() => updateUi({ showSuccess: false })} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs">Fermer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <ResponsiveDialog open={ui.showCartDrawer} onOpenChange={(v) => updateUi({ showCartDrawer: v })}>
        <ResponsiveDialogContent className="rounded-t-[3rem] p-6">
          <ResponsiveDialogHeader><ResponsiveDialogTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em]"><ShoppingCart size={20} className="text-primary" /> Validation</ResponsiveDialogTitle></ResponsiveDialogHeader>
          <div className="space-y-3 py-4 max-h-[30vh] overflow-y-auto px-1 no-scrollbar">
            {cart.map(item => (
              <div key={item.productId} className="flex items-center gap-4 p-4 bg-muted/20 border border-border/50 rounded-[2rem]">
                <div className="flex-1 min-w-0"><p className="text-[11px] font-black uppercase truncate">{item.name}</p><p className="text-[10px] font-bold text-primary">{item.unitPrice.toLocaleString()} F</p></div>
                <div className="flex items-center gap-2 bg-background border border-border rounded-2xl p-1">
                  <button onClick={() => updateCartQty(item.productId, -1)} className="p-2 hover:bg-muted rounded-xl"><Minus size={14} /></button>
                  <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQty(item.productId, 1)} className="p-2 hover:bg-muted rounded-xl"><Plus size={14} /></button>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><X size={16} /></button>
              </div>
            ))}
          </div>
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Paiement</label>
              <button 
                onClick={() => updateTerminal({ isSplitMode: !terminal.isSplitMode })} 
                className={clsx("text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all", terminal.isSplitMode ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-border")}
              >
                {terminal.isSplitMode ? "Mode Combiné" : "Simple"}
              </button>
            </div>

            {terminal.isSplitMode ? (
              <div className="space-y-2 bg-muted/20 p-4 rounded-3xl border border-border/50">
                {[
                  { id: 'cash', label: 'Espèces', color: 'emerald' },
                  { id: 'wave', label: 'Wave', color: 'blue' },
                  { id: 'orange', label: 'Orange Money', color: 'orange' },
                  { id: 'credit', label: 'Crédit (Dette)', color: 'red' }
                ].map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className={clsx("w-2 h-2 rounded-full", `bg-${m.color}-500`)} />
                    <span className="text-[10px] font-bold flex-1">{m.label}</span>
                    <input 
                      type="number" 
                      value={splitPayments[m.id] || ''} 
                      onChange={e => setSplitPayments({...splitPayments, [m.id]: Number(e.target.value)})}
                      placeholder="0"
                      className="w-24 p-2 bg-background border border-border rounded-xl text-right text-xs font-black outline-none focus:border-primary"
                    />
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-border/50 flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Total Saisi</span>
                  <span className={clsx("text-xs font-black", Math.abs(totalSplit - totalAmount) < 1 ? "text-emerald-500" : "text-red-500")}>
                    {totalSplit.toLocaleString()} / {totalAmount.toLocaleString()} F
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cash', label: 'Espèces' },
                  { id: 'wave', label: 'Wave' },
                  { id: 'orange', label: 'Orange Money' },
                  { id: 'credit', label: 'Crédit' }
                ].map(m => (
                  <button 
                    key={m.id}
                    onClick={() => updateTerminal({ paymentMethod: m.id })}
                    className={clsx("py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all", terminal.paymentMethod === m.id ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted")}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <select value={terminal.selectedClientId} onChange={e => updateTerminal({ selectedClientId: e.target.value })} className="w-full pl-9 p-3 bg-muted/10 border border-border rounded-2xl text-[10px] font-black uppercase outline-none">
                    <option value="">Client (Optionnel)</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <input type="number" value={terminal.discountAmount || ''} onChange={e => updateTerminal({ discountAmount: Number(e.target.value) })} placeholder="Remise" className="w-24 p-3 bg-muted/30 border border-border rounded-xl text-xs font-black outline-none" />
              </div>
            </div>

            <div className="bg-primary p-6 rounded-[2.5rem] shadow-2xl flex justify-between items-center text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase opacity-70 tracking-widest">Total Net</span>
                <span className="text-2xl font-black">{totalAmount.toLocaleString()} F</span>
              </div>
              <button 
                disabled={status.isProcessing || !isPaymentValid} 
                onClick={handleValidateSale} 
                className={clsx("px-10 py-3 bg-white text-primary rounded-2xl font-black text-xs uppercase shadow-xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale")}
              >
                {status.isProcessing ? "..." : "Valider"}
              </button>
            </div>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Sale Details Dialog */}
      <ResponsiveDialog open={!!history.selectedSaleDetails} onOpenChange={() => updateHistory({ selectedSaleDetails: null })}>
        <ResponsiveDialogContent className="rounded-t-[3rem] p-6">
          <ResponsiveDialogHeader><ResponsiveDialogTitle className="text-sm font-black uppercase tracking-widest">Détails</ResponsiveDialogTitle></ResponsiveDialogHeader>
          {history.selectedSaleDetails && (
            <div className="space-y-6 py-4">
               <div className="flex justify-between items-start">
                  <div><p className="text-xs font-black">#{history.selectedSaleDetails.id.slice(0, 8)}</p><p className="text-[10px] text-muted-foreground mt-1">{formatDate(history.selectedSaleDetails.date)} à {formatTime(history.selectedSaleDetails.date)}</p></div>
                  <span className={clsx("text-[9px] font-black uppercase px-2 py-0.5 rounded-full", history.selectedSaleDetails.status === 'cancelled' ? "bg-red-500 text-white" : "bg-emerald-500 text-white")}>{history.selectedSaleDetails.status === 'cancelled' ? 'Annulée' : 'Validée'}</span>
               </div>
               <div className="space-y-2">
                 {history.selectedSaleDetails.items.map((it, idx) => (
                   <div key={idx} className="flex justify-between items-center p-3 bg-muted/20 rounded-2xl border border-border/50">
                     <span className="text-xs font-bold">{it.name} x{it.quantity}</span>
                     <span className="text-xs font-black">{formatF(it.unitPrice * it.quantity)}</span>
                   </div>
                 ))}
                 <div className="grid grid-cols-3 gap-2 pt-4">
                   <button onClick={() => handleReprintSale(history.selectedSaleDetails)} className="flex flex-col items-center justify-center gap-1 py-3 bg-muted hover:bg-muted/80 rounded-2xl text-[9px] font-black uppercase"><Printer size={16} /> Ticket</button>
                   <button onClick={() => handleShareWhatsApp(history.selectedSaleDetails)} className="flex flex-col items-center justify-center gap-1 py-3 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-2xl text-[9px] font-black uppercase"><Share2 size={16} /> WhatsApp</button>
                   <button onClick={() => {
                     updateHistory({ selectedSaleDetails: null });
                     navigate('/logistics', { state: { sale: history.selectedSaleDetails } });
                   }} className="flex flex-col items-center justify-center gap-1 py-3 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-2xl text-[9px] font-black uppercase"><Smartphone size={16} /> Livrer</button>
                   <button disabled={history.selectedSaleDetails.status === 'cancelled'} onClick={() => updateHistory({ saleIdToCancel: history.selectedSaleDetails.id })} className="flex flex-col items-center justify-center gap-1 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl text-[9px] font-black uppercase disabled:opacity-30"><RotateCcw size={16} /> Annuler</button>
                 </div>
               </div>
            </div>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Confirmation Cancel Dialog */}
      <ResponsiveDialog open={!!history.saleIdToCancel} onOpenChange={() => updateHistory({ saleIdToCancel: null })}>
        <ResponsiveDialogContent className="max-w-sm rounded-[2rem] p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto"><AlertTriangle size={40} /></div>
          <div className="space-y-2"><h3 className="text-xl font-black uppercase">Annuler la vente ?</h3><p className="text-sm font-bold text-muted-foreground">Cette action va rétablir les stocks et les finances.</p></div>
          <div className="flex flex-col gap-3">
             <button onClick={confirmCancelSale} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg">Confirmer l'Annulation</button>
             <button onClick={() => updateHistory({ saleIdToCancel: null })} className="w-full py-4 bg-muted text-muted-foreground rounded-2xl font-black uppercase text-xs">Retour</button>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* New Client Dialog */}
      <ResponsiveDialog open={ui.showNewClientDialog} onOpenChange={(v) => updateUi({ showNewClientDialog: v })}>
        <ResponsiveDialogContent className="max-w-sm rounded-[2rem]">
          <ResponsiveDialogHeader><ResponsiveDialogTitle className="uppercase font-black text-sm flex items-center gap-2"><UserPlus size={16} className="text-primary" /> Nouveau Client</ResponsiveDialogTitle></ResponsiveDialogHeader>
          <form onSubmit={handleCreateQuickClient} className="space-y-4 py-4">
            <input value={newClient.name} onChange={e => updateNewClient({ name: e.target.value })} placeholder="Nom" className="w-full p-4 bg-muted/30 border border-border rounded-2xl text-xs font-black outline-none" autoFocus />
            <input value={newClient.phone} onChange={e => updateNewClient({ phone: e.target.value })} placeholder="Téléphone" className="w-full p-4 bg-muted/30 border border-border rounded-2xl text-xs font-black outline-none" />
            <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs shadow-lg">Créer Client</button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
