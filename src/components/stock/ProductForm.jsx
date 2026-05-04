import { useState, useMemo } from 'react'
import { Plus, PackageSearch } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function ProductForm() {
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
  }

  return (
    <div className="p-6 bg-card rounded-2xl border border-border shadow-sm sticky top-20">
      <h3 className="flex items-center gap-2 font-bold mb-4 text-base uppercase">
        <PackageSearch size={18} className="text-primary"/> Nouveau Produit
      </h3>
      <form onSubmit={handleAddItem} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5">Nom du Produit</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-bold focus:ring-2 ring-primary outline-none" placeholder="ex: Coca Cola" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5">Type Produit</label>
            <input type="text" value={typeProduit} onChange={e => setTypeProduit(e.target.value)} placeholder="ex: Carton, Sac" className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-bold focus:ring-2 ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5">Nombre de Type</label>
            <input type="number" value={numTypes} onChange={e => setNumTypes(e.target.value)} placeholder="ex: 10" className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-black focus:ring-2 ring-primary outline-none" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5">Quantité par Type</label>
            <input type="number" value={qtyPerType} onChange={e => setQtyPerType(e.target.value)} placeholder="ex: 12" className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-black focus:ring-2 ring-primary outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5">Prix achat par Type</label>
            <input type="number" value={priceBuyPerType} onChange={e => setPriceBuyPerType(e.target.value)} placeholder="ex: 5000" className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-black focus:ring-2 ring-primary outline-none" required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
          <div className="text-center border-r border-border/50">
            <span className="block text-[8px] font-black uppercase text-muted-foreground mb-1">Achat TOTAL</span>
            <p className="text-xs font-black text-primary">{totalPriceBuy.toLocaleString()} F</p>
          </div>
          <div className="text-center border-r border-border/50">
            <span className="block text-[8px] font-black uppercase text-muted-foreground mb-1">Achat Unitaire</span>
            <p className="text-xs font-black text-primary">{priceBuyUnit.toLocaleString()} F</p>
          </div>
          <div className="text-center">
            <span className="block text-[8px] font-black uppercase text-muted-foreground mb-1">Nombre Unités</span>
            <p className="text-xs font-black text-primary">{totalUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-orange-500 mb-1.5">Seuil Alerte (Unités)</label>
            <input type="number" value={thresholdUnit} onChange={e => setThresholdUnit(e.target.value)} className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-black focus:ring-2 ring-orange-500 outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-green-500 mb-1.5">Prix Vente Unitaire</label>
            <input type="number" value={priceSellUnit} onChange={e => setPriceSellUnit(e.target.value)} className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-black focus:ring-2 ring-green-500 outline-none" required />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5">Date de validité</label>
          <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full p-2.5 border border-border rounded-xl bg-background text-sm font-bold focus:ring-2 ring-primary outline-none" />
        </div>

        <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:opacity-90 flex justify-center items-center gap-2 mt-4 shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm">
          <Plus size={16} /> Ajouter le Produit
        </button>
      </form>
    </div>
  )
}
