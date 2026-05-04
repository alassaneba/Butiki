import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, Users, Settings, TrendingUp, Smartphone
} from 'lucide-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

export default function BottomNav() {
  const location = useLocation()
  const activeUser = useStore(state => state.users.find(u => u.id === state.activeUserId))
  const config = useStore(state => state.config)

  // Les 5 items les plus importants filtrés dynamiquement
  const allBottomItems = [
    { path: '/', label: 'Accueil', icon: LayoutDashboard, moduleId: 'dashboard' },
    { path: '/caisse', label: 'Caisse', icon: Wallet, moduleId: 'caisse' },
    { path: '/credit', label: 'Crédit', icon: Smartphone, moduleId: 'credit' },
    { path: '/clients', label: 'Clients', icon: Users, moduleId: 'clients' },
    { path: '/previsions', label: 'Stats', icon: TrendingUp, moduleId: 'previsions' },
    { path: '/settings', label: 'Réglages', icon: Settings, moduleId: 'settings' },
  ]

  const filteredBottomItems = allBottomItems.filter(item => {
    if (!activeUser) return item.path === '/users'
    const role = activeUser.role || 'caissier'
    const defaultPermissions = role === 'gerant' 
      ? { full_access: true, modules: [] } 
      : { modules: ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'clients'] }
    
    const permissions = config?.role_permissions?.[role] || defaultPermissions
    
    const activeModules = config?.active_modules || ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'charges', 'depot', 'clients', 'fournisseurs', 'historique', 'previsions', 'settings']
    const isGloballyActive = activeModules.includes(item.moduleId)
    if (!isGloballyActive && item.moduleId !== 'settings') return false

    if (permissions.full_access) return true
    return permissions.modules?.includes(item.moduleId)
  }).slice(0, 5) // Garder max 5 pour mobile

  if (filteredBottomItems.length === 0) return null

  return (
    <nav className="floating-nav lg:hidden">
      {filteredBottomItems.map(item => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all duration-300 relative overflow-hidden',
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground/60 hover:text-foreground'
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 3 : 2} className={clsx('transition-transform duration-300', isActive && 'scale-110')} />
            <span className={clsx(
              'text-[8px] font-black uppercase tracking-tighter leading-none transition-all',
              isActive ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-0'
            )}>
              {item.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute inset-0 border-2 border-primary/20 rounded-2xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
