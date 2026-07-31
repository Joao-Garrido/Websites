import { useCallback, useEffect, useRef, useState } from 'react'
import type { EnergySample } from '../analysis/pauses'
import { isSilentFor, noiseFloor } from '../analysis/pauses'
import { combineMetrics } from '../analysis/metrics'
import { getMode, getPersona, pack } from '../content'
import type { Lang, ModeId, PersonaId, Topic } from '../content/types'
import type { SessionRecord, Settings, Turn } from '../storage/types'
import { loadRecentProbeKeys, pushRecentProbeKeys, putAudio, saveSession } from '../storage/db'
import { useRecorder } from '../voice/useRecorder'
import { useSpeechRecognition } from '../voice/useSpeechRecognition'
import { useSpeechSynthesis } from '../voice/useSpeechSynthesis'
import { makeRng, pick } from './random'
import { selectQuestion, type Question } from './probeSelector'

export type Phase = 'idle' | 'asking' | 'listening' | 'thinking' | 'done'

interface AnswerPart {
  text: string
  energy: EnergySample[]
  durationMs: number
}

export interface UseSessionArgs {
  topic: Topic
  lang: Lang
  mode: ModeId
  personaId: PersonaId
  settings: Settings
  /** Force written mode (no recognition available, or user chose it). */
  written: boolean
}

export interface SessionState {
  phase: Phase
  question: Question | null
  turnIndex: number
  totalTurns: number
  transcript: string
  interim: string
  level: number
  micError: string | null
  /** True once the microphone has proved unusable — callers should fall back. */
  voiceUnavailable: boolean
  elapsedMs: number
  turns: Turn[]
  begin: () => Promise<void>
  finishTurn: (typedText?: string) => Promise<void>
  end: () => Promise<SessionRecord | null>
  record: SessionRecord | null
}

