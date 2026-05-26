import React from 'react'
import { Card, Label } from './SharedSettingsUI'
import clsx from 'clsx'
import { Fingerprint, Check, Crown, Shield } from 'lucide-react'

export default function SettingsRoles({ config, updateConfigField }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
       <Card title="Permissions Caissier" icon={Fingerprint}>
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { id: 'can_delete', label: 'Suppression Logs' },
                { id: 'can_view_reports', label: 'Rapports Marges' },
                { id: 'can_edit_prices', label: 'Modif. Tarifs' }
              ].map(perm => {
                const isGranted = config?.role_permissions?.caissier?.[perm.id]
                return (
                  <button 
                    key={perm.id}
                    onClick={() => {
                      const perms = { ...config.role_permissions.caissier, [perm.id]: !isGranted }
                      updateConfigField('role_permissions', { ...config.role_permissions, caissier: perms })
                    }}
                    className={clsx(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all",
                      isGranted ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" : "bg-muted/10 border-border/50 text-muted-foreground"
                    )}
                  >
                    <span className="text-[11px] font-black uppercase">{perm.label}</span>
                    <div className={clsx("w-5 h-5 rounded-full flex items-center justify-center transition-all", isGranted ? "bg-emerald-500 text-white" : "bg-muted-foreground/20")}>
                      {isGranted && <Check size={12} strokeWidth={4} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="pt-4 border-t border-border/50">
               <Label className="mb-3">Modules accessibles par défaut</Label>
               <div className="flex flex-wrap gap-1.5">
                 {['dashboard', 'caisse', 'stock', 'pain', 'gaz', 'credit', 'clients', 'depot', 'charges', 'sales'].map(modId => {
                   const isGranted = config?.role_permissions?.caissier?.modules?.includes(modId)
                   return (
                     <button 
                       key={modId}
                       onClick={() => {
                         const current = config.role_permissions.caissier.modules || []
                         const newList = isGranted ? current.filter(m => m !== modId) : [...current, modId]
                         updateConfigField('role_permissions', { ...config.role_permissions, caissier: { ...config.role_permissions.caissier, modules: newList } })
                       }}
                       className={clsx(
                         "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all",
                         isGranted ? "bg-primary text-white border-primary shadow-sm shadow-primary/20" : "bg-muted/20 text-muted-foreground border-border/50"
                       )}
                     >
                       {modId}
                     </button>
                   )
                 })}
               </div>
            </div>
          </div>
       </Card>
       <div className="space-y-4">
           <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-[28px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-sm"><Crown size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-amber-600">Propriétaire (Super-Admin)</p>
                <p className="text-[11px] font-bold text-muted-foreground italic">Accès total non restreint aux finances, audits et réglages critiques.</p>
              </div>
           </div>

           <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-[28px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm"><Shield size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-600">Gérant (Manager Opérationnel)</p>
                <p className="text-[11px] font-bold text-muted-foreground">Accès complet à la gestion quotidienne (Stocks, Commandes, Caisse).</p>
              </div>
           </div>
        </div>
    </div>
  )
}
