import { useEffect, useState } from 'react'
import { buildReport } from '../analysis/report'
import { topicById } from '../content'
import { t } from '../i18n/strings'
import { Button } from '../components/ui'
import { MetricTile } from '../components/MetricTile'
import { HighlightedText } from '../components/TranscriptPane'
import { getAudio } from '../storage/db'
import type { SessionRecord } from '../storage/types'

export function Debrief({
  record,
  onRestart,
  onHome,
}: {
  record: SessionRecord
  onRestart: () => void
  onHome: () => void
}) {
  const s = t(record.lang)
  const insights = buildReport(record.metrics, record.lang)
  const topic = topicById(record.topicId)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!record.audioKey) return
    let url: string | null = null
    let cancelled = false
    void getAudio(record.audioKey).then((blob) => {
      if (!blob || cancelled) return
      url = URL.createObjectURL(blob)
      setAudioUrl(url)
    })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [record.audioKey])

  const userTurns = record.turns.filter((turn) => turn.speaker === 'user')

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-7 px-5 py-8 sm:py-12">
      <header>
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.2em] text-fg-faint">
          {s.debrief}
        </p>
        <h1 className="mt-2 font-display text-balance text-2xl leading-snug text-fg">
          {record.topicPrompt}
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {insights.map((insight) => (
          <MetricTile key={insight.id} insight={insight} />
        ))}
      </div>

      {audioUrl && (
        <section className="flex flex-col gap-2">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
            {s.listenBack}
          </p>
          <audio controls src={audioUrl} className="w-full" />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
          {s.yourWords}
        </p>
        <div className="flex flex-col gap-4">
          {record.turns.map((turn, i) =>
            turn.speaker === 'app' ? (
              <p key={i} className="text-sm italic leading-relaxed text-fg-faint">
                {turn.text}
              </p>
            ) : (
              <p
                key={i}
                className="border-l-2 border-sage-400/30 pl-4 text-sm leading-relaxed text-fg-dim"
              >
                {turn.text ? (
                  <HighlightedText text={turn.text} lang={record.lang} />
                ) : (
                  <span className="text-fg-faint">—</span>
                )}
              </p>
            ),
          )}
          {!userTurns.length && (
            <p className="text-sm text-fg-faint">—</p>
          )}
        </div>
      </section>

      {topic?.vocab?.length && (
        <section className="flex flex-col gap-2">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
            {s.vocabTitle}
          </p>
          <div className="flex flex-wrap gap-2">
            {topic.vocab.map((word) => (
              <span
                key={word}
                className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-sm text-fg-dim"
              >
                {word}
              </span>
            ))}
          </div>
        </section>
      )}

      {topic?.framework && (
        <section className="flex flex-col gap-2">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
            {s.frameworkTitle}
          </p>
          <p className="text-sm text-fg-dim">{topic.framework}</p>
        </section>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row">
        <Button variant="secondary" onClick={onHome} className="flex-1">
          {s.back}
        </Button>
        <Button variant="primary" onClick={onRestart} className="flex-1">
          {s.newSession}
        </Button>
      </div>
    </div>
  )
}
