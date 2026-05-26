import React, { useRef } from 'react'
import { Card } from './SharedSettingsUI'
import clsx from 'clsx'
import { Cloud, RefreshCw, UploadCloud, Info, FileSpreadsheet, DownloadCloud, Flag, Package, AlertTriangle, Shield, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsData({ 
  cloudToken, 
  lastBackupDate, 
  handleSyncToCloud, 
  ui, 
  handleExportExcel, 
  applySenegalSeed, 
  exportBackup, 
  handleImport, 
  clearAuditLogs, 
  handleFullReset 
}) {
  const importInputRef = useRef(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <div className="space-y-6">
        <Card title="Synchronisation" icon={Cloud}>
           <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/20 rounded-2xl border border-border/30">
                <div className="flex items-center gap-2">
                   <div className={clsx("w-2 h-2 rounded-full shrink-0", cloudToken ? "bg-green-500" : "bg-red-500")} />
                   <span className="text-[10px] font-black uppercase text-muted-foreground">{cloudToken ? 'Auto-Sync Actif' : 'Sauvegarde Inactive'}</span>
                </div>
                {lastBackupDate && (
                   <div className="text-left sm:text-right">
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
                onClick={() => { if(window.confirm("Vider l'historique des actions ?")) { clearAuditLogs(); toast.success("Journal vidé"); } }}
                className="w-full py-3 bg-muted/20 text-muted-foreground border border-border/50 rounded-xl text-[10px] font-black uppercase hover:bg-muted transition-all flex items-center justify-center gap-2"
              >
                <Shield size={12} /> Nettoyer Journal d'Audit
              </button>

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

        <div className="p-5 bg-card/30 border border-border/50 rounded-[24px] flex justify-between items-center flex-wrap gap-4">
           <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Version</p>
              <p className="text-lg font-black tracking-tighter">Butik v2.5.0</p>
           </div>
           <button onClick={() => window.location.reload()} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"><RefreshCw size={18}/></button>
        </div>
      </div>
    </div>
  )
}
