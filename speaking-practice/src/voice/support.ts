/** Feature detection done once at boot, so the UI can adapt rather than break. */

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionLike
  available?: (opts: {
    langs: string[]
    processLocally?: boolean
  }) => Promise<string>
  install?: (opts: { langs: string[] }) => Promise<boolean>
}

export interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  processLocally?: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
  onspeechstart: (() => void) | null
}

export interface SpeechRecognitionEventLike {
  resultIndex: number
  results: {
    length: number
    [i: number]: {
      isFinal: boolean
      length: number
      [j: number]: { transcript: string; confidence: number }
    }
  }
}

export function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface Capabilities {
  recognition: boolean
  synthesis: boolean
  recorder: boolean
  /** True on browsers where `continuous` is honoured. */
  continuousRecognition: boolean
  secureContext: boolean
  isSafari: boolean
  isAndroid: boolean
}

export function detectCapabilities(): Capabilities {
  if (typeof window === 'undefined') {
    return {
      recognition: false,
      synthesis: false,
      recorder: false,
      continuousRecognition: false,
      secureContext: false,
      isSafari: false,
      isAndroid: false,
    }
  }

  const ua = navigator.userAgent
  const isAndroid = /Android/i.test(ua)
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua)

  return {
    recognition: getRecognitionCtor() !== null,
    synthesis: typeof window.speechSynthesis !== 'undefined',
    recorder:
      typeof MediaRecorder !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function',
    // Chrome on Android, Samsung Internet and Opera Android ignore `continuous`
    // and return a single result. We rely on the restart loop there instead.
    continuousRecognition: !isAndroid,
    secureContext: window.isSecureContext,
    isSafari,
    isAndroid,
  }
}

export const BCP47: Record<'pt' | 'en', string> = {
  pt: 'pt-PT',
  en: 'en-US',
}

/**
 * Progressive enhancement: Chrome/Edge 139+ on desktop can run recognition
 * fully on-device once the language pack is installed. Absent everywhere else,
 * so every call is guarded.
 */
export async function onDeviceStatus(lang: 'pt' | 'en'): Promise<
  'unavailable' | 'downloadable' | 'available'
> {
  const Ctor = getRecognitionCtor()
  if (!Ctor?.available) return 'unavailable'
  try {
    const result = await Ctor.available({
      langs: [BCP47[lang]],
      processLocally: true,
    })
    if (result === 'available') return 'available'
    if (result === 'downloadable' || result === 'downloading') return 'downloadable'
    return 'unavailable'
  } catch {
    return 'unavailable'
  }
}

export async function installOnDevice(lang: 'pt' | 'en'): Promise<boolean> {
  const Ctor = getRecognitionCtor()
  if (!Ctor?.install) return false
  try {
    return await Ctor.install({ langs: [BCP47[lang]] })
  } catch {
    return false
  }
}
