import React from 'react'
import { Card, Label, Input } from './SharedSettingsUI'
import { Lock, EyeOff, Eye, Info, Check, Save } from 'lucide-react'

export default function SettingsSecurity({ form, updateForm, saveSection, ui, updateUi }) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
       <Card 
          title="Sécurité & Accès" 
          icon={Lock}
       >
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <Label>Code PIN Admin</Label>
              <div className="relative">
                <Input 
                  type={ui.showPin ? 'text' : 'password'} 
                  value={form.security?.pin || ''} 
                  onChange={e => updateForm({ security: { ...form.security, pin: e.target.value.replace(/\D/g,'').slice(0,6) } })} 
                  className="tracking-[0.8em] text-lg text-center"
                  placeholder="****"
                />
                <button onClick={() => updateUi({ showPin: !ui.showPin })} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground">
                  {ui.showPin ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <div>
              <Label>Délai Inactivité</Label>
              <select 
                value={form.security?.timeout || 0} 
                onChange={e => updateForm({ security: { ...form.security, timeout: Number(e.target.value) } })} 
                className="w-full p-2.5 bg-background/50 border border-border/50 rounded-xl font-black text-xs outline-none focus:border-primary"
              >
                <option value={0}>Jamais</option>
                <option value={5}>5 min</option>
                <option value={15}>15 min</option>
                <option value={60}>1 heure</option>
              </select>
            </div>
          </div>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
             <Info size={16} className="text-primary mt-0.5 shrink-0" />
             <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                Le PIN protège l'accès aux réglages critiques. Le délai d'inactivité verrouille l'application automatiquement pour plus de sécurité.
             </p>
          </div>
       </Card>

       <div className="flex justify-center pt-2">
         <button 
           onClick={() => saveSection('security')} 
           className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-[20px] font-black text-[11px] uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all"
         >
           {ui.savedStatus === 'security' ? <Check size={16} strokeWidth={3} /> : <Save size={16} strokeWidth={3} />}
           {ui.savedStatus === 'security' ? 'Sécurité Sauvegardée' : 'Valider les Paramètres'}
         </button>
       </div>
    </div>
  )
}
