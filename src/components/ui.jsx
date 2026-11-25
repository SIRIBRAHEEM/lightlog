// Small design-system components in the shadcn/ui style: copy-paste
// patterns owned by this project, styled with Tailwind tokens from
// tailwind.config.js. No external component dependency.

import { cn } from '../utils.js'

const buttonVariants = {
  default:
    'bg-gradient-to-br from-lamp to-ember text-[#241300] font-extrabold shadow-[0_8px_24px_-6px_rgba(255,150,40,0.55)] hover:brightness-105 active:translate-y-px',
  secondary:
    'bg-panel2 text-cream border border-line font-bold hover:border-lamp/50 hover:text-gold active:translate-y-px',
  ghost:
    'bg-transparent text-muted font-bold hover:text-cream hover:bg-panel2 active:translate-y-px',
}

const buttonSizes = {
  sm: 'h-9 px-3.5 text-sm rounded-xl',
  default: 'h-12 px-6 text-base rounded-2xl',
  lg: 'h-14 px-8 text-lg rounded-2xl',
}

export function Button({ variant = 'default', size = 'default', className, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lamp/70 disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }) {
  return (
    <section
      className={cn(
        'rounded-[1.75rem] border border-line bg-panel shadow-card',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1.5 p-6 pb-3', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return (
    <h2
      className={cn('font-display text-[22px] font-bold leading-tight text-cream', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm leading-relaxed text-muted', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-3', className)} {...props} />
}

const badgeVariants = {
  on: 'bg-mint/15 text-mint border-mint/30',
  off: 'bg-rose/15 text-rose border-rose/30',
  lamp: 'bg-lamp/15 text-gold border-lamp/35',
  muted: 'bg-panel2 text-muted border-line',
}

export function Badge({ variant = 'muted', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-extrabold tracking-wide',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  )
}

export function TabsList({ className, ...props }) {
  return (
    <nav
      className={cn(
        'flex gap-1.5 rounded-full border border-line bg-nightsoft p-1.5',
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ active, className, ...props }) {
  return (
    <button
      className={cn(
        'flex-1 rounded-full px-3 py-2.5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lamp/70 sm:text-base',
        active
          ? 'bg-gradient-to-br from-lamp to-ember text-[#241300] shadow-[0_6px_18px_-4px_rgba(255,150,40,0.55)]'
          : 'text-muted hover:text-cream',
        className
      )}
      aria-pressed={active}
      {...props}
    />
  )
}

export function Label({ className, ...props }) {
  return (
    <label
      className={cn('mb-1.5 block text-[13px] font-bold text-muted', className)}
      {...props}
    />
  )
}

const fieldClasses =
  'w-full rounded-2xl border border-line bg-nightsoft px-3.5 py-3 text-base text-cream transition focus:border-lamp/60 focus:outline-none focus:ring-2 focus:ring-lamp/30'

export function Input({ className, ...props }) {
  return <input className={cn(fieldClasses, className)} {...props} />
}

export function Select({ className, ...props }) {
  return <select className={cn(fieldClasses, className)} {...props} />
}

export function Stat({ value, label, accent }) {
  return (
    <div className="rounded-[1.75rem] border border-line bg-panel p-5 shadow-card">
      <div
        className={cn(
          'font-display text-[34px] font-extrabold leading-none',
          accent ? 'text-gold' : 'text-cream'
        )}
      >
        {value}
      </div>
      <div className="mt-2 text-[13px] font-semibold text-muted">{label}</div>
    </div>
  )
}

// Inline stroke icons (Lucide-style paths, drawn here, no icon dependency)
function Icon({ children, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function ZapIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function BulbIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0 0 12 2z" />
    </Icon>
  )
}

export function PhoneIcon({ className }) {
  return (
    <Icon className={className}>
      <rect x="7" y="2" width="10" height="20" rx="2.5" />
      <path d="M11 18.5h2" />
    </Icon>
  )
}

export function LaptopIcon({ className }) {
  return (
    <Icon className={className}>
      <rect x="4" y="4" width="16" height="11" rx="2" />
      <path d="M2 19h20" />
    </Icon>
  )
}

export function BatteryIcon({ className }) {
  return (
    <Icon className={className}>
      <rect x="2" y="8" width="17" height="9" rx="2.5" />
      <path d="M22 11v3" />
      <path d="M11 9.5 8.5 13h3L9 16.5" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function ClockIcon({ className }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  )
}

export function UndoIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9a7 7 0 0 1 0 14h-3" />
    </Icon>
  )
}

export function PlusIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function PlugIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M9 2v6M15 2v6" />
      <path d="M6 8h12v3a6 6 0 0 1-12 0V8z" />
      <path d="M12 17v5" />
    </Icon>
  )
}

export function TrashIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    </Icon>
  )
}
