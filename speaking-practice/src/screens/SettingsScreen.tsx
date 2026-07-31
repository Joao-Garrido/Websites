import { useEffect, useState } from 'react'
import { t } from '../i18n/strings'
import { Button, Field, Notice, Select, Toggle } from '../components/ui'
import { installOnDevice, onDeviceStatus } from '../voice/support'
import type { Settings } from '../storage/types'

export function SettingsScreen({
  settings,
  onChange,
  onBack,
}: {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onBack: () => void
}) {
  const s = t(settings.lang)
  const [onDevice, setOnDevice] = useState<
    'unavailable' | 'downloadable' | 'available' | 'installing'
  >('unavailable')

  useEffect(() => {
    let cancelled = false
    void onDeviceStatus(settings.lang).then((status) => {
      if (!cancelled) setOnDevice(status)
    })
    return () => {
      cancelled = true
    }
  }, [settings.lang])

  const silenceOptions = [
    { id: '0', label: s.silenceOff },
    { id: '1500', label: s.seconds(1.5) },
    { id: '2500', label: s.seconds(2.5) },
    { id: '4000', label: s.seconds(4) },
  ]

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-7 px-5 py-8 sm:py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-fg">{s.settings}</h1>
        <Button variant="ghost" onClick={onBack} className="px-3 py-2">
          {s.back}
        </Button>
      </header>

      <div className="surface flex flex-col divide-y divide-white/6 rounded-3xl px-5">
        <Toggle
          label={s.voiceOutput}
          checked={settings.ttsEnabled}
          onChange={(v) => onChange({ ttsEnabled: v })}
        />
        <Toggle
          label={s.saveAudioLabel}
          checked={settings.saveAudio}
          onChange={(v) => onChange({ saveAudio: v })}
        />
      </div>

      <Field label={s.silenceLabel}>
        <Select
          value={String(settings.silenceMs)}
          onChange={(id) => onChange({ silenceMs: Number(id) })}
          options={silenceOptions}
        />
      </Field>

      {onDevice !== 'unavailable' && (
        <Notice
          action={
            onDevice === 'downloadable' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setOnDevice('installing')
                  void installOnDevice(settings.lang).then((ok) =>
                    setOnDevice(ok ? 'available' : 'downloadable'),
                  )
                }}
              >
                {s.onDeviceInstall}
              </Button>
            ) : undefined
          }
        >
          {onDevice === 'available'
            ? s.onDeviceReady
            : onDevice === 'installing'
              ? s.onDeviceInstalling
              : s.onDeviceAvailable}
        </Notice>
      )}

      <div className="flex flex-col gap-3 text-sm leading-relaxed text-fg-faint">
        <p>{s.dataNote}</p>
        <p>{s.sttNote}</p>
      </div>
    </div>
  )
}
