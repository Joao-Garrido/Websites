/**
 * Small seedable RNG (mulberry32) so sessions can be replayed deterministically
 * in tests. Production code seeds from Date.now().
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(items: readonly T[], rng: () => number): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(rng() * items.length)]
}

/**
 * Weighted pick. Items with weight <= 0 are never chosen. Returns undefined if
 * every candidate has non-positive weight.
 */
export function pickWeighted<T>(
  items: readonly T[],
  weightOf: (item: T) => number,
  rng: () => number,
): T | undefined {
  let total = 0
  for (const item of items) {
    const w = weightOf(item)
    if (w > 0) total += w
  }
  if (total <= 0) return undefined

  let r = rng() * total
  for (const item of items) {
    const w = weightOf(item)
    if (w <= 0) continue
    r -= w
    if (r <= 0) return item
  }
  // Floating-point straggler: return the last positive-weight item.
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]!
    if (weightOf(item) > 0) return item
  }
  return undefined
}

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = out[i]!
    const b = out[j]!
    out[i] = b
    out[j] = a
  }
  return out
}
