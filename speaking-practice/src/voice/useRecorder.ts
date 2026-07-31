import { useCallback, useRef, useState } from 'react'
import type { EnergySample } from '../analysis/pauses'

export interface RecorderResult {
  blob: Blob | null
  energy: EnergySample[]
  durationMs: number
}

const SAMPLE_INTERVAL_MS = 50 // ~20 Hz

/**
 * Captures the microphone for two purposes at once:
 *  - MediaRecorder, so the user can play themselves back (the single most
 *    useful piece of feedback we can offer);
 *  - an AnalyserNode RMS timeline, which powers the live orb, silence-based
 *    turn ending, and the pause metrics.
 *
 * `saveAudio: false` keeps the analyser but skips MediaRecorder — used on
 * Safari, where running both off one stream is unreliable.
 */
export function useRecorder(saveAudio = true) {
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const energyRef = useRef<EnergySample[]>([])
  const startedAtRef = useRef(0)

  const [level, setLevel] = useState(0)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close().catch(() => undefined)
    ctxRef.current = null
    recorderRef.current = null
    setLevel(0)
  }, [])

  const start = useCallback(async (): Promise<boolean> => {
    setError(null)
    energyRef.current = []
    chunksRef.current = []

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.name : 'mic-failed')
      return false
    }

    streamRef.current = stream
    startedAtRef.current = performance.now()

    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (AudioCtor) {
      const ctx = new AudioCtor()
      ctxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.4
      source.connect(analyser)

      const buffer = new Float32Array(analyser.fftSize)
      let lastSample = 0

      const tick = () => {
        analyser.getFloatTimeDomainData(buffer)
        let sum = 0
        for (let i = 0; i < buffer.length; i++) {
          const v = buffer[i]!
          sum += v * v
        }
        const rms = Math.sqrt(sum / buffer.length)
        setLevel(rms)

        const now = performance.now()
        if (now - lastSample >= SAMPLE_INTERVAL_MS) {
          lastSample = now
          energyRef.current.push({ t: now - startedAtRef.current, rms })
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    if (saveAudio && typeof MediaRecorder !== 'undefined') {
      try {
        const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(
          (m) => MediaRecorder.isTypeSupported(m),
        )
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }
        rec.start(1000)
        recorderRef.current = rec
      } catch {
        // Recording is a bonus; the analyser is what the metrics need.
        recorderRef.current = null
      }
    }

    setRecording(true)
    return true
  }, [saveAudio])

  const stop = useCallback(async (): Promise<RecorderResult> => {
    const durationMs = startedAtRef.current
      ? performance.now() - startedAtRef.current
      : 0
    const energy = energyRef.current.slice()

    const rec = recorderRef.current
    let blob: Blob | null = null
    if (rec && rec.state !== 'inactive') {
      blob = await new Promise<Blob | null>((resolve) => {
        rec.onstop = () => {
          resolve(
            chunksRef.current.length
              ? new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
              : null,
          )
        }
        try {
          rec.stop()
        } catch {
          resolve(null)
        }
      })
    }

    cleanup()
    setRecording(false)
    return { blob, energy, durationMs }
  }, [cleanup])

  /** Live energy timeline, for silence detection while the turn is running. */
  const getEnergy = useCallback(() => energyRef.current, [])

  return { start, stop, level, recording, error, getEnergy }
}
