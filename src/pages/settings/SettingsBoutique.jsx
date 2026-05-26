import React, { useRef } from 'react'
import { Card, Label, Input } from './SharedSettingsUI'
import { Store, Image as ImageIcon, Upload, Check, Save } from 'lucide-react'

export default function SettingsBoutique({ form, updateForm, saveSection, ui }) {
  const logoInputRef = useRef(null)

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 500) return alert("Logo trop lourd (max 500 KB)")
    const reader = new FileReader()
    reader.onload = (ev) => updateForm({ boutique: { ...form.boutique, logo: ev.target.result } })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card title="Identité Visuelle" icon={ImageIcon}>
             <div className="flex flex-col items-center gap-6 py-4">
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-32 h-32 rounded-[32px] border-4 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:border-primary transition-all relative overflow-hidden group bg-transparent shadow-sm"
                >
                  {form.boutique?.logo ? (
                    <img src={form.boutique.logo} className="w-full h-full object-contain p-0" alt="Logo" />
                  ) : (
                    <ImageIcon size={32} className="text-muted-foreground opacity-20" />
                  )}
                  <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                     <Upload size={24} className="text-white" />
                  </div>
                </div>
                <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <div className="text-center">
                  <p className="font-black text-sm uppercase tracking-tight">{form.boutique?.name || 'Nom manquant'}</p>
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">{form.boutique?.address || 'Adresse manquante'}</p>
                </div>
             </div>
          </Card>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-[24px]">
            <p className="text-[9px] font-black uppercase text-primary mb-1">Status</p>
            <p className="text-[11px] font-bold text-muted-foreground">Les modifications ici impactent vos factures et rapports PDF.</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card title="Informations Générales" icon={Store}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nom de l'Etablissement</Label>
                <Input value={form.boutique?.name || ''} onChange={e => updateForm({ boutique: { ...form.boutique, name: e.target.value } })} placeholder="Butik Pro Max" />
              </div>
              <div>
                <Label>Objectif CA Journalier (F)</Label>
                <Input type="number" value={form.boutique?.target || ''} onChange={e => updateForm({ boutique: { ...form.boutique, target: e.target.value } })} placeholder="50000" />
              </div>
            </div>
            <div className="mt-4">
              <Label>Adresse Physique</Label>
              <Input value={form.boutique?.address || ''} onChange={e => updateForm({ boutique: { ...form.boutique, address: e.target.value } })} placeholder="Dakar, Plateau..." />
            </div>
            <div className="mt-4">
              <Label className="text-emerald-500">WhatsApp Commercial (Relances)</Label>
              <Input value={form.boutique?.whatsapp || ''} onChange={e => updateForm({ boutique: { ...form.boutique, whatsapp: e.target.value } })} placeholder="+221 77..." />
            </div>
            <div className="mt-4">
              <Label>Mentions Légales (NINEA, SIRET...)</Label>
              <textarea 
                value={form.boutique?.legal || ''} 
                onChange={e => updateForm({ boutique: { ...form.boutique, legal: e.target.value } })} 
                className="w-full p-3 bg-background/50 border border-border/50 rounded-xl text-sm font-bold focus:ring-4 ring-primary/5 outline-none min-h-[80px]" 
                placeholder="Identifiant fiscal, capital social..."
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <button 
          onClick={() => saveSection('boutique')} 
          className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-[20px] font-black text-[11px] uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          {ui.savedStatus === 'boutique' ? <Check size={16} strokeWidth={3} /> : <Save size={16} strokeWidth={3} />}
          {ui.savedStatus === 'boutique' ? 'Infos Boutique Sauvegardées' : 'Enregistrer les Infos Boutique'}
        </button>
      </div>
    </div>
  )
}
