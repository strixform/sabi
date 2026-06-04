/**
 * SABI Design System
 * Unified color palette, spacing, and component styling
 */

export const SABI_COLORS = {
  // Primary colors
  primary: {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',
  },

  // Secondary colors - for multi-color beautification
  secondary: {
    cyan: '#06b6d4',
    emerald: '#10b981',
    orange: '#f97316',
    yellow: '#eab308',
    red: '#ef4444',
    indigo: '#6366f1',
    rose: '#f43f5e',
  },

  // Neutral colors
  neutral: {
    slate950: '#020617',
    slate900: '#0f172a',
    slate800: '#1e293b',
    slate700: '#334155',
    slate400: '#78716c',
    slate300: '#cbd5e1',
    slate200: '#e2e8f0',
  },

  // Status colors
  status: {
    pending: '#eab308',
    processing: '#3b82f6',
    completed: '#10b981',
    failed: '#ef4444',
    active: '#10b981',
  },
} as const;

export const SABI_SPACING = {
  // Responsive padding values for consistent spacing
  page: 'px-4 sm:px-6 lg:px-8',

  // Responsive padding scales
  xs: 'p-2 sm:p-3 lg:p-4',
  sm: 'p-4 sm:p-5 lg:p-6',
  md: 'p-6 sm:p-7 lg:p-8',
  lg: 'p-8 sm:p-9 lg:p-10',
  xl: 'p-10 sm:p-11 lg:p-12',

  // Responsive margin scales
  gapXs: 'gap-2 sm:gap-3 lg:gap-4',
  gapSm: 'gap-3 sm:gap-4 lg:gap-5',
  gapMd: 'gap-4 sm:gap-5 lg:gap-6',
  gapLg: 'gap-6 sm:gap-7 lg:gap-8',

  // Responsive height scales
  heightXs: 'py-2 sm:py-3 lg:py-4',
  heightSm: 'py-3 sm:py-4 lg:py-5',
  heightMd: 'py-4 sm:py-5 lg:py-6',
  heightLg: 'py-6 sm:py-7 lg:py-8',
  heightXl: 'py-8 sm:py-9 lg:py-10',
} as const;

export const SABI_GRADIENT = {
  primary: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
  primaryWithAccent: (accentColor: string) =>
    `bg-gradient-to-br from-slate-950 via-${accentColor}-950/10 to-slate-950`,
  card: 'bg-gradient-to-br from-slate-900/50 to-slate-800/30',
  accent: (color1: string, color2: string) => `bg-gradient-to-r from-${color1} to-${color2}`,
  text: (color1: string, color2: string) => `bg-gradient-to-r from-${color1} to-${color2} bg-clip-text text-transparent`,
} as const;

export const SABI_COMPONENTS = {
  // Card styling
  card: 'bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700/50 rounded-lg',
  cardInteractive: 'hover:border-slate-600/50 hover:bg-slate-800/40 transition-all',

  // Button styling
  buttonPrimary: 'px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all',
  buttonSecondary: 'px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50 rounded-lg transition-all',
  buttonDanger: 'px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all',
  buttonSuccess: 'px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all',

  // Input styling
  input: 'w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all',

  // Badge styling
  badge: {
    primary: 'px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold',
    secondary: 'px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-semibold',
    success: 'px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold',
    warning: 'px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-semibold',
    danger: 'px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-semibold',
  },

  // Header styling
  header: 'sticky top-0 z-50 border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950 backdrop-blur-xl shadow-lg',

  // Border styling
  border: 'border border-slate-700/50',
  borderLight: 'border border-slate-600/30',

  // Divider styling
  divider: 'h-px bg-gradient-to-r from-slate-700/0 via-slate-700/50 to-slate-700/0',
} as const;

export const SABI_ANIMATIONS = {
  fadeIn: 'animate-fadeIn',
  slideUp: 'animate-slideUp',
  slideInRight: 'animate-slideInRight',
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer',
} as const;

// Component color palettes for multi-color beautification
export const COMPONENT_COLOR_MAP = {
  card1: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'blue' },
  card2: { bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'purple' },
  card3: { bg: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'cyan' },
  card4: { bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'emerald' },
  card5: { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/20', text: 'text-orange-400', glow: 'orange' },
  card6: { bg: 'from-pink-500/10 to-pink-600/5', border: 'border-pink-500/20', text: 'text-pink-400', glow: 'pink' },
  card7: { bg: 'from-yellow-500/10 to-yellow-600/5', border: 'border-yellow-500/20', text: 'text-yellow-400', glow: 'yellow' },
  card8: { bg: 'from-rose-500/10 to-rose-600/5', border: 'border-rose-500/20', text: 'text-rose-400', glow: 'rose' },
} as const;

// Get a color from the palette in rotation (for card coloring)
export function getCardColor(index: number): typeof COMPONENT_COLOR_MAP.card1 {
  const colors = Object.values(COMPONENT_COLOR_MAP);
  return colors[index % colors.length];
}
