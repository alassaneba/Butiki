import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from '../../components/ui/responsive-dialog'
import { Input, Label } from '../settings/SharedSettingsUI'
import clsx from 'clsx'

const formatTime = (dateStr) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch (e) { return '--:--' }
}
const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch (e) { return '-- --- ----' }
}

export function SuccessModal({ ui, updateUi }) {
  return (
    <AnimatePresence>
      {ui.showSuccess && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-emerald-500/90 backdrop-blur-md">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto"><CheckCircle2 size={60} /></div>
            <div className="space-y-2"><h3 className="text-2xl font-black uppercase tracking-tight">Vente OK !</h3></div>
            <button onClick={() => updateUi({ showSuccess: false })} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs">Fermer</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function NewClientModal({ ui, updateUi, newClient, updateNewClient, handleCreateQuickClient }) {
  return (
    <ResponsiveDialog open={ui.showNewClientDialog} onOpenChange={(v) => updateUi({ showNewClientDialog: v })}>
      <ResponsiveDialogContent className="rounded-t-[3rem] p-6">
        <ResponsiveDialogHeader><ResponsiveDialogTitle className="text-sm font-black uppercase tracking-widest">Nouveau Client</ResponsiveDialogTitle></ResponsiveDialogHeader>
        <form onSubmit={handleCreateQuickClient} className="space-y-4 py-4">
          <div><Label>Nom / Entreprise</Label><Input required value={newClient.name} onChange={e => updateNewClient({ name: e.target.value })} autoFocus /></div>
          <div><Label>Téléphone (Optionnel)</Label><Input type="tel" value={newClient.phone} onChange={e => updateNewClient({ phone: e.target.value })} /></div>
          <button type="submit" className="w-full py-3.5 bg-primary text-white rounded-[20px] font-black text-[11px] uppercase shadow-lg active:scale-95 transition-all">Créer Client</button>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

export function SaleDetailsModal({ history, updateHistory, formatF, cancelSale }) {
  return (
    <ResponsiveDialog open={!!history.selectedSaleDetails} onOpenChange={() => updateHistory({ selectedSaleDetails: null })}>
      <ResponsiveDialogContent className="rounded-t-[3rem] p-6">
        <ResponsiveDialogHeader><ResponsiveDialogTitle className="text-sm font-black uppercase tracking-widest">Détails</ResponsiveDialogTitle></ResponsiveDialogHeader>
        {history.selectedSaleDetails && (
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-start">
              <div><p className="text-xs font-black">#{history.selectedSaleDetails.id.slice(0, 8)}</p><p className="text-[10px] text-muted-foreground mt-1">{formatDate(history.selectedSaleDetails.date)} à {formatTime(history.selectedSaleDetails.date)}</p></div>
              <span className={clsx("text-[9px] font-black uppercase px-2 py-0.5 rounded-full", history.selectedSaleDetails.status === 'cancelled' ? "bg-red-500 text-white" : "bg-emerald-500 text-white")}>{history.selectedSaleDetails.status === 'cancelled' ? 'Annulée' : 'Validée'}</span>
            </div>
            <div className="space-y-2">
              {history.selectedSaleDetails.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold p-2 bg-muted/20 rounded-xl">
                  <span>{it.quantity}x {it.name}</span>
                  <span>{formatF(it.unitPrice * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Net à payer</span>
              <span className="text-lg font-black text-primary">{formatF(history.selectedSaleDetails.totalAmount)}</span>
            </div>
            {history.selectedSaleDetails.status !== 'cancelled' && (
              <button 
                onClick={() => {
                  if (window.confirm("Annuler définitivement cette vente ? (Le stock sera recrédité)")) {
                    cancelSale(history.selectedSaleDetails.id)
                    updateHistory({ selectedSaleDetails: null })
                  }
                }}
                className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase transition-all"
              >
                Annuler la transaction
              </button>
            )}
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
