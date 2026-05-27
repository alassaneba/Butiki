import React, { useRef } from 'react'
import { Search, RotateCcw, Wallet, CreditCard, Smartphone, Clock, History } from 'lucide-react'
import clsx from 'clsx'
import { useVirtualizer } from '@tanstack/react-virtual'

const formatF = (val) => `${Number(val || 0).toLocaleString('fr-FR')} F`
const formatTime = (dateStr) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch (err) { return '--:--' }
}

function SaleHistoryRow({ sale, clients, updateHistory }) {
  const client = clients.find(c => c.id === sale.clientId)
  const isCancelled = sale.status === 'cancelled'
  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }} 
      onClick={() => updateHistory({ selectedSaleDetails: sale })} 
      className={clsx("bg-card border border-border p-4 rounded-3xl flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all shadow-sm mb-3", isCancelled && "opacity-60 bg-muted/30")}
    >
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
        <p className="text-[9px] font-bold text-muted-foreground">{sale.items?.length || 0} article(s)</p>
      </div>
    </motion.div>
  )
}

export default function VentesHistory({ ui, updateUi, filteredSales, clients, updateHistory }) {
  const historyRef = useRef(null)
  
  const salesVirtualizer = useVirtualizer({
    count: filteredSales.length,
    getScrollElement: () => historyRef.current,
    estimateSize: () => 90,
    overscan: 5,
  })

  return (
    <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col gap-4 min-h-0">
      <div className="bg-card border border-border rounded-3xl p-4 shadow-sm shrink-0">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            value={ui.historySearch || ''} 
            onChange={e => updateUi({ historySearch: e.target.value })} 
            placeholder="Chercher une vente..." 
            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-2xl text-sm font-bold outline-none" 
          />
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
                <SaleHistoryRow sale={sale} clients={clients} updateHistory={updateHistory} />
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
  )
}
