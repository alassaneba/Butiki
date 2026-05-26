import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import {
  Plus, Search, Printer, Eye, X,
  MessageCircle, Phone, Star, UserCheck, TriangleAlert, UserPlus,
  CheckCircle2, Users, History, CreditCard, Receipt, Package, Pencil,
  Diamond, Clock, Trophy, TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import TransactionHistoryModal from '../components/people/TransactionHistoryModal'
import { getLoyaltyLevel, getNextLevelProgress, getClientSegment, getMarketingMessage } from '../lib/crm'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'
import * as XLSX from 'xlsx'
import clsx from 'clsx'

// ─── Tags de segmentation ─────────────────────────────────────────────────────
// ─── Tags de segmentation ─────────────────────────────────────────────────────
const TAGS = [
  { value: 'champion', label: 'Champion', icon: Diamond,           color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { value: 'vip',      label: 'VIP',      icon: Star,          color: 'bg-amber-400/10 text-amber-600 border-amber-400/20' },
  { value: 'regulier', label: 'Régulier', icon: UserCheck,     color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { value: 'risque',   label: 'Risqué',   icon: TriangleAlert, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
]

function TagBadge({ tag }) {
  const t = TAGS.find(t => t.value === tag)
  if (!t) return null
  const Icon = t.icon
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full font-black px-2 py-0.5 text-[8px] uppercase tracking-wider ${t.color}`}>
      <Icon size={10} strokeWidth={3} /> {t.label}
    </span>
  )
}


// ─── Marketing Relance Dialog ────────────────────────────────────────────────
function MarketingRelanceDialog({ isOpen, onClose, clients }) {
  const [activeSegment, setActiveSegment] = useState('inactive');
  
  const segments = [
    { id: 'inactive', name: 'Inactifs', icon: '⏳', color: 'text-orange-600', bg: 'bg-orange-500/10' },
    { id: 'lost', name: 'Perdus', icon: '🥀', color: 'text-red-600', bg: 'bg-red-500/10' },
    { id: 'potential', name: 'Potentiels', icon: '📈', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { id: 'champion', name: 'Champions', icon: '🏆', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  ];

  const filtered = useMemo(() => {
    return clients.filter(c => getClientSegment(c).id === activeSegment);
  }, [clients, activeSegment]);

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={onClose}>
      <ResponsiveDialogContent className="max-w-2xl p-0 overflow-hidden flex flex-col h-[85vh] sm:h-[75vh] rounded-t-[2rem] sm:rounded-[2rem] border-none">
        <div className="p-6 bg-muted/20 border-b border-border/50">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase">Assistant Marketing</h2>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Ciblage et Relance Client</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X size={20}/></button>
          </div>

          <div className="flex gap-2 p-1 bg-background border border-border rounded-2xl overflow-x-auto no-scrollbar">
            {segments.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSegment(s.id)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                  activeSegment === s.id ? `${s.bg} ${s.color} shadow-sm border border-current/20` : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span>{s.icon}</span> {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-background/50">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
              <TrendingUp size={48} className="mb-4" />
              <p className="font-black uppercase text-xs tracking-widest">Aucun client dans ce segment</p>
            </div>
          ) : (
            filtered.map(client => (
              <div key={client.id} className="p-4 rounded-3xl bg-card border border-border/50 flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center font-black text-xs uppercase">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase leading-tight">{client.name}</h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{client.loyalty_points || 0} Points • {client.phone || 'Pas de tel'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const msg = getMarketingMessage(activeSegment, client.name, client.loyalty_points || 0);
                    const url = `https://wa.me/${client.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
                    window.open(url, '_blank');
                  }}
                  disabled={!client.phone}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-30 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle size={14} /> Relancer
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-muted/10 border-t border-border/50 text-center">
           <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">
             💡 Astuce : Les messages de relance sont personnalisés selon le profil du client.
           </p>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export default function Clients() {
  const clients = useStore(state => state.clients)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const sales = useStore(state => state.sales)
  const clientList = useMemo(() => (clients || []).filter(c => (c.boutiqueId || 'b1') === activeBoutiqueId), [clients, activeBoutiqueId])
  const saleList = useMemo(() => (sales || []).filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [sales, activeBoutiqueId])
  const addClient = useStore(state => state.addClient)
  const addDebt = useStore(state => state.addDebt)
  const payDebt = useStore(state => state.payDebt)

  const [ui, setUi] = useState({
    isNewClientOpen: false,
    isMarketingOpen: false,
    activeClient: null,
    detailClient: null,
    printData: null
  })

  const [form, setForm] = useState({
    name: '',
    phone: '',
    tag: 'regulier',
    initialDebt: '',
    initialLibelle: '',
    creditLimit: '',
    paymentAmount: '',
    paymentLibelle: '',
    newDebtAmount: '',
    newDebtLibelle: '',
    pendingNote: '',
    cashReceived: '',
    paymentMethod: 'cash'
  })

  const updateUi = (patch) => setUi(prev => ({ ...prev, ...patch }))
  const updateForm = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('all')

  const handleAddClient = (e) => {
    e.preventDefault()
    if (!form.name) return
    addClient({ 
      name: form.name, 
      phone: form.phone, 
      tag: form.tag,
      total_debt: Number(form.initialDebt) || 0, 
      libelle_initial: form.initialLibelle || 'Solde initial', 
      credit_limit: Number(form.creditLimit) || 0,
      boutiqueId: activeBoutiqueId
    })
    setForm({ ...form, name: '', phone: '', tag: 'regulier', initialDebt: '', initialLibelle: '', creditLimit: '' })
    updateUi({ isNewClientOpen: false })
  }

  const handleWhatsAppRelance = (client) => {
    let message = `Bonjour ${client.name}, vous avez une ardoise de ${client.total_debt?.toLocaleString()} F chez BUTIK. Merci de passer régulariser dès que possible. 🙏`
    
    // IA CRM : Si le client est inactif (>30j), on change le ton pour un message de fidélisation
    if (client.isInactive) {
      message = `Bonjour ${client.name}, nous avons remarqué que vous n'êtes pas passé à la boutique depuis ${client.daysInactive} jours. Au plaisir de vous revoir chez Butik ! 🌟`
    }

    const phone = client.phone ? client.phone.replace(/\D/g, '') : ''
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  const handlePayment = (e) => {
    e.preventDefault()
    if (!ui.activeClient || !form.paymentAmount) return
    payDebt(ui.activeClient.id, form.paymentAmount, form.paymentLibelle, form.paymentMethod)
    updateUi({ 
      printData: { 
        client: ui.activeClient.name, 
        amount: Number(form.paymentAmount), 
        type: 'Encaissé', 
        date: new Date().toLocaleDateString(), 
        libelle: form.paymentLibelle || 'Versement', 
        newDebt: (ui.activeClient.total_debt || 0) - Number(form.paymentAmount),
        paymentMethod: form.paymentMethod 
      },
      activeClient: null
    })
    updateForm({ paymentAmount: '', paymentLibelle: '', paymentMethod: 'cash', cashReceived: '' })
  }

  const handleAddDebt = (e) => {
    e.preventDefault()
    if (!ui.activeClient || !form.newDebtAmount) return
    const limit = ui.activeClient.credit_limit || 0
    const futureDebt = (ui.activeClient.total_debt || 0) + Number(form.newDebtAmount)
    if (limit > 0 && futureDebt > limit) { alert(`⚠️ Plafond dépassé (${limit} F)`); return }
    addDebt(ui.activeClient.id, form.newDebtAmount, form.newDebtLibelle || 'Achat sans cash')
    updateForm({ newDebtAmount: '', newDebtLibelle: '' })
    updateUi({ activeClient: null })
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const filterType = searchParams.get('filter')
  const updateClient = useStore(state => state.updateClient)
  const useLoyaltyPoints = useStore(state => state.useLoyaltyPoints)
  const config = useStore(state => state.config)
  const loyaltyConfig = config?.prices?.loyalty || { ratio: 100, minPointsToRedeem: 500 }

  const exportDebtors = () => {
    const list = clientList.filter(c => c.total_debt > 0).map(c => ({
      'Nom Client': c.name,
      'Téléphone': c.phone || '',
      'Type': TAGS.find(t => t.value === c.tag)?.label || c.tag,
      'Dette Actuelle': c.total_debt,
      'Limite Crédit': c.credit_limit || 0,
      'Note Marchandise': c.pending_items || ''
    }))
    
    const ws = XLSX.utils.json_to_sheet(list)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Débiteurs")
    XLSX.writeFile(wb, `Debiteurs_Butik_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
  }

  const changeToReturn = useMemo(() => {
    if (!ui.activeClient) return 0
    const amount = ui.activeClient.type === 'pay' ? Number(form.paymentAmount) : Number(form.newDebtAmount)
    if (!form.cashReceived || isNaN(form.cashReceived) || amount <= 0) return 0
    return Math.max(0, Number(form.cashReceived) - amount)
  }, [form.cashReceived, form.paymentAmount, form.newDebtAmount, ui.activeClient])

  const handleCycleTag = (client) => {
    const currentIndex = TAGS.findIndex(t => t.value === client.tag)
    const nextIndex = (currentIndex + 1) % TAGS.length
    const nextTag = TAGS[nextIndex].value
    updateClient(client.id, { tag: nextTag })
    toast.success(`Tag mis à jour : ${TAGS[nextIndex].label}`)
  }

  // 🚀 P1 — Index Map O(n) : pré-calculer le CA par client UNE seule fois
  // Evite le filter+reduce O(n*m) à l'intérieur de filteredClients
  const revenueByClient = useMemo(() => {
    const map = new Map()
    saleList.forEach(s => {
      if (s.clientId && s.status !== 'cancelled') {
        map.set(s.clientId, (map.get(s.clientId) || 0) + (s.totalAmount || 0))
      }
    })
    return map
  }, [saleList])

  const filteredClients = useMemo(() => {
    let list = clientList
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
      .filter(c => filterTag === 'all' || c.tag === filterTag)

    if (filterType === 'debtors') {
      list = list.filter(c => (c.total_debt || 0) > 0)
    } else if (filterType === 'avoirs') {
      list = list.filter(c => (c.total_debt || 0) < 0)
    }

    const listWithActivity = list.map(client => {
      const lastTx = client.transactions && client.transactions.length > 0 
        ? client.transactions[client.transactions.length - 1] 
        : { date: client.id && !isNaN(new Date(client.id)) ? client.id : new Date().toISOString(), libelle: 'Création profil' }
      
      const totalRevenue = revenueByClient.get(client.id) || 0
      
      // CRM IA : Détection inactivité
      const lastDate = new Date(lastTx.date)
      const daysInactive = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24))
      const isInactive = daysInactive > 30

      return { 
        ...client, 
        lastActionDate: lastTx.date, 
        lastActionLibelle: lastTx.libelle,
        totalRevenue,
        daysInactive,
        isInactive
      }
    })

    return listWithActivity.sort((a, b) => {
      const dateA = new Date(a.lastActionDate)
      const dateB = new Date(b.lastActionDate)
      return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA)
    })
  }, [clientList, saleList, search, filterTag, filterType, revenueByClient])

  // Virtualization Responsive Grid Setup
  const [columns, setColumns] = useState(1);
  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1024) setColumns(3);
      else if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  const clientRows = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < filteredClients.length; i += columns) {
      chunks.push(filteredClients.slice(i, i + columns));
    }
    return chunks;
  }, [filteredClients, columns]);

  const rowVirtualizer = useWindowVirtualizer({
    count: clientRows.length,
    estimateSize: () => 192, // ~180px + gap
    overscan: 5,
  });

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Clients & Recouvrement</h1>
          <p className="text-muted-foreground font-bold mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <Users className="text-primary" size={14}/> Gestion des ardoises
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={exportDebtors}
            className="bg-emerald-500/10 text-emerald-600 px-3 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap justify-center"
          >
            <Printer size={16} /> Exporter
          </button>
          <button 
            onClick={() => updateUi({ isMarketingOpen: true })}
            className="bg-amber-500/10 text-amber-600 px-3 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap justify-center"
          >
            <Trophy size={16} /> Relance CRM
          </button>
          <button 
            onClick={() => updateUi({ isNewClientOpen: true })}
            className="bg-primary text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95 whitespace-nowrap flex-1 sm:flex-none justify-center"
          >
            <UserPlus size={16} /> Nouveau Client
          </button>
        </div>
      </header>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-2 rounded-2xl border border-border shadow-sm print:hidden">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Rechercher un client..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-9 p-2.5 bg-muted/30 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
          />
        </div>
        <div className="flex gap-1 bg-muted/20 p-1 rounded-xl border border-border/50 overflow-x-auto no-scrollbar">
          {[
            { id: null, label: 'Tous' },
            { id: 'debtors', label: 'Dettes' },
            { id: 'avoirs', label: 'Avoirs' }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                if (t.id) params.set('filter', t.id)
                else params.delete('filter')
                setSearchParams(params)
              }} 
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterType === t.id ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-border mx-1 hidden sm:block" />
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {['all', ...TAGS.map(t => t.value)].map(t => (
            <button 
              key={t} 
              onClick={() => setFilterTag(t)} 
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0 ${filterTag === t ? 'bg-primary text-white border-primary shadow-sm' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
            >
              {t === 'all' ? 'Tous Tags' : TAGS.find(x => x.value === t)?.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        <AnimatePresence initial={false}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const chunk = clientRows[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-3 print:hidden"
              >
                {chunk.map((client) => {
                  const limit = client.credit_limit || 0
                  const ratio = limit > 0 ? ((client.total_debt || 0) / limit) * 100 : 0
                  
                  // CRM Data
                  const level = getLoyaltyLevel(client.loyalty_points || 0)
                  const next = getNextLevelProgress(client.loyalty_points || 0)

                  return (
                    <motion.div 
                      key={client.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`card-ultra-compact flex flex-col gap-2 relative overflow-hidden transition-all ${limit > 0 && ratio >= 80 ? 'border-orange-500/30 bg-orange-500/5' : 'border-border/50 bg-card hover:shadow-md'}`}
                    >
                      {/* Level Badge Overlay */}
                      <div className={clsx("absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-[7px] font-black uppercase tracking-widest flex items-center gap-1", level.bg, level.color)}>
                        {level.icon} {level.name}
                      </div>

                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm", level.bg, level.color)}>
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-black text-sm tracking-tight truncate uppercase leading-none pr-12">{client.name}</h4>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleCycleTag(client); }} 
                                className="hover:scale-105 active:scale-95 transition-all outline-none"
                                title="Changer le segment"
                              >
                                <TagBadge tag={client.tag} />
                              </button>
                              {client.isInactive && (
                                <div className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-md text-[8px] font-black flex items-center gap-1 uppercase animate-pulse">
                                   <Clock size={8} /> Inactif
                                </div>
                              )}
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2 mt-1">
                                <a 
                                  href={`tel:${client.phone.replace(/\s/g, '')}`} 
                                  className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                                  title="Appeler le client"
                                >
                                  <Phone size={10} className="group-hover:scale-110 transition-transform" /> 
                                  <span>{client.phone}</span>
                                </a>
                                <a 
                                  href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-emerald-500 hover:scale-125 transition-transform p-0.5"
                                  title="Contacter par WhatsApp"
                                >
                                  <MessageCircle size={12} fill="currentColor" className="opacity-20 group-hover:opacity-100" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 pt-4">
                          <div className="flex flex-col items-end">
                            <p className={`text-base font-black tracking-tighter ${client.total_debt > 0 ? 'text-red-500' : client.total_debt < 0 ? 'text-emerald-500' : 'text-foreground'}`}>
                              {Math.abs(client.total_debt || 0).toLocaleString()} F
                            </p>
                            <p className="text-[8px] font-bold text-muted-foreground/40 uppercase">Dette actuelle</p>
                          </div>
                        </div>
                      </div>

                      {/* Loyalty Progress Bar */}
                      <div className="mt-1 bg-muted/30 p-2 rounded-xl border border-border/40">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-black uppercase text-muted-foreground flex items-center gap-1">
                            <Star size={8} className="text-amber-500" fill="currentColor"/> 
                            {client.loyalty_points || 0} Points
                          </span>
                          {next.next && (
                            <span className="text-[7px] font-bold text-muted-foreground italic">
                              +{next.remaining} pts vers {next.next.name}
                            </span>
                          )}
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${next.progress}%` }}
                            className={clsx("h-full", next.next ? "bg-amber-500" : "bg-blue-600")}
                          />
                        </div>
                      </div>

                      {limit > 0 && (
                        <div className="space-y-1 mt-1">
                          <div className="flex justify-between text-[7px] font-black uppercase text-muted-foreground/60">
                            <span>Utilisation Crédit {Math.round(ratio)}%</span>
                            <span>Limite: {limit.toLocaleString()} F</span>
                          </div>
                          <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                            <div style={{ width: `${Math.min(100, ratio)}%` }} className={`h-full ${ratio >= 100 ? 'bg-red-500' : ratio >= 80 ? 'bg-orange-500' : 'bg-primary'}`}/>
                          </div>
                        </div>
                      )}

                      {client.pending_items && (
                        <div className="px-2 py-1 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-2">
                          <Package size={10} className="text-primary shrink-0" />
                          <p className="text-[8px] font-bold text-primary/80 line-clamp-1 uppercase italic">{client.pending_items}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1 flex-wrap">
                        <div className="flex gap-1">
                          <button onClick={() => updateUi({ detailClient: client })} className="p-1.5 bg-muted/40 text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-all" title="Historique & Fidélité"><History size={12} /></button>
                          <button onClick={() => updateUi({ activeClient: { type: 'note', ...client } })} className="p-1.5 bg-muted/40 text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-all" title="Notes marchandise"><Package size={12} /></button>
                        </div>
                        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                          {client.phone && <button onClick={() => handleWhatsAppRelance(client)} className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle size={14} /></button>}
                          <button onClick={() => updateUi({ activeClient: { type: 'pay', ...client } })} className="btn-ultra-compact bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white">ENCAISSER</button>
                          <button onClick={() => updateUi({ activeClient: { type: 'add', ...client } })} className="btn-ultra-compact bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white">+ DETTE</button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredClients.length === 0 && (
        <div className="py-20 text-center opacity-20 print:hidden">
          <Users size={48} className="mx-auto mb-2" />
          <p className="text-[10px] font-black uppercase tracking-widest">Aucun client</p>
        </div>
      )}

      {/* --- DRAWERS / MODALS --- */}
      
      {/* Nouveau Client */}
      <ResponsiveDialog open={ui.isNewClientOpen} onOpenChange={(o) => updateUi({ isNewClientOpen: o })}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Nouveau Client</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Ajouter un client à votre carnet d'adresses.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <form onSubmit={handleAddClient} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom complet</label>
              <input type="text" value={form.name} onChange={e => updateForm({ name: e.target.value })} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="Nom du client..." required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Téléphone</label>
                <input type="text" value={form.phone} onChange={e => updateForm({ phone: e.target.value })} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="77..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Segmentation</label>
                <select value={form.tag} onChange={e => updateForm({ tag: e.target.value })} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-xs font-black uppercase focus:border-primary outline-none transition-all">
                  {TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-orange-500 ml-1">Plafond (F)</label>
                <input type="number" value={form.creditLimit} onChange={e => updateForm({ creditLimit: e.target.value })} className="w-full p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl text-sm font-black focus:border-orange-500 outline-none transition-all" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Dette Initiale</label>
                <input type="number" value={form.initialDebt} onChange={e => updateForm({ initialDebt: e.target.value })} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-black focus:border-primary outline-none transition-all" placeholder="0" />
              </div>
            </div>
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all mt-4">
              Enregistrer
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Opération (Paiement ou Dette) */}
      <ResponsiveDialog open={!!ui.activeClient} onOpenChange={(isOpen) => { if(!isOpen) { updateUi({ activeClient: null }); updateForm({ cashReceived: '' }); } }}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ui.activeClient?.type === 'pay' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {ui.activeClient?.type === 'pay' ? <Receipt size={20}/> : <CreditCard size={20}/>}
               </div>
               <div>
                 <ResponsiveDialogTitle>
                    {ui.activeClient?.type === 'pay' ? 'Encaissement' : 
                     ui.activeClient?.type === 'add' ? 'Achat sans cash' : 
                     'Note Marchandise'}
                 </ResponsiveDialogTitle>
                 <ResponsiveDialogDescription>{ui.activeClient?.name}</ResponsiveDialogDescription>
               </div>
            </div>
          </ResponsiveDialogHeader>
          {ui.activeClient && ui.activeClient.type === 'note' ? (
            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Marchandise en attente de retrait</label>
                <textarea 
                  value={form.pendingNote} 
                  onChange={(e) => updateForm({ pendingNote: e.target.value })} 
                  placeholder="Ex: 1 Sac de riz, 2 packs d'eau..." 
                  className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all min-h-[100px]" 
                  autoFocus
                />
              </div>
              <button 
                onClick={() => { updateClient(ui.activeClient.id, { pending_items: form.pendingNote }); updateUi({ activeClient: null }) }}
                className="w-full py-4 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all"
              >
                Enregistrer la note
              </button>
            </div>
          ) : ui.activeClient && (
            <form onSubmit={ui.activeClient.type === 'pay' ? handlePayment : handleAddDebt} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Motif / Libellé</label>
                <input type="text" value={ui.activeClient.type === 'pay' ? form.paymentLibelle : form.newDebtLibelle} onChange={(e) => ui.activeClient.type === 'pay' ? updateForm({ paymentLibelle: e.target.value }) : updateForm({ newDebtLibelle: e.target.value })} placeholder="ex: Versement espèces..." className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Montant (FCFA)</label>
                <input type="number" value={ui.activeClient.type === 'pay' ? form.paymentAmount : form.newDebtAmount} onChange={(e) => ui.activeClient.type === 'pay' ? updateForm({ paymentAmount: e.target.value }) : updateForm({ newDebtAmount: e.target.value })} className={`w-full p-4 border-2 rounded-xl text-2xl font-black outline-none transition-all ${ui.activeClient.type === 'pay' ? 'bg-emerald-500/5 border-emerald-500/20 focus:border-emerald-500' : 'bg-red-500/5 border-red-500/20 focus:border-red-500'}`} autoFocus required />
              </div>
 
              {ui.activeClient.type === 'pay' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mode de règlement</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => updateForm({ paymentMethod: 'cash' })} className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${form.paymentMethod === 'cash' ? 'bg-primary text-white border-primary' : 'bg-muted/20 border-border text-muted-foreground'}`}>Espèces</button>
                    <button type="button" onClick={() => updateForm({ paymentMethod: 'wave' })} className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${form.paymentMethod === 'wave' ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/20' : 'bg-muted/20 border-border text-muted-foreground'}`}>Wave</button>
                    <button type="button" onClick={() => updateForm({ paymentMethod: 'orange' })} className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${form.paymentMethod === 'orange' ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'bg-muted/20 border-border text-muted-foreground'}`}>O. Money</button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-2xl border border-border/50">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Espèces Reçues</label>
                    <input type="number" value={form.cashReceived} onChange={(e) => updateForm({ cashReceived: e.target.value })} placeholder="0" className="w-full p-2.5 bg-background border border-border rounded-xl text-lg font-black focus:border-primary outline-none transition-all" />
                 </div>
                 <div className="space-y-1 flex flex-col justify-end pb-1 text-right">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Monnaie à rendre</p>
                    <p className={`text-xl font-black tracking-tighter ${changeToReturn > 0 ? 'text-primary' : 'text-muted-foreground/30'}`}>
                       {changeToReturn.toLocaleString()} F
                    </p>
                 </div>
              </div>
 
              {ui.activeClient.type === 'pay' && (ui.activeClient.loyalty_points || 0) >= (loyaltyConfig.minPointsToRedeem || 500) && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                         <Star size={20} fill="currentColor" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-amber-600">Cagnotte Fidélité</p>
                         <p className="text-sm font-black">{ui.activeClient.loyalty_points} Points ≈ {ui.activeClient.loyalty_points} F</p>
                      </div>
                   </div>
                   <button 
                     type="button" 
                     onClick={() => {
                        const amountToUse = Math.min(ui.activeClient.loyalty_points, Number(form.paymentAmount))
                        if (amountToUse <= 0) return
                        useLoyaltyPoints(ui.activeClient.id, amountToUse, amountToUse)
                        updateForm({ paymentAmount: Number(form.paymentAmount) - amountToUse })
                        toast.success(`Fidélité appliquée : -${amountToUse} F`)
                     }}
                     className="px-4 py-2 bg-amber-500 text-white rounded-lg font-black text-[9px] uppercase shadow-md active:scale-95 transition-all"
                   >
                     DÉDUIRE
                   </button>
                </div>
              )}

              <button type="submit" className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all mt-4 ${ui.activeClient.type === 'pay' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                Confirmer l'opération
              </button>
            </form>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Impression Reçu */}
      <ResponsiveDialog open={!!ui.printData} onOpenChange={(isOpen) => !isOpen && updateUi({ printData: null })}>
        <ResponsiveDialogContent className="sm:max-w-sm text-center">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mt-4 mb-2">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-black tracking-tighter">Opération Validée</h3>
          <p className="text-sm font-bold text-muted-foreground mt-1 italic">"{ui.printData?.libelle}"</p>
          
          <div className="bg-muted/30 p-4 rounded-xl mt-6 mb-6">
             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nouveau Solde</p>
             <p className={`text-3xl font-black tracking-tighter mt-1 ${ui.printData?.newDebt > 0 ? 'text-red-500' : ui.printData?.newDebt < 0 ? 'text-emerald-500' : 'text-foreground'}`}>
               {ui.printData?.newDebt > 0 ? 'Dette ' : ui.printData?.newDebt < 0 ? 'Avoir ' : ''}{Math.abs(ui.printData?.newDebt || 0).toLocaleString()} F
             </p>
          </div>
 
          <div className="flex flex-col gap-2">
            <button onClick={() => { window.print(); updateUi({ printData: null }); }} className="w-full bg-primary text-white py-3.5 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Printer size={16} /> Imprimer le reçu
            </button>
            <button onClick={() => updateUi({ printData: null })} className="w-full py-3 rounded-xl font-black text-sm uppercase text-muted-foreground hover:bg-muted transition-all">
              Fermer
            </button>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Marketing */}
      <MarketingRelanceDialog 
        isOpen={ui.isMarketingOpen} 
        onClose={() => updateUi({ isMarketingOpen: false })} 
        clients={clientList} 
      />

      {/* Détails */}
      {ui.detailClient && <TransactionHistoryModal person={clients.find(c => c.id === ui.detailClient.id) || ui.detailClient} onClose={() => updateUi({ detailClient: null })} />}

      {/* Imprimante cachée */}
      <div className="hidden print:block text-black bg-white p-4 w-[58mm] mx-auto text-[10px] font-mono leading-tight">
        <div className="text-center mb-4 border-b-2 border-black pb-2">
          <h2 className="font-black text-lg">BUTIK</h2>
          <p className="font-bold text-[8px]">GESTION BOUTIQUE</p>
        </div>
        {ui.printData && (
          <div className="space-y-3">
            <div>
              <p>Date: {ui.printData.date}</p>
              <p>Type: {ui.printData.type}</p>
              <p className="font-bold">Mode: {ui.printData.paymentMethod === 'wave' ? 'WAVE' : ui.printData.paymentMethod === 'orange' ? 'ORANGE MONEY' : 'ESPECES'}</p>
              <p className="font-black mt-2">Client: {ui.printData.client}</p>
              <p>Ref: {ui.printData.libelle}</p>
            </div>
            <div className="border-t-2 border-black pt-2 mt-2">
              <div className="flex justify-between font-black text-sm">
                <span>MONTANT:</span>
                <span>{ui.printData.amount.toLocaleString()} F</span>
              </div>
            </div>
            <div className="border-t-2 border-black pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Nouveau Solde:</span>
                <span>{ui.printData.newDebt > 0 ? 'Dette ' : ui.printData.newDebt < 0 ? 'Avoir ' : ''}{Math.abs(ui.printData.newDebt).toLocaleString()} F</span>
              </div>
            </div>
            <div className="text-center pt-4 border-t border-black/10 mt-6 opacity-80 text-[8px]">
              <p>Merci pour votre confiance !</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
