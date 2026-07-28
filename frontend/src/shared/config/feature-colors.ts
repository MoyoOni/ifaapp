/**
 * Per-feature Orisha-inspired heading color system.
 * Each feature section maps to an Orisha's traditional color.
 * Uses soft, pastel gradients for a calm, spiritual aesthetic.
 */

export interface FeatureColorConfig {
  gradient: string;
  textColor: string;
  subtextColor: string;
  iconBg: string;
}

export const FEATURE_COLORS: Record<string, FeatureColorConfig> = {
  dashboard: {
    gradient: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    textColor: 'text-emerald-900',
    subtextColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  messages: {
    gradient: 'bg-gradient-to-r from-blue-50 to-cyan-50',
    textColor: 'text-blue-900',
    subtextColor: 'text-blue-600',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  'find-guide': {
    gradient: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    textColor: 'text-amber-900',
    subtextColor: 'text-amber-600',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  consultations: {
    gradient: 'bg-gradient-to-r from-slate-50 to-gray-100',
    textColor: 'text-slate-900',
    subtextColor: 'text-slate-500',
    iconBg: 'bg-slate-100 text-slate-600',
  },
  academy: {
    gradient: 'bg-gradient-to-r from-orange-50 to-red-50',
    textColor: 'text-orange-900',
    subtextColor: 'text-orange-600',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  community: {
    gradient: 'bg-gradient-to-r from-rose-50 to-pink-50',
    textColor: 'text-rose-900',
    subtextColor: 'text-rose-600',
    iconBg: 'bg-rose-100 text-rose-600',
  },
  marketplace: {
    gradient: 'bg-gradient-to-r from-purple-50 to-indigo-50',
    textColor: 'text-purple-900',
    subtextColor: 'text-purple-600',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  'practice-center': {
    gradient: 'bg-gradient-to-r from-amber-50 to-orange-50',
    textColor: 'text-amber-900',
    subtextColor: 'text-amber-600',
    iconBg: 'bg-amber-100 text-amber-600',
  },
};

const DEFAULT_COLORS: FeatureColorConfig = {
  gradient: 'bg-gradient-to-r from-stone-50 to-stone-100',
  textColor: 'text-stone-900',
  subtextColor: 'text-stone-500',
  iconBg: 'bg-stone-100 text-stone-600',
};

export function getFeatureColors(feature: string): FeatureColorConfig {
  return FEATURE_COLORS[feature] || DEFAULT_COLORS;
}
