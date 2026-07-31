import { cx } from './ui'

/**
 * Breathing microphone orb. The scale follows real RMS amplitude, so the user
 * gets immediate proof the mic is picking them up — the single most reassuring
 * thing in a voice UI.
 */
export function MicOrb({
  level,
  state,
  label,
  onClick,
}: {
  level: number
  state: 'idle' | 'listening' | 'speaking' | 'thinking'
  label: string
  onClick?: () => void
}) {
  // RMS is tiny in absolute terms; boost and clamp into a visible range.
  const amp = Math.min(1, Math.max(0, level * 9))
  const scale = state === 'listening' ? 1 + amp * 0.28 : 1

  const ring =
    state === 'listening'
      ? 'border-sage-400/70'
      : state === 'speaking'
        ? 'border-amber-warm/60'
        : 'border-white/12'

  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      {...(onClick ? { onClick, type: 'button' as const, 'aria-label': label } : {})}
      className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52"
    >
      {/* Amplitude halo */}
      <span
        aria-hidden="true"
        className={cx(
          'absolute inset-0 rounded-full transition-transform duration-100 ease-out',
          state === 'listening' ? 'bg-sage-400/12' : 'bg-transparent',
        )}
        style={{ transform: `scale(${scale})` }}
      />
      {/* Slow pulse while the app talks */}
      <span
        aria-hidden="true"
        className={cx(
          'absolute inset-4 rounded-full border transition-colors duration-300',
          ring,
          state === 'speaking' && 'animate-pulse',
        )}
      />
      <span
        aria-hidden="true"
        className="absolute inset-10 rounded-full bg-gradient-to-b from-white/[0.07] to-transparent"
      />
      <span className="relative z-10 text-xs font-medium uppercase tracking-[0.18em] text-fg-dim">
        {label}
      </span>
    </Wrapper>
  )
}
