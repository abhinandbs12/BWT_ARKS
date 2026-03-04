import { cn } from '@/utils/helpers'

interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'purple'
  suffix?: string
  loading?: boolean
  className?: string
}

const COLOR_MAP = {
  primary: { bg: 'bg-primary-light', text: 'text-primary-dark', icon: 'text-primary' },
  success: { bg: 'bg-success-light', text: 'text-green-700', icon: 'text-success' },
  warning: { bg: 'bg-warning-light', text: 'text-yellow-700', icon: 'text-warning' },
  danger: { bg: 'bg-danger-light', text: 'text-red-700', icon: 'text-danger' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600' },
}

export default function MetricCard({
  label,
  value,
  change,
  icon,
  color = 'primary',
  suffix,
  loading,
  className,
}: MetricCardProps) {
  const colors = COLOR_MAP[color]

  if (loading) {
    return (
      <div className={cn('card', className)}>
        <div className="skeleton h-4 w-24 mb-3 rounded" />
        <div className="skeleton h-8 w-32 mb-2 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    )
  }

  return (
    <div className={cn('card animate-fade-in', className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-neutral-gray font-medium">{label}</p>
        {icon && (
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <div className={colors.icon}>{icon}</div>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <p className="font-mono text-2xl font-bold text-neutral-dark tabular-nums">
          {value}
          {suffix && <span className="text-sm font-sans text-neutral-gray ml-1">{suffix}</span>}
        </p>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={cn(
              'text-xs font-medium',
              change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-neutral-gray',
            )}
          >
            {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}
          </span>
          <span className="text-xs text-neutral-gray">vs last month</span>
        </div>
      )}
    </div>
  )
}
