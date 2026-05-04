import React, { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { 
  Users, Banknote, CalendarCheck, Landmark, 
  UserPlus, Search, Filter, Plus, CreditCard, 
  Clock, CheckCircle2, AlertCircle, ChevronRight, 
  Wallet, UserRound, GraduationCap, Briefcase,
  History, TrendingUp, HandCoins, Printer, Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const formatF = (val) => `${Math.round(val || 0).toLocaleString('fr-FR')} F`

const Card = ({ children, className, title, icon: Icon, action }) => (
  <div className={clsx("bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative", className)}>
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-black text-lg tracking-tight flex items-center gap-3 uppercase">
          {Icon && <Icon size={20} className="text-primary" />} {title}
        </h3>
        {action}
      </div>
    )}
    {children}
  </div>
)

const TABS = [
  { id: 'team', label: 'Équipe', icon: Users },
  { id: 'attendance', label: 'Pointage', icon: CalendarCheck },
  { id: 'payroll', label: 'Paie & Avances', icon: Banknote },
  { id: 'reports', label: 'Analyses', icon: TrendingUp },
]

export default function RH() {
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const users = useStore(state => state.users)
  const allStaff = useStore(state => state.staff_profiles || [])
  const allAttendance = useStore(state => state.attendance_logs || [])
  const allSalaryAdvances = useStore(state => state.salary_advances || [])
  const allPayrollHistory = useStore(state => state.payroll_history || [])

  const staff_profiles = useMemo(() => allStaff.filter(p => (p.boutiqueId || 'b1') === activeBoutiqueId), [allStaff, activeBoutiqueId])
  const attendance_logs = useMemo(() => allAttendance.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId), [allAttendance, activeBoutiqueId])
  const salary_advances = useMemo(() => allSalaryAdvances.filter(a => (a.boutiqueId || 'b1') === activeBoutiqueId), [allSalaryAdvances, activeBoutiqueId])
  const payroll_history = useMemo(() => allPayrollHistory.filter(h => (h.boutiqueId || 'b1') === activeBoutiqueId), [allPayrollHistory, activeBoutiqueId])
  
  const updateStaffProfile = useStore(state => state.updateStaffProfile)
  const logAttendance = useStore(state => state.logAttendance)
  const addSalaryAdvance = useStore(state => state.addSalaryAdvance)
  const paySalary = useStore(state => state.paySalary)

  const [activeTab, setActiveTab] = useState('team')
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')

  // Stats
  const activeStaffCount = users.length
  const totalMonthlyPayroll = staff_profiles.reduce((acc, p) => acc + (Number(p.base_salary) || 0), 0)
  const pendingAdvances = salary_advances.filter(a => a.status === 'pending').reduce((acc, a) => acc + Number(a.amount), 0)

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
  }, [users, search])

  const handleUpdateProfile = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      base_salary: Number(formData.get('salary')),
      position: formData.get('position'),
      hire_date: formData.get('hire_date') || new Date().toISOString().split('T')[0]
    }
    updateStaffProfile(selectedUser.id, data)
    setSelectedUser(null)
  }

  return (
    <div className="space-y-8 pb-24 px-4 max-w-6xl mx-auto">
      {/* Header Premium */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <Users className="text-primary" size={32} />
            RH & Paie <span className="text-primary/40 text-xl italic">Butiki Pro</span>
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Gestion du Capital Humain & Rémunération</p>
        </div>
        
        <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest",
                activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Effectif Actif', val: activeStaffCount, sub: 'Employés enregistrés', icon: UserRound, color: 'blue' },
          { label: 'Masse Salariale', val: formatF(totalMonthlyPayroll), sub: 'Estimation mensuelle', icon: Landmark, color: 'emerald' },
          { label: 'Avances en cours', val: formatF(pendingAdvances), sub: 'Somme à récupérer', icon: HandCoins, color: 'orange' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="p-6 bg-card border border-border/50 rounded-[2rem] shadow-premium relative overflow-hidden group"
          >
            <stat.icon size={80} className={clsx("absolute -right-5 -bottom-5 opacity-5 group-hover:scale-110 transition-transform", `text-${stat.color}-500`)} />
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black tracking-tighter mb-1">{stat.val}</p>
            <p className="text-[10px] font-bold text-muted-foreground opacity-60 italic">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'team' && (
          <motion.div 
            key="team"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 p-4 rounded-3xl border border-border/50">
               <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher un employé..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 p-3 bg-background/50 border border-border/50 rounded-2xl text-sm font-bold outline-none focus:ring-4 ring-primary/5"
                  />
               </div>
               <div className="flex items-center gap-2">
                  <button className="p-3 bg-muted/50 rounded-2xl hover:bg-muted transition-all border border-border/50 text-muted-foreground"><Filter size={18}/></button>
                  <button className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2">
                    <UserPlus size={18}/> Nouveau
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredUsers.map((user, i) => {
                 const profile = staff_profiles.find(p => p.userId === user.id) || {}
                 return (
                   <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={user.id} 
                    className="bg-card border border-border/50 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group"
                   >
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary font-black text-xl shadow-inner uppercase">
                           {user.name.slice(0, 2)}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-black text-lg tracking-tight truncate">{user.name}</h3>
                            <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest truncate">{profile.position || 'Poste non défini'}</p>
                         </div>
                         <button onClick={() => setSelectedUser(user)} className="p-2.5 bg-muted rounded-xl hover:bg-primary hover:text-white transition-all">
                            <Settings size={18}/>
                         </button>
                      </div>

                      <div className="space-y-3 mb-6">
                         <div className="flex justify-between items-center p-3 bg-muted/30 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-2">
                               <Banknote size={14} className="text-emerald-500" />
                               <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">Salaire Base</span>
                            </div>
                            <span className="text-sm font-black text-emerald-600">{formatF(profile.base_salary)}</span>
                         </div>
                         <div className="flex justify-between items-center p-3 bg-muted/30 rounded-2xl border border-border/50">
                            <div className="flex items-center gap-2">
                               <CalendarCheck size={14} className="text-blue-500" />
                               <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">Embauché le</span>
                            </div>
                            <span className="text-[11px] font-black">{profile.hire_date || '--'}</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                         <button className="py-3 bg-secondary text-muted-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">Pointage</button>
                         <button className="py-3 bg-secondary text-muted-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">Payer</button>
                      </div>
                   </motion.div>
                 )
               })}
            </div>
          </motion.div>
        )}

        {activeTab === 'attendance' && (
          <motion.div 
            key="attendance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card border border-border/50 rounded-[2.5rem] overflow-hidden"
          >
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
               <div>
                  <h2 className="font-black text-lg tracking-tight flex items-center gap-3 uppercase">
                    <CalendarCheck size={20} className="text-primary" /> Registre de Présence
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">Aujourd'hui, {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
               </div>
               <button onClick={() => logAttendance({ userId: 'all', status: 'present' })} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20">Pointage Général</button>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-muted/5 text-[10px] font-black uppercase text-muted-foreground border-b border-border">
                        <th className="px-6 py-4">Employé</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Arrivée</th>
                        <th className="px-6 py-4">Départ</th>
                        <th className="px-6 py-4 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                     {users.map(user => {
                       const log = attendance_logs.find(l => l.userId === user.id && new Date(l.date).toDateString() === new Date().toDateString())
                       return (
                         <tr key={user.id} className="hover:bg-muted/5 transition-colors group">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs uppercase">{user.name.slice(0, 2)}</div>
                                  <span className="text-xs font-black">{user.name}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className={clsx(
                                 "text-[8px] font-black uppercase px-2 py-1 rounded-full border",
                                 log?.status === 'present' ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" : 
                                 log?.status === 'late' ? "bg-amber-500/5 text-amber-600 border-amber-500/20" : "bg-muted text-muted-foreground border-transparent"
                               )}>
                                 {log?.status || 'Non pointé'}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-[11px] font-bold text-muted-foreground">{log?.checkIn || '--:--'}</td>
                            <td className="px-6 py-4 text-[11px] font-bold text-muted-foreground">{log?.checkOut || '--:--'}</td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => logAttendance({ userId: user.id, status: 'present', checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle2 size={14}/></button>
                                  <button onClick={() => logAttendance({ userId: user.id, status: 'late', checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })} className="p-2 bg-amber-500/10 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-all"><Clock size={14}/></button>
                               </div>
                            </td>
                         </tr>
                       )
                     })}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'payroll' && (
          <div className="grid lg:grid-cols-2 gap-8">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm"
             >
                <div className="flex justify-between items-center mb-8">
                   <h2 className="font-black text-lg tracking-tight flex items-center gap-3 uppercase">
                     <TrendingUp size={20} className="text-primary" /> Avances & Prêts
                   </h2>
                   <button onClick={() => {
                     const amt = prompt("Montant de l'avance ?")
                     const uid = prompt("ID de l'employé ? (Nom)")
                     if (amt && uid) addSalaryAdvance({ userId: users.find(u => u.name === uid)?.id, amount: Number(amt), reason: 'Avance ponctuelle' })
                   }} className="p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"><Plus size={20}/></button>
                </div>
                
                <div className="space-y-4">
                   {salary_advances.length === 0 && <p className="text-center py-10 text-muted-foreground text-xs font-bold italic opacity-40">Aucune avance enregistrée</p>}
                   {salary_advances.map(advance => (
                     <div key={advance.id} className="p-4 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600"><HandCoins size={20}/></div>
                           <div>
                              <p className="text-xs font-black">{users.find(u => u.id === advance.userId)?.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">{new Date(advance.date).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-orange-600">{formatF(advance.amount)}</p>
                           <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">{advance.status === 'pending' ? 'À récupérer' : 'Remboursé'}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm"
             >
                <h2 className="font-black text-lg tracking-tight flex items-center gap-3 uppercase mb-8">
                  <History size={20} className="text-primary" /> Historique de Paie
                </h2>
                
                <div className="space-y-4">
                   {payroll_history.length === 0 && <p className="text-center py-10 text-muted-foreground text-xs font-bold italic opacity-40">Aucun paiement effectué</p>}
                   {payroll_history.map(pay => (
                     <div key={pay.id} className="p-4 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Landmark size={20}/></div>
                           <div>
                              <p className="text-xs font-black">{users.find(u => u.id === pay.userId)?.name}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">{pay.month}/{pay.year}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="text-right">
                              <p className="text-sm font-black text-emerald-600">{formatF(pay.amount)}</p>
                              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Versé le {new Date(pay.date).toLocaleDateString()}</p>
                           </div>
                           <button className="p-2 text-muted-foreground hover:text-primary transition-all"><Printer size={16}/></button>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>
        )}

        {activeTab === 'reports' && (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
             <div className="grid md:grid-cols-2 gap-8">
                <Card title="Taux de Présence Global" icon={CalendarCheck}>
                   <div className="flex flex-col items-center py-6">
                      <div className="relative w-40 h-40">
                         <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" className="stroke-muted fill-none" strokeWidth="12" />
                            <circle 
                              cx="80" cy="80" r="70" className="stroke-primary fill-none transition-all duration-1000" 
                              strokeWidth="12" strokeDasharray="440" 
                              strokeDashoffset={440 - (440 * (attendance_logs.length > 0 ? (attendance_logs.filter(l => l.status === 'present').length / attendance_logs.length * 100) : 0)) / 100} 
                              strokeLinecap="round"
                            />
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black italic">{attendance_logs.length > 0 ? Math.round((attendance_logs.filter(l => l.status === 'present').length / attendance_logs.length) * 100) : 0}%</span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Global</span>
                         </div>
                      </div>
                      <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                         <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                            <p className="text-[10px] font-black uppercase text-emerald-600">Présences</p>
                            <p className="text-lg font-black italic">{attendance_logs.filter(l => l.status === 'present').length}</p>
                         </div>
                         <div className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                            <p className="text-[10px] font-black uppercase text-amber-600">Retards</p>
                            <p className="text-lg font-black italic">{attendance_logs.filter(l => l.status === 'late').length}</p>
                         </div>
                      </div>
                   </div>
                </Card>

                <Card title="Structure des Coûts" icon={Landmark}>
                   <div className="space-y-6 py-4">
                      {[
                        { label: 'Salaires Net', val: totalMonthlyPayroll - pendingAdvances, color: 'bg-primary', pct: 75 },
                        { label: 'Avances en cours', val: pendingAdvances, color: 'bg-orange-500', pct: 15 },
                        { label: 'Charges Sociales', val: totalMonthlyPayroll * 0.1, color: 'bg-zinc-400', pct: 10 },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span>{item.label}</span>
                              <span className="text-muted-foreground">{formatF(item.val)}</span>
                           </div>
                           <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${item.pct}%` }} 
                                className={clsx("h-full rounded-full", item.color)} 
                              />
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
             </div>

             <Card title="Performance Individuelle (Top 5)" icon={TrendingUp}>
                <div className="overflow-x-auto mt-4">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[9px] font-black uppercase text-muted-foreground border-b border-border">
                            <th className="px-4 py-3">Employé</th>
                            <th className="px-4 py-3">Présences</th>
                            <th className="px-4 py-3">Score Ponc.</th>
                            <th className="px-4 py-3">Productivité</th>
                            <th className="px-4 py-3 text-right">Prime Sugg.</th>
                         </tr>
                      </thead>
                      <tbody>
                          {users.slice(0, 5).map((user, i) => {
                            const userLogs = attendance_logs.filter(l => l.userId === user.id)
                            const presenceCount = userLogs.filter(l => l.status === 'present').length
                            const lateCount = userLogs.filter(l => l.status === 'late').length
                            return (
                              <tr key={i} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                                 <td className="px-4 py-3 text-xs font-black italic uppercase tracking-tighter">{user.name}</td>
                                 <td className="px-4 py-3 text-xs font-bold">{presenceCount} j</td>
                                 <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                       {[1,2,3,4,5].map(s => (
                                         <div key={s} className={clsx("w-1.5 h-1.5 rounded-full", s <= (presenceCount > 5 ? 5 : presenceCount) ? "bg-emerald-500" : "bg-muted")} />
                                       ))}
                                    </div>
                                 </td>
                                 <td className="px-4 py-3">
                                    <span className={clsx(
                                      "px-2 py-0.5 text-[8px] font-black rounded-full uppercase italic",
                                      lateCount === 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                    )}>
                                      {lateCount === 0 ? 'Excellent' : `${lateCount} Retard(s)`}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3 text-right text-xs font-black text-emerald-600">+{formatF(presenceCount * 500)}</td>
                              </tr>
                            )
                          })}
                      </tbody>
                   </table>
                </div>
             </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Profile Management */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden"
            >
               <div className="p-8 border-b border-border bg-muted/20 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-primary text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-primary/20">{selectedUser.name.slice(0, 2)}</div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{selectedUser.name}</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedUser.role}</p>
                  </div>
               </div>
               
               <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Salaire Mensuel (F)</label>
                        <div className="relative">
                           <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/>
                           <input 
                             name="salary" 
                             type="number" 
                             defaultValue={staff_profiles.find(p => p.userId === selectedUser.id)?.base_salary || 0}
                             className="w-full pl-12 p-4 bg-muted/50 border border-border/50 rounded-2xl font-black outline-none focus:ring-4 ring-primary/5"
                             placeholder="0"
                           />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Poste / Fonction</label>
                        <div className="relative">
                           <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/>
                           <input 
                             name="position" 
                             type="text" 
                             defaultValue={staff_profiles.find(p => p.userId === selectedUser.id)?.position || ''}
                             className="w-full pl-12 p-4 bg-muted/50 border border-border/50 rounded-2xl font-black outline-none focus:ring-4 ring-primary/5"
                             placeholder="Caissier Principal"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Date d'embauche</label>
                     <input 
                       name="hire_date" 
                       type="date" 
                       defaultValue={staff_profiles.find(p => p.userId === selectedUser.id)?.hire_date || ''}
                       className="w-full p-4 bg-muted/50 border border-border/50 rounded-2xl font-black outline-none focus:ring-4 ring-primary/5"
                     />
                  </div>

                  <div className="flex gap-3 pt-4">
                     <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 py-4 bg-secondary text-muted-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted transition-all">Annuler</button>
                     <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Enregistrer</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
