import React from 'react'
import { Card } from './SharedSettingsUI'
import clsx from 'clsx'
import { Cpu, Monitor, Wallet, Package, Croissant, Flame, Smartphone, FileText, Lock, Users, ShoppingCart } from 'lucide-react'

export default function SettingsModules({ config, updateConfigList }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card title="Activation des Modules" icon={Cpu}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'dashboard', label: 'Bilan', icon: Monitor },
            { id: 'caisse', label: 'Caisse', icon: Wallet },
            { id: 'stock', label: 'Stock', icon: Package },
            { id: 'pain', label: 'Pain', icon: Croissant },
            { id: 'gaz', label: 'Gaz', icon: Flame },
            { id: 'credit', label: 'Crédit', icon: Smartphone },
            { id: 'charges', label: 'Charges', icon: FileText },
            { id: 'depot', label: 'Coffre', icon: Lock },
            { id: 'clients', label: 'Clients', icon: Users },
            { id: 'sales', label: 'Ventes', icon: ShoppingCart },
            { id: 'previsions', label: 'IA', icon: Cpu }
          ].map(mod => {
            const isActive = config?.active_modules?.includes(mod.id)
            return (
              <button
                key={mod.id}
                onClick={() => {
                  const current = config?.active_modules || []
                  const newList = isActive ? current.filter(id => id !== mod.id) : [...current, mod.id]
                  updateConfigList('active_modules', newList)
                }}
                className={clsx(
                  "flex flex-col items-center gap-2 p-4 rounded-[24px] border-2 transition-all group",
                  isActive ? "border-primary bg-primary/5 shadow-inner" : "border-border/50 bg-background/50 hover:border-primary/30"
                )}
              >
                <div className={clsx(
                  "p-2 rounded-xl transition-all",
                  isActive ? "bg-primary text-white scale-110" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  {mod.icon ? <mod.icon size={18} /> : <Cpu size={18} />}
                </div>
                <span className="font-black text-[10px] uppercase tracking-widest">{mod.label}</span>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
