import React from 'react'
import { ListEditor } from './SharedSettingsUI'
import { Palette, Smartphone, Plus, Trash2, Bell } from 'lucide-react'

export default function SettingsLists({ config, updateConfigList, resetConfigLists }) {
  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/20 rounded-[28px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Bell size={18} /></div>
          <div>
            <p className="text-[10px] font-black uppercase text-primary tracking-widest">Configuration Rapide</p>
            <p className="text-[11px] font-bold text-muted-foreground">Restaurer les catégories standards Butik Pro.</p>
          </div>
        </div>
        <button 
          onClick={() => window.confirm("Ecraser vos listes ?") && resetConfigLists()}
          className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-primary/20"
        >
          Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ListEditor title="Dépenses" icon={Palette} items={config?.expense_categories || []} type="category" onUpdate={l => updateConfigList('expense_categories', l)} />
        <ListEditor title="Fintech" icon={Smartphone} items={config?.fintech_providers || []} type="fintech" onUpdate={l => updateConfigList('fintech_providers', l)} />
        <ListEditor title="Opérateurs" icon={Smartphone} items={config?.phone_credit_providers || []} type="phone" onUpdate={l => updateConfigList('phone_credit_providers', l)} />
        <ListEditor title="Coffre Entrées" icon={Plus} items={config?.vault_categories_in || []} onUpdate={l => updateConfigList('vault_categories_in', l)} />
        <ListEditor title="Coffre Sorties" icon={Trash2} items={config?.vault_categories_out || []} onUpdate={l => updateConfigList('vault_categories_out', l)} />
      </div>
    </div>
  )
}
