import React from 'react'
import { Card, Label, Input } from './SharedSettingsUI'
import clsx from 'clsx'
import { MessageCircle, Printer, Cpu, Globe, RefreshCw, Check, Smartphone, ShoppingBag, ExternalLink, Monitor } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsIntegrations({ cloudToken }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
       <Card title="WhatsApp Reporting API" icon={MessageCircle}>
          <div className="space-y-4">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                   <span className="text-[10px] font-black uppercase text-emerald-600">Connecté à WhatsApp Web</span>
                </div>
                <button className="text-[9px] font-black text-emerald-600 underline uppercase self-end sm:self-auto">Tester</button>
             </div>
             <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border/30 rounded-2xl cursor-pointer hover:bg-muted/40 transition-all">
                   <input type="checkbox" className="w-4 h-4 accent-emerald-500 rounded-lg" defaultChecked />
                   <div>
                      <p className="text-[11px] font-black uppercase">Envoi Auto Bilan Soir</p>
                      <p className="text-[9px] text-muted-foreground font-bold">Envoie le récapitulatif caisse chaque soir à 20h.</p>
                   </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-muted/20 border border-border/30 rounded-2xl cursor-pointer hover:bg-muted/40 transition-all">
                   <input type="checkbox" className="w-4 h-4 accent-emerald-500 rounded-lg" defaultChecked />
                   <div>
                      <p className="text-[11px] font-black uppercase">Alertes Stock Bas</p>
                      <p className="text-[9px] text-muted-foreground font-bold">Notifie le gérant quand un produit est en rupture.</p>
                   </div>
                </label>
             </div>
          </div>
       </Card>

       <Card title="Imprimante Thermique (ESC/POS)" icon={Printer}>
          <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button className="w-full py-3 bg-primary text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Sélecteur Bluetooth</button>
                <button className="w-full py-3 bg-muted text-muted-foreground border border-border/50 rounded-xl text-[9px] font-black uppercase hover:bg-muted/50 transition-all">Sélecteur USB / LAN</button>
             </div>
             <div className="space-y-1.5">
                <Label>Format du Reçu</Label>
                <select className="w-full p-3 bg-background/50 border border-border/50 rounded-xl font-black text-[10px] uppercase outline-none focus:border-primary transition-all">
                   <option>Standard 58mm (Compact)</option>
                   <option>Standard 80mm (Large)</option>
                   <option>A4 PDF Export</option>
                </select>
             </div>
             <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-amber-600 mb-1">Architecture Ouverte</p>
                <p className="text-[10px] font-bold text-muted-foreground leading-tight">BUTIK supporte nativement les protocoles ESC/POS pour une impression thermique instantanée sans pilote tiers.</p>
             </div>
          </div>
       </Card>

       <Card title="Webhooks & Exports API" icon={Cpu}>
          <div className="space-y-4">
             <div>
                <Label>Clé API d'accès (Lecture seule)</Label>
                <div className="flex gap-2">
                   <Input readOnly value="btk_live_49f8a87d2e1...8f1" className="font-mono text-[9px] opacity-60" />
                   <button className="p-2.5 bg-muted rounded-xl hover:bg-muted/80 transition-all"><RefreshCw size={14}/></button>
                </div>
             </div>
             <div className="space-y-2">
                <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40">Endpoints Externes Disponibles</p>
                {[
                  { path: '/api/v1/stock', method: 'GET' },
                  { path: '/api/v1/sales', method: 'GET' },
                  { path: '/api/v1/inventory', method: 'POST' }
                ].map(ep => (
                   <div key={ep.path} className="flex items-center justify-between p-2.5 bg-muted/10 rounded-xl border border-border/30">
                      <code className="text-[9px] font-bold text-primary">{ep.path}</code>
                      <span className={clsx("text-[8px] font-black px-1.5 py-0.5 rounded", ep.method === 'GET' ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600")}>
                        {ep.method}
                      </span>
                   </div>
                ))}
             </div>
          </div>
       </Card>

       <Card title="Écosystème Connecté" icon={Monitor}>
          <div className="p-5 bg-primary/5 border border-primary/20 rounded-[2rem] space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"><Smartphone size={24}/></div>
                <div>
                   <p className="text-[11px] font-black uppercase tracking-tight">Accès Mobile Offline First</p>
                   <p className="text-[9px] text-muted-foreground font-bold">L'application fonctionne à 100% hors-ligne.</p>
                </div>
             </div>
             <div className="space-y-2 border-t border-primary/10 pt-4">
                <p className="text-[9px] font-bold text-primary/70 leading-relaxed italic">
                   "BUTIK API permet d'interconnecter votre boutique avec des services tiers (Comptabilité, Monitoring externe) via des flux JSON sécurisés."
                </p>
                <div className="flex gap-2">
                  <span className="text-[8px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">JSON</span>
                  <span className="text-[8px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">PWA</span>
                  <span className="text-[8px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">Cloud Sync</span>
                </div>
             </div>
          </div>
       </Card>

       <Card title="Connected Ecosystem (API)" icon={Globe}>
          <div className="space-y-4">
             <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl">
                <Label>Clé API Butik (Cloud Token)</Label>
                <div className="flex items-center gap-2">
                   <code className="flex-1 p-2 bg-card rounded-lg text-[10px] font-mono break-all border border-border/50">
                      {cloudToken || 'Non générée'}
                   </code>
                   <button 
                     onClick={() => { navigator.clipboard.writeText(cloudToken); toast.success('Clé copiée') }}
                     className="p-2 bg-muted rounded-xl text-muted-foreground"
                   >
                     <Check size={14} />
                   </button>
                </div>
             </div>
          </div>
       </Card>
       
       <Card title="Menu Digital (Public)" icon={ShoppingBag}>
          <div className="space-y-4">
             <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                <Label className="text-indigo-600">Lien du Catalogue</Label>
                <div className="flex items-center gap-2">
                   <div className="flex-1 p-3 bg-white dark:bg-zinc-900 rounded-xl text-[10px] font-bold border border-indigo-500/10 truncate">
                      {window.location.origin}/catalogue
                   </div>
                   <button 
                     onClick={() => { window.open('/catalogue', '_blank') }}
                     className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20"
                   >
                     <ExternalLink size={16} />
                   </button>
                </div>
             </div>
          </div>
       </Card>
    </div>
  )
}
