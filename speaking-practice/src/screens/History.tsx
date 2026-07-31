import { useMemo } from 'react'
import type { Lang } from '../content/types'
import { t } from '../i18n/strings'
import { Button } from '../components/ui'
import { Sparkline, StreakRing } from '../components/MetricTile'
import { computeStreak } from '../storage/db'
import type { SessionRecord } from '../storage/types'

function formatDuration(ms: number, lang: Lang): string {
  const totalMinutes = Math.round(ms / 60_000)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return lang === 'pt' ? `${h}h ${m}min` : `${h}h ${m}m`
}

export function History({
  sessions,
  lang,
  onBack,
  onOpen,
  onClear,
}: {
  sessions: SessionRecord[]
  lang: Lang
  onBack: () => void
  onOpen: (record: SessionRecord) => void
  onClear: () => void
}) {
  const s = t(lang)
  const streak = useMemo(() => computeStreak(sessions), [sessions])

  const totalSpeaking = sessions.reduce(
    (n, session) => n + session.metrics.speakingMs,
    0,
  )

  // Oldest → newest so the sparkline reads left to right. Pace only means
  // something for spoken sessions, so typed ones are left out of that trend.
  const chronological = useMemo(() => [...sessions].reverse(), [sessions])
  const wpmSeries = chronological
    .filter((session) => session.metrics.spoken)
    .map((session) => session.metrics.wpm)
  const fillerSeries = chronological.map((session) => session.metrics.fillersPer100)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-7 px-5 py-8 sm:py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-fg">{s.history}</h1>
        <Button variant="ghost" onClick={onBack} className="px-3 py-2">
          {s.back}
        </Button>
      </header>

      {!sessions.length ? (
        <p className="text-sm text-fg-dim">{s.noSessions}</p>
      ) : (
        <>
          <div className="surface flex items-center gap-5 rounded-3xl p-5">
            <StreakRing days={streak} />
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-fg-faint">{s.streak}</p>
                <p className="font-display text-lg text-fg">{streak}</p>
              </div>
              <div>
                <p className="text-fg-faint">{s.sessionsCount}</p>
                <p className="font-display text-lg text-fg">{sessions.length}</p>
              </div>
              <div className="col-span-2">
                <p className="text-fg-faint">{s.totalTime}</p>
                <p className="font-display text-lg text-fg">
                  {formatDuration(totalSpeaking, lang)}
                </p>
              </div>
            </div>
          </div>

          {sessions.length >= 2 && (
            <section className="surface flex flex-col gap-4 rounded-3xl p-5">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
                {s.trend}
              </p>
              {wpmSeries.length >= 2 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-fg-dim">
                    {lang === 'pt' ? 'Ritmo' : 'Pace'}
                  </span>
                  <Sparkline values={wpmSeries} />
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-fg-dim">
                  {lang === 'pt' ? 'Muletas / 100' : 'Fillers / 100'}
                </span>
                <Sparkline values={fillerSeries} />
              </div>
            </section>
          )}

          <ul className="flex flex-col gap-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  onClick={() => onOpen(session)}
                  className="w-full rounded-2xl border border-white/6 bg-white/[0.02] p-4 text-left transition-colors hover:border-white/15"
                >
                  <p className="text-sm leading-snug text-fg">
                    {session.topicPrompt}
                  </p>
                  <p className="mt-1.5 text-xs text-fg-faint">
                    {new Date(session.startedAt).toLocaleDateString(
                      lang === 'pt' ? 'pt-PT' : 'en-GB',
                      { day: 'numeric', month: 'short' },
                    )}
                    {' · '}
                    {session.metrics.words} {lang === 'pt' ? 'palavras' : 'words'}
                    {session.metrics.spoken && (
                      <>
                        {' · '}
                        {session.metrics.wpm} {lang === 'pt' ? 'ppm' : 'wpm'}
                      </>
                    )}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <Button
            variant="danger"
            className="self-start"
            onClick={() => {
              if (window.confirm(s.deleteAllConfirm)) onClear()
            }}
          >
            {s.deleteAll}
          </Button>
        </>
      )}
    </div>
  )
}
