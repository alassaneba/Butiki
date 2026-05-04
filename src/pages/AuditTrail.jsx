import { useRef, useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { 
  ShieldCheck, Search, Filter, Calendar, User, 
  AlertTriangle, Info, Clock, Activity
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useVirtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function AuditTrail() {
  const audit_log = useStore(state => state.audit_log)
  const users = useStore(state => state.users)
  const logList = audit_log || []
  const userList = users || []
  
  const parentRef = useRef()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  const filteredLogs = useMemo(() => {
    return logList.filter(log => {
      const action = log?.action || ''
      const details = log?.details || ''
      const user = log?.user || ''

      const matchSearch = details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (filter === 'all') return matchSearch
      if (filter === 'finances') return matchSearch && (action.includes('Caisse') || action.includes('Dette') || action.includes('Paiement') || action.includes('Trésorerie') || action.includes('Coffre'))
      if (filter === 'stock') return matchSearch && (action.includes('Stock') || action.includes('Inventaire') || action.includes('Produit') || action.includes('Livraison'))
      if (filter === 'security') return matchSearch && (action.includes('Config') || action.includes('Utilisateur'))
      return matchSearch
    })
  }, [logList, searchTerm, filter])

  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10
  })

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Journal d'Audit</h1>
          <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-1">Traçabilité complète des actions système</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-2xl text-[10px] font-black uppercase tracking-wider">
          <ShieldCheck size={14} /> Sécurité Active
        </div>
      </header>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {[
          { label: 'Actions Filtrées', val: filteredLogs.length, icon: Activity, color: 'primary' },
          { label: 'Utilisateurs', val: users.length, icon: User, color: 'blue' },
          { label: 'Dernière Action', val: filteredLogs[0] ? new Date(filteredLogs[0].date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--', icon: Clock, color: 'emerald' },
          { label: 'Alertes', val: filteredLogs.filter(l => (l.action || '').toLowerCase().includes('suppr') || (l.action || '').toLowerCase().includes('clôture')).length, icon: AlertTriangle, color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="p-3 bg-card border border-border rounded-2xl flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-500 flex items-center justify-center shrink-0`}>
              <stat.icon size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
              <p className="text-sm font-black">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liste Virtualisée */}
      <div className="flex-1 bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="p-4 border-b border-border bg-muted/5 flex flex-col sm:flex-row items-center gap-4 shrink-0">
           <div className="relative flex-1 w-full">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="Rechercher une action ou un utilisateur..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs font-bold outline-none focus:ring-4 ring-primary/5 transition-all"
             />
           </div>
           <div className="flex bg-muted/50 p-1 rounded-xl border border-border shrink-0">
              {['all', 'finances', 'stock', 'security'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all",
                    filter === f ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === 'all' ? 'Tout' : f === 'security' ? 'Système' : f}
                </button>
              ))}
           </div>
        </div>

        <div 
          ref={parentRef}
          className="flex-1 overflow-y-auto scrollbar-hide"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const log = filteredLogs[virtualRow.index]
              if (!log) return null
              const isAlert = (log.action || '').toLowerCase().includes('suppr') || (log.action || '').toLowerCase().includes('clôture') || (log.action || '').toLowerCase().includes('audit') || (log.action || '').toLowerCase().includes('annulation')
              
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="px-4 py-2"
                >
                  <div className={clsx(
                    "h-full border border-border/50 rounded-2xl flex items-center gap-4 px-4 hover:border-primary/30 transition-all group",
                    isAlert ? "bg-orange-500/5 border-orange-500/20" : "bg-card"
                  )}>
                    <div className="flex flex-col items-center justify-center shrink-0 w-12 border-r border-border/40 pr-4 text-center">
                      <p className="text-[8px] font-black text-muted-foreground uppercase">{log.date ? new Date(log.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '--'}</p>
                      <p className="text-[10px] font-black text-foreground">{log.date ? new Date(log.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--'}</p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={clsx(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                          isAlert ? "bg-orange-500 text-white" : "bg-primary/10 text-primary"
                        )}>
                          {log.action}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground truncate flex items-center gap-1">
                          <User size={10} /> {log.user}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-foreground/80 truncate leading-tight">{log.details}</p>
                    </div>

                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 py-20">
               <Activity size={48} className="opacity-10" />
               <p className="text-sm font-black uppercase tracking-widest opacity-20 text-center">Aucune action trouvée<br/><span className="text-[10px] opacity-50 font-bold">Ajustez vos filtres de recherche</span></p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ChevronRight({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
