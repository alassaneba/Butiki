import React, { useState, useEffect } from 'react'
import { exportBackup, importBackup } from '../lib/db-backup'
import { useGoogleLogin } from '@react-oauth/google'
import { uploadToDrive } from '../lib/google-sync'
import { useStore } from '../store/useStore'
import { get } from 'idb-keyval'
import { toast } from 'sonner'
import { 
  Database, Store, CircleDollarSign, Tags, Cpu, Fingerprint, Shield, Globe 
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

import SettingsBoutique from './settings/SettingsBoutique'
import SettingsPrices from './settings/SettingsPrices'
import SettingsLists from './settings/SettingsLists'
import SettingsModules from './settings/SettingsModules'
import SettingsRoles from './settings/SettingsRoles'
import SettingsIntegrations from './settings/SettingsIntegrations'
import SettingsSecurity from './settings/SettingsSecurity'
import SettingsData from './settings/SettingsData'

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

export default function Settings() {
  const cloudToken = useStore(state => state.cloudToken)
  const setCloudToken = useStore(state => state.setCloudToken)
  const lastBackupDate = useStore(state => state.lastBackupDate)
  const setLastBackupDate = useStore(state => state.setLastBackupDate)
  const clients = useStore(state => state.clients)
  const stock = useStore(state => state.stock)
  const config = useStore(state => state.config)
  const updateConfigField = useStore(state => state.updateConfigField)
  const updateConfigList = useStore(state => state.updateConfigList)
  const resetConfigLists = useStore(state => state.resetConfigLists)
  const clearAllData = useStore(state => state.clearAllData)
  const clearAuditLogs = useStore(state => state.clearAuditLogs)
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
    get('butik-storage').then(data => {
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

  const login = useGoogleLogin({
    onSuccess: resp => setCloudToken(resp.access_token),
    scope: 'https://www.googleapis.com/auth/drive.appdata',
  })

  const handleSyncToCloud = async () => {
    if (!cloudToken) return login()
    updateUi({ isLoading: true })
    try {
      const dataStr = await get('butik-storage')
      await uploadToDrive(cloudToken, dataStr)
      setLastBackupDate(new Date().toLocaleString())
    } catch (err) {
      toast.error("Erreur de synchronisation")
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
    XLSX.writeFile(wb, `Butik_Export.xlsx`)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 overflow-x-hidden min-w-0">
      <header className="flex justify-between items-end min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic truncate">Configuration</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">Butik · Paramètres</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-2xl border border-border/50 shrink-0">
          <Database size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{ui.storageSize}</span>
        </div>
      </header>

      {/* Tabs Menu - Compact & Responsive */}
      <div className="flex bg-card/50 backdrop-blur-md p-1 rounded-3xl border border-border/50 shadow-premium overflow-x-auto no-scrollbar gap-0.5">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex-1 min-w-[52px] flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl text-[7px] sm:text-[8px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap",
                isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Icon size={13} strokeWidth={isActive ? 3 : 2} />
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
          className="min-w-0"
        >
          {activeTab === 'boutique' && <SettingsBoutique form={form} updateForm={updateForm} saveSection={saveSection} ui={ui} />}
          {activeTab === 'prices' && <SettingsPrices form={form} updateForm={updateForm} saveSection={saveSection} ui={ui} />}
          {activeTab === 'lists' && <SettingsLists config={config} updateConfigList={updateConfigList} resetConfigLists={resetConfigLists} />}
          {activeTab === 'modules' && <SettingsModules config={config} updateConfigList={updateConfigList} />}
          {activeTab === 'roles' && <SettingsRoles config={config} updateConfigField={updateConfigField} />}
          {activeTab === 'security' && <SettingsSecurity form={form} updateForm={updateForm} saveSection={saveSection} ui={ui} updateUi={updateUi} />}
          {activeTab === 'integrations' && <SettingsIntegrations cloudToken={cloudToken} />}
          {activeTab === 'data' && (
            <SettingsData 
              cloudToken={cloudToken}
              lastBackupDate={lastBackupDate}
              handleSyncToCloud={handleSyncToCloud}
              ui={ui}
              handleExportExcel={handleExportExcel}
              applySenegalSeed={applySenegalSeed}
              exportBackup={exportBackup}
              handleImport={handleImport}
              clearAuditLogs={clearAuditLogs}
              handleFullReset={handleFullReset}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
