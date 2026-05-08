import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import {
  Plus, Search, X, Eye, MessageCircle, Phone, History,
  Truck, UserPlus, CreditCard, Receipt
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SupplierHistoryModal, { CatBadge } from '../components/people/SupplierHistoryModal'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription
} from '../components/ui/responsive-dialog'

export default function Fournisseurs() {
  const suppliers = useStore(state => state.suppliers)
  const addSupplier = useStore(state => state.addSupplier)
  const addSupplierDebt = useStore(state => state.addSupplierDebt)
  const paySupplierDebt = useStore(state => state.paySupplierDebt)

  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState('general')
  const [initialDebt, setInitialDebt] = useState('')
  const [initialLibelle, setInitialLibelle] = useState('')

  const [search, setSearch] = useState('')
  const [activeSupplier, setActiveSupplier] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentLibelle, setPaymentLibelle] = useState('')
  const [newDebtAmount, setNewDebtAmount] = useState('')
  const [newDebtLibelle, setNewDebtLibelle] = useState('')

  const [detailSupplier, setDetailSupplier] = useState(null)

  const handleAddSupplier = (e) => {
    e.preventDefault()
    if (!name) return
    addSupplier({
      name,
      phone,
      category,
      total_debt: Number(initialDebt) || 0,
      libelle_initial: initialLibelle || 'Dette initiale',
    })
    setName(''); setPhone(''); setCategory('general'); setInitialDebt(''); setInitialLibelle('')
    setIsNewSupplierOpen(false)
  }

  const handlePayment = (e) => {
    e.preventDefault()
    if (!activeSupplier || !paymentAmount) return
    paySupplierDebt(activeSupplier.id, paymentAmount, paymentLibelle || 'Remboursement')
    setPaymentAmount(''); setPaymentLibelle('')
    setActiveSupplier(null)
  }

  const handleAddDebt = (e) => {
    e.preventDefault()
    if (!activeSupplier || !newDebtAmount) return
    addSupplierDebt(activeSupplier.id, newDebtAmount, newDebtLibelle || 'Nouvelle dette')
    setNewDebtAmount(''); setNewDebtLibelle('')
    setActiveSupplier(null)
  }

  const filteredSuppliers = useMemo(() => {
    const list = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    
    const listWithActivity = list.map(supplier => {
      const lastTx = supplier.transactions && supplier.transactions.length > 0 
        ? supplier.transactions[supplier.transactions.length - 1] 
        : { date: supplier.createdAt || new Date().toISOString(), libelle: 'Profil créé' }
      return { ...supplier, lastActionDate: lastTx.date, lastActionLibelle: lastTx.libelle }
    })

    return listWithActivity.sort((a, b) => new Date(b.lastActionDate) - new Date(a.lastActionDate))
  }, [suppliers, search])

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-20 will-change-[opacity]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight uppercase">Partenaires & Comptes</h1>
          <p className="text-muted-foreground font-bold mt-1 uppercase text-[10px] tracking-widest flex items-center gap-2">
            <Truck className="text-primary" size={14}/> Gestion des dettes fournisseurs
          </p>
        </div>
        <button 
          onClick={() => setIsNewSupplierOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md active:scale-95 whitespace-nowrap w-full sm:w-auto justify-center"
        >
          <UserPlus size={16} /> Nouveau Fournisseur
        </button>
      </header>

      {/* Barre de recherche */}
      <div className="flex bg-card p-2 rounded-2xl border border-border shadow-sm">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Rechercher un partenaire..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full pl-9 p-2.5 bg-muted/30 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
          />
        </div>
      </div>

      {/* Liste des Fournisseurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence initial={false}>
          {filteredSuppliers.map((supplier) => (
            <motion.div 
              key={supplier.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              transition={{ duration: 0.2 }}
              className="card-ultra-compact flex flex-col gap-2 relative overflow-hidden"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0">
                    {supplier.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-black text-sm tracking-tight truncate uppercase">{supplier.name}</h4>
                      <CatBadge cat={supplier.category} />
                    </div>
                    {supplier.phone && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <a href={`tel:${supplier.phone}`} className="text-[9px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1"><Phone size={10}/> {supplier.phone}</a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[8px] font-black uppercase text-muted-foreground/60 mb-0.5">Solde Dû</p>
                  <p className={`text-sm font-black tracking-tighter ${(supplier.total_debt || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {(supplier.total_debt || 0).toLocaleString()} F
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 mt-1 flex-wrap">
                <button onClick={() => setDetailSupplier(supplier)} className="flex items-center gap-1.5 p-1.5 bg-muted/40 text-muted-foreground rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-[9px] font-bold uppercase">
                  <History size={12} /> Détails
                </button>
                <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                  {supplier.phone && (
                    <a href={`https://wa.me/${supplier.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle size={14} /></a>
                  )}
                  <button onClick={() => setActiveSupplier({ type: 'pay', ...supplier })} disabled={(supplier.total_debt || 0) <= 0} className="btn-ultra-compact bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white disabled:opacity-30 disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-600">PAYER</button>
                  <button onClick={() => setActiveSupplier({ type: 'debt', ...supplier })} className="btn-ultra-compact bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white">+ DETTE</button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full py-10 text-center bg-muted/10 rounded-2xl border border-dashed border-border/50">
            <Truck className="mx-auto text-muted-foreground opacity-10 mb-2" size={32} />
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Aucun partenaire trouvé</p>
          </div>
        )}
      </div>

      {/* --- DRAWERS / MODALS --- */}

      {/* Nouveau Fournisseur */}
      <ResponsiveDialog open={isNewSupplierOpen} onOpenChange={setIsNewSupplierOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Nouveau Profil</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Ajouter un nouveau partenaire ou fournisseur.</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <form onSubmit={handleAddSupplier} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom / Société</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Téléphone</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all" placeholder="77..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Spécialité</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-xs font-black uppercase focus:border-primary outline-none transition-all">
                  <option value="general">Général</option>
                  <option value="pain">Pain</option>
                  <option value="gaz">Gaz</option>
                  <option value="credit">Crédit</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Dette de départ (F)</label>
              <input type="number" value={initialDebt} onChange={e => setInitialDebt(e.target.value)} className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-black focus:border-primary outline-none transition-all" placeholder="0" />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all mt-4">
              Créer Partenaire
            </button>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Opération (Paiement ou Dette) */}
      <ResponsiveDialog open={!!activeSupplier} onOpenChange={(isOpen) => !isOpen && setActiveSupplier(null)}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeSupplier?.type === 'pay' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {activeSupplier?.type === 'pay' ? <Receipt size={20}/> : <CreditCard size={20}/>}
              </div>
              <div>
                <ResponsiveDialogTitle>{activeSupplier?.type === 'pay' ? 'Payer le Solde' : 'Ajouter Dette'}</ResponsiveDialogTitle>
                <ResponsiveDialogDescription>{activeSupplier?.name}</ResponsiveDialogDescription>
              </div>
            </div>
          </ResponsiveDialogHeader>
          {activeSupplier && (
            <form onSubmit={activeSupplier.type === 'pay' ? handlePayment : handleAddDebt} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Motif / Facture #</label>
                <input
                  type="text"
                  value={activeSupplier.type === 'pay' ? paymentLibelle : newDebtLibelle}
                  onChange={(e) => activeSupplier.type === 'pay' ? setPaymentLibelle(e.target.value) : setNewDebtLibelle(e.target.value)}
                  placeholder="ex: Facture Gaz..."
                  className="w-full p-3 bg-muted/20 border border-border rounded-xl text-sm font-bold focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Montant (F)</label>
                <input
                  type="number"
                  value={activeSupplier.type === 'pay' ? paymentAmount : newDebtAmount}
                  onChange={(e) => activeSupplier.type === 'pay' ? setPaymentAmount(e.target.value) : setNewDebtAmount(e.target.value)}
                  className={`w-full p-4 border-2 rounded-xl text-2xl font-black outline-none transition-all ${activeSupplier.type === 'pay' ? 'bg-emerald-500/5 border-emerald-500/20 focus:border-emerald-500' : 'bg-red-500/5 border-red-500/20 focus:border-red-500'}`}
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all mt-4 ${activeSupplier.type === 'pay' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                Valider l'Opération
              </button>
            </form>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Détails Historique */}
      {detailSupplier && (
        <SupplierHistoryModal
          supplier={suppliers.find(s => s.id === detailSupplier.id) || detailSupplier}
          onClose={() => setDetailSupplier(null)}
        />
      )}
    </div>
  )
}
