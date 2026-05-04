import React, { useState, useMemo, useRef } from 'react'
import { useStore } from '../store/useStore'
import { 
  ShoppingBag, Search, Tag, Info, 
  ChevronRight, ArrowLeft, Star, Clock,
  Filter, Heart, Share2, ExternalLink,
  Plus, Minus, ShoppingCart, Send, X,
  CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import clsx from 'clsx'

const formatF = (val) => `${Math.round(val || 0).toLocaleString('fr-FR')} F`

export default function Catalogue() {
  const stock = useStore(state => state.stock || [])
  const config = useStore(state => state.config)
  const activeBoutiqueId = useStore(state => state.activeBoutiqueId)
  
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tous')
  const [cart, setCart] = useState({}) // { productId: quantity }
  const [showCart, setShowCart] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'grid'
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Filtrage par boutique active
  const boutiqueStock = useMemo(() => {
    return stock.filter(s => (s.boutiqueId || 'b1') === activeBoutiqueId)
  }, [stock, activeBoutiqueId])

  const categories = useMemo(() => {
    const cats = ['Tous', ...new Set(boutiqueStock.map(s => s.category).filter(Boolean))]
    return cats
  }, [boutiqueStock])

  // Top Ventes (Simulé par les produits avec le plus de stock ou simplement les 5 premiers)
  const topVentes = useMemo(() => {
    return [...boutiqueStock]
      .filter(p => p.price_sell > 0)
      .sort((a, b) => b.current_stock - a.current_stock)
      .slice(0, 5)
  }, [boutiqueStock])

  const filteredItems = useMemo(() => {
    return boutiqueStock.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = selectedCategory === 'Tous' || item.category === selectedCategory
      return matchSearch && matchCat && item.price_sell > 0
    })
  }, [boutiqueStock, search, selectedCategory])

  // -- Logique Panier --
  const addToCart = (productId) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }))
  }

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[productId] > 1) {
        newCart[productId] -= 1
      } else {
        delete newCart[productId]
      }
      return newCart
    })
  }

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, qty]) => {
      const product = boutiqueStock.find(p => p.id === id)
      return { ...product, qty }
    }).filter(p => p.id)
  }, [cart, boutiqueStock])

  const cartTotal = cartItems.reduce((sum, p) => sum + (p.price_sell * p.qty), 0)
  const cartCount = cartItems.reduce((sum, p) => sum + p.qty, 0)

  const handleSendOrder = () => {
    if (cartItems.length === 0) return

    const whatsapp = config?.boutiqueWhatsApp || ''
    const boutiqueName = config?.boutiqueName || 'votre boutique'
    
    let message = `Bonjour *${boutiqueName}* ! 👋\n\nJe souhaiterais passer une commande :\n\n`
    cartItems.forEach(item => {
      message += `• *${item.qty}x* ${item.name} (${formatF(item.price_sell * item.qty)})\n`
    })
    message += `\n💰 *Total : ${formatF(cartTotal)}*\n\nMerci de me confirmer la disponibilité !`

    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${whatsapp}?text=${encodedMessage}`, '_blank')
  }

  const handleShare = () => {
    const shareData = {
      title: config?.boutiqueName || 'Butiki',
      text: `Découvrez le catalogue digital de ${config?.boutiqueName || 'notre boutique'} ! 🛍️`,
      url: window.location.href,
    }

    if (navigator.share) {
      navigator.share(shareData).catch((err) => {
        console.log('Share error:', err)
        navigator.clipboard.writeText(window.location.href)
        toast.success('Lien copié dans le presse-papier !')
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copié dans le presse-papier !')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090B] font-sans text-zinc-900 dark:text-zinc-100">
      {/* Navbar Premium */}
      <header className="sticky top-0 z-[60] bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20"
          >
            <ShoppingBag size={20} />
          </motion.div>
          <div>
            <h1 className="font-black text-lg tracking-tighter uppercase leading-none">{config?.boutiqueName || 'Butiki'}</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Menu Digital
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={handleShare}
             className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-500 hover:text-primary transition-colors"
           >
              <Share2 size={18}/>
           </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto pb-40">
        {/* Banner Boutique Immersive */}
        <div className="p-6">
           <div className="relative h-56 rounded-[3rem] bg-gradient-to-br from-indigo-600 via-primary to-blue-600 overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute bottom-8 left-8 right-8 text-white">
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex items-center gap-2 mb-3"
                 >
                    <span className="px-3 py-1 bg-emerald-500/90 backdrop-blur-md text-[10px] font-black uppercase rounded-full shadow-lg">Ouvert</span>
                    <div className="flex gap-1 text-amber-400">
                      {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor"/>)}
                    </div>
                 </motion.div>
                 <h2 className="text-3xl font-black mb-1 tracking-tight">Prêt à commander ? 👋</h2>
                 <p className="text-sm font-medium text-white/80">Explorez notre sélection exclusive et recevez vos produits rapidement.</p>
              </div>

              {/* Decoration */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
           </div>
        </div>

        {/* Section Top Ventes (Horizontal Carousel) */}
        {topVentes.length > 0 && selectedCategory === 'Tous' && !search && (
          <div className="mb-10">
             <div className="px-8 flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">🔥 Nos Pépites</h3>
                <span className="text-[10px] font-bold text-primary">VOIR TOUT</span>
             </div>
             <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar">
                {topVentes.map(item => (
                   <motion.div 
                     key={item.id}
                     whileHover={{ y: -5 }}
                     onClick={() => setSelectedProduct(item)}
                     className="w-40 shrink-0 bg-white dark:bg-zinc-900 p-3 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm cursor-pointer"
                   >
                      <div className="w-full h-32 rounded-2xl bg-zinc-50 dark:bg-zinc-800 mb-3 flex items-center justify-center overflow-hidden">
                         {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Tag size={24} className="text-zinc-300" />}
                      </div>
                      <h4 className="font-bold text-[11px] truncate mb-1">{item.name}</h4>
                      <p className="font-black text-xs text-primary">{formatF(item.price_sell)}</p>
                   </motion.div>
                ))}
             </div>
          </div>
        )}

        {/* Barre de Recherche & Filtres & View Switcher */}
        <div className="px-6 mb-8 sticky top-20 z-40 py-2">
           <div className="flex items-center gap-3">
              <div className="relative group flex-1">
                 <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" size={20} />
                 <input 
                   type="text" placeholder="Rechercher une pépite..." 
                   value={search} onChange={e => setSearch(e.target.value)}
                   className="w-full pl-14 pr-6 py-5 bg-white dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] text-sm font-bold shadow-xl shadow-zinc-200/40 dark:shadow-none outline-none focus:ring-4 ring-primary/10 transition-all placeholder:text-zinc-400"
                 />
              </div>
              <button 
                onClick={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
                className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 shadow-lg"
              >
                 {viewMode === 'list' ? <Filter size={20} /> : <Tag size={20} />}
              </button>
           </div>
        </div>

        {/* Catégories Scrollable Premium */}
        <div className="flex gap-3 overflow-x-auto px-6 mb-10 no-scrollbar items-center">
           {categories.map(cat => (
             <motion.button
               whileHover={{ y: -2 }}
               whileTap={{ scale: 0.95 }}
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={clsx(
                 "px-7 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border-2",
                 selectedCategory === cat 
                   ? "bg-primary text-white border-primary shadow-xl shadow-primary/25" 
                   : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-100 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700"
               )}
             >
               {cat}
             </motion.button>
           ))}
        </div>

        {/* Grille de Produits Premium */}
        <div className={clsx(
           "px-6",
           viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "space-y-5"
        )}>
           <AnimatePresence mode="popLayout">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, i) => {
                const qtyInCart = cart[item.id] || 0
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.03 }}
                    key={item.id} 
                    onClick={() => setSelectedProduct(item)}
                    className={clsx(
                      "group relative bg-white dark:bg-zinc-900 border transition-all duration-300 cursor-pointer",
                      viewMode === 'grid' 
                        ? "flex flex-col p-4 rounded-[2rem] gap-3" 
                        : "flex items-center p-5 rounded-[2.5rem] gap-5",
                      qtyInCart > 0 
                        ? "border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/5" 
                        : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm"
                    )}
                  >
                     {/* Image Container */}
                     <div className={clsx(
                        "relative bg-zinc-50 dark:bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-all overflow-hidden shadow-inner rounded-3xl",
                        viewMode === 'grid' ? "w-full aspect-square" : "w-24 h-24"
                     )}>
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                        ) : (
                          <Tag size={viewMode === 'grid' ? 40 : 32} strokeWidth={1.5} />
                        )}
                        
                        {item.current_stock <= 0 && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest -rotate-12">Épuisé</span>
                          </div>
                        )}
                     </div>

                     {/* Details */}
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                           <span className="text-[10px] font-black uppercase text-primary/80 tracking-widest">{item.category || 'Général'}</span>
                        </div>
                        <h3 className={clsx(
                           "font-bold tracking-tight truncate mb-1",
                           viewMode === 'grid' ? "text-sm" : "text-lg"
                        )}>{item.name}</h3>
                        <div className="flex items-baseline gap-2">
                          <p className={clsx(
                             "font-black tracking-tighter text-zinc-900 dark:text-white",
                             viewMode === 'grid' ? "text-lg" : "text-2xl"
                          )}>
                            {formatF(item.price_sell)}
                          </p>
                        </div>
                     </div>

                     {/* Quick Action Button */}
                     <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        {qtyInCart > 0 ? (
                           <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
                              <motion.button whileTap={{ scale: 0.8 }} onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center shadow-sm"><Minus size={14}/></motion.button>
                              <span className="font-black text-xs">{qtyInCart}</span>
                              <motion.button whileTap={{ scale: 0.8 }} onClick={() => addToCart(item.id)} className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center shadow-sm text-primary"><Plus size={14}/></motion.button>
                           </div>
                        ) : (
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={item.current_stock <= 0}
                            onClick={() => addToCart(item.id)}
                            className={clsx(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                              item.current_stock <= 0 ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-300" : "bg-primary text-white shadow-lg shadow-primary/20"
                            )}
                          >
                             <Plus size={20} />
                          </motion.button>
                        )}
                     </div>
                  </motion.div>
                )
              })
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center col-span-2">
                 <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-6">
                    <Search size={40} className="text-zinc-300" />
                 </div>
                 <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Aucune pépite trouvée</p>
              </motion.div>
            )}
           </AnimatePresence>
        </div>
      </main>

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {cartCount > 0 && !showCart && !selectedProduct && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-[70]">
             <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black p-4 pl-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-white/10">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white"><ShoppingCart size={22} /></div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-zinc-900">{cartCount}</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total</p>
                      <p className="text-xl font-black tracking-tighter">{formatF(cartTotal)}</p>
                   </div>
                </div>
                <button onClick={() => setShowCart(true)} className="px-8 py-4 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest">Finaliser</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Drawer */}
      <AnimatePresence>
         {selectedProduct && (
            <>
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100]" />
               <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white dark:bg-zinc-900 rounded-t-[3.5rem] z-[110] overflow-hidden flex flex-col shadow-2xl">
                  <div className="relative h-80 shrink-0">
                     <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        {selectedProduct.image ? <img src={selectedProduct.image} className="w-full h-full object-cover" /> : <Tag size={80} className="text-zinc-300" />}
                     </div>
                     <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-black/20 backdrop-blur-md text-white flex items-center justify-center"><X size={24}/></button>
                  </div>
                  <div className="p-10 flex-1 overflow-y-auto">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full tracking-widest">{selectedProduct.category}</span>
                           <h2 className="text-3xl font-black tracking-tight mt-3">{selectedProduct.name}</h2>
                        </div>
                        <p className="text-3xl font-black text-primary tracking-tighter">{formatF(selectedProduct.price_sell)}</p>
                     </div>
                     <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="flex-1 p-5 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700">
                              <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Disponibilité</p>
                              <p className="font-bold text-sm flex items-center gap-2">
                                 {selectedProduct.current_stock > 0 ? <CheckCircle2 size={16} className="text-emerald-500"/> : <X size={16} className="text-rose-500"/>}
                                 {selectedProduct.current_stock > 0 ? `${selectedProduct.current_stock} en stock` : 'En rupture'}
                              </p>
                           </div>
                           <div className="flex-1 p-5 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700">
                              <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Délai</p>
                              <p className="font-bold text-sm flex items-center gap-2"><Clock size={16} className="text-blue-500"/> ~ 30 min</p>
                           </div>
                        </div>
                        <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10">
                           <h4 className="text-xs font-black uppercase tracking-widest mb-4">Description</h4>
                           <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                              {selectedProduct.description || "Ce produit est soigneusement sélectionné pour vous offrir la meilleure qualité possible. Idéal pour vos besoins quotidiens."}
                           </p>
                        </div>
                     </div>
                  </div>
                  <div className="p-10 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                     {cart[selectedProduct.id] > 0 ? (
                        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                           <button onClick={() => removeFromCart(selectedProduct.id)} className="w-14 h-14 rounded-3xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-rose-500"><Minus size={24}/></button>
                           <span className="flex-1 text-center text-xl font-black">{cart[selectedProduct.id]} article(s)</span>
                           <button onClick={() => addToCart(selectedProduct.id)} className="w-14 h-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"><Plus size={24}/></button>
                        </div>
                     ) : (
                        <button 
                          onClick={() => addToCart(selectedProduct.id)}
                          disabled={selectedProduct.current_stock <= 0}
                          className="w-full py-6 bg-primary text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
                        >
                           Ajouter au panier • {formatF(selectedProduct.price_sell)}
                        </button>
                     )}
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>

      {/* Cart Summary Drawer (Simplified) */}
      <AnimatePresence>
         {showCart && (
           <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCart(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80]" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-[3.5rem] z-[90] overflow-hidden flex flex-col shadow-2xl">
                 <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mt-4 mb-6" />
                 <div className="px-8 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                       <h2 className="text-2xl font-black tracking-tight">Votre Panier 🛍️</h2>
                       <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{cartCount} article(s)</p>
                    </div>
                    <button onClick={() => setShowCart(false)} className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500"><X size={24} /></button>
                 </div>
                 <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                    {cartItems.map(item => (
                       <div key={item.id} className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-3xl">
                          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shrink-0 flex items-center justify-center overflow-hidden">
                             {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Tag size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-sm truncate">{item.name}</h4>
                             <p className="text-xs font-black text-primary">{formatF(item.price_sell)} × {item.qty}</p>
                          </div>
                          <div className="flex items-center gap-1">
                             <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-rose-500"><Minus size={14}/></button>
                             <span className="w-6 text-center font-black text-xs">{item.qty}</span>
                             <button onClick={() => addToCart(item.id)} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-primary"><Plus size={14}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="p-8 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                       <span className="text-sm font-black uppercase tracking-widest text-zinc-400">Total</span>
                       <span className="text-3xl font-black tracking-tighter text-primary">{formatF(cartTotal)}</span>
                    </div>
                    <button onClick={handleSendOrder} className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">Commander sur WhatsApp <Send size={18} /></button>
                 </div>
              </motion.div>
           </>
         )}
      </AnimatePresence>
    </div>
  )
}
