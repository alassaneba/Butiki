import React from 'react'
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from '../../components/ui/responsive-dialog'
import { ShoppingCart, Minus, Plus, X, User, UserPlus, Star, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

export default function VentesCart({
  ui, 
  updateUi, 
  cart, 
  updateCartQty, 
  removeFromCart, 
  terminal, 
  updateTerminal, 
  splitPayments, 
  setSplitPayments, 
  totalSplit, 
  totalAmount, 
  totalCart,
  totalCost,
  clients, 
  config,
  status,
  isLossSale,
  canValidate,
  handleValidateSale
}) {
  return (
    <ResponsiveDialog open={ui.showCartDrawer} onOpenChange={(v) => updateUi({ showCartDrawer: v })}>
      <ResponsiveDialogContent className="rounded-t-[3rem] p-6">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em]">
            <ShoppingCart size={20} className="text-primary" /> Validation
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        
        <div className="space-y-3 py-4 max-h-[30vh] overflow-y-auto px-1 no-scrollbar">
          {cart.map(item => (
            <div key={item.productId} className="flex items-center gap-4 p-4 bg-muted/20 border border-border/50 rounded-[2rem]">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black uppercase truncate">{item.name}</p>
                <p className="text-[10px] font-bold text-primary">{item.unitPrice.toLocaleString()} F</p>
              </div>
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
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Client</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                  <select 
                    value={terminal.selectedClientId} 
                    onChange={e => updateTerminal({ selectedClientId: e.target.value })} 
                    className="w-full pl-10 pr-10 py-3 bg-muted/20 border border-border rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  >
                    <option value="">{clients.length === 0 ? 'Aucun client (Vente Comptant)' : 'Sélectionner un client'}</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => updateUi({ showNewClientDialog: true })} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="Ajouter un nouveau client"
                  >
                    <UserPlus size={18} />
                  </button>
                </div>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">OFF</span>
                  <input 
                    type="number" 
                    value={terminal.discountAmount || ''} 
                    onChange={e => updateTerminal({ discountAmount: Number(e.target.value), pointsUsed: 0 })} 
                    placeholder="0" 
                    className="w-full pl-10 p-3 bg-muted/30 border border-border rounded-xl text-xs font-black outline-none focus:border-primary transition-all text-right" 
                  />
                </div>
              </div>
            </div>
            
            {terminal.selectedClientId && (() => {
              const client = clients.find(c => c.id === terminal.selectedClientId)
              const pts = client?.loyalty_points || 0
              const minPts = config?.prices?.loyalty?.minPointsToRedeem || 500
              if (pts >= minPts) {
                return (
                  <div className="flex items-center justify-between bg-amber-500/5 p-3 rounded-2xl border border-amber-500/20">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-1"><Star size={12}/> Fidélité</span>
                      <span className="text-xs font-bold">{pts} Points disponibles</span>
                    </div>
                    <button 
                      onClick={() => {
                        const maxUsable = Math.min(pts, totalCart)
                        updateTerminal({ discountAmount: maxUsable, pointsUsed: maxUsable })
                      }}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95"
                    >
                      Utiliser
                    </button>
                  </div>
                )
              }
              return null
            })()}
          </div>

          {isLossSale && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Alerte Vente à Perte</span>
              </div>
              <p className="text-[10px] font-bold text-red-600/80">
                Le montant total ({totalAmount.toLocaleString()} F) est inférieur au coût d'achat ({totalCost.toLocaleString()} F).
              </p>
              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={ui.allowLoss} 
                  onChange={e => updateUi({ allowLoss: e.target.checked })}
                  className="w-4 h-4 rounded border-red-500/50 text-red-600 focus:ring-red-500"
                />
                <span className="text-[10px] font-black uppercase text-red-700">Autoriser cette vente exceptionnelle</span>
              </label>
            </div>
          )}

          <div className={clsx("p-6 rounded-[2.5rem] shadow-2xl flex justify-between items-center text-white relative overflow-hidden group transition-colors", isLossSale && !ui.allowLoss ? "bg-red-500" : "bg-primary")}>
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase opacity-70 tracking-widest">Total Net</span>
              <span className="text-2xl font-black">{totalAmount.toLocaleString()} F</span>
            </div>
            <button 
              disabled={status.isProcessing || !canValidate} 
              onClick={handleValidateSale} 
              className={clsx("px-10 py-3 bg-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale", isLossSale && !ui.allowLoss ? "text-red-600" : "text-primary")}
            >
              {status.isProcessing ? "..." : "Valider"}
            </button>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
