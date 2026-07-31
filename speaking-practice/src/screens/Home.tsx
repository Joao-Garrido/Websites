import { useMemo, useState } from 'react'
import { CATEGORIES, MODES, PERSONAS, getMode, topicsFor } from '../content'
import type { CategoryId, Lang, ModeId, PersonaId, Topic } from '../content/types'
import { t } from '../i18n/strings'
import { Button, Field, Notice, Segmented, Select } from '../components/ui'
import { TopicReel } from '../components/TopicReel'
import type { Settings } from '../storage/types'

export function Home({
  settings,
  onChange,
  onStart,
  onHistory,
  onSettings,
  capabilityNotice,
}: {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onStart: (topic: Topic) => void
  onHistory: () => void
  onSettings: () => void
  capabilityNotice: React.ReactNode
}) {
  const s = t(settings.lang)
  const mode = getMode(settings.mode)

  const pool = useMemo(
    () => topicsFor(settings.lang, settings.category as CategoryId | 'all'),
    [settings.lang, settings.category],
  )

  const [topic, setTopic] = useState<Topic | null>(() => pool[0] ?? null)
  const [spinToken, setSpinToken] = useState(0)

  // Keep the shown topic valid when language or category changes.
  const poolKey = `${settings.lang}:${settings.category}`
  const [lastKey, setLastKey] = useState(poolKey)
  if (poolKey !== lastKey) {
    setLastKey(poolKey)
    setTopic(pool[Math.floor(Math.random() * pool.length)] ?? null)
  }

  const spin = () => {
    if (!pool.length) return
    let next = pool[Math.floor(Math.random() * pool.length)] ?? null
    // Avoid landing on the same prompt twice in a row.
    if (pool.length > 1 && next?.id === topic?.id) {
      const others = pool.filter((p) => p.id !== topic?.id)
      next = others[Math.floor(Math.random() * others.length)] ?? next
    }
    setTopic(next)
    setSpinToken((n) => n + 1)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-7 px-5 py-8 sm:py-12">
      <header className="flex items-start justify-between">
        <div>
          <p className="font-display text-2xl leading-none text-fg">{s.appName}</p>
          <p className="mt-1 text-sm text-fg-faint">{s.tagline}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={onHistory} className="px-3 py-2">
            {s.history}
          </Button>
          <Button
            variant="ghost"
            onClick={onSettings}
            className="px-3 py-2"
            ariaLabel={s.settings}
          >
            ⚙
          </Button>
        </div>
      </header>

      {capabilityNotice}

      <Segmented
        label={s.language}
        value={settings.lang}
        onChange={(lang) => onChange({ lang: lang as Lang })}
        options={[
          { id: 'pt', label: 'Português' },
          { id: 'en', label: 'English' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={s.mode}>
          <Select
            value={settings.mode}
            onChange={(id) => onChange({ mode: id as ModeId })}
            options={MODES.map((m) => ({
              id: m.id,
              label: m.label[settings.lang],
              emoji: m.emoji,
            }))}
          />
        </Field>

        <Field label={s.category}>
          <Select
            value={settings.category}
            onChange={(id) => onChange({ category: id })}
            options={[
              { id: 'all', label: s.allCategories, emoji: '✳' },
              ...CATEGORIES.map((c) => ({
                id: c.id as string,
                label: c.label[settings.lang],
                emoji: c.emoji,
              })),
            ]}
          />
        </Field>
      </div>

      <p className="-mt-2 text-sm leading-relaxed text-fg-dim">
        {mode.blurb[settings.lang]}
      </p>

      {mode.usesPersona && (
        <Field label={s.persona}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PERSONAS.map((p) => {
              const active = p.id === settings.personaId
              return (
                <button
                  key={p.id}
                  onClick={() => onChange({ personaId: p.id as PersonaId })}
                  aria-pressed={active}
                  className={[
                    'rounded-2xl border p-3 text-left transition-all duration-200',
                    active
                      ? 'border-sage-400/40 bg-sage-400/10'
                      : 'border-white/7 bg-white/[0.02] hover:border-white/15',
                  ].join(' ')}
                >
                  <span aria-hidden="true" className="text-base">
                    {p.emoji}
                  </span>
                  <span className="mt-1 block text-sm text-fg">
                    {p.label[settings.lang]}
                  </span>
                </button>
              )
            })}
          </div>
        </Field>
      )}

      <div className="surface flex-1 rounded-3xl p-6">
        <TopicReel
          topic={topic}
          pool={pool}
          spinToken={spinToken}
          eyebrow={s.ready}
        />
      </div>

      {!pool.length && <Notice tone="warn">—</Notice>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="secondary" onClick={spin} className="flex-1">
          {spinToken === 0 ? s.spin : s.spinAgain}
        </Button>
        <Button
          variant="primary"
          onClick={() => topic && onStart(topic)}
          disabled={!topic}
          className="flex-1"
        >
          {s.start}
        </Button>
      </div>
    </div>
  )
}
