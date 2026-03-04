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

    // ── Palette ──────────────────────────────────────────────────────────────
    const C = {
      primary:   [37, 99, 235]  as [number,number,number],
      primaryLt: [219,234,254]  as [number,number,number],
      success:   [22, 163, 74]  as [number,number,number],
      successLt: [220,252,231]  as [number,number,number],
      danger:    [220, 38, 38]  as [number,number,number],
      dangerLt:  [254,226,226]  as [number,number,number],
      warning:   [217,119,  6]  as [number,number,number],
      warningLt: [254,243,199]  as [number,number,number],
      dark:      [15,  23, 42]  as [number,number,number],
      medium:    [71, 85,105]   as [number,number,number],
      light:     [148,163,184]  as [number,number,number],
      border:    [226,232,240]  as [number,number,number],
      bg:        [248,250,252]  as [number,number,number],
      white:     [255,255,255]  as [number,number,number],
    }
    const pageW = 210
    const pageH = 297
    const margin = 14

    // ── Helpers ───────────────────────────────────────────────────────────────
    const sectionTitle = (text: string, y: number) => {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.dark)
      doc.text(text.toUpperCase(), margin, y)
      doc.setDrawColor(...C.primary)
      doc.setLineWidth(0.6)
      doc.line(margin, y + 1.5, pageW - margin, y + 1.5)
      return y + 8
    }
    const row2col = (label: string, value: string, y: number, valueColor = C.dark) => {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.light)
      doc.text(label, margin + 4, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...valueColor)
      doc.text(value, 115, y)
      return y + 6.5
    }
    const scoreBar = (x: number, y: number, w: number, pct: number, color: [number,number,number]) => {
      doc.setFillColor(...C.border)
      doc.roundedRect(x, y, w, 3.5, 1, 1, 'F')
      if (pct > 0) {
        doc.setFillColor(...color)
        doc.roundedRect(x, y, Math.max(1, (pct / 100) * w), 3.5, 1, 1, 'F')
      }
    }
    const addPageFooter = (pageNum: number) => {
      doc.setFillColor(...C.bg)
      doc.rect(0, pageH - 12, pageW, 12, 'F')
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.3)
      doc.line(0, pageH - 12, pageW, pageH - 12)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.light)
      doc.text('CredIQ — AI-Powered Financial Identity  |  Team ARKS  |  BWT Hackathon 2026', margin, pageH - 5)
      doc.text(`Page ${pageNum}`, pageW - margin - 8, pageH - 5)
    }

    // ═══════════════════════════════════════════════════════════════
    //  PAGE 1
    // ═══════════════════════════════════════════════════════════════

    // ── Header banner ─────────────────────────────────────────────
    doc.setFillColor(...C.primary)
    doc.rect(0, 0, pageW, 44, 'F')
    // Decorative circles
    doc.setFillColor(255, 255, 255, 0.06)
    doc.circle(pageW - 18, 8, 22, 'F')
    doc.circle(pageW - 6, 38, 14, 'F')

    doc.setTextColor(...C.white)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('CredIQ Score Report', margin, 17)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(186, 214, 254)
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, 26)
    doc.text(`Calculated: ${new Date(credScore.calculatedAt).toLocaleString('en-IN')}`, margin, 33)

    let y = 54

    // ── Score hero card ───────────────────────────────────────────
    const tierColors: Record<string, [number, number, number]> = {
      Excellent: C.success, Good: C.primary, Fair: C.warning, Poor: C.danger, 'Very Poor': C.danger,
    }
    const tierBg: Record<string, [number, number, number]> = {
      Excellent: C.successLt, Good: C.primaryLt, Fair: C.warningLt, Poor: C.dangerLt, 'Very Poor': C.dangerLt,
    }
    const tColor = tierColors[tier] ?? C.primary
    const tBg    = tierBg[tier]    ?? C.primaryLt

    doc.setFillColor(...C.bg)
    doc.roundedRect(margin, y, pageW - margin * 2, 34, 4, 4, 'F')
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, pageW - margin * 2, 34, 4, 4, 'S')

    // Big score number
    doc.setFontSize(42)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...tColor)
    doc.text(String(score), margin + 8, y + 24)

    // Scale label under score
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.light)
    doc.text('out of 850', margin + 8, y + 30)

    // Vertical divider
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.line(margin + 50, y + 6, margin + 50, y + 28)

    // Tier badge
    doc.setFillColor(...tBg)
    doc.roundedRect(margin + 56, y + 6, 34, 9, 2, 2, 'F')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...tColor)
    doc.text(tier, margin + 73, y + 12.5, { align: 'center' })

    // Loan eligibility
    if (loanEligibility.eligible) {
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.dark)
      doc.text('Loan Eligible', margin + 56, y + 22)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.medium)
      doc.text(`Up to ${formatCurrency(loanEligibility.maxAmount)}  •  ${loanEligibility.interestRate}% p.a.`, margin + 56, y + 28)
    } else {
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.danger)
      doc.text('Not eligible for loans currently', margin + 56, y + 22)
    }

    // Score range bar (300–850)
    const barX = margin + 100
    const barW = pageW - margin - barX - 2
    const fillPct = ((score - 300) / 550) * 100
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.light)
    doc.text('300', barX, y + 12)
    doc.text('850', barX + barW - 2, y + 12, { align: 'right' })
    scoreBar(barX, y + 14, barW, fillPct, tColor)
    doc.setFontSize(7.5)
    doc.setTextColor(...tColor)
    doc.text(`${score}`, barX + Math.max(0, Math.min(barW - 8, (fillPct / 100) * barW - 4)), y + 22, { align: 'center' })

    y += 44

    // ── Score Components ──────────────────────────────────────────
    y = sectionTitle('Score Components', y)
    const compNames: Record<string, string> = {
      incomeConsistency:  'Income Consistency',
      paymentBehavior:    'Payment Behavior',
      spendingIntelligence: 'Spending Intelligence',
      savingsBehavior:    'Savings Behavior',
      digitalFootprint:   'Digital Footprint',
    }
    Object.entries(components).forEach(([key, comp]) => {
      const label = compNames[key] || key
      const barColor = comp.score >= 70 ? C.success : comp.score >= 45 ? C.warning : C.danger
      // Row background
      doc.setFillColor(...C.bg)
      doc.roundedRect(margin, y - 3, pageW - margin * 2, 13, 2, 2, 'F')
      // Label
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.dark)
      doc.text(label, margin + 4, y + 4)
      // Weight tag
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.light)
      doc.text(`${comp.weight}% weight`, margin + 68, y + 4)
      // Score number
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...barColor)
      doc.text(`${comp.score}/100`, pageW - margin - 20, y + 4)
      // Progress bar
      scoreBar(margin + 4, y + 6.5, pageW - margin * 2 - 30, comp.score, barColor)
      y += 16
    })
    y += 4

    // ── AI Financial Snapshot ─────────────────────────────────────
    y = sectionTitle('AI Financial Snapshot', y)
    const snapRows: [string, string][] = [
      ['Monthly Average Income', formatCurrency(aiAnalysis.incomeAnalysis.monthlyAvg)],
      ['Savings Rate',           `${Math.round(aiAnalysis.savingsBehavior.savingsRate * 100)}%`],
      ['Income Growth Trend',    aiAnalysis.incomeAnalysis.growthTrend],
      ['Primary UPI Platform',   aiAnalysis.platformDetection.primaryPlatform],
      ['Payment Cycle',          aiAnalysis.incomeAnalysis.paymentCycle ?? 'N/A'],
      ['Spending Discipline',    `${Math.round(aiAnalysis.spendingIntelligence.spendingDiscipline)}/100`],
    ]
    // 2-column grid
    snapRows.forEach(([label, value], i) => {
      const col = i % 2
      const xOffset = col === 1 ? (pageW - margin * 2) / 2 + margin : margin
      if (col === 0 && i > 0) y += 0
      doc.setFillColor(...(i % 2 === 0 ? C.bg : C.white))
      if (col === 0) {
        doc.setFillColor(...C.bg)
        doc.rect(margin, y - 3, pageW - margin * 2, 8, 'F')
      }
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.light)
      doc.text(label, xOffset + 2, y + 2)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.dark)
      doc.text(value, xOffset + 2, y + 7)
      if (col === 1) y += 13
    })
    y += 8

    addPageFooter(1)

    // ═══════════════════════════════════════════════════════════════
    //  PAGE 2
    // ═══════════════════════════════════════════════════════════════
    doc.addPage()

    // ── Page 2 header strip ───────────────────────────────────────
    doc.setFillColor(...C.dark)
    doc.rect(0, 0, pageW, 20, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.white)
    doc.text('CredIQ Score Report  —  Details & Recommendations', margin, 13)
    y = 30

    // ── Key Insights ──────────────────────────────────────────────
    if (insights?.length) {
      y = sectionTitle('Key Insights', y)
      insights.slice(0, 5).forEach((ins, idx) => {
        const insColor: [number,number,number] = idx < 2 ? C.success : idx < 4 ? C.warning : C.danger
        doc.setFillColor(...(idx % 2 === 0 ? C.bg : C.white))
        doc.rect(margin, y - 3, pageW - margin * 2, 10, 'F')
        // Bullet dot
        doc.setFillColor(...insColor)
        doc.circle(margin + 5, y + 1.5, 1.5, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...C.dark)
        const lines = doc.splitTextToSize(ins, pageW - margin * 2 - 14)
        doc.text(lines, margin + 10, y + 2)
        y += lines.length * 5.5 + 3
      })
      y += 6
    }

    // ── Top Improvements ─────────────────────────────────────────
    y = sectionTitle('Top Actions to Improve Your Score', y)
    const imp = improvements.slice(0, 6)
    if (imp.length === 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...C.light)
      doc.text('No improvement plan available. Calculate your score first.', margin + 4, y + 4)
      y += 12
    } else {
      imp.forEach((action, idx) => {
        doc.setFillColor(...(idx % 2 === 0 ? C.bg : C.white))
        doc.rect(margin, y - 2, pageW - margin * 2, 13, 'F')
        // Priority dot
        const dotColor = action.pointsGain >= 15 ? C.danger : action.pointsGain >= 8 ? C.warning : C.success
        doc.setFillColor(...dotColor)
        doc.circle(margin + 5, y + 4.5, 2, 'F')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...C.dark)
        doc.text(action.title, margin + 11, y + 5)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...C.medium)
        const desc = doc.splitTextToSize(action.description || '', pageW - margin * 2 - 50)
        doc.text(desc, margin + 11, y + 10)
        // Points badge
        doc.setFillColor(...C.primaryLt)
        doc.roundedRect(pageW - margin - 22, y + 1, 22, 8, 2, 2, 'F')
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...C.primary)
        doc.text(`+${action.pointsGain} pts`, pageW - margin - 11, y + 6.5, { align: 'center' })
        y += 16
      })
    }
    y += 6

    // ── Loan Eligibility Panel ────────────────────────────────────
    y = sectionTitle('Loan Eligibility Details', y)
    const panelBg = loanEligibility.eligible ? C.successLt : C.dangerLt
    const panelTxt = loanEligibility.eligible ? C.success : C.danger
    doc.setFillColor(...panelBg)
    doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, 'F')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...panelTxt)
    doc.text(loanEligibility.eligible ? '✓  Eligible for Instant Loan' : '✗  Currently Not Eligible', margin + 6, y + 10)
    if (loanEligibility.eligible) {
      const loanRows: [string, string][] = [
        ['Max Loan Amount', formatCurrency(loanEligibility.maxAmount)],
        ['Interest Rate', `${loanEligibility.interestRate}% p.a.`],
        ['Tenure', '12–36 months'],
      ]
      loanRows.forEach(([label, value], i) => {
        const lx = margin + 6 + i * 62
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...C.medium)
        doc.text(label, lx, y + 19)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...C.dark)
        doc.text(value, lx, y + 24.5)
      })
    } else {
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.medium)
      doc.text(`Minimum score required: 580  •  Your score: ${score}  •  Gap: ${Math.max(0, 580 - score)} points`, margin + 6, y + 19)
    }
    y += 36

    // ── Disclaimer ───────────────────────────────────────────────
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...C.light)
    const disclaimer = doc.splitTextToSize(
      'This report is generated by CredIQ, an AI-powered financial profiling tool developed for the BWT Hackathon 2026 by Team ARKS. The CredScore and loan eligibility assessments are indicative only and should not be construed as formal credit assessments or financial advice.',
      pageW - margin * 2,
    )
    doc.text(disclaimer, margin, y)

    addPageFooter(2)

    doc.save(`CredIQ-Report-${score}-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF report exported!')
  }

  const handleRecalculate = async () => {
    if (!transactions.length) return toast.error('No transactions loaded.')
    setCalculating(true)
    const toastId = toast.loading('Recalculating with Qwen2.5-Coder:14B…')
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
  const remainingPoints = totalPoints - earnedPoints
  const projectedScore = Math.min(850, score + earnedPoints)

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
          <div className="relative">
            <ScoreGauge score={projectedScore} size="lg" />
            {earnedPoints > 0 && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-success text-white text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                +{earnedPoints} projected
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold">
              {projectedScore} — {tier}
              {earnedPoints > 0 && (
                <span className="ml-2 text-lg text-blue-200 font-normal">(was {score})</span>
              )}
            </h1>
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
              <h3 className="font-semibold text-neutral-dark">Qwen2.5-Coder:14B Analysis Summary</h3>
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
            <div>
              <h3 className="font-semibold text-neutral-dark">
                Your Path to {Math.min(850, score + totalPoints)}+ Score
              </h3>
              {earnedPoints > 0 && (
                <p className="text-xs text-success mt-0.5 font-medium">
                  ✓ Projected score: <span className="font-mono font-bold">{projectedScore}</span>
                  {' '}(+{earnedPoints} pts applied)
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-neutral-dark">
                {completedImprovements}/{improvements.length} done
              </span>
              {remainingPoints > 0 && (
                <p className="text-xs text-neutral-gray mt-0.5">+{remainingPoints} pts remaining</p>
              )}
            </div>
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
