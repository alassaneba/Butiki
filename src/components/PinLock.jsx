import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Lock, Shield, User, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { del } from 'idb-keyval'

const TIMEOUT_KEY = 'butiki-last-activity'

export function useSessionTimeout() {
  const config = useStore(state => state.config)
  const activeUserId = useStore(state => state.activeUserId)
  const setActiveUser = useStore(state => state.setActiveUser)
  const users = useStore(state => state.users)
  const [locked, setLocked] = useState(false)
  const timeoutRef = useRef(null)
  const isLockedRef = useRef(false)

  useEffect(() => { isLockedRef.current = locked }, [locked])

  const startTimer = useCallback((mins) => {
    clearTimeout(timeoutRef.current)
    if (mins <= 0) return
    timeoutRef.current = setTimeout(() => {
      isLockedRef.current = true
      setLocked(true)
    }, mins * 60 * 1000)
  }, [])

  const handleActivity = useCallback(() => {
    if (isLockedRef.current) return 
    localStorage.setItem(TIMEOUT_KEY, Date.now().toString())
    const mins = config?.sessionTimeoutMin || 0
    startTimer(mins)
  }, [config?.sessionTimeoutMin, startTimer])

  // 1. Verrouillage automatique si aucun utilisateur n'est actif
  useEffect(() => {
    const pin = config?.appPin || ''
    const hasUsers = users && users.length > 0
    if (!activeUserId && (pin || hasUsers)) {
      setLocked(true)
      isLockedRef.current = true
    }
  }, [activeUserId, config?.appPin, users])

  // 2. Gestion du timer de session et des événements
  useEffect(() => {
    const pin = config?.appPin || ''
    const mins = config?.sessionTimeoutMin || 0
    const hasUsers = users && users.length > 0

    if (!pin && !hasUsers && !activeUserId) {
      clearTimeout(timeoutRef.current)
      setLocked(false)
      isLockedRef.current = false
      return
    }

    if (activeUserId && mins > 0) {
      const last = parseInt(localStorage.getItem(TIMEOUT_KEY) || '0')
      const elapsed = Date.now() - last
      if (last && elapsed > mins * 60 * 1000) {
        setLocked(true)
        isLockedRef.current = true
        return 
      }
    }

    if (activeUserId) {
      localStorage.setItem(TIMEOUT_KEY, Date.now().toString())
      const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
      events.forEach(e => document.addEventListener(e, handleActivity, { passive: true }))
      startTimer(mins)

      return () => {
        events.forEach(e => document.removeEventListener(e, handleActivity))
        clearTimeout(timeoutRef.current)
      }
    }
  }, [config?.sessionTimeoutMin, config?.appPin, activeUserId, users, handleActivity, startTimer])

  const unlock = useCallback(() => {
    localStorage.setItem(TIMEOUT_KEY, Date.now().toString()) 
    isLockedRef.current = false
    setLocked(false)
    const mins = config?.sessionTimeoutMin || 0
    startTimer(mins)
  }, [config?.sessionTimeoutMin, startTimer])

  return useMemo(() => ({ locked, unlock }), [locked, unlock])
}

export default function PinLock({ locked, onUnlock }) {
  const config = useStore(state => state.config)
  const users = useStore(state => state.users)
  const setActiveUser = useStore(state => state.setActiveUser)
  const logAction = useStore(state => state.logAction)
  const [selectedUser, setSelectedUser] = useState(null)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  
  const pinLength = selectedUser ? (selectedUser.pin?.length || 4) : (config?.appPin?.length || 4)

  useEffect(() => {
    if (!locked) {
      setSelectedUser(null)
      setInput('')
      setError(false)
    }
  }, [locked])

  if (!locked) return null

  const handleDigit = (d) => {
    if (input.length >= 6) return
    const next = input + d
    setInput(next)
    setError(false)

    if (next.length >= pinLength) {
      const targetPin = selectedUser ? selectedUser.pin : config.appPin
      
      setTimeout(() => {
        if (next === targetPin) {
          if (selectedUser) {
            setActiveUser(selectedUser.id)
            logAction('Connexion', `Utilisateur ${selectedUser.name} connecté`)
          }
          onUnlock()
          setInput('')
        } else {
          setShake(true)
          setError(true)
          setInput('')
          setTimeout(() => setShake(false), 500)
        }
      }, 150)
    }
  }

  const handleDel = () => setInput(p => p.slice(0, -1))

  const handleForgotPin = async () => {
    const ok = window.confirm(
      '🔓 Réinitialiser l\'accès ?\n\nCette action peut entraîner la perte de certaines configurations de sécurité.'
    )
    if (!ok) return
    try {
      const { updateConfigField } = useStore.getState()
      updateConfigField('appPin', '')
      updateConfigField('sessionTimeoutMin', 0)
      setActiveUser(null)
      onUnlock()
    } catch {
      await del('butiki-store')
      window.location.reload()
    }
  }

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[999] bg-background flex flex-col items-center justify-center p-6 select-none"
    >
      <AnimatePresence mode="wait">
        {!selectedUser && users.length > 0 ? (
          <motion.div 
            key="user-selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md flex flex-col items-center gap-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black">Butiki</h1>
              <p className="text-muted-foreground">Sélectionnez votre profil pour continuer</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User size={32} className="text-primary" />
                  </div>
                  <span className="font-bold text-lg">{user.name}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">{user.role}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleForgotPin}
              className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors mt-4"
            >
              Problème d'accès ? Réinitialiser
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="pin-input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-8"
          >
            {/* Header */}
            <div className="flex flex-col items-center gap-3">
              {users.length > 0 && (
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ChevronLeft size={16} /> Changer d'utilisateur
                </button>
              )}
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                {selectedUser ? <User size={28} className="text-primary" /> : <Lock size={28} className="text-primary" />}
              </div>
              <h1 className="text-2xl font-black">
                {selectedUser ? selectedUser.name : 'Butiki verrouillé'}
              </h1>
              <p className="text-sm text-muted-foreground">Entrez votre code PIN</p>
            </div>

            {/* Points PIN */}
            <motion.div
              animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex gap-3"
            >
              {Array.from({ length: pinLength }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    i < input.length
                      ? error ? 'bg-destructive border-destructive' : 'bg-primary border-primary'
                      : 'border-border bg-transparent'
                  }`}
                />
              ))}
            </motion.div>

            {error && (
              <p className="text-sm text-destructive font-semibold -mt-4">PIN incorrect. Réessayez.</p>
            )}

            {/* Clavier numérique */}
            <div className="grid grid-cols-3 gap-3 w-64">
              {digits.map((d, i) => {
                if (d === '') return <div key={i} />
                const isDel = d === '⌫'
                return (
                  <button
                    key={i}
                    onClick={() => isDel ? handleDel() : handleDigit(String(d))}
                    className={`h-14 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
                      isDel
                        ? 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        : 'bg-card border border-border hover:bg-secondary shadow-sm'
                    }`}
                  >
                    {d}
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield size={12} /> Données protégées localement
            </p>

            {(!selectedUser || users.length === 0) && (
              <button
                onClick={handleForgotPin}
                className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors"
              >
                PIN oublié ? Réinitialiser l'accès
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
