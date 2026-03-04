import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw, Download, ChevronDown, ChevronUp, Bot, Target,
  CheckSquare, Square, TrendingUp, Star, AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { analyzeTransactions } from '@/services/ollama'
import { calculateCredScore, generateImprovements } from '@/utils/credScore'
import { formatCurrency, getScoreColor } from '@/utils/helpers'
import ScoreGauge from '@/components/ui/ScoreGauge'
import ProgressBar from '@/components/ui/ProgressBar'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'

export default function CredScorePage() {
  const {
    credScore, setCredScore, transactions, isCalculating, setCalculating,
    improvements, setImprovements, toggleImprovement,
  } = useAppStore()
  const [expanded, setExpanded] = useState<string | null>('incomeConsistency')
  const navigate = useNavigate()

  const handleExportPDF = () => {
    if (!credScore) return
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const { score, tier, components, insights, loanEligibility, aiAnalysis } = credScore
    const primaryColor: [number, number, number] = [59, 130, 246]
    const darkColor: [number, number, number] = [17, 24, 39]
    const grayColor: [number, number, number] = [107, 114, 128]
    const pageW = 210
    let y = 20

    // Header
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageW, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('CredIQ Score Report', 20, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 20, 28)
    doc.text(`Last calculated: ${new Date(credScore.calculatedAt).toLocaleString('en-IN')}`, 20, 35)
    y = 52

    // Score summary box
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(15, y - 4, pageW - 30, 28, 3, 3, 'F')
    doc.setTextColor(...darkColor)
    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.text(String(score), 25, y + 16)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...primaryColor)
    doc.text(tier, 55, y + 10)
    if (loanEligibility.eligible) {
      doc.setFontSize(10)
      doc.setTextColor(...grayColor)
      doc.text(`Loan eligible up to ${formatCurrency(loanEligibility.maxAmount)} @ ${loanEligibility.interestRate}% p.a.`, 55, y + 19)
    }
    y += 36

    // AI Analysis
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('AI Financial Analysis', 20, y)
    y += 7
    const aiRows = [
      ['Monthly Avg Income', formatCurrency(aiAnalysis.incomeAnalysis.monthlyAvg)],
      ['Savings Rate', `${Math.round(aiAnalysis.savingsBehavior.savingsRate * 100)}%`],
      ['Income Growth', aiAnalysis.incomeAnalysis.growthTrend],
      ['Primary Platform', aiAnalysis.platformDetection.primaryPlatform],
    ]
    aiRows.forEach(([label, value]) => {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...grayColor)
      doc.text(label, 22, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...darkColor)
      doc.text(value, 90, y)
      y += 6
    })
    y += 4

    // Score Components
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkColor)
    doc.text('Score Components', 20, y)
    y += 7
    const componentNames: Record<string, string> = {
      incomeConsistency: 'Income Consistency',
      paymentBehavior: 'Payment Behavior',
      spendingIntelligence: 'Spending Intelligence',
      savingsBehavior: 'Savings Behavior',
      digitalFootprint: 'Digital Footprint',
    }
    Object.entries(components).forEach(([key, comp]) => {
      const label = componentNames[key] || key
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkColor)
      doc.text(label, 22, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...primaryColor)
      doc.text(`${comp.score}/100 (${comp.weight * 100}% weight)`, 90, y)
      y += 5
      // Bar background
      doc.setFillColor(229, 231, 235)
      doc.rect(22, y, 120, 3, 'F')
      doc.setFillColor(...primaryColor)
      doc.rect(22, y, (comp.score / 100) * 120, 3, 'F')
      y += 7
    })
    y += 4

    // Insights
    if (insights?.length) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkColor)
      doc.text('Key Insights', 20, y)
      y += 7
      insights.slice(0, 4).forEach((ins) => {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...grayColor)
        const lines = doc.splitTextToSize(`• ${ins}`, pageW - 44)
        doc.text(lines, 22, y)
        y += lines.length * 5
      })
    }

    // Footer
    doc.setFillColor(249, 250, 251)
    doc.rect(0, 282, pageW, 15, 'F')
    doc.setFontSize(8)
    doc.setTextColor(...grayColor)
    doc.text('CredIQ — AI-Powered Financial Identity Platform | Team ARKS | BWT Hackathon 2026', 20, 290)

    doc.save(`CredIQ-Score-${score}-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF exported successfully!')
  }

  const handleRecalculate = async () => {
    if (!transactions.length) return toast.error('No transactions loaded.')
    setCalculating(true)
    const toastId = toast.loading('Recalculating with Qwen2.5-Coder:7B…')
    try {
      const ai = await analyzeTransactions(transactions)
      const score = calculateCredScore(transactions, ai)
      setCredScore(score)
      setImprovements(generateImprovements(score.score))
      toast.success(`Score updated: ${score.score}`, { id: toastId })
    } catch {
      toast.error('Recalculation failed.', { id: toastId })
    } finally {
      setCalculating(false)
    }
  }

  if (!credScore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center">
          <Star className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-dark">No CredScore Yet</h2>
          <p className="text-neutral-gray mt-1">Calculate your score from the dashboard first.</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          Go to Dashboard
        </button>
      </div>
    )
  }

  const { score, tier, components, insights, loanEligibility, aiAnalysis } = credScore
  const completedImprovements = improvements.filter((i) => i.completed).length
  const totalPoints = improvements.reduce((s, i) => s + i.pointsGain, 0)
  const earnedPoints = improvements.filter((i) => i.completed).reduce((s, i) => s + i.pointsGain, 0)

  const COMPONENT_DESCRIPTIONS: Record<string, string> = {
    incomeConsistency: 'Regularity and predictability of your income sources',
    paymentBehavior: 'Timeliness of bills, rent, and recurring payments',
    spendingIntelligence: 'Ratio of essential vs discretionary spending',
    savingsBehavior: 'Monthly savings rate and investment activity',
    digitalFootprint: 'Breadth of digital financial transactions',
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-gray">
        <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/dashboard')}>
          Dashboard
        </span>
        <span className="mx-2">›</span>
        <span className="text-neutral-dark font-medium">CredScore Details</span>
      </nav>

      {/* Header card */}
      <div className="card bg-score-gradient text-white">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreGauge score={score} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold">{score} — {tier}</h1>
            <p className="text-blue-200 mt-1">
              Last updated: {new Date(credScore.calculatedAt).toLocaleString('en-IN')}
            </p>
            {loanEligibility.eligible && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                <span className="text-sm">Eligible for loan up to</span>
                <span className="font-bold font-mono text-lg">
                  {formatCurrency(loanEligibility.maxAmount)}
                </span>
                <span className="text-blue-200 text-sm">@ {loanEligibility.interestRate}% p.a.</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRecalculate}
              disabled={isCalculating}
              className="btn bg-white/20 text-white border border-white/30 hover:bg-white/30 px-4 py-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
              Recalculate
            </button>
            <button onClick={handleExportPDF} className="btn bg-white/20 text-white border border-white/30 hover:bg-white/30 px-4 py-2 text-sm">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* AI Analysis summary */}
      <div className="card border-l-4 border-purple-500">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg shrink-0">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-neutral-dark">Qwen2.5-Coder:7B Analysis Summary</h3>
              <span className="badge-ai">AI</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-neutral-gray">Avg Monthly Income</span>
                <p className="font-semibold font-mono">
                  {formatCurrency(aiAnalysis.incomeAnalysis.monthlyAvg)}
                </p>
              </div>
              <div>
                <span className="text-neutral-gray">Platform Detected</span>
                <p className="font-semibold">{aiAnalysis.platformDetection.primaryPlatform}</p>
              </div>
              <div>
                <span className="text-neutral-gray">Income Growth</span>
                <p className="font-semibold text-success">{aiAnalysis.incomeAnalysis.growthTrend}</p>
              </div>
              <div>
                <span className="text-neutral-gray">Savings Rate</span>
                <p className="font-semibold font-mono">
                  {Math.round(aiAnalysis.savingsBehavior.savingsRate * 100)}%
                </p>
              </div>
            </div>
            {aiAnalysis.riskFlags.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-warning text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Risk Flags: {aiAnalysis.riskFlags.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-neutral-dark">Key Insights</h3>
          <div className="grid gap-3">
            {insights.map((ins, i) => (
              <div
                key={i}
                className={
                  ins.type === 'positive'
                    ? 'alert-success'
                    : ins.type === 'warning'
                    ? 'alert-warning'
                    : 'alert-info'
                }
              >
                <TrendingUp className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-neutral-dark">{ins.title}</p>
                  <p className="text-xs text-neutral-gray mt-0.5">{ins.description}</p>
                </div>
                {ins.pointsImpact !== 0 && (
                  <span
                    className={`ml-auto text-sm font-bold font-mono ${
                      ins.pointsImpact > 0 ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {ins.pointsImpact > 0 ? '+' : ''}{ins.pointsImpact}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score components — expandable */}
      <div className="space-y-3">
        <h3 className="font-semibold text-neutral-dark">Score Breakdown</h3>
        {Object.entries(components).map(([key, comp]) => (
          <div key={key} className="card p-0 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === key ? null : key)}
              className="w-full flex items-center gap-4 p-5 hover:bg-neutral-light/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-neutral-dark">
                    {comp.label}
                    <span className="ml-2 text-xs text-neutral-gray font-normal">
                      ({comp.weight}% weight)
                    </span>
                  </span>
                  <span
                    className="font-mono font-bold text-lg"
                    style={{ color: getScoreColor(comp.score * 8.5 + 300) }}
                  >
                    {comp.score}/100
                  </span>
                </div>
                <ProgressBar value={comp.score} showValue={false} />
              </div>
              <div className="text-neutral-gray shrink-0">
                {expanded === key ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {expanded === key && (
              <div className="px-5 pb-5 border-t border-neutral-border space-y-4 animate-fade-in">
                <p className="text-sm text-neutral-gray">{COMPONENT_DESCRIPTIONS[key] || comp.description}</p>

                {/* AI sub-metrics */}
                {key === 'incomeConsistency' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Monthly Avg', value: formatCurrency(aiAnalysis.incomeAnalysis.monthlyAvg) },
                      { label: 'Consistency', value: `${aiAnalysis.incomeAnalysis.consistencyScore}%` },
                      { label: 'Variance', value: `${aiAnalysis.incomeAnalysis.variance}%` },
                      { label: 'Growth', value: aiAnalysis.incomeAnalysis.growthTrend },
                      { label: 'Platform', value: aiAnalysis.platformDetection.primaryPlatform },
                      { label: 'Pay Cycle', value: aiAnalysis.incomeAnalysis.paymentCycle },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-neutral-light rounded-lg p-3">
                        <p className="text-xs text-neutral-gray mb-0.5">{label}</p>
                        <p className="text-sm font-medium text-neutral-dark font-mono">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {key === 'savingsBehavior' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Monthly Savings', value: formatCurrency(aiAnalysis.savingsBehavior.monthlySavings) },
                      { label: 'Savings Rate', value: `${Math.round(aiAnalysis.savingsBehavior.savingsRate * 100)}%` },
                      { label: 'Consistent?', value: aiAnalysis.savingsBehavior.consistentSaving ? 'Yes ✓' : 'No ✗' },
                      { label: 'Savings Score', value: `${aiAnalysis.savingsBehavior.savingsScore}/100` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-neutral-light rounded-lg p-3">
                        <p className="text-xs text-neutral-gray mb-0.5">{label}</p>
                        <p className="text-sm font-medium text-neutral-dark font-mono">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-neutral-dark mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    How to improve (+{comp.improvements.reduce((_: number, __: string, i: number) => (i < 2 ? 10 : 5), 0)} pts possible):
                  </p>
                  <ul className="space-y-1.5">
                    {comp.improvements.map((imp: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-gray">
                        <span className="text-primary mt-0.5">→</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Improvement roadmap */}
      {improvements.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-dark">
              Your Path to {Math.min(850, score + totalPoints)}+ Score
            </h3>
            <span className="text-sm text-neutral-gray">
              {completedImprovements}/{improvements.length} done
            </span>
          </div>

          <ProgressBar
            value={earnedPoints}
            max={totalPoints}
            label={`+${earnedPoints} of +${totalPoints} points earned`}
            className="mb-5"
          />

          <div className="space-y-3">
            {improvements.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleImprovement(item.id)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-light cursor-pointer transition-colors"
              >
                {item.completed ? (
                  <CheckSquare className="w-5 h-5 text-success shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-neutral-gray shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.completed ? 'line-through text-neutral-gray' : 'text-neutral-dark'}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-neutral-gray mt-0.5">{item.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${item.difficulty === 'easy' ? 'badge-success' : item.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'}`}>
                      {item.difficulty}
                    </span>
                    <span className="text-xs text-neutral-gray">{item.timeframe}</span>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-success shrink-0">
                  +{item.pointsGain}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
