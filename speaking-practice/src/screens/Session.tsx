import { useEffect, useRef, useState } from 'react'
import { getMode } from '../content'
import type { Topic } from '../content/types'
import { useSession } from '../engine/useSession'
import { t } from '../i18n/strings'
import { Button, Notice } from '../components/ui'
import { MicOrb } from '../components/MicOrb'
import { LiveTranscript } from '../components/TranscriptPane'
import type { SessionRecord, Settings } from '../storage/types'

export function Session({
  topic,
  settings,
  written,
  onFinished,
  onAbort,
}: {
  topic: Topic
  settings: Settings
  written: boolean
  onFinished: (record: SessionRecord) => void
  onAbort: () => void
}) {
  const s = t(settings.lang)
  const mode = getMode(settings.mode)
  const [typed, setTyped] = useState('')
  const [writtenMode, setWrittenMode] = useState(written)
  const startedRef = useRef(false)
  const endingRef = useRef(false)

  const session = useSession({
    topic,
    lang: settings.lang,
    mode: settings.mode,
    personaId: settings.personaId,
    settings,
    written: writtenMode,
  })

  const { phase, begin, end, voiceUnavailable } = session

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void begin()
  }, [begin])

  // The mic turned out to be unusable mid-session — switch rather than leaving
  // the user talking into a dead microphone.
  useEffect(() => {
    if (voiceUnavailable) setWrittenMode(true)
  }, [voiceUnavailable])

  // When the last turn completes, persist and hand over to the debrief.
  useEffect(() => {
    if (phase !== 'done' || endingRef.current) return
    endingRef.current = true
    void end().then((record) => {
      if (record) onFinished(record)
      else onAbort()
    })
  }, [phase, end, onFinished, onAbort])

  const orbState =
    phase === 'listening'
      ? 'listening'
      : phase === 'asking'
        ? 'speaking'
        : phase === 'thinking'
          ? 'thinking'
          : 'idle'

  const orbLabel =
    phase === 'listening'
      ? s.listening
      : phase === 'asking'
        ? s.speaking
        : phase === 'thinking'
          ? s.thinking
          : s.ready

  const secondsLeft =
    mode.turnSeconds > 0
      ? Math.max(0, Math.ceil(mode.turnSeconds - session.elapsedMs / 1000))
      : null

  const submitTyped = () => {
    const text = typed.trim()
    if (!text) return
    setTyped('')
    void session.finishTurn(text)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between text-sm text-fg-faint">
        <span>{s.turnOf(session.turnIndex + 1, session.totalTurns)}</span>
        <Button variant="ghost" onClick={onAbort} className="px-3 py-1.5 text-xs">
          {s.endSession}
        </Button>
      </header>

      <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-fg-faint">
        {topic.prompt}
      </p>

      <div
        aria-live="polite"
        className="surface min-h-[7.5rem] rounded-3xl p-6 text-center"
      >
        <p className="font-display text-balance text-2xl leading-snug text-fg sm:text-[1.75rem]">
          {session.question?.text ?? '…'}
        </p>
      </div>

      {(session.micError || voiceUnavailable) && (
        <Notice
          tone="warn"
          action={
            !writtenMode ? (
              <Button variant="secondary" onClick={() => setWrittenMode(true)}>
                {s.micDeniedAction}
              </Button>
            ) : undefined
          }
        >
          {session.micError === 'not-allowed' ? s.micDenied : s.micUnavailable}
        </Notice>
      )}

      {!writtenMode ? (
        <>
          <div className="flex flex-col items-center gap-4">
            <MicOrb level={session.level} state={orbState} label={orbLabel} />
            {secondsLeft !== null && phase === 'listening' && (
              <p className="font-display text-lg tabular-nums text-fg-dim">
                {secondsLeft}s
              </p>
            )}
          </div>

          <LiveTranscript
            transcript={session.transcript}
            interim={session.interim}
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              onClick={() => void session.finishTurn()}
              disabled={phase !== 'listening'}
              className="flex-1"
            >
              {s.done}
            </Button>
            <Button variant="ghost" onClick={() => setWrittenMode(true)}>
              {s.typeInstead}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={s.typePlaceholder}
            rows={6}
            disabled={phase !== 'listening'}
            className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm leading-relaxed text-fg outline-none placeholder:text-fg-faint focus:border-sage-400/40"
          />
          <Button
            variant="primary"
            onClick={submitTyped}
            disabled={phase !== 'listening' || !typed.trim()}
          >
            {s.send}
          </Button>
        </div>
      )}
    </div>
  )
}
