/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          dark: '#1E40AF',
          light: '#DBEAFE',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
        purple: {
          DEFAULT: '#8B5CF6',
        },
        neutral: {
          dark: '#111827',
          gray: '#6B7280',
          light: '#F9FAFB',
          border: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.01em', fontWeight: '700' }],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'card-deep': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'count-up': 'countUp 2.5s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-ring': 'pulseRing 1.5s ease-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-8px)' },
          '80%': { transform: 'translateX(8px)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },
      backgroundImage: {
        'score-gradient': 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
        'hero-gradient': 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #8B5CF6 100%)',
        'card-gradient': 'linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%)',
      },
    },
  },
  plugins: [],
}
