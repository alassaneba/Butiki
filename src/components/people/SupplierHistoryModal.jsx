import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { X, Plus, ArrowUpCircle, ArrowDownCircle, Truck, Flame, Zap, Package } from 'lucide-react'
import { ResponsiveDialog, ResponsiveDialogContent } from '../ui/responsive-dialog'

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const CATEGORY_LABELS = {
  pain:    { label: 'Pain',    icon: Truck, color: 'bg-amber-500/10 text-amber-600 border-amber-400/20' },
  gaz:     { label: 'Gaz',     icon: Flame, color: 'bg-blue-500/10 text-blue-600 border-blue-400/20' },
  credit:  { label: 'Crédit',  icon: Zap,   color: 'bg-indigo-500/10 text-indigo-600 border-indigo-400/20' },
  general: { label: 'Général', icon: Package, color: 'bg-muted text-muted-foreground border-border' },
}

export function CatBadge({ cat }) {
  const c = CATEGORY_LABELS[cat] || CATEGORY_LABELS.general
  const Icon = c.icon
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full font-black px-3 py-1 text-[9px] uppercase tracking-wider ${c.color}`}>
      <Icon size={10} strokeWidth={3} /> {c.label}
    </span>
  )
}

function StarIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export default function SupplierHistoryModal({ supplier, onClose }) {
  const stock = useStore(state => state.stock)
  const linkProductToSupplier = useStore(state => state.linkProductToSupplier)
  const addSupplierEvaluation = useStore(state => state.addSupplierEvaluation)
  const transactions = supplier.transactions || []
  const linkedProducts = stock.filter(s => s.supplierId === supplier.id)
  const availableProducts = stock.filter(s => s.supplierId !== supplier.id)
  
  const [showAddProduct, setShowAddProduct] = useState(false)

  if (!supplier) return null;

  return (
    <ResponsiveDialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <ResponsiveDialogContent className="p-0 bg-card overflow-hidden flex flex-col max-h-[90vh] sm:max-w-xl rounded-t-[20px] sm:rounded-[24px]">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase">Historique</h2>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{supplier.name}</p>
               <CatBadge cat={supplier.category} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
          {/* Section Produits */}
          <div className="space-y-3">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Produits Fournis ({linkedProducts.length})</h3>
                <button 
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                >
                  <Plus size={14} />
                </button>
             </div>
             
             {showAddProduct && (
               <div className="p-3 bg-muted/30 rounded-2xl border border-border space-y-2">
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        linkProductToSupplier(e.target.value, supplier.id)
                        setShowAddProduct(false)
                      }
                    }}
                    className="w-full p-2 bg-background border border-border rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="">Sélectionner un produit à lier...</option>
                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
             )}

             <div className="flex flex-wrap gap-2">
                {linkedProducts.length === 0 ? (
                  <p className="text-[9px] font-bold text-muted-foreground/40 italic ml-2">Aucun produit lié</p>
                ) : linkedProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl group/prod">
                    <span className="text-[10px] font-black uppercase">{p.name}</span>
                    <button 
                      onClick={() => linkProductToSupplier(p.id, null)}
                      className="text-muted-foreground/20 hover:text-red-500 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Transactions Financières</h3>
            {transactions.length === 0 ? (
               <div className="py-10 text-center opacity-20 italic font-black uppercase text-xs tracking-widest">Aucune donnée</div>
            ) : (
              transactions.map((tx, i) => (
                <div key={i} className={`p-5 rounded-3xl border transition-all flex justify-between items-center ${tx.type === 'paiement' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tx.type === 'paiement' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {tx.type === 'paiement' ? <ArrowUpCircle size={18}/> : <ArrowDownCircle size={18}/>}
                    </div>
                    <div>
                      <p className="font-black text-sm">{tx.libelle}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-lg ${tx.type === 'paiement' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.type === 'paiement' ? '-' : '+'}{tx.amount.toLocaleString()} F
                    </p>
                    <p className="text-[10px] font-black uppercase opacity-40">Solde: {tx.balance.toLocaleString()} F</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 bg-muted/10 border-y border-border space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Solde dû</span>
            <span className={`text-2xl font-black tracking-tighter ${supplier.total_debt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {(supplier.total_debt || 0).toLocaleString()} F
            </span>
          </div>
          <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-background border-2 border-border font-black text-sm hover:bg-muted active:scale-95 transition-all">
            Fermer l'aperçu
          </button>
        </div>

        {/* --- ERP: Section Évaluation --- */}
        <div className="p-6 bg-primary/5">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Évaluation de Performance</h4>
           <div className="flex items-center justify-between">
              <div className="flex gap-1">
                 {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                       key={star} 
                       onClick={() => addSupplierEvaluation({ supplierId: supplier.id, rating: star, note: 'Évaluation rapide' })}
                       className={`p-1.5 rounded-lg transition-all ${star <= (supplier.rating || 0) ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground/30 hover:text-amber-500'}`}
                    >
                       <StarIcon filled={star <= (supplier.rating || 0)} />
                    </button>
                 ))}
              </div>
              <span className="text-[9px] font-black uppercase text-muted-foreground">Qualité / Délais</span>
           </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
