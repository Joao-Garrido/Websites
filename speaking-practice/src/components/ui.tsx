import type { ReactNode } from 'react'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  className,
  type = 'button',
  ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  ariaLabel?: string
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-35 disabled:pointer-events-none active:scale-[0.98]'
  const variants = {
    primary:
      'bg-sage-400 text-ink-950 hover:bg-sage-300 shadow-[0_0_28px_-6px_rgba(127,191,163,0.5)]',
    secondary: 'surface text-fg hover:border-white/20 hover:bg-white/[0.06]',
    ghost: 'text-fg-dim hover:text-fg hover:bg-white/[0.05]',
    danger: 'text-clay hover:bg-clay/10',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cx(base, variants[variant], className)}
    >
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string; emoji?: string }[]
  value: T
  onChange: (id: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="surface flex gap-1 rounded-full p-1"
    >
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            className={cx(
              'flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all duration-200',
              active
                ? 'bg-sage-400/15 text-sage-300 shadow-[inset_0_0_0_1px_rgba(127,191,163,0.25)]'
                : 'text-fg-dim hover:text-fg',
            )}
          >
            {opt.emoji && <span aria-hidden="true">{opt.emoji} </span>}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-fg-faint">
        {label}
      </span>
      {children}
    </label>
  )
}

export function Select<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; emoji?: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="surface relative rounded-2xl">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full cursor-pointer appearance-none rounded-2xl bg-transparent px-4 py-3 pr-10 text-sm text-fg outline-none"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id} className="bg-ink-850 text-fg">
            {o.emoji ? `${o.emoji}  ${o.label}` : o.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-fg-faint"
      >
        ▾
      </span>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-1 py-3 text-left text-sm text-fg transition-colors hover:text-sage-300"
    >
      <span>{label}</span>
      <span
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-sage-400' : 'bg-white/12',
        )}
      >
        <span
          className={cx(
            'absolute top-1 h-4 w-4 rounded-full bg-ink-950 transition-all duration-200',
            checked ? 'left-6' : 'left-1',
          )}
        />
      </span>
    </button>
  )
}

export function Notice({
  tone = 'info',
  children,
  action,
}: {
  tone?: 'info' | 'warn'
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      className={cx(
        'flex flex-col gap-3 rounded-2xl border p-4 text-sm leading-relaxed sm:flex-row sm:items-center sm:justify-between',
        tone === 'warn'
          ? 'border-amber-warm/25 bg-amber-warm/[0.07] text-amber-warm'
          : 'border-white/8 bg-white/[0.03] text-fg-dim',
      )}
    >
      <p className="flex-1">{children}</p>
      {action}
    </div>
  )
}
