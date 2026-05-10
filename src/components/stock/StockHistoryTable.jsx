import { History, X } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function StockHistoryTable({ historyFilter, setHistoryFilter }) {
  const allLogs = useStore(state => state.stock_logs) || []
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  const stock_logs = allLogs.filter(l => (l.boutiqueId || 'b1') === activeBoutiqueId)

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border bg-muted/10 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><History size={18} className="text-primary"/> Journal des mouvements</h3>
        {historyFilter && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">Filtre : {historyFilter}</span>
            <button onClick={() => setHistoryFilter('')} className="p-1 hover:bg-muted rounded-lg transition-colors"><X size={14}/></button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-muted/5">
            <tr className="text-[10px] font-black uppercase text-muted-foreground border-b border-border">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Produit</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-center">Quantité</th>
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Raison</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stock_logs.filter(l => !historyFilter || l.productName === historyFilter).length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-20 text-center text-muted-foreground italic font-medium">Aucun mouvement trouvé.</td></tr>
            ) : (
              stock_logs
                .filter(l => !historyFilter || l.productName === historyFilter)
                .slice()
                .map(log => (
                  <tr key={log.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-bold">{new Date(log.date).toLocaleDateString()}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4"><span className="font-black text-sm">{log.productName}</span></td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${log.type === 'initial' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : log.type === 'entree' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                        {log.type === 'initial' ? 'Initial' : log.type === 'entree' ? 'Entrée' : 'Sortie'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-base font-black ${log.type === 'entree' || log.type === 'initial' ? 'text-green-600' : 'text-destructive'}`}>
                        {log.type === 'entree' || log.type === 'initial' ? '+' : '-'}{log.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">{log.userName.charAt(0)}</div>
                        <span className="text-xs font-bold">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs text-muted-foreground italic">{log.reason || 'Saisie initiale'}</span></td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
