import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Search, Users, Truck, X, ArrowRight, Wallet, Croissant, Flame, Package, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Raccourcis pages navigables
const PAGE_SHORTCUTS = [
  { label: 'Tableau de bord', path: '/', icon: Wallet, keywords: ['dashboard', 'accueil', 'tableau'] },
  { label: 'Caisse & Dépenses', path: '/caisse', icon: Wallet, keywords: ['caisse', 'depenses', 'argent'] },
  { label: 'Gestion Pain', path: '/pain', icon: Croissant, keywords: ['pain', 'boulangerie', 'miche'] },
  { label: 'Gestion Gaz', path: '/gaz', icon: Flame, keywords: ['gaz', 'bouteille', 'b6', 'b9', 'b12'] },
  { label: 'Stock Total', path: '/stock', icon: Package, keywords: ['stock', 'inventaire', 'produits'] },
  { label: 'Prévisions', path: '/previsions', icon: TrendingUp, keywords: ['previsions', 'rapport', 'analyse'] },
]

function highlight(text, query) {
  if (!query.trim()) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const clients = useStore(state => state.clients)
  const suppliers = useStore(state => state.suppliers)

  // Ctrl+K / Cmd+K pour ouvrir
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Focus auto à l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setQuery('')
  }, [open])

  const q = query.trim().toLowerCase()

  // Résultats clients
  const clientResults = q
    ? clients.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      ).slice(0, 4)
    : []

  // Résultats fournisseurs
  const supplierResults = q
    ? suppliers.filter(s => s.name.toLowerCase().includes(q)).slice(0, 3)
    : []

  // Pages
  const pageResults = q
    ? PAGE_SHORTCUTS.filter(p =>
        p.label.toLowerCase().includes(q) ||
        p.keywords.some(k => k.includes(q))
      ).slice(0, 3)
    : PAGE_SHORTCUTS.slice(0, 4) // Afficher les pages populaires quand pas de query

  const hasResults = clientResults.length > 0 || supplierResults.length > 0 || pageResults.length > 0

  const goTo = useCallback((path) => {
    navigate(path)
    setOpen(false)
  }, [navigate])

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        id="global-search-btn"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/60 hover:bg-secondary rounded-lg border border-border transition-all group"
        title="Recherche globale (Ctrl+K)"
      >
        <Search size={15} />
        <span className="hidden sm:block">Rechercher...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 bg-background border border-border rounded ml-1 opacity-60 group-hover:opacity-100">
          Ctrl K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="fixed top-16 sm:top-24 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[540px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search size={18} className="text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher un client, fournisseur, page..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                )}
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground">
                  Esc
                </kbd>
              </div>

              {/* Résultats */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {!hasResults && q && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Aucun résultat pour « {query} »
                  </p>
                )}

                {/* Pages */}
                {pageResults.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-1">
                      {q ? 'Pages' : 'Navigation rapide'}
                    </p>
                    {pageResults.map(page => {
                      const Icon = page.icon
                      return (
                        <button
                          key={page.path}
                          onClick={() => goTo(page.path)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors text-left group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon size={14} className="text-primary" />
                          </div>
                          <span className="text-sm font-medium flex-1">{highlight(page.label, query)}</span>
                          <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Clients */}
                {clientResults.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-1">
                      Clients
                    </p>
                    {clientResults.map(client => (
                      <button
                        key={client.id}
                        onClick={() => goTo('/clients')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors text-left group"
                      >
                        <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0 text-xs font-bold text-orange-500">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{highlight(client.name, query)}</p>
                          {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${client.total_debt > 0 ? 'text-destructive' : 'text-green-500'}`}>
                            {(client.total_debt || 0).toLocaleString('fr-FR')} F
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Fournisseurs */}
                {supplierResults.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-1">
                      Fournisseurs
                    </p>
                    {supplierResults.map(sup => (
                      <button
                        key={sup.id}
                        onClick={() => goTo('/fournisseurs')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/80 transition-colors text-left group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Truck size={13} className="text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{highlight(sup.name, query)}</p>
                          <p className="text-xs text-muted-foreground capitalize">{sup.category || 'Général'}</p>
                        </div>
                        {sup.total_debt > 0 && (
                          <p className="text-xs font-bold text-destructive shrink-0">
                            {sup.total_debt.toLocaleString('fr-FR')} F
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border bg-secondary/20 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {clientResults.length + supplierResults.length} résultat{clientResults.length + supplierResults.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-background border border-border rounded font-mono">↵</kbd> Naviguer</span>
                  <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-background border border-border rounded font-mono">Esc</kbd> Fermer</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
