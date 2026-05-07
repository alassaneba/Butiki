import { useState, useMemo } from 'react'
import { Plus, PackageSearch } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function ProductForm({ onSuccess }) {
  const addStockItem = useStore(state => state.addStockItem)

  const [name, setName] = useState('')
  const [typeProduit, setTypeProduit] = useState('')
  const [numTypes, setNumTypes] = useState('')
  const [qtyPerType, setQtyPerType] = useState('')
  const [priceBuyPerType, setPriceBuyPerType] = useState('')
  const [thresholdUnit, setThresholdUnit] = useState('10')
  const [priceSellUnit, setPriceSellUnit] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  const totalPriceBuy = useMemo(() => (Number(numTypes) || 0) * (Number(priceBuyPerType) || 0), [numTypes, priceBuyPerType])
  const totalUnits = useMemo(() => (Number(numTypes) || 0) * (Number(qtyPerType) || 0), [numTypes, qtyPerType])
  const priceBuyUnit = useMemo(() => {
    const qty = Number(qtyPerType) || 0
    const pricePerType = Number(priceBuyPerType) || 0
    return qty > 0 ? Math.round(pricePerType / qty) : 0
  }, [priceBuyPerType, qtyPerType])

  const handleAddItem = (e) => {
    e.preventDefault()
    if (!name) return
    addStockItem({ 
      name, 
      category: typeProduit,
      qty_per_type: Number(qtyPerType) || 1,
      current_stock: totalUnits,
      alert_threshold: Number(thresholdUnit) || 10, 
      price_buy: priceBuyUnit,
      price_sell: Number(priceSellUnit) || 0,
      expiry_date: expiryDate
    })
    setName(''); setTypeProduit(''); setNumTypes(''); setQtyPerType(''); setPriceBuyPerType(''); setThresholdUnit('10'); setPriceSellUnit(''); setExpiryDate('')
    if (onSuccess) onSuccess()
  }

  return (
    <div className="p-6 bg-card sm:rounded-2xl sm:border border-border/40 sm:shadow-sm">
      <h3 className="flex items-center gap-2 font-black mb-6 text-sm uppercase tracking-wider">
        <PackageSearch size={18} className="text-primary"/> Nouveau Produit
      </h3>
      <form onSubmit={handleAddItem} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-1">Désignation</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-border/40 rounded-xl bg-background text-[11px] font-black uppercase focus:ring-4 ring-primary/5 focus:border-primary/40 outline-none transition-all" placeholder="ex: Coca Cola" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-1">Type (Carton/Sac)</label>
            <input type="text" value={typeProduit} onChange={e => setTypeProduit(e.target.value)} placeholder="ex: Carton" className="w-full p-3 border border-border/40 rounded-xl bg-background text-[11px] font-black uppercase focus:ring-4 ring-primary/5 focus:border-primary/40 outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-1">Nb de Type</label>
            <input type="number" value={numTypes} onChange={e => setNumTypes(e.target.value)} placeholder="ex: 10" className="w-full p-3 border border-border/40 rounded-xl bg-background text-[11px] font-black focus:ring-4 ring-primary/5 focus:border-primary/40 outline-none transition-all" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-1">Qté par Type</label>
            <input type="number" value={qtyPerType} onChange={e => setQtyPerType(e.target.value)} placeholder="ex: 12" className="w-full p-3 border border-border/40 rounded-xl bg-background text-[11px] font-black focus:ring-4 ring-primary/5 focus:border-primary/40 outline-none transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-1">Achat par Type</label>
            <input type="number" value={priceBuyPerType} onChange={e => setPriceBuyPerType(e.target.value)} placeholder="ex: 5000" className="w-full p-3 border border-border/40 rounded-xl bg-background text-[11px] font-black focus:ring-4 ring-primary/5 focus:border-primary/40 outline-none transition-all" required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-2xl border border-border/30">
          <div className="text-center">
            <span className="block text-[7px] font-black uppercase text-muted-foreground/40 mb-1 leading-none">TOTAL</span>
            <p className="text-[10px] font-black text-primary">{totalPriceBuy.toLocaleString()} F</p>
          </div>
          <div className="text-center border-x border-border/30">
            <span className="block text-[7px] font-black uppercase text-muted-foreground/40 mb-1 leading-none">UNITAIRE</span>
            <p className="text-[10px] font-black text-primary">{priceBuyUnit.toLocaleString()} F</p>
          </div>
          <div className="text-center">
            <span className="block text-[7px] font-black uppercase text-muted-foreground/40 mb-1 leading-none">UNITÉS</span>
            <p className="text-[10px] font-black text-primary">{totalUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[8px] font-black uppercase text-orange-500/80 tracking-widest ml-1">Seuil Alerte</label>
            <input type="number" value={thresholdUnit} onChange={e => setThresholdUnit(e.target.value)} className="w-full p-3 border border-border/40 rounded-xl bg-background text-[11px] font-black focus:ring-4 ring-orange-500/5 focus:border-orange-500/40 outline-none transition-all" required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[8px] font-black uppercase text-emerald-500/80 tracking-widest ml-1">Prix Vente</label>
            <input type="number" value={priceSellUnit} onChange={e => setPriceSellUnit(e.target.value)} className="w-full p-3 border border-border/40 rounded-xl bg-background text-[11px] font-black focus:ring-4 ring-emerald-500/5 focus:border-emerald-500/40 outline-none transition-all" required />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest ml-1">Validité / Péremption</label>
          <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full p-3 border border-border/40 rounded-xl bg-background text-[11px] font-black focus:ring-4 ring-primary/5 focus:border-primary/40 outline-none transition-all" />
        </div>

        <button type="submit" className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:opacity-95 flex justify-center items-center gap-2 mt-4 shadow-lg shadow-primary/20 active:scale-95 transition-all">
          <Plus size={16} strokeWidth={3} /> Ajouter au Catalogue
        </button>
      </form>
    </div>
  )
}
