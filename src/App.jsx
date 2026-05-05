import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Loader2 } from 'lucide-react'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import InstallPrompt from './components/InstallPrompt'
import PinLock, { useSessionTimeout } from './components/PinLock'
import { ErrorBoundary } from './components/ErrorBoundary'
import CloudSyncManager from './components/CloudSyncManager'
import { useStore } from './store/useStore'

// Imports fainéants (Lazy Load) pour le code splitting
import Dashboard from './pages/Dashboard'
import Caisse from './pages/Caisse'
import Achat from './pages/Achat'
import Clients from './pages/Clients'
import Fournisseurs from './pages/Fournisseurs'
import Settings from './pages/Settings'
import Stock from './pages/Stock'
import Historique from './pages/Historique'
import Inventaire from './pages/Inventaire'
import PrevisionsPage from './pages/PrevisionsPage'
import UsersPage from './pages/UsersPage'
import ChargesFixes from './pages/ChargesFixes'
import Depot from './pages/Depot'
import Pain from './pages/Pain'
import Gaz from './pages/Gaz'
import CreditTelephonique from './pages/CreditTelephonique'
import Ventes from './pages/Ventes'
import Treasury from './pages/Treasury'
import Procurement from './pages/Procurement'
import AuditTrail from './pages/AuditTrail'
import Boutiques from './pages/Boutiques'
import RH from './pages/RH'
import Logistics from './pages/Logistics'
import Catalogue from './pages/Catalogue'

// Écran de chargement (utilisé uniquement pour le Suspense global si nécessaire)
const PageLoader = () => (
  <div className="flex w-full h-[50vh] items-center justify-center">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
)

function AppInner() {
  const { locked, unlock } = useSessionTimeout()
  const stock = useStore(state => state.stock)
  const applySenegalSeed = useStore(state => state.applySenegalSeed)

  // Auto-seed si le stock est vide (pour le confort de l'utilisateur)
  useEffect(() => {
    if (stock && stock.length === 0) {
      applySenegalSeed()
    }
  }, [stock, applySenegalSeed])

  return (
    <>
      <PinLock locked={locked} onUnlock={unlock} />
      <CloudSyncManager />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="caisse" element={<Caisse />} />
            <Route path="historique" element={<Historique />} />
            <Route path="achat" element={<Achat />} />
            <Route path="clients" element={<Clients />} />
            <Route path="fournisseurs" element={<Fournisseurs />} />
            <Route path="stock" element={<Stock />} />
            <Route path="inventaire" element={<Inventaire />} />
            <Route path="stats" element={<PrevisionsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="charges" element={<ChargesFixes />} />
            <Route path="depot" element={<Depot />} />
            <Route path="pain" element={<Pain />} />
            <Route path="gaz" element={<Gaz />} />
            <Route path="credit" element={<CreditTelephonique />} />
            <Route path="ventes" element={<Ventes />} />
            <Route path="tresorerie" element={<Treasury />} />
            <Route path="procurement" element={<Procurement />} />
            <Route path="audit" element={<AuditTrail />} />
            <Route path="boutiques" element={<Boutiques />} />
            <Route path="settings" element={<Settings />} />
            <Route path="rh" element={<RH />} />
            <Route path="logistics" element={<Logistics />} />
          </Route>
          <Route path="/catalogue" element={<Catalogue />} />
        </Routes>
      </Suspense>
      <InstallPrompt />
      <Toaster position="top-center" richColors theme="system" />
    </>
  )
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  )
}

export default App

