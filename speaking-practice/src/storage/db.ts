import { del, get, keys, set } from 'idb-keyval'
import type { SessionRecord, Settings } from './types'
import { DEFAULT_SETTINGS } from './types'

const SETTINGS_KEY = 'falado.settings'
const SESSIONS_KEY = 'falado.sessions'
const RECENT_KEYS = 'falado.recentProbeKeys'
const AUDIO_PREFIX = 'audio:'

/** Keep storage bounded — audio is by far the biggest consumer. */
const MAX_SESSIONS = 60
const MAX_AUDIO = 25
const MAX_RECENT_PROBE_KEYS = 120

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota or private mode — the app still works, it just forgets.
  }
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>(SETTINGS_KEY, {}) }
}

export function saveSettings(settings: Settings): void {
  writeJson(SETTINGS_KEY, settings)
}

export function loadSessions(): SessionRecord[] {
  return readJson<SessionRecord[]>(SESSIONS_KEY, [])
}

export async function saveSession(record: SessionRecord): Promise<void> {
  const sessions = [record, ...loadSessions()].slice(0, MAX_SESSIONS)
  writeJson(SESSIONS_KEY, sessions)

  // Drop the oldest audio blobs beyond the cap, including any orphaned by the
  // session list being trimmed above.
  const live = new Set(
    sessions
      .filter((s) => s.audioKey)
      .slice(0, MAX_AUDIO)
      .map((s) => s.audioKey!),
  )
  try {
    const all = await keys()
    for (const k of all) {
      if (typeof k === 'string' && k.startsWith(AUDIO_PREFIX) && !live.has(k)) {
        await del(k)
      }
    }
  } catch {
    // IndexedDB unavailable — metadata still saved.
  }
}

export async function putAudio(id: string, blob: Blob): Promise<string | undefined> {
  const key = `${AUDIO_PREFIX}${id}`
  try {
    await set(key, blob)
    return key
  } catch {
    return undefined
  }
}

export async function getAudio(key: string): Promise<Blob | undefined> {
  try {
    return await get<Blob>(key)
  } catch {
    return undefined
  }
}

export function loadRecentProbeKeys(): string[] {
  return readJson<string[]>(RECENT_KEYS, [])
}

export function pushRecentProbeKeys(used: string[]): void {
  const merged = [...used, ...loadRecentProbeKeys()]
  const seen = new Set<string>()
  const deduped: string[] = []
  for (const k of merged) {
    if (seen.has(k)) continue
    seen.add(k)
    deduped.push(k)
    if (deduped.length >= MAX_RECENT_PROBE_KEYS) break
  }
  writeJson(RECENT_KEYS, deduped)
}

export async function clearEverything(): Promise<void> {
  localStorage.removeItem(SESSIONS_KEY)
  localStorage.removeItem(RECENT_KEYS)
  try {
    for (const k of await keys()) {
      if (typeof k === 'string' && k.startsWith(AUDIO_PREFIX)) await del(k)
    }
  } catch {
    // Nothing to clear.
  }
}

/** Consecutive days ending today (or yesterday, so a day is not lost mid-morning). */
export function computeStreak(sessions: SessionRecord[]): number {
  if (!sessions.length) return 0
  const days = new Set(
    sessions.map((s) => new Date(s.startedAt).toDateString()),
  )

  const cursor = new Date()
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(cursor.toDateString())) return 0
  }

  let streak = 0
  for (;;) {
    if (!days.has(cursor.toDateString())) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
