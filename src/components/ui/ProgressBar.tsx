import { cn } from '@/utils/helpers'

interface ProgressBarProps {
  value: number          // 0–100
  max?: number
  label?: string
  showValue?: boolean
  color?: string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = true,
  color,
  size = 'md',
  animated = true,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const autoColor =
    color ||
    (pct >= 75 ? '#10B981' : pct >= 50 ? '#3B82F6' : pct >= 25 ? '#F59E0B' : '#EF4444')

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-neutral-gray">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium font-mono text-neutral-dark">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-neutral-border overflow-hidden', heights[size])}>
        <div
          className={cn(heights[size], 'rounded-full', animated && 'transition-all duration-1000 ease-out')}
          style={{ width: `${pct}%`, backgroundColor: autoColor }}
        />
      </div>
    </div>
  )
}
