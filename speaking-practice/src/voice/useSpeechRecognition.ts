import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lang } from '../content/types'
import {
  BCP47,
  getRecognitionCtor,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from './support'

export type RecognitionError =
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'audio-capture'
  | 'unsupported'
  | 'other'

/** Errors where restarting would just loop forever. */
const FATAL: RecognitionError[] = ['not-allowed', 'audio-capture', 'unsupported']

export interface UseSpeechRecognition {
  supported: boolean
  listening: boolean
  /** Committed text for the current turn. */
  transcript: string
  /** The in-flight guess, useful for live display and filler counting. */
  interim: string
  error: RecognitionError | null
  start: () => void
  stop: () => void
  reset: () => void
}

export function useSpeechRecognition(lang: Lang): UseSpeechRecognition {
  const ctorRef = useRef(getRecognitionCtor())
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const wantListeningRef = useRef(false)
  const restartTimerRef = useRef<number | null>(null)
  const restartCountRef = useRef(0)

  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<RecognitionError | null>(null)

  const supported = ctorRef.current !== null

  const teardown = useCallback(() => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    const rec = recRef.current
    if (rec) {
      rec.onresult = null
      rec.onerror = null
      rec.onend = null
      rec.onstart = null
      try {
        rec.abort()
      } catch {
        // Already stopped — nothing to do.
      }
    }
    recRef.current = null
  }, [])

  const spinUp = useCallback(() => {
    const Ctor = ctorRef.current
    if (!Ctor || !wantListeningRef.current) return

    const rec = new Ctor()
    recRef.current = rec
    rec.lang = BCP47[lang]
    // Harmless where unsupported (Android ignores it); the restart loop below
    // is what actually keeps a long answer intact.
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      setListening(true)
      restartCountRef.current = 0
    }

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (!result) continue
        const alt = result[0]
        if (!alt) continue
        if (result.isFinal) finalChunk += alt.transcript
        else interimChunk += alt.transcript
      }
      if (finalChunk) {
        setTranscript((prev) => (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()))
        setInterim('')
      }
      if (interimChunk) setInterim(interimChunk.trim())
    }

    rec.onerror = (e: { error: string }) => {
      const code = (e.error ?? 'other') as RecognitionError
      // `no-speech` is routine — the user simply paused. Keep going.
      if (code === 'no-speech') return
      const mapped: RecognitionError = (
        ['not-allowed', 'service-not-allowed'] as string[]
      ).includes(code)
        ? 'not-allowed'
        : code === 'network' || code === 'audio-capture'
          ? code
          : 'other'
      setError(mapped)
      if (FATAL.includes(mapped)) {
        wantListeningRef.current = false
        setListening(false)
      }
    }

    rec.onend = () => {
      setListening(false)
      if (!wantListeningRef.current) return
      // The service disconnects on its own constantly — on Android after every
      // single result. Restarting is the normal path, not an error path.
      restartCountRef.current++
      if (restartCountRef.current > 60) {
        wantListeningRef.current = false
        setError('other')
        return
      }
      restartTimerRef.current = window.setTimeout(() => {
        if (wantListeningRef.current) spinUp()
      }, 120)
    }

    try {
      rec.start()
    } catch {
      // start() throws if the previous instance has not fully released yet.
      restartTimerRef.current = window.setTimeout(() => {
        if (wantListeningRef.current) spinUp()
      }, 250)
    }
  }, [lang])

  const start = useCallback(() => {
    if (!ctorRef.current) {
      setError('unsupported')
      return
    }
    setError(null)
    wantListeningRef.current = true
    restartCountRef.current = 0
    teardown()
    spinUp()
  }, [spinUp, teardown])

  const stop = useCallback(() => {
    wantListeningRef.current = false
    const rec = recRef.current
    if (rec) {
      try {
        rec.stop()
      } catch {
        // Ignore — we tear down below regardless.
      }
    }
    setListening(false)
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setInterim('')
    setError(null)
  }, [])

  // Restart cleanly if the language changes mid-session.
  useEffect(() => {
    if (wantListeningRef.current) {
      teardown()
      spinUp()
    }
  }, [lang, spinUp, teardown])

  useEffect(() => {
    return () => {
      wantListeningRef.current = false
      teardown()
    }
  }, [teardown])

  return { supported, listening, transcript, interim, error, start, stop, reset }
}
