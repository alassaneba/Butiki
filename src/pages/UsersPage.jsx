import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import {
  Users, Plus, Trash2, Shield, Crown, User,
  Eye, EyeOff, ClipboardList, ChevronDown, Search, 
  Filter, Check, X, Clock, LogIn, Lock, Info, Smartphone
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const MODULES = [
  { id: 'dashboard', label: 'Tableau de bord', path: '/' },
  { id: 'caisse', label: 'Caisse & Dépenses', path: '/caisse' },
  { id: 'historique', label: 'Historique Caisses', path: '/historique' },
  { id: 'stock', label: 'Stock & Inventaire', path: '/stock' },
  { id: 'procurement', label: 'Assistant Réappro', path: '/procurement' },
  { id: 'achat', label: 'Achats Fournisseurs', path: '/achat' },
  { id: 'pain', label: 'Gestion Pain', path: '/pain' },
  { id: 'gaz', label: 'Gestion Gaz', path: '/gaz' },
  { id: 'credit', label: 'Crédit Téléphonique', path: '/credit' },
  { id: 'clients', label: 'Clients & Dettes', path: '/clients' },
  { id: 'fournisseurs', label: 'Fournisseurs', path: '/fournisseurs' },
  { id: 'tresorerie', label: 'Trésorerie Nette', path: '/tresorerie' },
  { id: 'audit', label: 'Journal d\'Audit', path: '/audit' },
  { id: 'charges', label: 'Charges Fixes', path: '/charges' },
  { id: 'depot', label: 'Dépôt Liquide', path: '/depot' },
  { id: 'settings', label: 'Paramètres / Équipe', path: '/users' },
]

const ROLE_UI = {
  gerant: { label: 'Gérant', icon: Crown, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
  caissier: { label: 'Caissier', icon: User, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
}

const AVATAR_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-emerald-500'
]

function UserAvatar({ name, size = 'md' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const colorIndex = name.length % AVATAR_COLORS.length
  const color = AVATAR_COLORS[colorIndex]
  
  const sizes = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-lg'
  }

  return (
    <div className={`${sizes[size]} rounded-2xl ${color} flex items-center justify-center font-black text-white shadow-lg shadow-black/5`}>
      {initials}
    </div>
  )
}

export default function UsersPage() {
  const users = useStore(state => state.users)
  const addUser = useStore(state => state.addUser)
  const updateUser = useStore(state => state.updateUser)
  const deleteUser = useStore(state => state.deleteUser)
  const setActiveUser = useStore(state => state.setActiveUser)
  const activeUserId = useStore(state => state.activeUserId)
  const audit_log = useStore(state => state.audit_log)
  const config = useStore(state => state.config)

  const [name, setName] = useState('')
  const [role, setRole] = useState('caissier')
  const [pin, setPin] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [showAudit, setShowAudit] = useState(true)
  
  const [auditSearch, setAuditSearch] = useState('')
  const [auditFilter, setAuditFilter] = useState('all')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    addUser({ name: name.trim(), role, pin, whatsapp })
    setName(''); setPin(''); setRole('caissier'); setWhatsapp('')
  }

  const filteredAudit = useMemo(() => {
    return audit_log.filter(entry => {
      const action = entry?.action || ''
      const details = entry?.details || ''
      const user = entry?.user || ''

      const matchSearch = details.toLowerCase().includes(auditSearch.toLowerCase()) || 
                          action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          user.toLowerCase().includes(auditSearch.toLowerCase())
      
      if (auditFilter === 'all') return matchSearch
      if (auditFilter === 'finances') return matchSearch && (action.includes('Caisse') || action.includes('Dette') || action.includes('Paiement'))
      if (auditFilter === 'stock') return matchSearch && (action.includes('Stock') || action.includes('Inventaire') || action.includes('Produit'))
      return matchSearch
    })
  }, [audit_log, auditSearch, auditFilter])

  const formatDate = (iso) => new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-xl font-black tracking-tight uppercase">Utilisateurs & Accès</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Sécurité, permissions et traçabilité des opérations.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Formulaire & Permissions View */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-5 bg-card rounded-3xl border border-border shadow-sm sticky top-20"
          >
            <h2 className="font-black text-lg mb-6 flex items-center gap-2 text-primary">
              <Plus size={20} /> Nouveau Profil
            </h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 tracking-widest">Nom complet</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-3 border border-border rounded-xl bg-background text-sm font-bold focus:ring-4 ring-primary/10 outline-none"
                  placeholder="Fatou Diallo"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 tracking-widest">Rôle</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full p-3 border border-border rounded-xl bg-background outline-none focus:ring-4 ring-primary/10 font-bold text-sm"
                >
                  <option value="gerant">👑 Gérant (accès total)</option>
                  <option value="caissier">👤 Caissier (accès restreint)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 tracking-widest">Numéro WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full p-3 border border-border rounded-xl bg-background text-sm font-bold focus:ring-4 ring-primary/10 outline-none"
                  placeholder="+221..."
                />
              </div>

              {/* Permissions Visualizer */}
              <div className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                 <p className="text-[10px] font-black uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <Shield size={12} /> Droits d'accès par défaut (Rôle)
                 </p>
                 <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto pr-1 scrollbar-hide">
                    {MODULES.map(m => {
                      const permissions = config?.role_permissions?.[role] || (role === 'gerant' ? { full_access: true } : { modules: ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'clients'] })
                      const hasAccess = permissions.full_access || permissions.modules?.includes(m.id)
                      return (
                        <div key={m.id} className={clsx(
                          "flex items-center justify-between px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all",
                          hasAccess ? "bg-primary/5 border-primary/20 text-primary" : "bg-muted/50 border-transparent text-muted-foreground opacity-50"
                        )}>
                          <span className="flex items-center gap-2">
                            {hasAccess ? <Check size={12} /> : <X size={12} />}
                            {m.label}
                          </span>
                        </div>
                      )
                    })}
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-1.5 tracking-widest">PIN personnel (optionnel)</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full p-3 border border-border rounded-xl bg-background focus:ring-4 ring-primary/10 outline-none pr-12 font-black tracking-widest text-lg"
                    placeholder="••••"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  <button type="button" onClick={() => setShowPin(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground">
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-black text-sm hover:opacity-90 flex items-center justify-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest">
                <Plus size={18} /> Créer l'accès
              </button>
            </form>
          </motion.div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center px-2">
             <h2 className="font-black text-lg tracking-tight flex items-center gap-2 uppercase">
                Équipe <span className="text-sm font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{users.length}</span>
             </h2>
          </div>

          <div className="grid gap-4">
            <AnimatePresence>
              {users.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/5">
                  <Users size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="font-bold">Aucun utilisateur</p>
                  <p className="text-xs mt-1">Créez le premier accès pour démarrer.</p>
                </motion.div>
              ) : (
                users.map(user => {
                  const rc = ROLE_UI[user.role] || ROLE_UI.caissier
                  const Icon = rc.icon
                  const isActive = activeUserId === user.id
                  return (
                    <motion.div
                      layout
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 bg-card border rounded-3xl flex flex-col sm:flex-row items-center gap-4 transition-all group ${isActive ? 'border-primary ring-4 ring-primary/5 shadow-xl shadow-primary/5' : 'border-border hover:border-primary/20 shadow-sm'}`}
                    >
                      <UserAvatar name={user.name} size="lg" />
                      
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                           <p className="font-black text-lg tracking-tight truncate">{user.name}</p>
                           {isActive && <span className="flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 bg-green-500 text-white rounded-full">● En session</span>}
                        </div>
                        
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-2">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${rc.color} flex items-center gap-1.5`}>
                             <Icon size={12}/> {rc.label}
                          </span>
                          {user.whatsapp && (
                            <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                               <Smartphone size={10}/> {user.whatsapp}
                            </span>
                          )}
                          {user.pin && <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1"><Shield size={12} className="text-primary"/> PIN ACTIF</span>}
                          {user.last_login && (
                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                               <Clock size={12}/> Vu le {formatDate(user.last_login)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => setActiveUser(isActive ? null : user.id)}
                          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        >
                          {isActive ? <Check size={16}/> : <LogIn size={16}/>}
                          {isActive ? 'Session Active' : 'Activer'}
                        </button>
                        <button
                          disabled={user.role === 'gerant' && users.filter(u => u.role === 'gerant').length <= 1}
                          onClick={() => { if (window.confirm(`Révoquer l'accès de ${user.name} ?`)) deleteUser(user.id) }}
                          className="p-2.5 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 transition-all disabled:opacity-0"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Configuration des Permissions (Gérant uniquement) */}
      {(() => {
        const currentUser = users.find(u => u.id === activeUserId);
        const isGerant = currentUser && currentUser.role === 'gerant';
        if (!isGerant) return null;

        const permissions = config?.role_permissions?.caissier || { modules: ['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'clients'] };
        const updatePermissions = (moduleId) => {
          const currentModules = permissions.modules || [];
          const newModules = currentModules.includes(moduleId)
            ? currentModules.filter(m => m !== moduleId)
            : [...currentModules, moduleId];
          
          const newRolePermissions = {
            ...config.role_permissions,
            caissier: { ...permissions, modules: newModules }
          };
          useStore.getState().updateConfigField('role_permissions', newRolePermissions);
        };

        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-3xl p-6 shadow-sm mt-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-black text-lg tracking-tight flex items-center gap-2 uppercase">
                  <Shield size={20} className="text-primary" /> Configuration du Rôle : Caissier
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-1">Définissez les modules accessibles par défaut pour tous les caissiers.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MODULES.filter(m => m.id !== 'settings' && m.id !== 'audit').map(m => {
                const hasAccess = permissions.modules?.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => updatePermissions(m.id)}
                    className={clsx(
                      "flex items-center justify-between px-4 py-3 rounded-2xl border text-xs font-black transition-all text-left",
                      hasAccess 
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10" 
                        : "bg-muted/50 border-border/50 text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    <span>{m.label}</span>
                    {hasAccess ? <Check size={14} /> : <X size={14} className="opacity-20" />}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
              <Info size={18} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-primary/80 leading-relaxed uppercase tracking-wide">
                Les modifications sont appliquées instantanément à tous les utilisateurs ayant le rôle "Caissier". 
                Le rôle "Gérant" conserve toujours un accès total.
              </p>
            </div>
          </motion.div>
        );
      })()}

      {/* Journal d'Audit Avancé - Sécurisé pour Gérants Uniquement */}
      {(() => {
        const currentUser = users.find(u => u.id === activeUserId);
        const isGerant = currentUser && currentUser.role === 'gerant';

        if (!isGerant) {
          return (
            <div className="bg-card rounded-3xl border border-border shadow-sm p-10 text-center mt-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h2 className="font-black text-lg tracking-tight uppercase">Accès Restreint</h2>
              <p className="text-sm text-muted-foreground font-medium mt-2">Le journal d'audit complet de la boutique est réservé aux gérants.</p>
            </div>
          );
        }

        return (
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-border bg-muted/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h2 className="font-black text-lg tracking-tight flex items-center gap-3 uppercase">
                    <ClipboardList size={20} className="text-primary" /> Journal d'Audit
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Traçabilité complète des opérations système.</p>
               </div>

               <div className="flex flex-wrap gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                     <input 
                       type="text"
                       placeholder="Rechercher une action..."
                       value={auditSearch}
                       onChange={e => setAuditSearch(e.target.value)}
                       className="w-full pl-10 p-2.5 bg-background border border-border rounded-xl text-xs font-bold outline-none focus:ring-4 ring-primary/5"
                     />
                  </div>
                  <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
                    <button 
                      onClick={() => setAuditFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${auditFilter === 'all' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >Tout</button>
                    <button 
                      onClick={() => setAuditFilter('finances')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${auditFilter === 'finances' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >Finances</button>
                    <button 
                      onClick={() => setAuditFilter('stock')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${auditFilter === 'stock' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >Stock</button>
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/5 text-[10px] font-black uppercase text-muted-foreground border-b border-border">
                    <th className="px-4 py-3">Horodatage</th>
                    <th className="px-4 py-3">Opérateur</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAudit.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center text-muted-foreground italic font-bold">
                        Aucune correspondance trouvée dans le journal.
                      </td>
                    </tr>
                  ) : (
                    filteredAudit.slice(0, 100).map(entry => (
                      <tr key={entry.id} className="hover:bg-muted/5 transition-colors group">
                        <td className="px-4 py-3 whitespace-nowrap">
                           <p className="text-[11px] font-black">{entry.date ? new Date(entry.date).toLocaleDateString() : '--'}</p>
                           <p className="text-[10px] text-muted-foreground">{entry.date ? new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</p>
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex items-center gap-2">
                              <UserAvatar name={entry.user} size="sm" />
                              <span className="text-xs font-black">{entry.user}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3">
                           <span className="text-[10px] font-black uppercase px-2 py-1 bg-secondary text-foreground rounded-lg border border-border">{entry.action}</span>
                        </td>
                        <td className="px-4 py-3">
                           <p className="text-xs text-muted-foreground font-medium italic">"{entry.details}"</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  )
}
