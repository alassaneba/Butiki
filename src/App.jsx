import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Loader2 } from 'lucide-react'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import InstallPrompt from './components/InstallPrompt'
import PinLock, { useSessionTimeout } from './components/PinLock'
import { ErrorBoundary } from './components/ErrorBoundary'
import CloudSyncManager from './components/CloudSyncManager'

// Imports fainéants (Lazy Load) pour le code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Caisse = lazy(() => import('./pages/Caisse'))
const Achat = lazy(() => import('./pages/Achat'))
const Clients = lazy(() => import('./pages/Clients'))
const Fournisseurs = lazy(() => import('./pages/Fournisseurs'))
const Settings = lazy(() => import('./pages/Settings'))
const Stock = lazy(() => import('./pages/Stock'))
const Historique = lazy(() => import('./pages/Historique'))
const Inventaire = lazy(() => import('./pages/Inventaire'))
const Previsions = lazy(() => import('./pages/Previsions'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const ChargesFixes = lazy(() => import('./pages/ChargesFixes'))
const Depot = lazy(() => import('./pages/Depot'))
const Pain = lazy(() => import('./pages/Pain'))
const Gaz = lazy(() => import('./pages/Gaz'))
const CreditTelephonique = lazy(() => import('./pages/CreditTelephonique'))
const Ventes = lazy(() => import('./pages/Ventes'))
const Treasury = lazy(() => import('./pages/Treasury'))
const Procurement = lazy(() => import('./pages/Procurement'))
const AuditTrail = lazy(() => import('./pages/AuditTrail'))
const Boutiques = lazy(() => import('./pages/Boutiques'))
const RH = lazy(() => import('./pages/RH'))
const Logistics = lazy(() => import('./pages/Logistics'))
const Catalogue = lazy(() => import('./pages/Catalogue'))

// Écran de chargement (utilisé uniquement pour le Suspense global si nécessaire)
const PageLoader = () => (
  <div className="flex w-full h-[50vh] items-center justify-center">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
)

function AppInner() {
  const { locked, unlock } = useSessionTimeout()
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
            <Route path="previsions" element={<Previsions />} />
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

