import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MinusCircle,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

const TONE_MAP: Record<StatusTone, { classes: string; icon: React.ReactNode }> = {
  success: {
    classes:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/35',
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  },
  warning: {
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/35',
    icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />,
  },
  danger: {
    classes:
      'bg-red-50 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/35',
    icon: <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />,
  },
  info: {
    classes:
      'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/35',
    icon: <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />,
  },
  neutral: {
    classes:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: <MinusCircle className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />,
  },
};

export function inferStatusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (
    s.includes('active') ||
    s.includes('available') ||
    s.includes('paid') ||
    s.includes('verified') ||
    s.includes('completed') ||
    s.includes('recovered') ||
    s.includes('normal') ||
    s.includes('valid') ||
    s.includes('stable') ||
    s.includes('improving')
  ) {
    return 'success';
  }
  if (
    s.includes('pending') ||
    s.includes('near') ||
    s.includes('low') ||
    s.includes('partial') ||
    s.includes('scheduled') ||
    s.includes('checked in') ||
    s.includes('consultation') ||
    s.includes('under treatment') ||
    s.includes('abnormal') ||
    s.includes('urgent') ||
    s.includes('sample')
  ) {
    return 'warning';
  }
  if (
    s.includes('expired') ||
    s.includes('unpaid') ||
    s.includes('rejected') ||
    s.includes('cancelled') ||
    s.includes('critical') ||
    s.includes('stat') ||
    s.includes('out of stock') ||
    s.includes('inactive')
  ) {
    return 'danger';
  }
  if (s.includes('requested') || s.includes('initial')) {
    return 'info';
  }
  return 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone }) => {
  const resolved = tone || inferStatusTone(label);
  const style = TONE_MAP[resolved];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 ${style.classes}`}
    >
      {resolved === 'danger' && label.toLowerCase().includes('expired') ? (
        <ShieldAlert className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
      ) : (
        style.icon
      )}
      <span>{label}</span>
    </span>
  );
};