export function useSession(args: UseSessionArgs): SessionState {
  const { topic, lang, mode, personaId, settings, written } = args
  const modeDef = getMode(mode)
  const persona = getPersona(modeDef.usesPersona ? personaId : defaultPersonaFor(mode))
  const totalTurns = modeDef.turns

  const [phase, setPhase] = useState<Phase>('idle')
  const [question, setQuestion] = useState<Question | null>(null)
  const [turnIndex, setTurnIndex] = useState(0)
  const [turns, setTurns] = useState<Turn[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [record, setRecord] = useState<SessionRecord | null>(null)
  const [voiceUnavailable, setVoiceUnavailable] = useState(false)

  const rngRef = useRef(makeRng(Date.now() >>> 0))
  const usedKeysRef = useRef<Set<string>>(new Set())
  const recentKeysRef = useRef<Set<string>>(new Set(loadRecentProbeKeys()))
  const partsRef = useRef<AnswerPart[]>([])
  const audioBlobsRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const turnStartRef = useRef(0)
  const finishingRef = useRef(false)

  const recognition = useSpeechRecognition(lang)
  const synthesis = useSpeechSynthesis(lang)
  const recorder = useRecorder(settings.saveAudio && !written)

  // Keep the latest transcript reachable from timers without re-subscribing.
  const transcriptRef = useRef('')
  transcriptRef.current = recognition.transcript

  /** Ask the question for `index`, speaking it when TTS is on. */
  const ask = useCallback(
    async (index: number) => {
      const last = partsRef.current[partsRef.current.length - 1]
      const q = selectQuestion({
        lang,
        topic,
        persona,
        mode,
        turnIndex: index,
        totalTurns,
        ...(last ? { lastAnswer: { text: last.text, durationMs: last.durationMs } } : {}),
        usedKeys: usedKeysRef.current,
        recentKeys: recentKeysRef.current,
        rng: rngRef.current,
      })
      usedKeysRef.current.add(q.key)
      setQuestion(q)
      setTurns((prev) => [...prev, { speaker: 'app', text: q.text, ms: 0 }])
      setPhase('asking')

      await new Promise<void>((resolve) => {
        if (!settings.ttsEnabled || !synthesis.supported) {
          // Give the reader a beat to take the question in.
          window.setTimeout(resolve, 600)
          return
        }
        synthesis.speak(q.text, {
          rate: persona.tts.rate,
          pitch: persona.tts.pitch,
          onEnd: resolve,
        })
      })

      // Start listening for the answer.
      turnStartRef.current = performance.now()
      recognition.reset()
      if (!written) {
        const ok = await recorder.start()
        // No microphone, no permission, no device — whatever the reason, a dead
        // mic must not leave the user staring at a "listening" orb.
        if (ok) recognition.start()
        else setVoiceUnavailable(true)
      }
      setPhase('listening')
    },
    [
      lang,
      mode,
      persona,
      recognition,
      recorder,
      settings.ttsEnabled,
      synthesis,
      topic,
      totalTurns,
      written,
    ],
  )

  const begin = useCallback(async () => {
    startedAtRef.current = Date.now()
    partsRef.current = []
    audioBlobsRef.current = []
    usedKeysRef.current = new Set()
    setTurns([])
    setTurnIndex(0)
    await ask(0)
  }, [ask])

  const finishTurn = useCallback(
    async (typedText?: string) => {
      if (finishingRef.current) return
      finishingRef.current = true
      setPhase('thinking')

      recognition.stop()
      const result = written
        ? { blob: null, energy: [] as EnergySample[], durationMs: performance.now() - turnStartRef.current }
        : await recorder.stop()

      const spoken = [transcriptRef.current, recognition.interim]
        .filter(Boolean)
        .join(' ')
        .trim()
      const text = (typedText ?? spoken).trim()

      partsRef.current.push({
        text,
        energy: result.energy,
        durationMs: result.durationMs,
      })
      if (result.blob) audioBlobsRef.current.push(result.blob)

      setTurns((prev) => [
        ...prev,
        { speaker: 'user', text, ms: Math.round(result.durationMs) },
      ])

      const next = turnIndex + 1
      if (next >= totalTurns) {
        setPhase('done')
        finishingRef.current = false
        return
      }

      // A beat of silence reads as the other person considering what you said.
      const ack = pick(pack(lang).acks, rngRef.current)
      if (settings.ttsEnabled && synthesis.supported && ack && text.length > 0) {
        synthesis.speak(ack, { rate: persona.tts.rate, pitch: persona.tts.pitch })
      }
      await new Promise((r) => window.setTimeout(r, 800))

      setTurnIndex(next)
      await ask(next)
      finishingRef.current = false
    },
    [
      ask,
      lang,
      persona.tts,
      recognition,
      recorder,
      settings.ttsEnabled,
      synthesis,
      totalTurns,
      turnIndex,
      written,
    ],
  )

  const end = useCallback(async (): Promise<SessionRecord | null> => {
    recognition.stop()
    synthesis.cancel()
    if (recorder.recording) await recorder.stop()

    const parts = partsRef.current
    if (!parts.length) return null

    const metrics = combineMetrics(parts, lang)
    const id = `${startedAtRef.current}-${topic.id}`

    let audioKey: string | undefined
    if (audioBlobsRef.current.length) {
      const type = audioBlobsRef.current[0]?.type || 'audio/webm'
      const merged = new Blob(audioBlobsRef.current, { type })
      audioKey = await putAudio(id, merged)
    }

    const rec: SessionRecord = {
      id,
      startedAt: startedAtRef.current,
      lang,
      mode,
      topicId: topic.id,
      topicPrompt: topic.prompt,
      ...(modeDef.usesPersona ? { personaId } : {}),
      turns,
      metrics,
      ...(audioKey ? { audioKey } : {}),
    }

    await saveSession(rec)
    pushRecentProbeKeys([...usedKeysRef.current])
    setRecord(rec)
    return rec
  }, [lang, mode, modeDef.usesPersona, personaId, recognition, recorder, synthesis, topic, turns])

  // Live turn clock.
  useEffect(() => {
    if (phase !== 'listening') return
    const id = window.setInterval(() => {
      setElapsedMs(performance.now() - turnStartRef.current)
    }, 200)
    return () => window.clearInterval(id)
  }, [phase])

  // Auto-end the turn on sustained silence. Uses the audio energy timeline
  // rather than the recogniser's `onend`, which fires unpredictably.
  useEffect(() => {
    if (phase !== 'listening' || written || settings.silenceMs <= 0) return
    const id = window.setInterval(() => {
      const energy = recorder.getEnergy()
      if (energy.length < 20) return
      // Do not cut someone off before they have said anything at all.
      const spokenYet = transcriptRef.current.trim().length > 0
      const elapsed = performance.now() - turnStartRef.current
      if (!spokenYet && elapsed < 8000) return

      const threshold = Math.max(noiseFloor(energy) * 2.2, 0.012)
      if (isSilentFor(energy, settings.silenceMs, threshold)) {
        void finishTurn()
      }
    }, 400)
    return () => window.clearInterval(id)
  }, [finishTurn, phase, recorder, settings.silenceMs, written])

  // Hard cap per turn so a runaway answer still advances.
  useEffect(() => {
    if (phase !== 'listening' || modeDef.turnSeconds <= 0) return
    const id = window.setTimeout(
      () => void finishTurn(),
      modeDef.turnSeconds * 1000,
    )
    return () => window.clearTimeout(id)
  }, [finishTurn, modeDef.turnSeconds, phase])

  return {
    phase,
    question,
    turnIndex,
    totalTurns,
    transcript: recognition.transcript,
    interim: recognition.interim,
    level: recorder.level,
    micError: recorder.error ?? recognition.error,
    voiceUnavailable,
    elapsedMs,
    turns,
    begin,
    finishTurn,
    end,
    record,
  }
}

function defaultPersonaFor(mode: ModeId): PersonaId {
  switch (mode) {
    case 'interview':
      return 'interviewer'
    case 'debate':
      return 'devil'
    case 'story':
      return 'friend'
    default:
      return 'journalist'
  }
}
