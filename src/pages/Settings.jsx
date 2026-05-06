import React, { useState, useRef, useEffect } from 'react'
import { exportBackup, importBackup } from '../lib/db-backup'
import { useGoogleLogin } from '@react-oauth/google'
import { uploadToDrive, downloadFromDrive } from '../lib/google-sync'
import { useStore } from '../store/useStore'
import { get } from 'idb-keyval'
import { toast } from 'sonner'
import { 
  Cloud, CloudOff, RefreshCw, UploadCloud, DownloadCloud, 
  Database, AlertTriangle, FileSpreadsheet, CircleDollarSign, 
  Check, Target, Store, Shield, Lock, Eye, EyeOff, 
  Upload, MapPin, FileText, Image as ImageIcon, ChevronRight,
  Info, HardDrive, Trash2, Globe, Settings as SettingsIcon,
  Monitor, Croissant, Flame, Tags, Cpu, Fingerprint, Plus, Smartphone, Palette, UserCheck, Bell, Save,
  Wallet, Package, Users, MessageCircle, Printer, Flag, ShoppingBag, ExternalLink
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const TABS = [
  { id: 'boutique', label: 'Boutique', icon: Store },
  { id: 'prices', label: 'Tarifs', icon: CircleDollarSign },
  { id: 'lists', label: 'Listes', icon: Tags },
  { id: 'modules', label: 'ERP', icon: Cpu },
  { id: 'roles', label: 'Accès', icon: Fingerprint },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'integrations', label: 'API', icon: Globe },
  { id: 'data', label: 'Data', icon: Database },
]

// --- Helper for styling ---
const Label = ({ children, className }) => (
  <label className={clsx("text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 block", className)}>
    {children}
  </label>
)

const Input = ({ className, ...props }) => (
  <input 
    {...props} 
    className={clsx(
      "w-full p-2.5 bg-background/50 border border-border/50 rounded-xl text-sm font-bold focus:ring-4 ring-primary/5 focus:border-primary outline-none transition-all placeholder:opacity-30",
      className
    )} 
  />
)

const Card = ({ children, className, title, icon: Icon, action }) => (
  <div className={clsx("bg-card/30 backdrop-blur-sm border border-border/50 rounded-[24px] p-5 shadow-premium overflow-hidden relative", className)}>
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground">
          {Icon && <Icon size={14} className="text-primary" />} {title}
        </h3>
        {action}
      </div>
    )}
    {children}
  </div>
)

// --- Sub-components for Settings ---
const ListEditor = ({ title, icon: Icon, items, onUpdate, type = 'text' }) => {
  const [newLabel, setNewLabel] = useState('')
  const [newEmoji, setNewEmoji] = useState(type === 'phone' ? '📱' : '📦')
  const [newColor, setNewColor] = useState('#3b82f6')

  const handleAdd = () => {
    if (!newLabel) return
    const val = newLabel.toLowerCase().replace(/\s+/g, '_')
    if (type === 'category') {
      onUpdate([...items, { value: val, label: newLabel, emoji: newEmoji }])
    } else if (type === 'fintech') {
      onUpdate([...items, { name: newLabel, value: val, color: newColor }])
    } else if (type === 'phone') {
      onUpdate([...items, { name: newLabel, value: val, emoji: newEmoji }])
    } else {
      onUpdate([...items, newLabel])
    }
    setNewLabel('')
  }

  const removeItem = (idx) => {
    if (window.confirm("Supprimer cet élément ?")) {
      onUpdate(items.filter((_, i) => i !== idx))
    }
  }

  return (
    <Card title={title} icon={Icon}>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 no-scrollbar mb-4">
        {items.length === 0 && <p className="text-[10px] font-bold text-muted-foreground opacity-30 italic py-2 text-center">Aucun élément</p>}
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-muted/20 border border-border/30 rounded-xl group hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2.5">
              {type === 'category' ? (
                <>
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                </>
              ) : type === 'fintech' ? (
                <>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-black uppercase tracking-tight">{item.name}</span>
                </>
              ) : type === 'phone' ? (
                <>
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-[11px] font-black uppercase tracking-tight">{item.name}</span>
                </>
              ) : (
                <span className="text-[11px] font-black uppercase tracking-tight">{item}</span>
              )}
            </div>
            <button onClick={() => removeItem(i)} className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 items-center">
        {(type === 'category' || type === 'phone') && (
          <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} className="w-9 h-9 p-0 bg-background/50 border border-border/50 rounded-xl text-center text-sm outline-none focus:border-primary transition-all" />
        )}
        {type === 'fintech' && (
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-9 h-9 p-1 bg-background/50 border border-border/50 rounded-xl cursor-pointer outline-none" />
        )}
        <input 
          value={newLabel} 
          onChange={e => setNewLabel(e.target.value)} 
          className="flex-1 h-9 px-3 bg-background/50 border border-border/50 rounded-xl text-[11px] font-black uppercase outline-none focus:border-primary transition-all" 
          placeholder="Ajouter..." 
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} className="w-9 h-9 shrink-0 flex items-center justify-center bg-primary text-white rounded-xl active:scale-90 transition-all shadow-lg shadow-primary/20">
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </Card>
  )
}

