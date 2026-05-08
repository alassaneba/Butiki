import { X, ArrowUpCircle, ArrowDownCircle, MessageCircle, Printer } from 'lucide-react'
import { ResponsiveDialog, ResponsiveDialogContent } from '../ui/responsive-dialog'

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function TransactionHistoryModal({ person, onClose, isSupplier = false }) {
  const transactions = person.transactions || []

  const handleWhatsApp = () => {
    const lines = [
      `🏪 *BUTIK – Relevé de compte*`,
      `📋 ${isSupplier ? 'Fournisseur' : 'Client'} : *${person.name}*`,
      person.phone ? `📞 Tél : ${person.phone}` : null,
      `📅 Date : ${new Date().toLocaleDateString('fr-FR')}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      ...transactions.map((tx, i) => {
        const sign = tx.type === 'paiement' ? '-' : '+'
        return `${i + 1}. ${formatDate(tx.date)}\n   *${tx.libelle}*\n   ${sign}${tx.amount.toLocaleString()} F  →  Solde: ${tx.balance.toLocaleString()} F`
      }),
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `💳 *Solde actuel : ${(person.total_debt || 0).toLocaleString()} F*`,
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
      <ResponsiveDialogContent className="p-0 bg-card overflow-hidden flex flex-col max-h-[90vh] sm:max-w-xl rounded-t-[20px] sm:rounded-[24px]">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase">Historique</h2>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-1">{person.name}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3 no-scrollbar">
          {transactions.length === 0 ? <div className="py-20 text-center opacity-20 italic font-black uppercase text-xs tracking-widest">Aucune donnée</div> : transactions.map((tx, i) => (
            <div key={i} className={`p-5 rounded-3xl border transition-all flex justify-between items-center ${tx.type === 'paiement' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tx.type === 'paiement' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {tx.type === 'paiement' ? <ArrowUpCircle size={18}/> : <ArrowDownCircle size={18}/>}
                </div>
                <div><p className="font-black text-sm">{tx.libelle}</p><p className="text-[10px] font-bold text-muted-foreground uppercase">{formatDate(tx.date)}</p></div>
              </div>
              <div className="text-right"><p className={`font-black text-lg ${tx.type === 'paiement' ? 'text-emerald-500' : 'text-red-500'}`}>{tx.type === 'paiement' ? '-' : '+'}{tx.amount.toLocaleString()} F</p><p className="text-[10px] font-black uppercase opacity-40">Solde: {tx.balance.toLocaleString()} F</p></div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-muted/10 border-t border-border space-y-4">
          <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reste à payer</span><span className={`text-2xl font-black tracking-tighter ${person.total_debt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{(person.total_debt || 0).toLocaleString()} F</span></div>
          <div className="grid grid-cols-2 gap-4 print:hidden">
            <button onClick={handleWhatsApp} className="flex items-center justify-center gap-3 py-4 rounded-[24px] bg-[#25D366] text-white font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"><MessageCircle size={18} /> Partager</button>
            <button onClick={() => window.print()} className="flex items-center justify-center gap-3 py-4 rounded-[24px] bg-background border-2 border-border font-black text-sm hover:bg-muted active:scale-95 transition-all"><Printer size={18} /> Imprimer</button>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
