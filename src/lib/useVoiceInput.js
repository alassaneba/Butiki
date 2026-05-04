/**
 * Hook useVoiceInput — Saisie vocale avec Web Speech API (natif, aucune dépendance)
 * Compatible Chrome, Edge, Safari (Android).
 * Retourne { listening, transcript, startListening, stopListening, supported }
 */
import React, { useState, useRef, useCallback } from 'react'

export function useVoiceInput({ onResult, lang = 'fr-FR' } = {}) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const startListening = useCallback(() => {
    if (!supported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      onResult?.(text)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
    setTranscript('')
  }, [supported, lang, onResult])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, transcript, startListening, stopListening, supported }
}
