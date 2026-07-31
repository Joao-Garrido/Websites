import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lang } from '../content/types'
import { BCP47 } from './support'

export interface SpeakOptions {
  rate?: number
  pitch?: number
  onEnd?: () => void
}

/** Ordered fallbacks — a pt-BR voice is far better than no voice at all. */
const PREFERRED: Record<Lang, string[]> = {
  pt: ['pt-PT', 'pt-BR', 'pt'],
  en: ['en-GB', 'en-US', 'en'],
}

function chooseVoice(
  voices: SpeechSynthesisVoice[],
  lang: Lang,
): SpeechSynthesisVoice | null {
  for (const tag of PREFERRED[lang]) {
    // Local voices sound better and work offline.
    const local = voices.find(
      (v) => v.lang.replace('_', '-').toLowerCase().startsWith(tag.toLowerCase()) && v.localService,
    )
    if (local) return local
    const any = voices.find((v) =>
      v.lang.replace('_', '-').toLowerCase().startsWith(tag.toLowerCase()),
    )
    if (any) return any
  }
  return null
}

export function useSpeechSynthesis(lang: Lang) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [speaking, setSpeaking] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const supported =
    typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'

  // getVoices() is empty on first call in most browsers; the list arrives async.
  useEffect(() => {
    if (!supported) return
    const load = () => setVoices(window.speechSynthesis.getVoices())
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [supported])

  const voice = chooseVoice(voices, lang)

  const cancel = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported || !enabled || !text.trim()) {
        opts.onEnd?.()
        return
      }
      window.speechSynthesis.cancel()

      const u = new SpeechSynthesisUtterance(text)
      u.lang = BCP47[lang]
      if (voice) u.voice = voice
      u.rate = opts.rate ?? 1
      u.pitch = opts.pitch ?? 1

      let done = false
      const finish = () => {
        if (done) return
        done = true
        setSpeaking(false)
        opts.onEnd?.()
      }
      u.onend = finish
      // Some browsers fire `error` instead of `end` when cancelled or when the
      // voice is unavailable; without this the turn would never advance.
      u.onerror = finish

      utteranceRef.current = u
      setSpeaking(true)
      window.speechSynthesis.speak(u)
    },
    [enabled, lang, supported, voice],
  )

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  return {
    supported,
    speaking,
    speak,
    cancel,
    voice,
    voices,
    enabled,
    setEnabled,
  }
}
