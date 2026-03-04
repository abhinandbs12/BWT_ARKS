import { cn, formatCurrency, formatDate } from '@/utils/helpers'
import type { UPITransaction } from '@/types'
import { ArrowDownLeft, ArrowUpRight, Bot } from 'lucide-react'
import { CATEGORY_COLORS } from '@/utils/helpers'

interface TransactionItemProps {
  transaction: UPITransaction
  compact?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  gig_income: 'Gig Income',
  salary: 'Salary',
  food: 'Food',
  rent: 'Rent',
  electricity: 'Electricity',
  mobile_recharge: 'Recharge',
  investment: 'Investment',
  insurance: 'Insurance',
  shopping: 'Shopping',
  transport: 'Transport',
  healthcare: 'Healthcare',
  entertainment: 'Entertainment',
  transfer: 'Transfer',
  other: 'Other',
}

export default function TransactionItem({ transaction: tx, compact }: TransactionItemProps) {
  const isCredit = tx.type === 'CREDIT'
  const catColor = CATEGORY_COLORS[tx.category || 'other'] || '#9CA3AF'
  const catLabel = CATEGORY_LABELS[tx.category || 'other'] || 'Other'

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3 border-b border-neutral-border last:border-0',
        'hover:bg-neutral-light/50 transition-colors',
        compact && 'py-2',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white',
          isCredit ? 'bg-success' : 'bg-danger',
        )}
      >
        {isCredit ? (
          <ArrowDownLeft className="w-4 h-4" />
        ) : (
          <ArrowUpRight className="w-4 h-4" />
        )}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-dark truncate">
          {tx.merchantName || tx.description.slice(0, 40)}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{ backgroundColor: `${catColor}20`, color: catColor }}
          >
            {catLabel}
          </span>
          <span className="text-xs text-neutral-gray">
            {formatDate(tx.date, 'relative')}
          </span>
          {tx.isAIProcessed && (
            <span className="badge-ai">
              <Bot className="w-2.5 h-2.5" />
              AI
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p
          className={cn(
            'font-mono font-semibold tabular-nums text-sm',
            isCredit ? 'text-success' : 'text-neutral-dark',
          )}
        >
          {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
        </p>
        {tx.status !== 'SUCCESS' && (
          <span className={cn(
            'text-xs',
            tx.status === 'FAILED' ? 'text-danger' : 'text-warning',
          )}>
            {tx.status}
          </span>
        )}
      </div>
    </div>
  )
}
