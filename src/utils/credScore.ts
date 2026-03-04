import type { UPITransaction, CredScore, ScoreComponents, ImprovementAction, DashboardStats, CategoryData, MonthlyData } from '@/types'
import { getScoreTier } from '@/utils/helpers'
import { CATEGORY_COLORS } from '@/utils/helpers'
import type { AIAnalysisResult } from '@/types'

// ===== Core Score Calculator =====
export function calculateCredScore(
  transactions: UPITransaction[],
  aiAnalysis: AIAnalysisResult,
): CredScore {
  const components = computeComponents(transactions, aiAnalysis)
  const weightedScore = Object.values(components).reduce(
    (sum, c) => sum + (c.score * c.weight) / 100,
    0,
  )
  // Scale to 300–850 range
  const score = Math.round(300 + (weightedScore / 100) * 550)
  const clampedScore = Math.min(850, Math.max(300, score))
  const tier = getScoreTier(clampedScore)

  return {
    score: clampedScore,
    tier,
    calculatedAt: new Date(),
    components,
    insights: generateInsights(components, aiAnalysis),
    loanEligibility: computeLoanEligibility(clampedScore, aiAnalysis.incomeAnalysis.monthlyAvg),
    aiAnalysis,
  }
}

function computeComponents(
  _transactions: UPITransaction[],
  ai: AIAnalysisResult,
): ScoreComponents {
  return {
    incomeConsistency: {
      score: Math.min(100, ai.incomeAnalysis.consistencyScore),
      weight: 35,
      label: 'Income Consistency',
      description: 'How stable and regular your income is over the past months',
      improvements: [
        'Add a secondary income source (+10 pts)',
        'Maintain current consistency for 3 more months (+5 pts)',
        'Register on additional gig platforms (+8 pts)',
      ],
    },
    paymentBehavior: {
      score: Math.min(100, ai.paymentBehavior.billPaymentScore),
      weight: 25,
      label: 'Payment Behavior',
      description: 'Timeliness of bill payments, rent, and recurring obligations',
      improvements: [
        'Set up auto-pay for electricity bill (+15 pts)',
        'Pay bills 3 days before due date (+10 pts)',
        '6 consecutive on-time payments (+8 pts)',
      ],
    },
    spendingIntelligence: {
      score: Math.min(100, ai.spendingIntelligence.spendingDiscipline),
      weight: 20,
      label: 'Spending Intelligence',
      description: 'Balance between essential spending and discretionary expenses',
      improvements: [
        'Reduce food delivery by 20% this month (+8 pts)',
        'Zero impulse purchases in 30 days (+5 pts)',
        'Keep essentials ratio above 70% (+6 pts)',
      ],
    },
    savingsBehavior: {
      score: Math.min(100, ai.savingsBehavior.savingsScore),
      weight: 15,
      label: 'Savings Behavior',
      description: 'Consistency and rate of savings and investment activity',
      improvements: [
        'Start a ₹500/month SIP on Groww (+12 pts)',
        'Maintain 15%+ savings rate for 2 months (+10 pts)',
        'Link an investment app (+5 pts)',
      ],
    },
    digitalFootprint: {
      score: 75,
      weight: 5,
      label: 'Digital Footprint',
      description: 'Breadth and depth of your digital financial activity',
      improvements: [
        'Make 20+ UPI transactions per month (+5 pts)',
        'Use 3+ different payment apps (+3 pts)',
      ],
    },
  }
}

function generateInsights(components: ScoreComponents, ai: AIAnalysisResult) {
  const insights = []

  if (ai.incomeAnalysis.consistencyScore >= 80) {
    insights.push({
      type: 'positive' as const,
      title: 'Strong Income Consistency',
      description: `Your income has been ${ai.incomeAnalysis.consistencyScore}% consistent — well above average gig workers.`,
      pointsImpact: 0,
    })
  }

  if (ai.savingsBehavior.savingsRate < 0.10) {
    insights.push({
      type: 'warning' as const,
      title: 'Low Savings Rate',
      description: 'You are saving less than 10% of income. Even ₹500/month in SIP can improve your score.',
      pointsImpact: -15,
    })
  }

  if (ai.incomeAnalysis.growthTrend.includes('+')) {
    insights.push({
      type: 'positive' as const,
      title: 'Income Growth Detected',
      description: `Qwen AI detected ${ai.incomeAnalysis.growthTrend} income growth — lenders see this very positively.`,
      pointsImpact: 10,
    })
  }

  if (ai.riskFlags.length > 0) {
    insights.push({
      type: 'warning' as const,
      title: `${ai.riskFlags.length} Risk Flag(s) Detected`,
      description: ai.riskFlags.join(', '),
      pointsImpact: -20,
    })
  }

  if (components.paymentBehavior.score >= 85) {
    insights.push({
      type: 'positive' as const,
      title: 'Excellent Bill Payment Record',
      description: 'All bills paid on time. This is your biggest strength for loan approval.',
      pointsImpact: 20,
    })
  }

  return insights
}

