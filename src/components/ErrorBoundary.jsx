import { Component } from 'react'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleClearData = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vider le cache ? Vous pourriez perdre les sessions actives, mais les données principales sont sauvegardées si vous les avez synchronisées.")) {
      // Vider IndexedDB ou LocalStorage d'urgence
      localStorage.clear()
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-destructive/20 shadow-xl">
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-black mb-2 text-foreground uppercase tracking-tight">Erreur Inattendue</h1>
            <p className="text-sm text-muted-foreground mb-6 font-medium">
              Une erreur système s'est produite. L'application a été interrompue pour protéger vos données.
            </p>
            
            <div className="p-4 bg-muted/30 rounded-xl mb-8 overflow-hidden text-left border border-border">
               <p className="text-[10px] font-mono text-destructive/80 break-words line-clamp-3">
                 {this.state.error?.toString()}
               </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={this.handleRefresh} 
                className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest"
              >
                <RefreshCw size={16} /> Rafraîchir l'application
              </button>
              
              <button 
                onClick={this.handleClearData} 
                className="w-full py-3 bg-secondary text-muted-foreground rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all uppercase tracking-widest"
              >
                <Trash2 size={16} /> Vider le cache d'urgence
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
