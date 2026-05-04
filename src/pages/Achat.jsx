import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Beef, Flame, Smartphone, ShoppingCart } from 'lucide-react'
import Pain from './Pain'
import Gaz from './Gaz'
import CreditTelephonique from './CreditTelephonique'
import PurchaseOrderModule from '../components/PurchaseOrderModule'

const TABS = [
  { id: 'orders', label: 'Commandes Achat', icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'pain', label: 'Gestion Pain', icon: Beef, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'gaz', label: 'Gestion Gaz', icon: Flame, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'credit', label: 'Crédit Téléphonique', icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
]

export default function Achat() {
  const [activeTab, setActiveTab] = useState('orders')

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tighter uppercase flex items-center gap-2 sm:gap-3">
            <ShoppingBag className="text-primary" size={24} />
            Espace Achats
          </h1>
          <p className="text-ultra-compact text-muted-foreground/60 mt-0.5 ml-1">
            APPROVISIONNEMENTS
          </p>
        </div>

        <nav className="flex bg-muted/30 p-1 rounded-xl border border-border shadow-sm overflow-x-auto max-w-full no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-card text-primary shadow-md border border-border' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon size={14} className={activeTab === tab.id ? tab.color : ''} />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'pain' && <Pain />}
            {activeTab === 'gaz' && <Gaz />}
            {activeTab === 'credit' && <CreditTelephonique />}
            {activeTab === 'orders' && <PurchaseOrderModule />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
