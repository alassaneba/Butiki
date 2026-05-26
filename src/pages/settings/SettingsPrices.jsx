import React from 'react'
import { Card } from './SharedSettingsUI'
import { Croissant, Flame, Check, Save } from 'lucide-react'

export default function SettingsPrices({ form, updateForm, saveSection, ui }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
         <Card title="Grille Tarifaire Pain" icon={Croissant}>
            <div className="space-y-2">
              {[
                { label: 'Miche entière', key: 'miche' },
                { label: '2/3 Miche', key: 'deuxTiers' },
                { label: '1/2 Miche', key: 'demi' },
                { label: '1/3 Miche', key: 'unTiers' }
              ].map(p => (
                <div key={p.key} className="flex items-center justify-between p-3 bg-muted/10 rounded-2xl border border-border/30 hover:bg-muted/20 transition-all">
                   <span className="text-[11px] font-black uppercase tracking-tight">{p.label}</span>
                   <div className="flex items-center gap-2">
                     <input 
                       type="number" 
                       value={form.prices?.pain?.[p.key] || ''} 
                       onChange={e => updateForm({ prices: { ...form.prices, pain: { ...form.prices.pain, [p.key]: Number(e.target.value) } } })} 
                       className="w-16 p-1.5 text-right bg-background border border-border/50 rounded-lg font-black text-xs outline-none focus:border-primary" 
                     />
                     <span className="text-[9px] font-black text-muted-foreground">F</span>
                   </div>
                </div>
              ))}
            </div>
         </Card>
         <Card title="Grille Tarifaire Gaz" icon={Flame}>
            <div className="space-y-2">
              {[
                { label: 'B6kg (Petite)', key: 'b6' },
                { label: 'B9kg (Moyenne)', key: 'b9' },
                { label: 'B12kg (Grande)', key: 'b12' }
              ].map(p => (
                <div key={p.key} className="flex items-center justify-between p-3 bg-muted/10 rounded-2xl border border-border/30 hover:bg-muted/20 transition-all">
                   <span className="text-[11px] font-black uppercase tracking-tight">{p.label}</span>
                   <div className="flex items-center gap-2">
                     <input 
                       type="number" 
                       value={form.prices?.gaz?.[p.key] || ''} 
                       onChange={e => updateForm({ prices: { ...form.prices, gaz: { ...form.prices.gaz, [p.key]: Number(e.target.value) } } })} 
                       className="w-20 p-1.5 text-right bg-background border border-border/50 rounded-lg font-black text-xs outline-none focus:border-primary" 
                     />
                     <span className="text-[9px] font-black text-muted-foreground">F</span>
                   </div>
                </div>
              ))}
            </div>
         </Card>
      </div>

      <div className="flex justify-center pt-2">
        <button 
          onClick={() => saveSection('prices')} 
          className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-[20px] font-black text-[11px] uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          {ui.savedStatus === 'prices' ? <Check size={16} strokeWidth={3} /> : <Save size={16} strokeWidth={3} />}
          {ui.savedStatus === 'prices' ? 'Tarifs Sauvegardés' : 'Enregistrer tous les Tarifs'}
        </button>
      </div>
    </div>
  )
}
