import { Fragment } from 'react'
import { fillerRanges } from '../analysis/fillers'
import type { Lang } from '../content/types'

/** Renders the transcript with filler words highlighted in place. */
export function HighlightedText({ text, lang }: { text: string; lang: Lang }) {
  if (!text.trim()) return null
  const ranges = fillerRanges(text, lang)
  if (!ranges.length) return <>{text}</>

  const nodes: React.ReactNode[] = []
  let cursor = 0
  ranges.forEach((r, i) => {
    if (r.start > cursor) nodes.push(<Fragment key={`t${i}`}>{text.slice(cursor, r.start)}</Fragment>)
    nodes.push(
      <mark
        key={`m${i}`}
        className="rounded bg-amber-warm/15 px-0.5 text-amber-warm"
      >
        {text.slice(r.start, r.end)}
      </mark>,
    )
    cursor = r.end
  })
  if (cursor < text.length) nodes.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>)
  return <>{nodes}</>
}

export function LiveTranscript({
  transcript,
  interim,
}: {
  transcript: string
  interim: string
}) {
  const empty = !transcript && !interim
  return (
    <div
      aria-live="polite"
      className="max-h-40 w-full overflow-y-auto rounded-2xl border border-white/6 bg-white/[0.02] p-4 text-sm leading-relaxed"
    >
      {empty ? (
        <span className="text-fg-faint">…</span>
      ) : (
        <p className="text-fg-dim">
          {transcript}
          {interim && <span className="text-fg-faint"> {interim}</span>}
        </p>
      )}
    </div>
  )
}
