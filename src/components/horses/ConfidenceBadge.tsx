import type { ConfidenceLevel } from '@/types'

interface Props {
  level: ConfidenceLevel
  size?: 'sm' | 'md'
}

const CONFIG: Record<ConfidenceLevel, { label: string; className: string; dot: string }> = {
  fort:   { label: 'FORT',   className: 'bg-eq-green-dim  text-eq-green  border border-eq-green/30',  dot: 'bg-eq-green'  },
  moyen:  { label: 'MOYEN',  className: 'bg-eq-amber-dim  text-eq-amber  border border-eq-amber/30',  dot: 'bg-eq-amber'  },
  faible: { label: 'FAIBLE', className: 'bg-eq-red-dim    text-eq-red    border border-eq-red/30',    dot: 'bg-eq-red'    },
}

export function ConfidenceBadge({ level, size = 'md' }: Props) {
  const { label, className, dot } = CONFIG[level]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
    } ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${level === 'fort' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  )
}