function computeLoanEligibility(score: number, monthlyIncome: number) {
  if (score < 550) {
    return {
      eligible: false,
      maxAmount: 0,
      minAmount: 0,
      interestRate: 0,
      tenure: 'N/A',
      reason: 'Score too low. Focus on improving bill payment consistency.',
    }
  }

  const multiplier = score >= 750 ? 3 : score >= 700 ? 2.5 : score >= 650 ? 2 : 1.5
  const rate = score >= 750 ? 12 : score >= 700 ? 14 : score >= 650 ? 16 : 20

  return {
    eligible: true,
    maxAmount: Math.round((monthlyIncome * multiplier) / 1000) * 1000,
    minAmount: 2000,
    interestRate: rate,
    tenure: '3–12 months',
    reason: `Based on ${Math.round(monthlyIncome).toLocaleString('en-IN')} average monthly income and ${score} score`,
  }
}

// ===== Dashboard Stats Builder =====
export function buildDashboardStats(transactions: UPITransaction[]): DashboardStats {
  const credits = transactions.filter((t) => t.type === 'CREDIT' && t.status === 'SUCCESS')
  const debits = transactions.filter((t) => t.type === 'DEBIT' && t.status === 'SUCCESS')

  const totalIncome = credits.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = debits.reduce((s, t) => s + t.amount, 0)
  const totalSavings = Math.max(0, totalIncome - totalExpenses)
  const savingsRate = totalIncome > 0 ? totalSavings / totalIncome : 0

  // Monthly trends
  const monthMap: Record<string, { income: number; expenses: number }> = {}
  transactions.forEach((t) => {
    const key = new Date(t.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    if (!monthMap[key]) monthMap[key] = { income: 0, expenses: 0 }
    if (t.type === 'CREDIT') monthMap[key].income += t.amount
    else monthMap[key].expenses += t.amount
  })
  const monthlyTrend: MonthlyData[] = Object.entries(monthMap)
    .slice(-6)
    .map(([month, d]) => ({
      month,
      income: Math.round(d.income),
      expenses: Math.round(d.expenses),
      savings: Math.max(0, Math.round(d.income - d.expenses)),
    }))

  // Category breakdown
  const catMap: Record<string, number> = {}
  debits.forEach((t) => {
    const cat = t.category || 'other'
    catMap[cat] = (catMap[cat] || 0) + t.amount
  })
  const categoryBreakdown: CategoryData[] = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: CATEGORY_COLORS[name] || '#9CA3AF',
      percentage: totalExpenses > 0 ? Math.round((value / totalExpenses) * 100) : 0,
    }))

  return {
    totalIncome,
    totalExpenses,
    totalSavings,
    savingsRate,
    incomeScore: 85,
    paymentScore: 78,
    spendingScore: 72,
    healthScore: 90,
    monthlyTrend,
    categoryBreakdown,
  }
}

// ===== Improvement Roadmap =====
export function generateImprovements(score: number): ImprovementAction[] {
  const target = score >= 750 ? 800 : score + 38
  const gap = target - score

  const allActions: ImprovementAction[] = [
    {
      id: 'bill_autopay',
      title: 'Set up bill auto-pay',
      description: 'Pay all bills 3 days before due date for 3 consecutive months',
      pointsGain: 15,
      difficulty: 'easy',
      timeframe: '3 months',
      completed: false,
      category: 'paymentBehavior',
    },
    {
      id: 'start_sip',
      title: 'Start ₹500/month SIP',
      description: 'Invest a fixed amount monthly in a mutual fund via Groww or Zerodha',
      pointsGain: 12,
      difficulty: 'easy',
      timeframe: '2 months',
      completed: false,
      category: 'savingsBehavior',
    },
    {
      id: 'reduce_food_delivery',
      title: 'Reduce food delivery by 20%',
      description: 'Cook at home more often to improve your spending discipline score',
      pointsGain: 8,
      difficulty: 'medium',
      timeframe: '1 month',
      completed: false,
      category: 'spendingIntelligence',
    },
    {
      id: 'secondary_income',
      title: 'Add secondary income source',
      description: 'Register on a second gig platform (Swiggy + Zomato) for income diversification',
      pointsGain: 10,
      difficulty: 'medium',
      timeframe: '2 months',
      completed: false,
      category: 'incomeConsistency',
    },
    {
      id: 'consistent_saving',
      title: 'Maintain 15%+ savings rate',
      description: 'Keep savings consistent for 2 consecutive months',
      pointsGain: 10,
      difficulty: 'medium',
      timeframe: '2 months',
      completed: false,
      category: 'savingsBehavior',
    },
    {
      id: 'rent_on_time',
      title: 'Make 3 consecutive rent payments',
      description: 'Pay rent on or before the 1st of each month for 3 months',
      pointsGain: 3,
      difficulty: 'easy',
      timeframe: '3 months',
      completed: false,
      category: 'paymentBehavior',
    },
  ]

  // Prioritize highest impact first, limited to gap
  let remaining = gap
  return allActions
    .sort((a, b) => b.pointsGain - a.pointsGain)
    .filter((a) => {
      if (remaining <= 0) return false
      remaining -= a.pointsGain
      return true
    })
}
