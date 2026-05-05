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
import { useShallow } from 'zustand/react/shallow'

function useNotificationEngine() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const addNotification = useStore(state => state.addNotification)
  
  // Utiliser useShallow pour éviter les re-rendus si les données n'ont pas changé structurellement
  const allClients = useStore(useShallow(state => state.clients || []))
  const allStock = useStore(useShallow(state => state.stock || []))
  const allRegisters = useStore(useShallow(state => state.daily_cash_register || []))
  
  const processedRef = useRef(new Set())

  const clients = useMemo(() => allClients.filter(c => (c.boutiqueId || 'b1') === activeBoutiqueId), [allClients, activeBoutiqueId])
  const stock = useMemo(() => allStock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId), [allStock, activeBoutiqueId])
  const daily_cash_register = useMemo(() => allRegisters.filter(r => (r.boutiqueId || 'b1') === activeBoutiqueId), [allRegisters, activeBoutiqueId])

  useEffect(() => {
    // Éviter de s'exécuter si on n'a pas les données nécessaires
    if (!activeBoutiqueId) return

    const now = new Date()
    const hour = now.getHours()
    const todayStrLocal = now.toLocaleDateString()
    
    // Accès direct sans hook pour éviter les boucles de rendu
    const state = useStore.getState()
    const currentNotifications = state.notifications || []

    clients.forEach(client => {
      if (client.total_debt > 0) {
        const lastActivity = client.transactions?.length > 0 
          ? new Date(Math.max(...client.transactions.map(t => new Date(t.date))))
          : null
        
        if (lastActivity) {
          const daysSince = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24))
          if (daysSince >= 7) {
            const refId = `debt-${client.id}-${activeBoutiqueId}`
            const alreadyInStore = currentNotifications.some(n => n.refId === refId && !n.read)
            if (!processedRef.current.has(refId) && !alreadyInStore) {
              addNotification({
                type: 'dette',
                refId,
                title: `Dette — ${client.name}`,
                message: `${client.total_debt.toLocaleString('fr-FR')} FCFA depuis ${daysSince}j.`,
              })
              processedRef.current.add(refId)
            }
          }
        }
      }
    })

    stock.forEach(item => {
      const refId = `stock-${item.id}-${activeBoutiqueId}`
      const alreadyInStore = currentNotifications.some(n => n.refId === refId && !n.read)
      if (item.current_stock <= (item.alert_threshold || 0) && !processedRef.current.has(refId) && !alreadyInStore) {
        addNotification({
          type: 'stock',
          refId,
          title: `Stock — ${item.name}`,
          message: `Reste ${item.current_stock} unité(s).`,
        })
        processedRef.current.add(refId)
      }
    })

    if (hour >= 7 && hour < 10) {
      const refId = `caisse-${todayStrLocal}-${activeBoutiqueId}`
      const alreadyInStore = currentNotifications.some(n => n.refId === refId && !n.read)
      const hasTodayRegister = daily_cash_register.some(
        r => new Date(r.date).toLocaleDateString() === todayStrLocal
      )
      if (!hasTodayRegister && !processedRef.current.has(refId) && !alreadyInStore) {
        addNotification({
          type: 'caisse',
          refId,
          title: 'Caisse non ouverte',
          message: 'Pensez à déclarer le fond de caisse.',
        })
        processedRef.current.add(refId)
      }
    }
  }, [clients.length, stock.length, daily_cash_register.length, activeBoutiqueId]) // Utiliser les longueurs pour limiter la réactivité
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
    localStorage.removeItem('butiki-last-activity')
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-10 lg:h-12 border-b border-border bg-card/60 backdrop-blur shrink-0 flex items-center px-3 sm:px-4 gap-2 sm:gap-4 z-30 sticky top-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 -ml-1 text-muted-foreground hover:text-foreground lg:hidden rounded-lg hover:bg-secondary transition-all active:scale-90"
          >
            <Menu size={20} />
          </button>

          <span className="font-black text-base lg:hidden bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 uppercase italic truncate max-w-[120px]">
            {config?.boutiqueName || 'Butiki'}
          </span>

          <div className="flex-1" />

          <div className="hidden md:block">
            <GlobalSearch />
          </div>

          {activeUser && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{activeUser.role}</span>
                <span className="text-sm font-bold truncate max-w-[120px]">{activeUser.name}</span>
              </div>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center border border-primary/20 shadow-inner">
                {activeUser.role === 'gerant' ? <Crown size={14} className="text-yellow-500" /> : <User size={14} className="text-blue-500" />}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                title="Déconnexion"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          <div className="h-6 w-px bg-border mx-1" />

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-90"
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

          <NotificationCenter />
        </header>

        <div className="flex-1 p-2 sm:p-4 flex flex-col relative w-full overflow-y-auto overflow-x-hidden scrollbar-hide">
          <AnimatePresence mode="wait">
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

      <BottomNav />
    </div>
  )
}
