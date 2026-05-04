import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Bell, X, CheckCheck, AlertTriangle, Info, Package, Trash2, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ICONS = {
  dette: { icon: Info, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
  stock: { icon: Package, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  caisse: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  anomalie: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${Math.floor(hours / 24)}j`
}

export default function NotificationCenter() {
  const notifications = useStore(state => state.notifications)
  const markNotificationRead = useStore(state => state.markNotificationRead)
  const markAllRead = useStore(state => state.markAllRead)
  const clearAllNotifications = useStore(state => state.clearAllNotifications)
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  // Fermer en cliquant dehors
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleClickNotif = (n) => {
    if (!n.read) markNotificationRead(n.id)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Cloche */}
      <button
        id="notif-bell-btn"
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-black rounded-full ring-2 ring-background"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-destructive text-white rounded-full">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-secondary transition-all"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck size={15} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary transition-all"
                    title="Tout effacer"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-all"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <Bell size={28} className="opacity-20" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map(n => {
                  const typeInfo = ICONS[n.type] || ICONS.info
                  const Icon = typeInfo.icon
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClickNotif(n)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${n.read ? 'opacity-60 hover:opacity-80' : 'hover:bg-secondary/50'}`}
                    >
                      <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center ${typeInfo.bg}`}>
                        <Icon size={15} className={typeInfo.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-snug ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.date)}</p>
                      </div>
                      {!n.read && (
                        <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
