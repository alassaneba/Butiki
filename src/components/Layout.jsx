import { useState, useEffect, useRef, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Sun, Moon, Crown, User, LogOut } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import NotificationCenter from './NotificationCenter'
import GlobalSearch from './GlobalSearch'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useTheme } from '../lib/theme'

function useNotificationEngine() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const allClients = useStore(state => state.clients || [])
  const allStock = useStore(state => state.stock || [])
  const allRegisters = useStore(state => state.daily_cash_register || [])
  const addNotification = useStore(state => state.addNotification)
  
  // Guard ref to track which specific alerts have been processed in this session/state cycle
  const processedRef = useRef(new Set())

  // Memoize boutique-specific data for stable references
  const clients = useMemo(() => allClients.filter(c => (c.boutiqueId || 'b1') === activeBoutiqueId), [allClients, activeBoutiqueId])
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const daily_cash_register = useMemo(() => allRegisters.filter(r => (r.boutiqueId || 'b1') === activeBoutiqueId), [allRegisters, activeBoutiqueId])

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    const todayStrLocal = now.toLocaleDateString()
    
    // Accès sécurisé aux notifications actuelles sans déclencher de re-rendu
    const currentNotifications = useStore.getState().notifications || []

    // 1. Alertes dettes anciennes (> 7j)
    clients.forEach(client => {
      if (client.total_debt > 0) {
        const lastPayment = client.transactions
          ?.filter(t => t.type === 'paiement')
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
        const lastActivity = lastPayment
          ? new Date(lastPayment.date)
          : (client.transactions?.length > 0 ? new Date(client.transactions[0].date) : null)
        
        if (lastActivity) {
          const daysSince = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))
          if (daysSince >= 7) {
            const refId = `debt-${client.id}-${activeBoutiqueId}`
            const alreadyInStore = currentNotifications.some(n => n.refId === refId && !n.read)
            if (!processedRef.current.has(refId) && !alreadyInStore) {
              addNotification({
                type: 'dette',
                refId,
                title: `Dette non soldée — ${client.name}`,
                message: `${client.total_debt.toLocaleString('fr-FR')} FCFA depuis ${daysSince} jours.`,
              })
              processedRef.current.add(refId)
            }
          }
        }
      }
    })

    // 2. Alertes stock critique
    stock.forEach(item => {
      const refId = `stock-${item.id}-${activeBoutiqueId}`
      const alreadyInStore = currentNotifications.some(n => n.refId === refId && !n.read)
      if (item.current_stock <= (item.alert_threshold || 0) && !processedRef.current.has(refId) && !alreadyInStore) {
        addNotification({
          type: 'stock',
          refId,
          title: `Stock critique — ${item.name}`,
          message: `Il ne reste que ${item.current_stock} unité(s) (seuil : ${item.alert_threshold}).`,
        })
        processedRef.current.add(refId)
      } else if (item.current_stock > (item.alert_threshold || 0)) {
        processedRef.current.delete(refId)
      }
    })

    // 3. Rappel ouverture caisse (7h–10h)
    if (hour >= 7 && hour < 10) {
      const refId = `caisse-${todayStrLocal}-${activeBoutiqueId}`
      const alreadyInStore = currentNotifications.some(n => n.refId === refId && !n.read)
      const todayRegister = daily_cash_register.find(
        r => new Date(r.date).toLocaleDateString() === todayStrLocal
      )
      if (!todayRegister && !processedRef.current.has(refId) && !alreadyInStore) {
        addNotification({
          type: 'caisse',
          refId,
          title: 'Caisse non ouverte',
          message: 'Pensez à déclarer le fond de caisse pour démarrer la journée.',
        })
        processedRef.current.add(refId)
      }
    }
  }, [clients, stock, daily_cash_register, addNotification, activeBoutiqueId])
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  
  const config = useStore(state => state.config)
  const activeUser = useStore(state => state.users.find(u => u.id === state.activeUserId))
  const setActiveUser = useStore(state => state.setActiveUser)
  const logAction = useStore(state => state.logAction)
  const { theme, toggleTheme, isDark } = useTheme()

  useNotificationEngine()

  const handleLogout = () => {
    if (activeUser) {
      logAction('Déconnexion', `Utilisateur ${activeUser.name} s'est déconnecté`)
    }
    setActiveUser(null)
    // Le verrouillage est géré automatiquement par useSessionTimeout quand activeUserId devient null
    localStorage.removeItem('butiki-last-activity')
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 border-b border-border bg-card/60 backdrop-blur shrink-0 flex items-center px-4 gap-4 z-30 sticky top-0">
          {/* Bouton menu burger (mobile only) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground lg:hidden rounded-xl hover:bg-secondary transition-all active:scale-90"
          >
            <Menu size={22} />
          </button>

          {/* Nom boutique (mobile) */}
          <span className="font-black text-lg lg:hidden bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 uppercase italic">
            {config?.boutiqueName || 'Butiki'}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Recherche globale */}
          <div className="hidden md:block">
            <GlobalSearch />
          </div>

          {/* Utilisateur actif */}
          {activeUser && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{activeUser.role}</span>
                <span className="text-sm font-bold truncate max-w-[120px]">{activeUser.name}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border border-primary/20 shadow-inner">
                {activeUser.role === 'gerant' ? <Crown size={18} className="text-yellow-500" /> : <User size={18} className="text-blue-500" />}
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}

          <div className="h-6 w-px bg-border mx-1" />

          {/* Toggle Dark/Light */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90"
            aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 30, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </motion.div>
            </AnimatePresence>
          </button>

          {/* Notifications */}
          <NotificationCenter />
        </header>

        {/* Contenu */}
        <div className="flex-1 p-2 sm:p-4 flex flex-col relative w-full overflow-y-auto overflow-x-hidden">
          <AnimatePresence>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="max-w-6xl mx-auto w-full h-full flex flex-col will-change-[transform,opacity]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Nav mobile */}
      <BottomNav />
    </div>
  )
}
