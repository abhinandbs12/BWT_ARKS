import { cn, getScoreColor, getScoreGradient, getScoreTier } from '@/utils/helpers'
import { useEffect, useState } from 'react'

interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  showTier?: boolean
  className?: string
}

export default function ScoreGauge({
  score,
  size = 'md',
  animated = true,
  showTier = true,
  className,
}: ScoreGaugeProps) {
  const [displayed, setDisplayed] = useState(animated ? 300 : score)

  useEffect(() => {
    if (!animated) { setDisplayed(score); return }
    let start = 300
    const end = score
    const duration = 2000
    const step = (end - start) / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setDisplayed(end)
        clearInterval(timer)
      } else {
        setDisplayed(Math.round(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [score, animated])

  const pct = ((score - 300) / 550) * 100
  const color = getScoreColor(score)
  const tier = getScoreTier(score)
  const gradient = getScoreGradient(score)

  const sizes = {
    sm: { container: 'w-24 h-24', text: 'text-xl', tier: 'text-xs' },
    md: { container: 'w-36 h-36', text: 'text-3xl', tier: 'text-sm' },
    lg: { container: 'w-48 h-48', text: 'text-5xl', tier: 'text-base' },
  }

  const s = sizes[size]
  const radius = size === 'lg' ? 80 : size === 'md' ? 60 : 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  const svgSize = radius * 2 + 20
  const center = svgSize / 2

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn('relative', s.container)}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="10"
          />
          {/* Score arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn('font-mono font-bold tabular-nums', s.text)}
            style={{ color }}
          >
            {displayed}
          </span>
          <span className="text-xs text-neutral-gray">/850</span>
        </div>
      </div>

      {showTier && (
        <span
          className={cn(
            'px-3 py-1 rounded-full font-semibold text-white',
            s.tier,
            `bg-gradient-to-r ${gradient}`,
          )}
        >
          {tier}
        </span>
      )}
    </div>
  )
}
