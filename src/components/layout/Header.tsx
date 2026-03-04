import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, Search, TrendingUp, ShieldAlert, FileText, Star, Info, CheckCheck } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useLocation, useNavigate } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/credscore': 'CredScore Details',
  '/scamshield': 'ScamShield',
  '/transactions': 'Transactions',
  '/loans': 'Loan Marketplace',
  '/automations': 'Automations',
}

interface Notification {
  id: string
  icon: React.ElementType
  color: string
  bg: string
  title: string
  desc: string
  time: string
  link?: string
  read: boolean
}

export default function Header() {
  const { sidebarOpen, setSidebarOpen, credScore, transactions, scamsBlocked, ollamaConnected } = useAppStore()
  const location = useLocation()
  const navigate = useNavigate()
  const title = PAGE_TITLES[location.pathname] || 'CredIQ'
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Build contextual notifications from app state
  const notifications: Notification[] = []

  if (credScore) {
    notifications.push({
      id: 'score',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary-light',
      title: `CredScore: ${credScore.score} — ${credScore.tier}`,
      desc: credScore.loanEligibility.eligible
        ? `Eligible for loans up to ₹${credScore.loanEligibility.maxAmount.toLocaleString('en-IN')} @ ${credScore.loanEligibility.interestRate}% p.a.`
        : 'Improve your score to unlock loan offers.',
      time: new Date(credScore.calculatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      link: '/credscore',
      read: false,
    })
  } else {
    notifications.push({
      id: 'no-score',
      icon: Star,
      color: 'text-warning',
      bg: 'bg-warning-light',
      title: 'Calculate your CredScore',
      desc: 'Upload a UPI CSV and hit Calculate Score on the Dashboard.',
      time: 'Action needed',
      link: '/dashboard',
      read: false,
    })
  }

  if (transactions.length > 0) {
    notifications.push({
      id: 'tx',
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      title: `${transactions.length} transactions loaded`,
      desc: 'Your UPI data is ready for analysis.',
      time: 'Today',
      link: '/transactions',
      read: false,
    })
  } else {
    notifications.push({
      id: 'no-tx',
      icon: FileText,
      color: 'text-neutral-gray',
      bg: 'bg-neutral-100',
      title: 'No transactions yet',
      desc: 'Upload a UPI CSV or PDF to get started.',
      time: 'Pending',
      link: '/transactions',
      read: false,
    })
  }

  if (scamsBlocked > 0) {
    notifications.push({
      id: 'scam',
      icon: ShieldAlert,
      color: 'text-danger',
      bg: 'bg-danger-light',
      title: `${scamsBlocked} scam${scamsBlocked > 1 ? 's' : ''} blocked`,
      desc: 'ScamShield has protected you from fraudulent contacts.',
      time: 'Recent',
      link: '/scamshield',
      read: false,
    })
  }

  notifications.push({
    id: 'ollama',
    icon: Info,
    color: ollamaConnected ? 'text-success' : 'text-neutral-gray',
    bg: ollamaConnected ? 'bg-success-light' : 'bg-neutral-100',
    title: ollamaConnected ? 'AI Engine connected' : 'AI Engine offline',
    desc: ollamaConnected
      ? 'Qwen2.5-Coder:14B is running locally via Ollama.'
      : 'Ollama not detected — fallback scoring is active.',
    time: 'System',
    read: false,
  })

  const unread = notifications.filter((n) => !readIds.has(n.id))
  const unreadCount = unread.length

  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)))

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-neutral-border h-16 flex items-center px-4 md:px-6 gap-4">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 rounded-md text-neutral-gray hover:text-neutral-dark hover:bg-neutral-light transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="font-semibold text-neutral-dark text-lg hidden sm:block">{title}</h1>

      <div className="flex-1 max-w-sm hidden md:block relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-gray" />
        <input type="search" placeholder="Search transactions, reports…" className="input pl-9 h-9 text-sm" />
      </div>

      <div className="flex-1 md:hidden" />

      {/* Notification bell */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative p-2 rounded-md text-neutral-gray hover:text-neutral-dark hover:bg-neutral-light transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center px-0.5">
              {unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-2xl border border-neutral-border z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-border">
              <h3 className="font-semibold text-neutral-dark text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-neutral-border">
              {notifications.map((n) => {
                const isRead = readIds.has(n.id)
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setReadIds((prev) => new Set([...prev, n.id]))
                      if (n.link) { navigate(n.link); setOpen(false) }
                    }}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-light transition-colors ${!isRead ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${n.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <n.icon className={`w-4 h-4 ${n.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium text-neutral-dark leading-tight ${!isRead ? 'font-semibold' : ''}`}>{n.title}</p>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs text-neutral-gray mt-0.5 leading-snug">{n.desc}</p>
                      <p className="text-xs text-neutral-gray/60 mt-1">{n.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
        <span>Team ARKS</span>
        <span className="text-purple-400">·</span>
        <span>BWT 2026</span>
      </div>
    </header>
  )
}
