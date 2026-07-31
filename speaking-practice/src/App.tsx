import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Topic } from './content/types'
import { t } from './i18n/strings'
import { Notice } from './components/ui'
import { Home } from './screens/Home'
import { Session } from './screens/Session'
import { Debrief } from './screens/Debrief'
import { History } from './screens/History'
import { SettingsScreen } from './screens/SettingsScreen'
import {
  clearEverything,
  loadSessions,
  loadSettings,
  saveSettings,
} from './storage/db'
import type { SessionRecord, Settings } from './storage/types'
import { detectCapabilities } from './voice/support'

type Screen =
  | { name: 'home' }
  | { name: 'session'; topic: Topic }
  | { name: 'debrief'; record: SessionRecord }
  | { name: 'history' }
  | { name: 'settings' }

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [sessions, setSessions] = useState<SessionRecord[]>(() => loadSessions())
  const [online, setOnline] = useState(() => navigator.onLine)

  const caps = useMemo(() => detectCapabilities(), [])
  const s = t(settings.lang)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  // Written mode is forced when the browser cannot transcribe at all, or when
  // we are offline on a browser that needs the network to do it.
  const written = !caps.recognition || !caps.secureContext || !online

  const capabilityNotice = !caps.recognition ? (
    <Notice tone="warn">{s.noRecognition}</Notice>
  ) : !caps.secureContext ? (
    <Notice tone="warn">{s.insecure}</Notice>
  ) : !online ? (
    <Notice tone="warn">{s.offlineWarning}</Notice>
  ) : null

  const goHome = useCallback(() => setScreen({ name: 'home' }), [])

  const handleFinished = useCallback((record: SessionRecord) => {
    setSessions(loadSessions())
    setScreen({ name: 'debrief', record })
  }, [])

  switch (screen.name) {
    case 'session':
      return (
        <Session
          key={screen.topic.id}
          topic={screen.topic}
          settings={settings}
          written={written}
          onFinished={handleFinished}
          onAbort={goHome}
        />
      )

    case 'debrief':
      return (
        <Debrief
          record={screen.record}
          onRestart={goHome}
          onHome={goHome}
        />
      )

    case 'history':
      return (
        <History
          sessions={sessions}
          lang={settings.lang}
          onBack={goHome}
          onOpen={(record) => setScreen({ name: 'debrief', record })}
          onClear={() => {
            void clearEverything().then(() => setSessions([]))
          }}
        />
      )

    case 'settings':
      return (
        <SettingsScreen
          settings={settings}
          onChange={patchSettings}
          onBack={goHome}
        />
      )

    default:
      return (
        <Home
          settings={settings}
          onChange={patchSettings}
          onStart={(topic) => setScreen({ name: 'session', topic })}
          onHistory={() => setScreen({ name: 'history' })}
          onSettings={() => setScreen({ name: 'settings' })}
          capabilityNotice={capabilityNotice}
        />
      )
  }
}
