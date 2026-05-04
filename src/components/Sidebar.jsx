import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, Croissant, Flame, Users, Truck, PiggyBank,
  Settings, X, Package, History, ClipboardCheck, TrendingUp, Bell, UsersRound, ShoppingBag, Home, Smartphone,
  Landmark, ShieldCheck, ShoppingCart, Building2, Banknote, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'

const navItems = [
  { section: 'Principal' },
  { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/ventes', label: 'Ventes (POS)', icon: ShoppingBag, badge: 'PRO' },
  { path: '/caisse', label: 'Caisse & Dépenses', icon: Wallet },
  { path: '/historique', label: 'Historique Caisses', icon: History },
  
  { section: 'Approvisionnement' },
  { path: '/stock', label: 'Stock Total', icon: Package },
  { path: '/inventaire', label: 'Inventaire Péri.', icon: ClipboardCheck },
  { path: '/procurement', label: 'Assistant Réappro', icon: ShoppingCart, badge: 'AUTO' },
  { path: '/previsions', label: 'Analyses & Prévisions', icon: TrendingUp },
  { path: '/achat', label: 'Achats Fournisseurs', icon: ShoppingBag },
  
  { section: 'Modules Spécialisés' },
  { path: '/pain', label: 'Gestion Pain', icon: Croissant },
  { path: '/gaz', label: 'Gestion Gaz', icon: Flame },
  { path: '/credit', label: 'Crédit Téléphonique', icon: Smartphone },
  { path: '/logistics', label: 'Livraisons', icon: Truck, badge: 'NEW' },
  
  { section: 'Clients & Tiers' },
  { path: '/clients', label: 'Clients & Dettes', icon: Users },
  { path: '/fournisseurs', label: 'Fournisseurs', icon: Truck },
  
  { section: 'Gestion Avancée' },
  { path: '/tresorerie', label: 'Trésorerie Nette', icon: Landmark },
  { path: '/rh', label: 'RH & Paie', icon: Banknote, badge: 'PRO' },
  { path: '/audit', label: 'Journal d\'Audit', icon: ShieldCheck },
  { path: '/catalogue', label: 'Menu Digital', icon: ShoppingBag, badge: 'CLIENT' },
  { path: '/boutiques', label: 'Multi-Boutiques', icon: Building2, badge: 'PRO' },
  { path: '/depot', label: 'Coffre (Dépôt)', icon: PiggyBank },
  { path: '/charges', label: 'Charges Fixes', icon: Home },
  
  { section: 'Système' },
  { path: '/users', label: 'Équipe / Rôles', icon: UsersRound },
  { path: '/settings', label: 'Paramètres', icon: Settings },
]

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation()
  const notifications = useStore(state => state.notifications)
  const config = useStore(state => state.config)
  const activeUser = useStore(state => state.users.find(u => u.id === state.activeUserId))
  const boutiques = useStore(state => state.boutiques)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const activeBoutique = (boutiques || []).find(b => b.id === activeBoutiqueId)
  const unreadCount = (notifications || []).filter(n => !n.read).length

  const filteredNavItems = navItems.filter(item => {
    // Si c'est une section, on l'affiche toujours (elle sera filtrée par ses enfants si vide, mais ici on simplifie)
    if (item.section) return true

    // Si aucun utilisateur n'est actif, on ne montre que la page de sélection (Users)
    if (!activeUser) {
      return item.path === '/users'
    }
    const role = activeUser.role || 'caissier'
    // Fallback intelligent : si gérant, accès total. Sinon, restreint.
    const defaultPermissions = role === 'gerant' 
      ? { full_access: true, modules: [] } 
      : { modules: ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'clients'] }
    
    const permissions = config?.role_permissions?.[role] || defaultPermissions

    // Map path to module ID for filtering
    const pathToModule = {
      '/': 'dashboard',
      '/ventes': 'sales',
      '/caisse': 'caisse',
      '/historique': 'historique',
      '/achat': 'stock',
      '/clients': 'clients',
      '/fournisseurs': 'fournisseurs',
      '/stock': 'stock',
      '/inventaire': 'stock',
      '/previsions': 'previsions',
      '/charges': 'charges',
      '/depot': 'depot',
      '/pain': 'pain',
      '/gaz': 'gaz',
      '/credit': 'credit',
      '/tresorerie': 'tresorerie',
      '/procurement': 'procurement',
      '/audit': 'audit',
      '/rh': 'hr',
      '/logistics': 'logistics',
      '/catalogue': 'dashboard',
      '/boutiques': 'audit',
      '/users': 'settings',
      '/settings': 'settings'
    }

    const moduleId = pathToModule[item.path]
    
    // Admin/Settings are always allowed for full_access (gerant)
    if (permissions.full_access && (moduleId === 'settings' || moduleId === 'users')) return true
    
    // 1. Check if module is globally active
    const activeModules = config?.active_modules || ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'charges', 'depot', 'clients', 'fournisseurs', 'historique', 'previsions', 'settings', 'tresorerie', 'procurement', 'audit', 'sales', 'hr', 'logistics']
    const isGloballyActive = activeModules.includes(moduleId)
    
    // Si gérant, on affiche tout même si désactivé dans les réglages (pour debug/visibilité)
    if (permissions.full_access) return true
    
    // Sinon, on respecte l'activation globale et les permissions du rôle
    if (!isGloballyActive) return false
    return permissions.modules?.includes(moduleId)
  })

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={clsx(
        "fixed top-0 left-0 z-50 h-screen w-60 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 lg:static",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-12 items-center justify-between px-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {config?.logo ? (
              <img src={config.logo} alt="Logo" className="w-7 h-7 rounded-lg object-cover border border-border" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet size={14} className="text-primary" />
              </div>
            )}
            <div className="flex flex-col min-w-0 group relative cursor-pointer">
              <span className="text-[10px] font-black text-primary/60 uppercase tracking-tighter leading-none">Boutique</span>
              <select 
                value={activeBoutiqueId} 
                onChange={(e) => useStore.getState().switchBoutique(e.target.value)}
                className="text-sm font-black text-foreground truncate uppercase italic bg-transparent border-none outline-none appearance-none cursor-pointer pr-4"
              >
                {(boutiques || []).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="absolute right-0 bottom-1 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={10} className="rotate-90" />
              </div>
            </div>
          </div>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto scrollbar-hide">
          {filteredNavItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={`section-${idx}`} className="px-3 pt-4 pb-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{item.section}</p>
                </div>
              )
            }
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium transition-all duration-300 text-sm group relative overflow-hidden",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:translate-x-1"
                )}
              >
                <Icon size={16} className={clsx("shrink-0 relative z-10", isActive ? "" : "group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 opacity-70 group-hover:opacity-100")} />
                <span className={clsx("flex-1 truncate relative z-10", isActive ? "font-black" : "font-semibold")}>{item.label}</span>
                {item.badge && !isActive && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 relative z-10">
                    {item.badge}
                  </span>
                )}
                
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />
                )}
              </Link>
            )
          })}
        </nav>

        {unreadCount > 0 && (
          <div className="p-2 border-t border-border shrink-0">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Bell size={12} className="text-destructive shrink-0" />
              <p className="text-[10px] text-destructive font-bold">
                {unreadCount} alerte{unreadCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
