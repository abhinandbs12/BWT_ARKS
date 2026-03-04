import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  User,
  CredScore,
  UPITransaction,
  DashboardStats,
  ScamReport,
  LoanOffer,
  ImprovementAction,
} from '@/types'

// ===== App Store =====
interface AppStore {
  // Auth
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (v: boolean) => void
  logout: () => void

  // CredScore
  credScore: CredScore | null
  isCalculating: boolean
  setCredScore: (score: CredScore) => void
  setCalculating: (v: boolean) => void

  // Transactions
  transactions: UPITransaction[]
  setTransactions: (tx: UPITransaction[]) => void
  addTransactions: (tx: UPITransaction[]) => void

  // Dashboard stats
  dashboardStats: DashboardStats | null
  setDashboardStats: (stats: DashboardStats) => void

  // Scam shield
  scamReports: ScamReport[]
  scamsBlocked: number
  setScamReports: (reports: ScamReport[]) => void
  incrementScamsBlocked: () => void

  // Loans
  loanOffers: LoanOffer[]
  setLoanOffers: (offers: LoanOffer[]) => void

  // Improvements
  improvements: ImprovementAction[]
  setImprovements: (items: ImprovementAction[]) => void
  toggleImprovement: (id: string) => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void

  // Ollama status
  ollamaConnected: boolean
  ollamaModel: string
  setOllamaStatus: (connected: boolean, model: string) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isAuthenticated: false, credScore: null, transactions: [] }),

      // CredScore
      credScore: null,
      isCalculating: false,
      setCredScore: (credScore) => set({ credScore }),
      setCalculating: (isCalculating) => set({ isCalculating }),

      // Transactions
      transactions: [],
      setTransactions: (transactions) => set({ transactions }),
      addTransactions: (tx) => set({ transactions: [...get().transactions, ...tx] }),

      // Dashboard stats
      dashboardStats: null,
      setDashboardStats: (dashboardStats) => set({ dashboardStats }),

      // Scam
      scamReports: [],
      scamsBlocked: 0,
      setScamReports: (scamReports) => set({ scamReports }),
      incrementScamsBlocked: () => set({ scamsBlocked: get().scamsBlocked + 1 }),

      // Loans
      loanOffers: [],
      setLoanOffers: (loanOffers) => set({ loanOffers }),

      // Improvements
      improvements: [],
      setImprovements: (improvements) => set({ improvements }),
      toggleImprovement: (id) =>
        set({
          improvements: get().improvements.map((i) =>
            i.id === id ? { ...i, completed: !i.completed } : i,
          ),
        }),

      // UI
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      activeTab: 'dashboard',
      setActiveTab: (activeTab) => set({ activeTab }),

      // Ollama
      ollamaConnected: false,
      ollamaModel: 'qwen2.5-coder:7b',
      setOllamaStatus: (ollamaConnected, ollamaModel) =>
        set({ ollamaConnected, ollamaModel }),
    }),
    {
      name: 'crediq-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        transactions: state.transactions,
        credScore: state.credScore,
        dashboardStats: state.dashboardStats,
        scamsBlocked: state.scamsBlocked,
        improvements: state.improvements,
        ollamaModel: state.ollamaModel,
      }),
    },
  ),
)
