import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Printer, List, LayoutGrid, ScanLine, Mic, Package, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { toast } from 'sonner'
import Scanner from '../../components/Scanner'
import { useVirtualizer } from '@tanstack/react-virtual'

function ImageWithFallback({ src, alt, fallback }) {
  const [error, setError] = useState(false)
  if (!src || error) return fallback
  return <img src={src} alt={alt} onError={() => setError(true)} className="w-full h-full object-cover" />
}

export default function VentesTerminal({ 
  stockList, 
  terminal, 
  updateTerminal, 
  ui, 
  updateUi, 
  voiceSupported, 
  listening, 
  startListening, 
  stopListening, 
  sales, 
  handleReprintSale, 
  handleScanSuccess, 
  addToCart 
}) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const columns = useMemo(() => {
    if (windowWidth < 768) return 1
    if (windowWidth < 1280) return 2
    return 3
  }, [windowWidth])

  const filteredProducts = useMemo(() => {
    const search = (terminal.searchTerm || '').toLowerCase()
    return stockList.filter(p => 
      (p.name || '').toLowerCase().includes(search) || 
      (p.category || '').toLowerCase().includes(search)
    )
  }, [stockList, terminal.searchTerm])

  const parentRef = useRef(null)
  const rowCount = Math.ceil(filteredProducts.length / columns)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ui.viewMode === 'grid' ? 250 : 115, 
    overscan: 5,
  })

  useEffect(() => {
    rowVirtualizer.measure()
  }, [ui.viewMode, columns, rowCount, rowVirtualizer])

  return (
    <motion.div key="pos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col gap-4 min-h-0">
      <div className="bg-card border border-border rounded-3xl p-4 shadow-sm space-y-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              value={terminal.searchTerm} 
              onChange={e => updateTerminal({ searchTerm: e.target.value })} 
              placeholder="Chercher un article..." 
              className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-2xl text-sm font-bold outline-none" 
            />
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
            <button onClick={() => updateUi({ viewMode: ui.viewMode === 'grid' ? 'list' : 'grid' })} className="p-2 rounded-xl text-muted-foreground transition-all">
              {ui.viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
            </button>
          </div>
          {voiceSupported && (
            <button onClick={listening ? stopListening : startListening} className={clsx("p-3 rounded-2xl border transition-all", listening ? "bg-red-500 text-white" : "bg-primary/10 text-primary border-primary/20")}>
              <Mic size={18} />
            </button>
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
          key={ui.viewMode}
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
                className={clsx("grid gap-3 px-1", 
                  columns === 3 ? "grid-cols-3" : 
                  columns === 2 ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                {rowProducts.map(p => (
                  ui.viewMode === 'grid' ? (
                    <div 
                      key={p.id} 
                      onClick={() => addToCart(p)} 
                      className="bg-card/50 backdrop-blur-md border border-border p-2 rounded-[2.2rem] shadow-sm cursor-pointer hover:border-primary hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col h-[225px]"
                    >
                      <div className="w-full h-32 rounded-[1.8rem] bg-muted shrink-0 overflow-hidden border border-border/50 shadow-inner relative">
                        <ImageWithFallback 
                          src={p.image} 
                          alt={p.name} 
                          fallback={<Package size={32} className="opacity-20" />} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="flex-1 min-w-0 p-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 truncate">{p.category || 'Général'}</p>
                            <div className={clsx("px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase", p.current_stock < 5 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>
                              Stock: {p.current_stock}
                            </div>
                          </div>
                          <p className="text-xs font-black uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">{p.name}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                          <p className="text-sm font-black text-primary">{p.price_sell.toLocaleString()} <span className="text-[9px] opacity-60">F</span></p>
                          <div className="opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 bg-primary text-white p-1.5 rounded-xl shadow-lg">
                            <Plus size={14} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      key={p.id} 
                      onClick={() => addToCart(p)} 
                      className="bg-card/50 backdrop-blur-md border border-border p-2 rounded-[1.5rem] shadow-sm cursor-pointer hover:border-primary hover:bg-card/80 transition-all group relative overflow-hidden flex items-center gap-3 h-[95px]"
                    >
                      <div className="w-20 h-20 rounded-xl bg-muted shrink-0 overflow-hidden border border-border/50 shadow-inner">
                        <ImageWithFallback 
                          src={p.image} 
                          alt={p.name} 
                          fallback={<Package size={24} className="opacity-20" />} 
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground truncate mb-0.5">{p.category || 'Général'}</p>
                        <p className="text-[11px] font-black uppercase tracking-tight truncate leading-tight mb-1.5 group-hover:text-primary transition-colors">{p.name}</p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-primary">{p.price_sell.toLocaleString()} <span className="text-[8px] opacity-60">F</span></p>
                          <div className={clsx("flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase", p.current_stock < 5 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500")}>
                            {p.current_stock}
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 bg-primary text-white p-1.5 rounded-lg shadow-lg">
                        <Plus size={14} />
                      </div>
                    </div>
                  )
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
