/**
 * Pause detection from the audio energy timeline.
 *
 * This is the most trustworthy signal we have: it comes from the microphone,
 * not from the speech-to-text service, so it is unaffected by the recogniser
 * swallowing words or cleaning up disfluencies.
 */

export interface EnergySample {
  /** Milliseconds since the turn started. */
  t: number
  /** Root-mean-square amplitude, 0–1. */
  rms: number
}

export interface PauseAnalysis {
  /** Silences longer than the threshold, excluding leading/trailing silence. */
  longPauses: number
  longestPauseMs: number
  /** Milliseconds where the user was actually producing sound. */
  speakingMs: number
  totalMs: number
}

/**
 * Adaptive threshold: take a low percentile of the energy as the noise floor,
 * then treat anything close to it as silence. A fixed threshold fails badly on
 * quiet microphones and noisy rooms alike.
 */
export function noiseFloor(samples: EnergySample[]): number {
  if (!samples.length) return 0
  const sorted = samples.map((s) => s.rms).sort((a, b) => a - b)
  const idx = Math.floor(sorted.length * 0.15)
  return sorted[Math.min(idx, sorted.length - 1)] ?? 0
}

export function analysePauses(
  samples: EnergySample[],
  minPauseMs = 600,
): PauseAnalysis {
  if (samples.length < 2) {
    return { longPauses: 0, longestPauseMs: 0, speakingMs: 0, totalMs: 0 }
  }

  const floor = noiseFloor(samples)
  // Sit clearly above the floor, with an absolute minimum so a silent recording
  // does not register as continuous speech.
  const threshold = Math.max(floor * 2.2, 0.012)

  const totalMs = (samples[samples.length - 1]?.t ?? 0) - (samples[0]?.t ?? 0)

  let speakingMs = 0
  let longPauses = 0
  let longestPauseMs = 0

  let silenceStart: number | null = null
  let seenSpeech = false

  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1]!
    const cur = samples[i]!
    const dt = cur.t - prev.t
    const loud = prev.rms > threshold

    if (loud) {
      speakingMs += dt
      if (silenceStart !== null && seenSpeech) {
        const gap = prev.t - silenceStart
        if (gap >= minPauseMs) {
          longPauses++
          longestPauseMs = Math.max(longestPauseMs, gap)
        }
      }
      silenceStart = null
      seenSpeech = true
    } else if (silenceStart === null) {
      silenceStart = prev.t
    }
  }

  return { longPauses, longestPauseMs, speakingMs, totalMs }
}

/**
 * Rolling check used live to end a turn: true when the last `windowMs` of
 * audio has been below the speaking threshold.
 */
export function isSilentFor(
  samples: EnergySample[],
  windowMs: number,
  threshold: number,
): boolean {
  if (!samples.length) return false
  const last = samples[samples.length - 1]!
  const cutoff = last.t - windowMs
  if (cutoff < 0) return false

  for (let i = samples.length - 1; i >= 0; i--) {
    const s = samples[i]!
    if (s.t < cutoff) break
    if (s.rms > threshold) return false
  }
  return true
}
