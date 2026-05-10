import React, { useState } from 'react'
import { X, ArrowUpCircle, ArrowDownCircle, MessageCircle, Printer, Star, History, CreditCard, Gift } from 'lucide-react'
import { ResponsiveDialog, ResponsiveDialogContent } from '../ui/responsive-dialog'
import clsx from 'clsx'

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function TransactionHistoryModal({ person, onClose, isSupplier = false }) {
  const [activeTab, setActiveTab] = useState('transactions')
  const transactions = person.transactions || []
  const loyaltyLogs = person.loyalty_logs || []

  const handleWhatsApp = () => {
    const lines = [
      `🏪 *BUTIK – Relevé de compte*`,
      `📋 ${isSupplier ? 'Fournisseur' : 'Client'} : *${person.name}*`,
      person.phone ? `📞 Tél : ${person.phone}` : null,
      `📅 Date : ${new Date().toLocaleDateString('fr-FR')}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      ...transactions.slice(0, 15).map((tx, i) => {
        const sign = tx.type === 'paiement' ? '-' : '+'
        return `${i + 1}. ${formatDate(tx.date)}\n   *${tx.libelle}*\n   ${sign}${tx.amount.toLocaleString()} F  →  Solde: ${tx.balance.toLocaleString()} F`
      }),
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `💳 *Solde actuel : ${(person.total_debt || 0).toLocaleString()} F*`,
      !isSupplier ? `⭐ *Points Fidélité : ${(person.loyalty_points || 0).toLocaleString()}*` : null,
      ``,
      `Merci pour votre confiance ! 🙏`
    ].filter(Boolean).join('\n')

    const phone = person.phone ? person.phone.replace(/\D/g, '') : ''
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(lines)}` : `https://wa.me/?text=${encodeURIComponent(lines)}`
    window.open(url, '_blank')
  }

  if (!person) return null;

  return (
    <ResponsiveDialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <ResponsiveDialogContent className="p-0 bg-card overflow-hidden flex flex-col h-[85vh] sm:h-[70vh] max-h-[90vh] sm:max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] border-none">
        <div className="p-6 pb-2 flex flex-col gap-4 bg-muted/20">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase">Fiche Client</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">{person.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X size={20}/></button>
          </div>

          {!isSupplier && (
            <div className="flex p-1 bg-background/50 border border-border rounded-2xl">
              <button 
                onClick={() => setActiveTab('transactions')}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'transactions' ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <History size={14} /> Comptes
              </button>
              <button 
                onClick={() => setActiveTab('loyalty')}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'loyalty' ? "bg-amber-500 text-white shadow-lg" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Star size={14} /> Fidélité
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar bg-background/50">
          {activeTab === 'transactions' ? (
            transactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                <CreditCard size={48} className="mb-4" />
                <p className="font-black uppercase text-xs tracking-widest">Aucune transaction</p>
              </div>
            ) : (
              transactions.slice().reverse().map((tx, i) => (
                <div key={i} className={clsx(
                  "p-5 rounded-[2rem] border transition-all flex justify-between items-center group",
                  tx.type === 'paiement' ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' : 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
                )}>
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      tx.type === 'paiement' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    )}>
                      {tx.type === 'paiement' ? <ArrowUpCircle size={18}/> : <ArrowDownCircle size={18}/>}
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{tx.libelle}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={clsx(
                      "font-black text-lg tracking-tighter",
                      tx.type === 'paiement' ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {tx.type === 'paiement' ? '-' : '+'}{tx.amount.toLocaleString()} F
                    </p>
                    <p className="text-[9px] font-black uppercase opacity-30">Solde: {tx.balance.toLocaleString()} F</p>
                  </div>
                </div>
              ))
            )
          ) : (
            loyaltyLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                <Gift size={48} className="mb-4" />
                <p className="font-black uppercase text-xs tracking-widest">Aucun point cumulé</p>
              </div>
            ) : (
              loyaltyLogs.map((log, i) => (
                <div key={i} className={clsx(
                  "p-5 rounded-[2rem] border transition-all flex justify-between items-center group",
                  log.points > 0 ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30' : 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30'
                )}>
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      log.points > 0 ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                    )}>
                      <Star size={18} fill="currentColor" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{log.reason || 'Gain de points'}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{formatDate(log.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={clsx(
                      "font-black text-lg tracking-tighter",
                      log.points > 0 ? 'text-amber-600' : 'text-blue-600'
                    )}>
                      {log.points > 0 ? '+' : ''}{log.points.toLocaleString()} pts
                    </p>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        <div className="p-6 bg-muted/20 border-t border-border space-y-6">
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reste à payer</span>
              <span className={clsx("text-2xl font-black tracking-tighter", person.total_debt > 0 ? 'text-red-600' : 'text-emerald-600')}>
                {(person.total_debt || 0).toLocaleString()} F
              </span>
            </div>
            {!isSupplier && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Points Fidélité</span>
                <span className="text-2xl font-black tracking-tighter text-amber-500">
                  {(person.loyalty_points || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 print:hidden">
            <button 
              onClick={handleWhatsApp} 
              className="flex items-center justify-center gap-3 py-4 rounded-[1.5rem] bg-[#25D366] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <MessageCircle size={18} /> WhatsApp
            </button>
            <button 
              onClick={() => window.print()} 
              className="flex items-center justify-center gap-3 py-4 rounded-[1.5rem] bg-background border border-border font-black text-xs uppercase tracking-widest hover:bg-muted active:scale-95 transition-all shadow-sm"
            >
              <Printer size={18} /> Imprimer
            </button>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