export default function Settings() {
  const cloudToken = useStore(state => state.cloudToken)
  const setCloudToken = useStore(state => state.setCloudToken)
  const lastBackupDate = useStore(state => state.lastBackupDate)
  const setLastBackupDate = useStore(state => state.setLastBackupDate)
  const clients = useStore(state => state.clients)
  const stock = useStore(state => state.stock)
  const users = useStore(state => state.users)
  const activeUserId = useStore(state => state.activeUserId)
  const config = useStore(state => state.config)
  const updateConfig = useStore(state => state.updateConfig)
  const updateConfigField = useStore(state => state.updateConfigField)
  const updateConfigList = useStore(state => state.updateConfigList)
  const resetConfigLists = useStore(state => state.resetConfigLists)
  const clearAllData = useStore(state => state.clearAllData)
  const applySenegalSeed = useStore(state => state.applySenegalSeed)

  const [activeTab, setActiveTab] = useState('boutique')
  const [ui, setUi] = useState({
    isLoading: false,
    storageSize: '...',
    savedStatus: null,
    showPin: false
  })
  
  const [form, setForm] = useState({
    boutique: {},
    prices: {},
    security: {}
  })

  const updateUi = (patch) => setUi(prev => ({ ...prev, ...patch }))
  const updateForm = (patch) => setForm(prev => ({ ...prev, ...patch }))

  const logoInputRef = useRef(null)
  const importInputRef = useRef(null)

  // Sync with store on load
  useEffect(() => {
    if (config) {
      setForm({
        boutique: {
          name: config.boutiqueName || '',
          target: config.dailyTarget || 0,
          address: config.boutiqueAddress || '',
          whatsapp: config.boutiqueWhatsApp || '',
          legal: config.boutiqueLegal || '',
          logo: config.boutiqueLogo || ''
        },
        prices: {
          pain: config.prices?.pain || { miche: 135, deuxTiers: 90, demi: 65, unTiers: 45 },
          gaz: config.prices?.gaz || { b6: 2800, b9: 4175, b12: 6000 }
        },
        security: {
          pin: config.appPin || '',
          timeout: config.sessionTimeoutMin || 0
        }
      })
    }
  }, [config])

  useEffect(() => {
    get('butiki-storage').then(data => {
      if (data) {
        const size = (new Blob([data]).size / 1024).toFixed(1)
        updateUi({ storageSize: `${size} KB` })
      }
    })
  }, [])

  const saveSection = (type) => {
    if (type === 'boutique') {
      updateConfigField('boutiqueName', form.boutique.name)
      updateConfigField('dailyTarget', Number(form.boutique.target))
      updateConfigField('boutiqueAddress', form.boutique.address)
      updateConfigField('boutiqueWhatsApp', form.boutique.whatsapp)
      updateConfigField('boutiqueLegal', form.boutique.legal)
      updateConfigField('boutiqueLogo', form.boutique.logo)
    } else if (type === 'prices') {
      updateConfigField('prices', form.prices)
    } else if (type === 'security') {
      updateConfigField('appPin', form.security.pin)
      updateConfigField('sessionTimeoutMin', form.security.timeout)
    }
    updateUi({ savedStatus: type })
    setTimeout(() => updateUi({ savedStatus: null }), 2000)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 500) return alert("Logo trop lourd (max 500 KB)")
    const reader = new FileReader()
    reader.onload = (ev) => updateForm({ boutique: { ...form.boutique, logo: ev.target.result } })
    reader.readAsDataURL(file)
  }

  const login = useGoogleLogin({
    onSuccess: resp => setCloudToken(resp.access_token),
    scope: 'https://www.googleapis.com/auth/drive.appdata',
  })

  const handleSyncToCloud = async () => {
    if (!cloudToken) return login()
    updateUi({ isLoading: true })
    try {
      const dataStr = await get('butiki-storage')
      await uploadToDrive(cloudToken, dataStr)
      setLastBackupDate(new Date().toLocaleString())
    } catch (err) {
      alert("Erreur de synchronisation")
    } finally {
      updateUi({ isLoading: false })
    }
  }

  const handleFullReset = () => {
    const pin = prompt("Confirmez par votre PIN administrateur :")
    if (pin === config.appPin || (!config.appPin && pin === '0000')) {
      if (window.confirm("Action IRREVERSIBLE. Continuer ?")) {
        clearAllData()
        window.location.reload()
      }
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (file) await importBackup(file)
  }

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stock), "Stock")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clients), "Clients")
    XLSX.writeFile(wb, `Butiki_Export.xlsx`)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <header className="flex justify-between items-end px-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase italic">Configuration</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] mt-1">Personnalisation du système Butiki</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-2xl border border-border/50">
          <Database size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{ui.storageSize}</span>
        </div>
      </header>

      {/* Tabs Menu - Compact & Responsive */}
      <div className="flex bg-card/50 backdrop-blur-md p-1 rounded-3xl border border-border/50 shadow-premium overflow-x-auto no-scrollbar gap-1 mx-2">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 min-w-[65px] sm:min-w-[100px] flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon size={14} strokeWidth={isActive ? 3 : 2} />
              <span className={clsx("transition-opacity", isActive ? "opacity-100" : "opacity-70")}>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="px-2"
        >
          {activeTab === 'boutique' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card title="Identité Visuelle" icon={ImageIcon}>
                   <div className="flex flex-col items-center gap-6 py-4">
                      <div 
                        onClick={() => logoInputRef.current.click()}
                        className="w-32 h-32 rounded-[32px] border-4 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:border-primary transition-all relative overflow-hidden group bg-muted/10"
                      >
                        {form.boutique.logo ? (
                          <img src={form.boutique.logo} className="w-full h-full object-contain p-2" alt="Logo" />
                        ) : (
                          <ImageIcon size={32} className="text-muted-foreground opacity-20" />
                        )}
                        <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                           <Upload size={24} className="text-white" />
                        </div>
                      </div>
                      <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      <div className="text-center">
                        <p className="font-black text-sm uppercase tracking-tight">{form.boutique.name || 'Nom manquant'}</p>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">{form.boutique.address || 'Adresse manquante'}</p>
                      </div>
                   </div>
                </Card>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-[24px]">
                  <p className="text-[9px] font-black uppercase text-primary mb-1">Status</p>
                  <p className="text-[11px] font-bold text-muted-foreground">Les modifications ici impactent vos factures et rapports PDF.</p>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <Card 
                  title="Informations Générales" 
                  icon={Store}
                  action={
                    <button 
                      onClick={() => saveSection('boutique')} 
                      className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl font-black text-[9px] uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                      {ui.savedStatus === 'boutique' ? <Check size={12} /> : <Save size={12} />}
                      {ui.savedStatus === 'boutique' ? 'Sauvé' : 'Enregistrer'}
                    </button>
                  }
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Nom de l'Etablissement</Label>
                      <Input value={form.boutique.name} onChange={e => updateForm({ boutique: { ...form.boutique, name: e.target.value } })} placeholder="Butiki Pro Max" />
                    </div>
                    <div>
                      <Label>Objectif CA Journalier (F)</Label>
                      <Input type="number" value={form.boutique.target} onChange={e => updateForm({ boutique: { ...form.boutique, target: e.target.value } })} placeholder="50000" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Adresse Physique</Label>
                    <Input value={form.boutique.address} onChange={e => updateForm({ boutique: { ...form.boutique, address: e.target.value } })} placeholder="Dakar, Plateau..." />
                  </div>
                  <div className="mt-4">
                    <Label className="text-emerald-500">WhatsApp Commercial (Relances)</Label>
                    <Input value={form.boutique.whatsapp} onChange={e => updateForm({ boutique: { ...form.boutique, whatsapp: e.target.value } })} placeholder="+221 77..." />
                  </div>
                  <div className="mt-4">
                    <Label>Mentions Légales (NINEA, SIRET...)</Label>
                    <textarea 
                      value={form.boutique.legal} 
                      onChange={e => updateForm({ boutique: { ...form.boutique, legal: e.target.value } })} 
                      className="w-full p-3 bg-background/50 border border-border/50 rounded-xl text-sm font-bold focus:ring-4 ring-primary/5 outline-none min-h-[80px]" 
                      placeholder="Identifiant fiscal, capital social..."
                    />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'prices' && (
            <div className="grid md:grid-cols-2 gap-6">
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
                             value={form.prices.pain?.[p.key]} 
                             onChange={e => updateForm({ prices: { ...form.prices, pain: { ...form.prices.pain, [p.key]: Number(e.target.value) } } })} 
                             className="w-16 p-1.5 text-right bg-background border border-border/50 rounded-lg font-black text-xs outline-none focus:border-primary" 
                           />
                           <span className="text-[9px] font-black text-muted-foreground">F</span>
                         </div>
                      </div>
                    ))}
                  </div>
               </Card>
               <Card 
                  title="Grille Tarifaire Gaz" 
                  icon={Flame}
                  action={
                    <button onClick={() => saveSection('prices')} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all">
                      {ui.savedStatus === 'prices' ? <Check size={12} /> : <Save size={12} />} Sauvegarder
                    </button>
                  }
               >
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
                             value={form.prices.gaz?.[p.key]} 
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
          )}

          {activeTab === 'lists' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-[28px] mx-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Bell size={18} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">Configuration Rapide</p>
                    <p className="text-[11px] font-bold text-muted-foreground">Restaurer les catégories standards Butiki Pro.</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.confirm("Ecraser vos listes ?") && resetConfigLists()}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-primary/20"
                >
                  Réinitialiser
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <ListEditor title="Dépenses" icon={Palette} items={config?.expense_categories || []} type="category" onUpdate={l => updateConfigList('expense_categories', l)} />
                <ListEditor title="Fintech" icon={Smartphone} items={config?.fintech_providers || []} type="fintech" onUpdate={l => updateConfigList('fintech_providers', l)} />
                <ListEditor title="Opérateurs" icon={Smartphone} items={config?.phone_credit_providers || []} type="phone" onUpdate={l => updateConfigList('phone_credit_providers', l)} />
                <ListEditor title="Coffre Entrées" icon={Plus} items={config?.vault_categories_in || []} onUpdate={l => updateConfigList('vault_categories_in', l)} />
                <ListEditor title="Coffre Sorties" icon={Trash2} items={config?.vault_categories_out || []} onUpdate={l => updateConfigList('vault_categories_out', l)} />
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
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
          )}

          {activeTab === 'roles' && (
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
               <div className="p-5 bg-card/30 border border-border/50 rounded-[24px] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600"><Shield size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-600">Rôle : Administrateur / Gérant</p>
                    <p className="text-[11px] font-bold text-muted-foreground">Accès total non restreint par défaut.</p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
               <Card title="WhatsApp Reporting API" icon={MessageCircle}>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-black uppercase text-emerald-600">Connecté à WhatsApp Web</span>
                        </div>
                        <button className="text-[9px] font-black text-emerald-600 underline uppercase">Tester</button>
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
                     <div className="grid grid-cols-2 gap-2">
                        <button className="py-3 bg-primary text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-all">Sélecteur Bluetooth</button>
                        <button className="py-3 bg-muted text-muted-foreground border border-border/50 rounded-xl text-[9px] font-black uppercase hover:bg-muted/50 transition-all">Sélecteur USB / LAN</button>
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
                        <p className="text-[10px] font-bold text-muted-foreground leading-tight">BUTIKI supporte nativement les protocoles ESC/POS pour une impression thermique instantanée sans pilote tiers.</p>
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
                           "BUTIKI API permet d'interconnecter votre boutique avec des services tiers (Comptabilité, Monitoring externe) via des flux JSON sécurisés."
                        </p>
                        <div className="flex gap-2">
                          <span className="text-[8px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">JSON</span>
                          <span className="text-[8px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">PWA</span>
                          <span className="text-[8px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">Cloud Sync</span>
                        </div>
                     </div>
                  </div>
               </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-xl mx-auto space-y-6">
               <Card 
                  title="Sécurité & Accès" 
                  icon={Lock}
                  action={
                    <button onClick={() => saveSection('security')} className="px-5 py-2 bg-primary text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-primary/20">
                       Valider
                    </button>
                  }
               >
                  <div className="grid sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label>Code PIN Admin</Label>
                      <div className="relative">
                        <Input 
                          type={ui.showPin ? 'text' : 'password'} 
                          value={form.security.pin} 
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
                        value={form.security.timeout} 
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
            </div>
          )}

          {activeTab === 'data' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card title="Synchronisation" icon={Cloud}>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-2xl border border-border/30">
                        <div className="flex items-center gap-2">
                           <div className={clsx("w-2 h-2 rounded-full", cloudToken ? "bg-green-500" : "bg-red-500")} />
                           <span className="text-[10px] font-black uppercase text-muted-foreground">{cloudToken ? 'Auto-Sync Actif' : 'Sauvegarde Inactive'}</span>
                        </div>
                        {lastBackupDate && (
                           <div className="text-right">
                             <p className="text-[8px] font-black uppercase text-muted-foreground">Dernier Cloud</p>
                             <p className="text-[9px] font-bold text-primary">{lastBackupDate}</p>
                           </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={handleSyncToCloud}
                        disabled={ui.isLoading}
                        className="w-full py-4 bg-primary text-white rounded-[24px] font-black text-xs flex items-center justify-center gap-3 shadow-premium active:scale-95 transition-all disabled:opacity-50"
                      >
                        {ui.isLoading ? <RefreshCw className="animate-spin" size={18}/> : <UploadCloud size={18}/>}
                        {cloudToken ? "SAUVEGARDER MAINTENANT" : "ACTIVER LA SAUVEGARDE CLOUD"}
                      </button>

                      <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl space-y-3">
                         <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Info size={12} className="text-primary" /> Guide de Sauvegarde
                         </p>
                         <ul className="space-y-2 text-[10px] font-bold text-muted-foreground list-disc pl-4 leading-tight">
                            <li>Connectez votre compte Google pour activer la sauvegarde.</li>
                            <li>L'application synchronise vos données <span className="text-primary">toutes les 15 minutes</span>.</li>
                            <li>En cas de changement de téléphone, connectez le <span className="text-primary">même compte</span> pour restaurer vos données.</li>
                            <li>Vos données sont stockées de manière sécurisée dans votre espace Google Drive privé (App Data Folder).</li>
                         </ul>
                      </div>
                   </div>
                </Card>
                <Card title="Rapports Excel" icon={FileSpreadsheet}>
                   <button onClick={handleExportExcel} className="w-full py-4 bg-emerald-600 text-white rounded-[24px] font-black text-xs flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                      <DownloadCloud size={18}/> EXPORT COMPLET (.XLSX)
                   </button>
                </Card>
              </div>

              <div className="space-y-6">
                <Card title="Données Démo (Sénégal)" icon={Flag}>
                   <div className="space-y-3">
                      <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                        Remplir automatiquement le catalogue avec des produits et fournisseurs locaux (Riz, Huile, GMD, CSS...).
                      </p>
                      <button 
                        onClick={async () => {
                          if (window.confirm("Ajouter les produits et fournisseurs du Sénégal au système ?")) {
                            await applySenegalSeed();
                            toast.success("Données du Sénégal importées !");
                          }
                        }}
                        className="w-full py-4 bg-primary/10 text-primary border border-primary/20 rounded-[24px] font-black text-xs flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all active:scale-95 shadow-premium"
                      >
                         <Package size={18}/> INITIALISER (SÉNÉGAL)
                      </button>
                   </div>
                </Card>

                <Card title="Maintenance" icon={AlertTriangle}>
                   <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => exportBackup()} className="py-2.5 bg-muted/30 text-foreground border border-border/50 rounded-xl text-[10px] font-black uppercase hover:bg-muted transition-all">Export JSON</button>
                        <button onClick={() => importInputRef.current?.click()} className="py-2.5 bg-muted/30 text-foreground border border-border/50 rounded-xl text-[10px] font-black uppercase hover:bg-muted transition-all">Import JSON</button>
                        <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
                      </div>
                      <button 
                        onClick={handleFullReset}
                        className="w-full p-4 border-2 border-dashed border-destructive/20 hover:border-destructive hover:bg-destructive/5 rounded-2xl flex items-center gap-3 transition-all group"
                      >
                         <Trash2 size={20} className="text-destructive group-hover:scale-110 transition-transform" />
                         <div className="text-left">
                            <p className="text-[11px] font-black text-destructive uppercase tracking-tight">RAZ Totale</p>
                            <p className="text-[9px] text-muted-foreground font-bold italic">Supprimer tout le contenu</p>
                         </div>
                      </button>
                   </div>
                </Card>

                <div className="p-5 bg-card/30 border border-border/50 rounded-[24px] flex justify-between items-center">
                   <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Version</p>
                      <p className="text-lg font-black tracking-tighter">Butiki v2.5.0</p>
                   </div>
                   <button onClick={() => window.location.reload()} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"><RefreshCw size={18}/></button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="grid md:grid-cols-2 gap-6">
               <Card title="Connected Ecosystem (API)" icon={Globe}>
                  <div className="space-y-4">
                     <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl">
                        <Label>Clé API Butiki (Cloud Token)</Label>
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
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function ShoppingCart(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}
