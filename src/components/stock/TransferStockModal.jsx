import { useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { ArrowRightLeft, Package, Store, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function TransferStockModal({ onSuccess }) {
  const boutiques = useStore(state => state.boutiques) || []
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allStock = useStore(state => state.stock) || []
  const transferStock = useStore(state => state.transferStock)

  const activeUser = useStore(state => (state.users || []).find(u => u.id === state.activeUserId))
  const [destBoutiqueId, setDestBoutiqueId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isAuthorized = activeUser?.role === 'gerant' || !activeUser // !activeUser pour le dev si pas de login

  // Produits de la boutique actuelle
  const availableStock = useMemo(() => 
    allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId && s.current_stock > 0),
    [allStock, activeBoutiqueId]
  )

  const selectedProduct = useMemo(() => 
    availableStock.find(p => p.id === productId),
    [availableStock, productId]
  )

  const handleTransfer = async (e) => {
    if (e) e.preventDefault()
    
    if (!isAuthorized) {
      toast.error('Accès refusé : Seul un gérant peut effectuer des transferts')
      return
    }

    if (!destBoutiqueId || !productId || !quantity) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (Number(quantity) <= 0) {
      toast.error('Quantité invalide')
      return
    }

    if (Number(quantity) > selectedProduct.current_stock) {
      toast.error('Quantité insuffisante')
      return
    }

    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)
    try {
      transferStock(activeBoutiqueId, destBoutiqueId, productId, quantity)
      toast.success('Transfert réussi !')
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Erreur lors du transfert')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="p-6 bg-card sm:rounded-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-border/50 pb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <ArrowRightLeft size={20} />
        </div>
        <div>
          <h3 className="font-black text-sm uppercase tracking-wider">Transfert Inter-Boutique</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Logistique Interne Butik</p>
        </div>
      </div>

      <form onSubmit={handleTransfer} className="space-y-6">
        {/* Source & Destination */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="space-y-1.5 opacity-60 cursor-not-allowed">
            <label className="block text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">Source</label>
            <div className="p-3 bg-muted/30 border border-border/40 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
              <Store size={12} /> {boutiques.find(b => b.id === activeBoutiqueId)?.name || 'Principale'}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[8px] font-black uppercase text-primary tracking-widest ml-1">Destination</label>
            <select 
              value={destBoutiqueId} 
              onChange={e => setDestBoutiqueId(e.target.value)}
              className="w-full p-3 bg-background border border-primary/20 rounded-xl text-[10px] font-black uppercase focus:ring-4 ring-primary/5 outline-none"
              required
            >
              <option value="">Choisir...</option>
              {boutiques.filter(b => b.id !== activeBoutiqueId).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Produit */}
        <div className="space-y-1.5">
          <label className="block text-[8px] font-black uppercase text-muted-foreground tracking-widest ml-1">Produit à transférer</label>
          <select 
            value={productId} 
            onChange={e => setProductId(e.target.value)}
            className="w-full p-3 bg-background border border-border/40 rounded-xl text-[11px] font-black uppercase outline-none focus:border-primary/40"
            required
          >
            <option value="">Sélectionner un produit ({availableStock.length})</option>
            {availableStock.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
            ))}
          </select>
        </div>

        {/* Quantité & Alerte */}
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={20} />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase">{selectedProduct.name}</p>
                  <p className="text-[9px] font-bold text-muted-foreground">Disponibilité : {selectedProduct.current_stock} unités</p>
                </div>
              </div>
              <div className="text-right">
                <label className="block text-[8px] font-black uppercase text-primary tracking-widest mb-1">Quantité</label>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)}
                  max={selectedProduct.current_stock}
                  min="1"
                  className="w-20 p-2 bg-background border border-primary/40 rounded-lg text-center font-black text-sm focus:ring-4 ring-primary/5 outline-none"
                  required
                />
              </div>
            </div>

            {Number(quantity) > 0 && Number(quantity) <= selectedProduct.current_stock && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-600">
                <CheckCircle2 size={14} />
                <p className="text-[9px] font-bold uppercase">Nouveau stock prévu : {selectedProduct.current_stock - Number(quantity)} unités à la source</p>
              </div>
            )}
          </motion.div>
        )}

        {!selectedProduct && (
          <div className="p-8 text-center bg-muted/20 rounded-3xl border border-dashed border-border/50">
             <Package size={30} className="mx-auto opacity-10 mb-2" />
             <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">Choisissez un produit pour continuer</p>
          </div>
        )}

        {/* Summary if confirmation is needed */}
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3"
          >
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">Confirmer le transfert</p>
            </div>
            <p className="text-xs font-bold leading-relaxed">
              Vous allez transférer <span className="text-primary">{quantity} unités</span> de <span className="text-primary">{selectedProduct?.name}</span> vers <span className="text-primary">{boutiques.find(b => b.id === destBoutiqueId)?.name}</span>.
            </p>
            <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-muted text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Traitement...' : 'Confirmer'}
              </button>
            </div>
          </motion.div>
        )}

        {!isAuthorized && (
          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={18} />
            <p className="text-[10px] font-bold text-red-600/80 uppercase leading-relaxed">
              Votre rôle actuel ne vous permet pas d'initier des transferts de stock. Veuillez contacter un gérant.
            </p>
          </div>
        )}

        {!showConfirm && (
          <button 
            type="submit"
            disabled={loading || !isAuthorized}
            className="w-full py-4 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            {loading ? 'Chargement...' : 'Initier le Transfert'}
          </button>
        )}
      </form>
    </div>
  )
}
